import pytest

from keepup.bucketize import _assignments


def test_parses_reply_wrapped_in_a_json_fence():
    # What Workers AI actually returns despite response_format=json_object.
    reply = '```json\n{\n  "assignments": {"6f70dd59": "Compute", "bbef74e9": "Security"}\n}\n```'
    assert _assignments(reply) == {"6f70dd59": "Compute", "bbef74e9": "Security"}


def test_parses_bare_json():
    assert _assignments('{"assignments": {"a1": "Containers"}}') == {"a1": "Containers"}


def test_missing_assignments_key_returns_empty():
    assert _assignments('{"buckets": []}') == {}


def test_reply_without_an_object_raises():
    with pytest.raises(ValueError):
        _assignments("I cannot classify these items.")
