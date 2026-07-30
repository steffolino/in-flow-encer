import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.application.shared.import_report import ImportReport


class TenantOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    created_at: datetime

    model_config = {"from_attributes": True}


class PlaceOut(BaseModel):
    id: uuid.UUID
    name: str
    place_type: str
    municipality: str | None
    district: str | None
    region: str | None
    country: str
    aliases: list[str]
    lon: float
    lat: float


class LocationMatchOut(BaseModel):
    place_id: uuid.UUID
    place_name: str
    method: str
    confidence: float
    matched_text: str | None


class SocialContentItemOut(BaseModel):
    id: uuid.UUID
    platform: str
    author_name: str | None
    author_category: str | None
    published_at: datetime
    caption: str | None
    hashtags: list[str]
    content_url: str | None
    engagement_count: int
    estimated_reach: int
    location_text: str | None
    location_matches: list[LocationMatchOut]


class SocialContentListOut(BaseModel):
    items: list[SocialContentItemOut]
    total: int


class SocialContentImportRequest(BaseModel):
    source_name: str
    provider: str | None = None
    items: list[dict] = Field(default_factory=list)


SocialContentImportReport = ImportReport


class AttentionCellOut(BaseModel):
    place_id: uuid.UUID
    place_name: str
    lon: float
    lat: float
    post_count: int
    total_reach: int
    total_engagement: int
    unique_creators: int
    change_vs_previous_period: float | None
    avg_confidence: float
    attention_score: float


class AttentionResponse(BaseModel):
    generated_at: datetime
    weights: dict[str, float]
    cells: list[AttentionCellOut]


class ComparisonItemOut(BaseModel):
    place_id: uuid.UUID
    place_name: str
    attention_level: str
    visitor_flow_level: str
    statement: str


class ComparisonResponse(BaseModel):
    thresholds: dict[str, float | None]
    items: list[ComparisonItemOut]


class OverlaySourceOut(BaseModel):
    name: str
    provider: str | None
    last_updated_at: datetime | None


class OverlayLayerOut(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    geometry_type: str
    measurement_type: str
    unit: str | None
    visibility: bool
    time_field: str | None
    source: OverlaySourceOut
    feature_count: int


class OverlayLayerPatch(BaseModel):
    visibility: bool | None = None
    name: str | None = None
    style_configuration: dict | None = None


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: list[str] | None = None


class ErrorResponse(BaseModel):
    error: ErrorDetail
