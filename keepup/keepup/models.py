"""Data shapes passed between pipeline layers."""

import hashlib
import re
from dataclasses import dataclass, field
from datetime import datetime
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

# Query params that vary per visitor/campaign but not per document; stripping
# them lets the same article fetched via RSS and HN collapse into one item.
_TRACKING_PARAMS = re.compile(r"^(utm_|ref_|fbclid$|gclid$|mc_)")


@dataclass
class Item:
    """One fetched piece of content, normalized across all source types."""

    id: str  # short hash of the canonical URL — the LLM references this
    title: str
    url: str
    source: str  # display name of the origin; also the render grouping key
    published: datetime  # timezone-aware UTC
    excerpt: str = ""


@dataclass
class TopicDigest:
    """Everything the renderer needs for one topic section."""

    name: str
    items: list[Item]  # selected items, newest first
    failed_sources: list[str] = field(default_factory=list)
    descriptions: bool = False  # show a one-line description per item
    groups: list[str] = field(default_factory=list)  # group roster, quiet ones included
    group_of: dict[str, str] = field(default_factory=dict)  # source display name → group


def canonical_url(url: str) -> str:
    """Normalize a URL so duplicates across sources share one identity.

    Fragments are kept: changelog feeds identify entries by anchor on one
    page, so stripping them would collapse a whole changelog into one item.
    """
    scheme, netloc, path, query, fragment = urlsplit(url.strip())
    kept = [(k, v) for k, v in parse_qsl(query) if not _TRACKING_PARAMS.match(k)]
    return urlunsplit(
        (scheme.lower(), netloc.lower(), path.rstrip("/") or "/", urlencode(kept), fragment)
    )


def make_item(title: str, url: str, source: str, published: datetime, excerpt: str = "") -> Item:
    """Single constructor for all fetchers, so item identity is defined once."""
    canon = canonical_url(url)
    item_id = hashlib.sha1(canon.encode()).hexdigest()[:8]
    return Item(item_id, title.strip(), canon, source, published, excerpt.strip())
