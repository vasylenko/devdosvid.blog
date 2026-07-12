"""Hacker News fetcher — Algolia HN Search API, keyword search in the week window."""

import json
from datetime import UTC, datetime
from urllib.parse import urlencode

from keepup.fetchers.markfetch import fetch_raw
from keepup.models import Item, make_item

API = "https://hn.algolia.com/api/v1/search_by_date"


def fetch_keywords(keywords: list[str], since: datetime, until: datetime) -> list[Item]:
    """One API call per keyword; stories deduped across keywords by HN id.

    Points/comments go into the excerpt so the digest shows each story's HN
    traction. The window's future edge is applied server-side too — on a
    late-week run, current-week stories would otherwise crowd last week's
    out of the 50-hit page.
    """
    seen: dict[str, Item] = {}
    for kw in keywords:
        query = urlencode(
            {
                "query": kw,
                "tags": "story",
                "numericFilters": (
                    f"created_at_i>{int(since.timestamp())},"
                    f"created_at_i<{int(until.timestamp())}"
                ),
                "hitsPerPage": 50,
            }
        )
        data = json.loads(fetch_raw(f"{API}?{query}"))
        for hit in data["hits"]:
            hn_id = hit["objectID"]
            if hn_id in seen or not hit.get("title"):
                continue
            seen[hn_id] = make_item(
                title=hit["title"],
                url=hit.get("url") or f"https://news.ycombinator.com/item?id={hn_id}",
                source="Hacker News",
                published=datetime.fromtimestamp(hit["created_at_i"], tz=UTC),
                excerpt=f"{hit.get('points') or 0} points, "
                f"{hit.get('num_comments') or 0} comments on HN",
            )
    return list(seen.values())
