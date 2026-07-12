"""Select layer: Item[] → ≤N per topic, deterministic and source-diverse."""

from keepup.models import Item

CAP = 40  # max items per topic section


def dedupe(items: list[Item]) -> list[Item]:
    """Merge items sharing a canonical URL into one, keeping the longer excerpt."""
    merged: dict[str, Item] = {}
    for item in sorted(items, key=lambda i: i.published):
        existing = merged.get(item.id)
        if existing is None:
            merged[item.id] = item
            continue
        if len(item.excerpt) > len(existing.excerpt):
            existing.excerpt = item.excerpt
    return list(merged.values())


def select(items: list[Item], cap: int = CAP) -> list[Item]:
    """Newest-first round-robin across sources, so one high-volume feed can't
    crowd lower-volume sources out of the cap."""
    groups: dict[str, list[Item]] = {}
    for item in items:
        groups.setdefault(item.source, []).append(item)
    for group in groups.values():
        group.sort(key=lambda i: i.published, reverse=True)

    picked: list[Item] = []
    while len(picked) < cap and any(groups.values()):
        for name in sorted(groups):
            if groups[name] and len(picked) < cap:
                picked.append(groups[name].pop(0))
    picked.sort(key=lambda i: i.published, reverse=True)
    return picked
