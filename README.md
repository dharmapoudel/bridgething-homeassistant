# Home Assistant for Bridgething (Dharma's fork)

Custom build of the Bridgething Home Assistant webapp with swipe-to-dim gesture for light tiles.

## Changes from upstream

- **Swipe-to-dim**: Horizontal swipe on light tiles maps finger x to 0-100% brightness. Live overlay shows the percentage while swiping. On release, sends a single `light.turn_on` with `brightness_pct` (or `light.turn_off` at 0%). Tap still toggles. Based on [upstream PR #15](https://github.com/JoeyEamigh/bridgething/pull/15).

## App ID

`12371786-2cdb-4c38-9c1b-7c6efd601ea8` (differs from upstream so both can be installed side-by-side)

## Development

```sh
bun install
bun run typecheck
bun run build
```
