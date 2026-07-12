"""Pipeline entrypoint: one run = one weekly digest, committed by CI."""

from datetime import UTC, datetime, timedelta

from keepup.bucketize import bucketize
from keepup.config import load_config
from keepup.fetchers import fetch_topic
from keepup.models import TopicDigest
from keepup.render import render
from keepup.select import dedupe, select


def main() -> None:
    cfg = load_config()
    now = datetime.now(UTC)
    # The window is the previous ISO week, so every run inside week N — the
    # Monday 07:00 cron or a Sunday retry — covers exactly the same seven days.
    monday = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    since, until = monday - timedelta(days=7), monday
    week = f"{since:%G}-W{since:%V}"  # the covered ISO week names the archive page
    covers = f"W{since:%V} {since:%b %d}-{until - timedelta(days=1):%b %d}"

    digests = []
    for topic in cfg.topics:
        raw, failed = fetch_topic(topic, since, until)
        selected = select(dedupe(raw))

        # Buckets, when configured, replace source-grouping; a failed
        # classification keeps the source groups (the walrus short-circuits).
        groups, group_of = topic.group_roster(), topic.group_of()
        bucketed = False
        if topic.buckets and (roster := bucketize(topic.name, selected, topic.buckets, cfg.model)):
            groups, group_of, bucketed = roster, {b: b for b in roster}, True

        outcome = f"{len(groups)} buckets" if bucketed else f"{len(selected)} items"
        note = f"; failed: {', '.join(failed)}" if failed else ""
        print(f"{topic.name}: {len(raw)} fetched → {outcome}{note}")
        digests.append(TopicDigest(topic.name, selected, failed, topic.descriptions, groups, group_of))

    render(digests, week, covers, now)
    print(f"rendered docs/index.html + docs/archive/{week}.html")


if __name__ == "__main__":
    main()
