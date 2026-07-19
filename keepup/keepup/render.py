"""Render layer: TopicDigest[] → static pages in dist/.

Writes dist/index.html (latest week) and dist/archive/<week>.html (this week's
permanent copy); the two differ only in relative-link depth (root). Render never
reads the archive — the "past digests" index is built live by the Worker from an
R2 listing, so a run only ever writes.
"""

import re
from datetime import datetime
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

from keepup.models import TopicDigest


def first_sentence(text: str, limit: int = 220) -> str:
    """One-line description from a feed summary, which may be a whole post body."""
    match = re.match(r"(.+?[.!?])(?:\s|$)", text)
    return (match.group(1) if match else text)[:limit]


def render(
    digests: list[TopicDigest],
    week: str,
    covers: str,
    generated: datetime,
    out_dir: str | Path = "dist",
    templates: str | Path = "templates",
) -> None:
    out_dir = Path(out_dir)
    archive_dir = out_dir / "archive"
    archive_dir.mkdir(parents=True, exist_ok=True)

    # Every topic renders topic (h2) → group (h3: vendor, author, or bucket) →
    # items. Child sources (Codex, Claude Code) roll up under their vendor group.
    items_by_source: dict[str, dict[str, list]] = {}
    for t in digests:

        def group_for(source: str, mapping=t.group_of) -> str:
            return mapping.get(source, source)

        # Seed groups in roster (config) order so display order is stable, not
        # data-dependent. A group with no items shows a quiet note — unless
        # every source in it failed, which the footnote already covers.
        failed_groups = {group_for(f.split(" (")[0]) for f in t.failed_sources}
        item_groups: dict[str, list] = {g: [] for g in t.groups if g not in failed_groups}
        for item in t.items:  # already newest-first
            item_groups.setdefault(group_for(item.source), []).append(item)
        items_by_source[t.name] = item_groups
    # Every template here is HTML rendering untrusted feed text (titles carry
    # &, <, >), so escape unconditionally — select_autoescape() silently skips
    # the .j2 filename and would leave output unescaped.
    env = Environment(loader=FileSystemLoader(templates), autoescape=True)
    env.filters["first_sentence"] = first_sentence
    template = env.get_template("digest.html.j2")

    for target, root in ((out_dir / "index.html", ""), (archive_dir / f"{week}.html", "../")):
        target.write_text(
            template.render(
                digests=digests,
                week=week,
                covers=covers,
                generated=generated,
                items_by_source=items_by_source,
                root=root,
            )
        )
