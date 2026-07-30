from fastapi import APIRouter

from . import analytics, overlays, places, social_content, tenants

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(tenants.router)
api_router.include_router(places.router)
api_router.include_router(social_content.router)
api_router.include_router(analytics.router)
api_router.include_router(overlays.router)
