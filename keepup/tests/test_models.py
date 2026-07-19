from datetime import UTC, datetime

from keepup.models import canonical_url, make_item


def test_strips_tracking_params_keeps_real_ones():
    assert canonical_url("https://x.com/p?utm_source=rss&ref_=hn&id=42") == "https://x.com/p?id=42"
    # `ref` (no underscore) is a real param, not the `ref_` tracking prefix.
    assert canonical_url("https://x.com/p?ref=abc") == "https://x.com/p?ref=abc"


def test_fbclid_and_gclid_are_end_anchored():
    assert canonical_url("https://x.com/p?fbclid=z&gclid=y&keep=1") == "https://x.com/p?keep=1"


def test_lowercases_scheme_and_host_but_not_path():
    assert canonical_url("HTTPS://Example.COM/Path") == "https://example.com/Path"


def test_trailing_slash_stripped_but_root_preserved():
    assert canonical_url("https://x.com/a/") == "https://x.com/a"
    assert canonical_url("https://x.com/") == "https://x.com/"


def test_fragment_is_kept():
    # Changelog feeds identify entries by #anchor on a single page.
    assert canonical_url("https://x.com/changelog#v2") == "https://x.com/changelog#v2"


def test_same_article_from_two_sources_shares_one_id():
    when = datetime(2026, 1, 1, tzinfo=UTC)
    rss = make_item("T", "https://x.com/p?utm_source=rss", "RSS", when)
    hn = make_item("T", "https://x.com/p", "HN", when)
    assert rss.id == hn.id
