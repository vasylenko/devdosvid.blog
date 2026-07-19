from datetime import UTC, datetime
from pathlib import Path

from keepup.models import Item, TopicDigest
from keepup.render import render

_TEMPLATES = Path(__file__).parent.parent / "templates"


def test_untrusted_feed_text_is_html_escaped(tmp_path):
    """Regression: the .j2 filename disabled autoescape, so titles rendered raw."""
    item = Item(
        id="1",
        title="Rust & C++ <script>alert(1)</script>",
        url="https://x.com/p?a=1&b=2",
        source="Blog",
        published=datetime(2026, 1, 1, tzinfo=UTC),
    )
    digest = TopicDigest(name="AI", items=[item], groups=["Blog"], group_of={"Blog": "Blog"})
    render(
        [digest],
        "2026-W01",
        "W01 Jan",
        datetime(2026, 1, 1, tzinfo=UTC),
        out_dir=tmp_path,
        templates=_TEMPLATES,
    )

    html = (tmp_path / "index.html").read_text(encoding="utf-8")
    assert "Rust &amp; C++ &lt;script&gt;" in html
    assert "a=1&amp;b=2" in html  # ampersand inside href escaped too
    assert "<script>" not in html  # would be present if autoescape were still off
