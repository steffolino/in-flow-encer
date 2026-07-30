import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Because vitest globals are disabled (tests import from 'vitest' explicitly),
// @testing-library/react's automatic afterEach-based cleanup never registers
// itself. Without this, components from one test leak into the next test's
// DOM within the same file, causing spurious "multiple elements found"
// failures and stale query results.
afterEach(() => {
  cleanup()
})
