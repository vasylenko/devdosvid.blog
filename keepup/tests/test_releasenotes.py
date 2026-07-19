from keepup.fetchers.openai_releasenotes import _rows


def _blob(rows_json: str) -> str:
    # A sibling object precedes "rows" and pagination follows it — the shape the
    # real RSC payload has, and what the old scanner over-read into.
    return f'noise{{"x":1}}"rows":{rows_json},"pagination":{{"page":1}}tail'


def test_parses_rows_including_nested_objects():
    rows = _rows(_blob('[{"product":"a","description":{"content":[]}},{"product":"b"}]'))
    assert [r["product"] for r in rows] == ["a", "b"]


def test_empty_rows_array_returns_empty_not_the_sibling_object():
    assert _rows(_blob("[]")) == []


def test_missing_rows_key_returns_empty():
    assert _rows('{"pagination":{"page":1}}') == []
