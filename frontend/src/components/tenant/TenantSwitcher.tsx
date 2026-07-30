import { useEffect } from 'react'
import { useTenants } from '../../api/useTenants'
import { useTenant } from '../../state/tenant'

/**
 * Dev-only tenant switcher. Selecting a tenant sets the `X-Tenant-Slug`
 * header (via TenantProvider) used on every subsequent API request.
 */
export function TenantSwitcher(): React.JSX.Element {
  const { data: tenants, isLoading, isError } = useTenants()
  const { activeSlug, setActiveSlug } = useTenant()

  useEffect(() => {
    if (!activeSlug && tenants && tenants.length > 0) {
      const first = tenants[0]
      if (first) setActiveSlug(first.slug)
    }
  }, [tenants, activeSlug, setActiveSlug])

  return (
    <div className="field" style={{ marginBottom: 0 }}>
      <label htmlFor="tenant-switcher">Tenant (dev)</label>
      {isError ? (
        <span className="error-message" role="alert">
          Failed to load tenants.
        </span>
      ) : (
        <select
          id="tenant-switcher"
          value={activeSlug ?? ''}
          disabled={isLoading || !tenants || tenants.length === 0}
          onChange={(event) => {
            setActiveSlug(event.target.value)
          }}
        >
          {isLoading && <option value="">Loading tenants…</option>}
          {!isLoading && (!tenants || tenants.length === 0) && (
            <option value="">No tenants available</option>
          )}
          {tenants?.map((tenant) => (
            <option key={tenant.id} value={tenant.slug}>
              {tenant.name}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
