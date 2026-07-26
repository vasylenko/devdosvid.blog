"""X author-timeline fetcher — nitter's RSS mirror, read through markfetch.

X has no free API (pay-per-use billed ~$1 per weekly run), so timelines come
from nitter.net, a public mirror serving per-account RSS. Instance flakiness
is priced in: a down or rate-limited week lands the author in the
failed-sources footnote and nothing else breaks.
"""

import html
import re
import time
from datetime import UTC, datetime
from textwrap import shorten
from urllib.parse import urlsplit, urlunsplit

import feedparser

from keepup.fetchers.markfetch import fetch_raw
from keepup.fetchers.rss import strip_html
from keepup.models import Item, make_item

_TITLE_WIDTH = 120  # tweets have no title; the opening words serve as one
_URL_ONLY = re.compile(r"https?://\S+$")
# the preview card's title is the <b> that closes an <a>; label and quote
# attribution <b>s sit outside links
_CARD_TITLE = re.compile(r"<b>([^<]+)</b>\s*</a>")


def _as_x_url(nitter_link: str) -> str:
    """Point items at x.com; nitter's #m fragment is viewer chrome, not identity."""
    _, _, path, query, _ = urlsplit(nitter_link)
    return urlunsplit(("https", "x.com", path, query, ""))


def _undo_mirrors(text: str) -> str:
    """nitter rewrites embedded links to its mirror hosts; restore the originals."""
    return text.replace("nitter.net", "x.com").replace("piped.video", "youtube.com")


def fetch_account(handle: str, since: datetime, name: str = "") -> list[Item]:
    """Return one author's original posts and thread heads inside the window.

    The feed mixes in retweets (dc:creator names the original author) and the
    author's own thread continuations ("R to " titles); dropping both leaves
    original posts and thread heads.
    """
    time.sleep(1)  # all accounts hit one public instance; stay under its rate limit
    parsed = feedparser.parse(fetch_raw(f"https://nitter.net/{handle}/rss"))
    if not parsed.entries and not parsed.feed.get("title"):
        # nitter serves an empty 200 when its backend can't reach the account;
        # surface it as a failure, not a quiet week
        raise RuntimeError("empty feed")

    source = name or f"@{handle}"
    items = []
    for entry in parsed.entries:
        stamp = entry.get("published_parsed")
        if not stamp or not entry.get("link"):
            continue
        published = datetime(*stamp[:6], tzinfo=UTC)
        if published < since:
            continue
        if entry.get("author", "").lower() != f"@{handle.lower()}":
            continue  # retweet
        title = entry.get("title", "").strip()
        if title.startswith("R to "):
            continue  # thread continuation; the head is its own entry
        if not title:
            continue  # wordless quote of another post — retweet-equivalent
        if _URL_ONLY.fullmatch(title):
            # a link-only tweet's meaning lives in its preview card
            card = _CARD_TITLE.search(entry.get("summary", ""))
            title = html.unescape(card.group(1)).strip() if card else title
        items.append(
            make_item(
                title=shorten(_undo_mirrors(title), _TITLE_WIDTH, placeholder="…"),
                url=_as_x_url(entry.link),
                source=source,
                published=published,
                excerpt=_undo_mirrors(strip_html(entry.get("summary", ""))),
            )
        )
    return items
