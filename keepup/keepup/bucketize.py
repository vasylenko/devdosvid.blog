"""Bucketize layer: sort a topic's verbatim items into named buckets via one
LLM classification call.

Cross-cutting buckets (e.g. Security spanning EKS/EC2) are why this is an LLM
call and not a tag rule: the bucket depends on what an item is *about*, which
AWS's multi-tags don't resolve. On any failure the topic keeps its original
grouping, so the section degrades to a flat list rather than breaking.
"""

import json
from pathlib import Path

from keepup.llm import client
from keepup.models import Item

_PROMPT = Path(__file__).parent / "prompts" / "bucketize.md"
_MAX_OUTPUT = 2000


def bucketize(topic_name: str, items: list[Item], buckets: list[str], model: str) -> list[str] | None:
    """Assign each item to a bucket by mutating item.source; return the bucket
    roster (display order) on success, or None to fall back to flat grouping.

    Unclassified or invalidly-labelled items land in the last bucket — a safe
    default that keeps the bucket set stable every week.
    """
    if not items:
        return buckets
    api = client()
    if api is None:
        return None
    try:
        system = _PROMPT.read_text().replace("{buckets}", "\n".join(f"- {b}" for b in buckets))
        payload = "\n".join(f"{i.id} | {i.title}" for i in items)
        response = api.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": payload},
            ],
            response_format={"type": "json_object"},
            max_tokens=_MAX_OUTPUT,
            temperature=0,
        )
        assignments = json.loads(response.choices[0].message.content).get("assignments", {})
    except Exception as exc:
        print(f"  bucketize failed for {topic_name}: {exc}")
        return None

    valid = set(buckets)
    for item in items:
        chosen = assignments.get(item.id)
        item.source = chosen if chosen in valid else buckets[-1]
    return buckets
