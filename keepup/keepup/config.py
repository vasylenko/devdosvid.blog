"""Loads config/topics.yml into typed config objects."""

from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import urlsplit

import yaml


def _display(url: str, name: str) -> str:
    return name or urlsplit(url).netloc.removeprefix("www.")


# group defaults to the source's own name — a source is its own group unless it
# rolls up under a vendor (Codex → OpenAI, Claude Code → Anthropic).
@dataclass
class FeedSource:
    url: str
    categories: list[str] = field(default_factory=list)  # empty ⇒ take all entries
    name: str = ""  # display name when the feed's own title is unhelpful
    group: str = ""

    @property
    def display(self) -> str:
        return _display(self.url, self.name)

    @property
    def group_name(self) -> str:
        return self.group or self.display


@dataclass
class SitemapSource:
    url: str
    path_prefix: str
    name: str = ""  # display name when the bare hostname is unhelpful
    group: str = ""

    @property
    def display(self) -> str:
        return _display(self.url, self.name)

    @property
    def group_name(self) -> str:
        return self.group or self.display


@dataclass
class ReleaseNotesSource:
    """OpenAI's release-notes page: a Next.js RSC payload, filtered by product."""

    url: str
    products: list[str] = field(default_factory=list)
    name: str = ""
    group: str = ""

    @property
    def display(self) -> str:
        return _display(self.url, self.name)

    @property
    def group_name(self) -> str:
        return self.group or self.display


@dataclass
class XAccountSource:
    """One X author timeline; each author is their own render group."""

    handle: str
    name: str = ""  # author's display name; the handle reads poorly as a header

    @property
    def display(self) -> str:
        return self.name or f"@{self.handle}"

    @property
    def group_name(self) -> str:
        return self.display


@dataclass
class Topic:
    name: str
    feeds: list[FeedSource] = field(default_factory=list)
    sitemaps: list[SitemapSource] = field(default_factory=list)
    release_notes: list[ReleaseNotesSource] = field(default_factory=list)
    x_accounts: list[XAccountSource] = field(default_factory=list)
    hn_keywords: list[str] = field(default_factory=list)
    descriptions: bool = False  # show a one-line description per item
    buckets: list[str] = field(default_factory=list)  # LLM sorts items into these groups

    def group_of(self) -> dict[str, str]:
        """Map each source's display name to its parent group (for rendering)."""
        mapping = {s.display: s.group_name for s in self._sources}
        if self.hn_keywords:
            mapping["Hacker News"] = "Hacker News"
        return mapping

    def group_roster(self) -> list[str]:
        """Ordered unique parent groups — every one appears on the page weekly."""
        roster: list[str] = []
        for group in self.group_of().values():
            if group not in roster:
                roster.append(group)
        return roster

    @property
    def _sources(self) -> list:
        return [*self.feeds, *self.sitemaps, *self.release_notes, *self.x_accounts]


@dataclass
class Config:
    model: str
    topics: list[Topic]


def load_config(path: str | Path = "config/topics.yml") -> Config:
    """Parse the hand-curated topics file; fail loudly on malformed config."""
    raw = yaml.safe_load(Path(path).read_text())
    topics = [
        Topic(
            name=t["name"],
            feeds=[
                FeedSource(f["url"], f.get("categories", []), f.get("name", ""), f.get("group", ""))
                for f in t.get("feeds", [])
            ],
            sitemaps=[
                SitemapSource(s["url"], s["path_prefix"], s.get("name", ""), s.get("group", ""))
                for s in t.get("sitemaps", [])
            ],
            release_notes=[
                ReleaseNotesSource(
                    r["url"], r.get("products", []), r.get("name", ""), r.get("group", "")
                )
                for r in t.get("release_notes", [])
            ],
            x_accounts=[
                XAccountSource(a["handle"], a.get("name", "")) for a in t.get("x_accounts", [])
            ],
            hn_keywords=t.get("hn_keywords", []),
            descriptions=t.get("descriptions", False),
            buckets=t.get("buckets", []),
        )
        for t in raw["topics"]
    ]
    return Config(model=raw["llm"]["model"], topics=topics)
