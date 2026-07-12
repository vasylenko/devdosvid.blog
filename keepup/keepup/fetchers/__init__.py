"""Fetch layer: source config in, normalized Item[] out.

A failing source never fails the run — it lands in failed_sources and the
renderer footnotes it.
"""

from datetime import datetime

from keepup.config import Topic
from keepup.fetchers import hn, openai_releasenotes, rss, sitemap, x
from keepup.models import Item


def fetch_topic(topic: Topic, since: datetime, until: datetime) -> tuple[list[Item], list[str]]:
    """Run every configured source for one topic, isolating failures.

    Fetchers cut off the past themselves (that bounds what they download);
    the future edge is cut once here, so a midweek run can't leak
    current-week items into last week's digest.
    """
    items: list[Item] = []
    failed: list[str] = []

    for feed in topic.feeds:
        try:
            items += rss.fetch_feed(feed.url, since, feed.categories, feed.name)
        except Exception as exc:
            failed.append(f"{feed.display} ({exc})")

    for source in topic.sitemaps:
        try:
            items += sitemap.fetch_sitemap(source.url, source.path_prefix, since, source.name)
        except Exception as exc:
            failed.append(f"{source.display} ({exc})")

    for source in topic.release_notes:
        try:
            items += openai_releasenotes.fetch_release_notes(
                source.url, source.products, since, source.display
            )
        except Exception as exc:
            failed.append(f"{source.display} ({exc})")

    for account in topic.x_accounts:
        try:
            items += x.fetch_account(account.handle, since, account.display)
        except Exception as exc:
            failed.append(f"{account.display} ({exc})")

    if topic.hn_keywords:
        try:
            items += hn.fetch_keywords(topic.hn_keywords, since, until)
        except Exception as exc:
            failed.append(f"Hacker News ({exc})")

    return [item for item in items if item.published < until], failed
