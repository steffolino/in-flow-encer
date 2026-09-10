"""Export the current database's public demo data; no database writes.

Run from backend: python -m seed.export_demo --output /tmp/demo.json
Only use with a database whose contents are intended for public demonstration.
"""
import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

from fastapi.testclient import TestClient
from shapely.geometry import shape
from sqlalchemy import select

from app.application.ingestion.matching import haversine_km
from app.db.session import SessionLocal
from app.domain.social_content.models import SocialContentItem
from app.main import app


def export_snapshot() -> dict:
    with TestClient(app) as client, SessionLocal() as db:
        def get(path: str, slug: str | None = None):
            response = client.get('/api/v1' + path, headers={'X-Tenant-Slug': slug} if slug else {})
            response.raise_for_status()
            return response.json()

        tenants, places = get('/tenants'), get('/places')
        snapshot = {'version': 1, 'exported_at': datetime.now(timezone.utc).isoformat(),
                    'tenants': tenants, 'places': places, 'data': {}}
        for tenant in tenants:
            slug = tenant['slug']
            items = []
            while True:
                page = get(f'/social-content?limit=500&offset={len(items)}', slug)
                items.extend(page['items'])
                if len(items) >= page['total']:
                    break
                if not page['items']:
                    raise RuntimeError('Incomplete social content export')
            sources = {str(row.id): str(row.source_id) for row in db.scalars(
                select(SocialContentItem).where(SocialContentItem.tenant_id == tenant['id']))}
            for item in items:
                item['source_id'] = sources[item['id']]
            overlays = get('/overlays', slug)
            for layer in overlays:
                if isinstance(layer['visibility'], bool):
                    layer['visibility'] = 'visible' if layer['visibility'] else 'hidden'
            features = {layer['id']: get(f"/overlays/{layer['id']}/features", slug) for layer in overlays}
            # Preserve the backend's Shapely centroid + 3km comparison semantics.
            flow = {}
            for place in places:
                values = []
                for layer in overlays:
                    if layer['visibility'] != 'visible':
                        continue
                    for feature in features[layer['id']]['features']:
                        value = feature['properties'].get('value')
                        point = shape(feature['geometry']).centroid
                        if value is not None and haversine_km(place['lon'], place['lat'], point.x, point.y) <= 3:
                            values.append(value)
                if values:
                    flow[place['id']] = sum(values)
            snapshot['data'][slug] = {'items': items, 'overlays': overlays, 'features': features, 'flow': flow}
        return snapshot


def export_checks(snapshot: dict) -> list:
    """Capture backend answers to verify the browser's snapshot calculations."""
    queries = ['', '?date_from=2026-06-01&date_to=2026-07-01',
               '?date_from=2026-04-01&date_to=2026-08-31&platform=instagram',
               '?region=Oberland', '?date_from=2030-01-01&date_to=2030-02-01']
    checks = []
    with TestClient(app) as client:
        for tenant in snapshot['tenants']:
            for query in queries:
                for endpoint in ['attention', 'forecast', 'comparison']:
                    path = f'/analytics/{endpoint}{query}'
                    response = client.get('/api/v1' + path, headers={'X-Tenant-Slug': tenant['slug']})
                    response.raise_for_status()
                    checks.append({'slug': tenant['slug'], 'path': path, 'expected': response.json()})
    return checks


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--checks', type=Path, help='Optional backend parity test fixture')
    args = parser.parse_args()
    snapshot = export_snapshot()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(snapshot, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    if args.checks:
        args.checks.parent.mkdir(parents=True, exist_ok=True)
        args.checks.write_text(json.dumps(export_checks(snapshot), ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    print(f"Exported {len(snapshot['tenants'])} tenants and {sum(len(t['items']) for t in snapshot['data'].values())} posts to {args.output}")
