"""RSS/Atom fetcher — covers blogs and GitHub /releases.atom feeds."""

import html
import re
from datetime import UTC, datetime
from urllib.parse import urlsplit

import feedparser

from keepup.fetchers.markfetch import fetch_raw
from keepup.models import Item, make_item

_TAGS = re.compile(r"<[^>]+>")


def strip_html(text: str, limit: int = 500) -> str:
    """Feed summaries arrive as HTML; the pipeline works in plain text."""
    return " ".join(html.unescape(_TAGS.sub(" ", text)).split())[:limit]


def fetch_feed(
    url: str, since: datetime, categories: list[str] | None = None, name: str = ""
) -> list[Item]:
    """Fetch one feed and return items published inside the window.

    Undated entries are dropped — the week window is the product. `categories`
    narrows firehose feeds (e.g. OpenAI's single rss.xml) to the curated
    sections; entries carry them as <category> tags.
    """
    parsed = feedparser.parse(fetch_raw(url))
    if parsed.bozo and not parsed.entries:
        raise RuntimeError(f"unparseable feed: {parsed.bozo_exception}")

    source = name or parsed.feed.get("title") or urlsplit(url).netloc
    items = []
    for entry in parsed.entries:
        stamp = entry.get("published_parsed") or entry.get("updated_parsed")
        if not stamp or not entry.get("link"):
            continue
        published = datetime(*stamp[:6], tzinfo=UTC)
        if published < since:
            continue
        if categories:
            # AWS packs all tags into one comma-joined <category> element.
            entry_categories = {
                c.strip()
                for tag in entry.get("tags", [])
                for c in (tag.get("term") or "").split(",")
            }
            if not entry_categories & set(categories):
                continue
        items.append(
            make_item(
                title=entry.get("title", "(untitled)"),
                url=entry.link,
                source=source,
                published=published,
                excerpt=strip_html(entry.get("summary", "")),
            )
        )
    return items
