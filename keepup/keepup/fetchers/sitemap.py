"""Sitemap fetcher for sites without RSS (e.g. anthropic.com).

Two steps: sitemap.xml discovers candidate URLs, then each page's raw HTML
gives the title, publish date, and excerpt — all read directly from the markup
(Readability would strip the header block where the date lives).
"""

import html as html_entities
import re
import xml.etree.ElementTree as ET
from datetime import UTC, datetime
from urllib.parse import urlsplit

from keepup.fetchers.markfetch import fetch_raw
from keepup.models import Item, make_item

_NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
# "Jun 30, 2026" / "June 30, 2026" — the publish-date style on article pages.
_DATE = re.compile(r"[A-Z][a-z]{2,8} \d{1,2}, \d{4}")
# lastmod means modified, not published: a site redeploy can bump every URL.
# The cap bounds page fetches in that case; on-page dates re-filter below.
_MAX_PAGES = 25


def _parse_date(text: str) -> datetime | None:
    for fmt in ("%b %d, %Y", "%B %d, %Y"):
        try:
            return datetime.strptime(text, fmt).replace(tzinfo=UTC)
        except ValueError:
            continue
    return None


def _h1_date(html: str) -> datetime | None:
    """Publish date rendered next to the page's h1 (anthropic.com style)."""
    match = re.search(r"</h1>.{0,300}?(" + _DATE.pattern + ")", html, re.S)
    return _parse_date(match.group(1)) if match else None


def _meta(html: str, keys: str) -> str:
    """First matching <meta> content for any of the given name/property keys."""
    for tag in re.finditer(r"<meta\s[^>]*>", html[:20000], re.I):
        if not re.search(rf"(?:name|property)=[\"'](?:{keys})[\"']", tag.group(0), re.I):
            continue
        content = re.search(r"content=[\"']([^\"']+)", tag.group(0))
        if content:
            return html_entities.unescape(content.group(1)).strip()
    return ""


def _title(html: str, fallback: str) -> str:
    if og := _meta(html, "og:title"):
        return og
    match = re.search(r"<title[^>]*>([^<]+)</title>", html, re.I)
    return html_entities.unescape(match.group(1)).strip() if match else fallback


def fetch_sitemap(url: str, path_prefix: str, since: datetime, name: str = "") -> list[Item]:
    """Fetch pages under path_prefix whose content is inside the week window."""
    root = ET.fromstring(fetch_raw(url))

    candidates = []
    for node in root.findall("sm:url", _NS):
        loc = node.findtext("sm:loc", "", _NS)
        lastmod_raw = node.findtext("sm:lastmod", "", _NS)
        if not loc or not lastmod_raw or not urlsplit(loc).path.startswith(path_prefix):
            continue
        lastmod = datetime.fromisoformat(lastmod_raw.replace("Z", "+00:00"))
        if lastmod.tzinfo is None:
            lastmod = lastmod.replace(tzinfo=UTC)
        if lastmod >= since:
            candidates.append((lastmod, loc))
    candidates.sort(reverse=True)

    items = []
    for _, loc in candidates[:_MAX_PAGES]:
        try:
            page = fetch_raw(loc)
        except RuntimeError:
            continue  # one broken article must not hide the rest of the week
        published = _h1_date(page)
        if not published or published < since:
            continue
        items.append(
            make_item(
                title=_title(page, loc),
                url=loc,
                source=name or urlsplit(url).netloc.removeprefix("www."),
                published=published,
                excerpt=_meta(page, "og:description|description"),
            )
        )
    return items
