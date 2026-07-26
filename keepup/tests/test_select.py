from datetime import UTC, datetime, timedelta

from keepup.models import Item
from keepup.select import dedupe, select


def _item(iid: str, source: str, when: datetime, excerpt: str = "") -> Item:
    return Item(id=iid, title="t", url="u", source=source, published=when, excerpt=excerpt)


def test_dedupe_keeps_the_longer_excerpt():
    when = datetime(2026, 1, 1, tzinfo=UTC)
    merged = dedupe([_item("1", "A", when, "short"), _item("1", "B", when, "a longer excerpt")])
    assert len(merged) == 1
    assert merged[0].excerpt == "a longer excerpt"


def test_select_round_robin_gives_each_source_a_fair_share():
    base = datetime(2026, 1, 1, tzinfo=UTC)
    items = [
        _item(f"{s}{n}", s, base + timedelta(minutes=n)) for s in "ABC" for n in range(30)
    ]
    picked = select(items, cap=12)
    assert len(picked) == 12
    # Round-robin caps any single high-volume source; 3 sources ⇒ 4 each, not 12 from one.
    per_source = {s: sum(1 for i in picked if i.source == s) for s in "ABC"}
    assert per_source == {"A": 4, "B": 4, "C": 4}


def test_select_returns_newest_first():
    base = datetime(2026, 1, 1, tzinfo=UTC)
    items = [_item(str(n), "A", base + timedelta(days=n)) for n in range(5)]
    picked = select(items, cap=5)
    assert [i.published for i in picked] == sorted((i.published for i in items), reverse=True)
