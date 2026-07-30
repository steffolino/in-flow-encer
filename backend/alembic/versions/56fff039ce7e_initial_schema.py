"""initial schema

Revision ID: 56fff039ce7e
Revises:
Create Date: 2026-07-30 15:51:35.409859

"""
from typing import Sequence, Union

import geoalchemy2
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "56fff039ce7e"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    op.create_table(
        "places",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("place_type", sa.String(length=50), nullable=False),
        sa.Column("municipality", sa.String(length=200), nullable=True),
        sa.Column("district", sa.String(length=200), nullable=True),
        sa.Column("region", sa.String(length=200), nullable=True),
        sa.Column("country", sa.String(length=2), nullable=False),
        sa.Column(
            "geometry",
            geoalchemy2.types.Geometry(srid=4326, from_text="ST_GeomFromEWKT", name="geometry", nullable=False),
            nullable=False,
        ),
        sa.Column("aliases", sa.ARRAY(sa.String()), server_default="{}", nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    # NOTE: geoalchemy2 auto-creates a GIST index on the geometry column when the
    # table is created, so no explicit op.create_index for it is needed here.
    op.create_index(op.f("ix_places_name"), "places", ["name"], unique=False)

    op.create_table(
        "tenants",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("slug", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_tenants_slug"), "tenants", ["slug"], unique=True)

    op.create_table(
        "sources",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("tenant_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("source_type", sa.String(length=30), nullable=False),
        sa.Column("provider", sa.String(length=200), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("source_url", sa.String(length=500), nullable=True),
        sa.Column("last_updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_sources_tenant_id"), "sources", ["tenant_id"], unique=False)

    op.create_table(
        "overlay_layers",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("tenant_id", sa.UUID(), nullable=False),
        sa.Column("source_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.String(length=1000), nullable=True),
        sa.Column("geometry_type", sa.String(length=30), nullable=False),
        sa.Column("measurement_type", sa.String(length=100), nullable=False),
        sa.Column("unit", sa.String(length=50), nullable=True),
        sa.Column("visibility", sa.Boolean(), server_default="true", nullable=False),
        sa.Column(
            "style_configuration", postgresql.JSONB(astext_type=sa.Text()), server_default="{}", nullable=False
        ),
        sa.Column("time_field", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["source_id"], ["sources.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_overlay_layers_source_id"), "overlay_layers", ["source_id"], unique=False)
    op.create_index(op.f("ix_overlay_layers_tenant_id"), "overlay_layers", ["tenant_id"], unique=False)

    op.create_table(
        "social_content_items",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("tenant_id", sa.UUID(), nullable=False),
        sa.Column("source_id", sa.UUID(), nullable=False),
        sa.Column("external_id", sa.String(length=300), nullable=True),
        sa.Column("platform", sa.String(length=50), nullable=False),
        sa.Column("author_name", sa.String(length=200), nullable=True),
        sa.Column("author_category", sa.String(length=100), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("caption", sa.Text(), nullable=True),
        sa.Column("hashtags", sa.ARRAY(sa.String()), server_default="{}", nullable=False),
        sa.Column("content_url", sa.String(length=500), nullable=True),
        sa.Column("engagement_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("estimated_reach", sa.Integer(), server_default="0", nullable=False),
        sa.Column("location_text", sa.String(length=300), nullable=True),
        sa.Column("explicit_lat", sa.Float(), nullable=True),
        sa.Column("explicit_lon", sa.Float(), nullable=True),
        sa.Column("content_hash", sa.String(length=64), nullable=False),
        sa.Column("raw_metadata", postgresql.JSONB(astext_type=sa.Text()), server_default="{}", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["source_id"], ["sources.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "source_id", "content_hash", name="uq_social_content_dedup"),
    )
    op.create_index(
        op.f("ix_social_content_items_content_hash"), "social_content_items", ["content_hash"], unique=False
    )
    op.create_index(op.f("ix_social_content_items_platform"), "social_content_items", ["platform"], unique=False)
    op.create_index(
        op.f("ix_social_content_items_published_at"), "social_content_items", ["published_at"], unique=False
    )
    op.create_index(op.f("ix_social_content_items_source_id"), "social_content_items", ["source_id"], unique=False)
    op.create_index(op.f("ix_social_content_items_tenant_id"), "social_content_items", ["tenant_id"], unique=False)

    op.create_table(
        "location_matches",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("social_content_id", sa.UUID(), nullable=False),
        sa.Column("place_id", sa.UUID(), nullable=False),
        sa.Column("method", sa.String(length=30), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("matched_text", sa.String(length=300), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["place_id"], ["places.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["social_content_id"], ["social_content_items.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_location_matches_place_id"), "location_matches", ["place_id"], unique=False)
    op.create_index(
        op.f("ix_location_matches_social_content_id"), "location_matches", ["social_content_id"], unique=False
    )

    op.create_table(
        "overlay_features",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("tenant_id", sa.UUID(), nullable=False),
        sa.Column("layer_id", sa.UUID(), nullable=False),
        sa.Column(
            "geometry",
            geoalchemy2.types.Geometry(srid=4326, from_text="ST_GeomFromEWKT", name="geometry", nullable=False),
            nullable=False,
        ),
        sa.Column("observed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("value", sa.Float(), nullable=True),
        sa.Column("properties", postgresql.JSONB(astext_type=sa.Text()), server_default="{}", nullable=False),
        sa.Column("external_id", sa.String(length=300), nullable=True),
        sa.Column("content_hash", sa.String(length=64), nullable=False),
        sa.ForeignKeyConstraint(["layer_id"], ["overlay_layers.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "layer_id", "content_hash", name="uq_overlay_feature_dedup"),
    )
    # NOTE: geoalchemy2 auto-creates a GIST index on the geometry column when the
    # table is created, so no explicit op.create_index for it is needed here.
    op.create_index(op.f("ix_overlay_features_content_hash"), "overlay_features", ["content_hash"], unique=False)
    op.create_index(op.f("ix_overlay_features_layer_id"), "overlay_features", ["layer_id"], unique=False)
    op.create_index(op.f("ix_overlay_features_observed_at"), "overlay_features", ["observed_at"], unique=False)
    op.create_index(op.f("ix_overlay_features_tenant_id"), "overlay_features", ["tenant_id"], unique=False)


def downgrade() -> None:
    op.drop_table("overlay_features")
    op.drop_table("location_matches")
    op.drop_table("social_content_items")
    op.drop_table("overlay_layers")
    op.drop_table("sources")
    op.drop_table("tenants")
    op.drop_table("places")
