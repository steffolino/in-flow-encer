import hashlib
import uuid

from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.domain.social_content.models import LocationMatch, SocialContentItem
from app.infrastructure.repositories.places import PlaceRepository
from app.infrastructure.repositories.social_content import SocialContentRepository

from app.application.shared.import_report import ImportReport, ImportWarning

from .dto import CanonicalSocialContentInput
from .matching import LocationMatcher


def compute_content_hash(item: CanonicalSocialContentInput) -> str:
    """Hashes the full content, independent of external_id.

    external_id is used only to *look up* a prior record with the same
    identity; the hash itself must reflect the content so that a changed
    payload for the same external_id is detected as an update rather than
    always appearing identical.
    """
    basis = "|".join(
        [
            item.platform,
            item.author_name or "",
            item.author_category or "",
            item.published_at.isoformat(),
            (item.caption or "")[:500],
            item.content_url or "",
            str(item.engagement_count),
            str(item.estimated_reach),
            item.location_text or "",
            ",".join(sorted(item.hashtags)),
        ]
    )
    return hashlib.sha256(basis.encode("utf-8")).hexdigest()


class SocialContentImporter:
    """Imports canonical social-content rows: validate -> dedupe -> persist -> match locations."""

    def __init__(self, db: Session) -> None:
        self._db = db
        self._repo = SocialContentRepository(db)
        self._matcher = LocationMatcher(PlaceRepository(db))

    def import_rows(
        self,
        tenant_id: uuid.UUID,
        source_id: uuid.UUID,
        raw_rows: list[dict],
    ) -> ImportReport:
        report = ImportReport(received=len(raw_rows))

        for index, raw_row in enumerate(raw_rows):
            try:
                item = CanonicalSocialContentInput.model_validate(raw_row)
            except ValidationError as exc:
                report.invalid += 1
                report.warnings.append(
                    ImportWarning(row=index, message=f"Row {index} failed validation: {exc.errors()[0]['msg']}")
                )
                continue

            content_hash = compute_content_hash(item)
            existing = None
            if item.external_id:
                existing = self._repo.find_by_external_id(tenant_id, source_id, item.external_id)

            if existing is not None:
                if existing.content_hash == content_hash:
                    report.duplicates += 1
                    continue
                self._update_existing(existing, item, content_hash)
                report.updated += 1
                continue

            duplicate = self._repo.find_by_hash(tenant_id, source_id, content_hash)
            if duplicate is not None:
                report.duplicates += 1
                continue

            self._create_new(tenant_id, source_id, item, content_hash)
            report.created += 1

        return report

    def _create_new(
        self,
        tenant_id: uuid.UUID,
        source_id: uuid.UUID,
        item: CanonicalSocialContentInput,
        content_hash: str,
    ) -> SocialContentItem:
        entity = SocialContentItem(
            tenant_id=tenant_id,
            source_id=source_id,
            external_id=item.external_id,
            platform=item.platform,
            author_name=item.author_name,
            author_category=item.author_category,
            published_at=item.published_at,
            caption=item.caption,
            hashtags=item.hashtags,
            content_url=item.content_url,
            engagement_count=item.engagement_count,
            estimated_reach=item.estimated_reach,
            location_text=item.location_text,
            explicit_lat=item.explicit_lat,
            explicit_lon=item.explicit_lon,
            content_hash=content_hash,
            raw_metadata=item.raw_metadata,
        )
        self._repo.add(entity)
        self._apply_matches(entity, item)
        return entity

    def _update_existing(
        self,
        entity: SocialContentItem,
        item: CanonicalSocialContentInput,
        content_hash: str,
    ) -> None:
        entity.author_name = item.author_name
        entity.author_category = item.author_category
        entity.published_at = item.published_at
        entity.caption = item.caption
        entity.hashtags = item.hashtags
        entity.content_url = item.content_url
        entity.engagement_count = item.engagement_count
        entity.estimated_reach = item.estimated_reach
        entity.location_text = item.location_text
        entity.explicit_lat = item.explicit_lat
        entity.explicit_lon = item.explicit_lon
        entity.content_hash = content_hash
        entity.raw_metadata = item.raw_metadata
        self._db.flush()
        self._repo.delete_location_matches(entity.id)
        self._apply_matches(entity, item)

    def _apply_matches(self, entity: SocialContentItem, item: CanonicalSocialContentInput) -> None:
        candidates = self._matcher.match(
            explicit_lon=item.explicit_lon,
            explicit_lat=item.explicit_lat,
            location_text=item.location_text,
            caption=item.caption,
            hashtags=item.hashtags,
        )
        for candidate in candidates:
            self._repo.add_location_match(
                LocationMatch(
                    social_content_id=entity.id,
                    place_id=candidate.place_id,
                    method=candidate.method,
                    confidence=candidate.confidence,
                    matched_text=candidate.matched_text,
                )
            )
