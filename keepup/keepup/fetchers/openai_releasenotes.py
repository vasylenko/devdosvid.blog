"""OpenAI release-notes fetcher (openai.com/products/release-notes).

The page has no RSS. Its entries live in the Next.js RSC flight payload as
structured rows — more reliable than scraping the rendered DOM, which we parse
from the raw HTML.
"""

import json
import re
from datetime import UTC, date, datetime

from keepup.fetchers.markfetch import fetch_raw
from keepup.models import Item, make_item

_FLIGHT = re.compile(r'self\.__next_f\.push\(\[1,(".*?")\]\)', re.S)


def _flight_blob(html: str) -> str:
    """Reassemble the RSC stream: concatenated JS strings, JSON-unescaped."""
    return "".join(json.loads(chunk) for chunk in _FLIGHT.findall(html))


def _rows(blob: str) -> list[dict]:
    """Decode the `rows` array from the RSC payload with the stdlib JSON parser.

    raw_decode() reads one JSON value (the array) starting at its `[` and stops
    at the matching `]` — no hand-rolled brace matching, and an empty `[]`
    can't over-read into the next object.
    """
    marker = blob.find('"rows":')
    if marker == -1:
        return []
    start = blob.find("[", marker)
    if start == -1:
        return []
    rows, _ = json.JSONDecoder().raw_decode(blob, start)
    return rows


def _first_text(node: dict | list) -> str:
    """First non-empty text value in a Contentful rich-text tree."""
    if isinstance(node, dict):
        if node.get("nodeType") == "text" and node.get("value", "").strip():
            return node["value"].strip()
        node = node.get("content", [])
    for child in node if isinstance(node, list) else []:
        found = _first_text(child)
        if found:
            return found
    return ""


def fetch_release_notes(
    url: str, products: list[str], since: datetime, name: str = ""
) -> list[Item]:
    """Fetch release-notes entries for the given products inside the window."""
    rows = _rows(_flight_blob(fetch_raw(url)))
    if not rows:
        raise RuntimeError("no rows in release-notes payload (page structure changed?)")

    wanted = set(products)
    since_date = since.date()
    items = []
    for row in rows:
        released = row.get("releaseDate")
        if row.get("product") not in wanted or not released:
            continue
        if date.fromisoformat(released) < since_date:
            continue
        links = row.get("links") or [{}]
        items.append(
            make_item(
                title=row.get("title", "(untitled)"),
                url=links[0].get("url") or url,
                source=name or "OpenAI release notes",
                published=datetime.fromisoformat(released).replace(tzinfo=UTC),
                excerpt=_first_text(row.get("description", {})),
            )
        )
    return items
