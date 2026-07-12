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


def _json_object_at(text: str, start: int) -> str | None:
    """Return the balanced {...} object beginning at `start` (string-aware)."""
    depth = in_str = esc = 0
    for j in range(start, len(text)):
        c = text[j]
        if esc:
            esc = 0
        elif c == "\\":
            esc = 1
        elif c == '"':
            in_str ^= 1
        elif not in_str:
            if c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    return text[start : j + 1]
    return None


def _rows(blob: str) -> list[dict]:
    """Parse the consecutive row objects out of the `rows` array."""
    start = blob.find('"rows":[')
    if start == -1:
        return []
    pos = blob.find("{", start)
    rows = []
    while pos != -1:
        raw = _json_object_at(blob, pos)
        if not raw:
            break
        try:
            rows.append(json.loads(raw))
        except json.JSONDecodeError:
            break
        nxt = blob.find("{", pos + len(raw))
        if nxt == -1 or "," not in blob[pos + len(raw) : nxt]:
            break  # left the array
        pos = nxt
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
