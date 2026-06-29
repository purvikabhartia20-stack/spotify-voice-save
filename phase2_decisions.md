# Phase 2 Decisions (Now Playing)

## 1. Dynamic Color Extraction
**Decision**: We added a `color` property to each object in `DEFAULT_STATE.songs` and used JavaScript to inject it into a global CSS variable `--dynamic-color`.
**Rationale**: Simulating Spotify's album art color extraction makes the prototype feel infinitely more premium. The Mobile Now Playing background, the Mobile Mini Player, and the Desktop Playbar all dynamically adjust to the current song's color, giving a rich, bespoke feel.

## 2. Vinyl Spin Animation
**Decision**: We applied an `@keyframes spin` animation to the album art on both the Mobile Now Playing screen and the Desktop Playbar, triggered by a `.playing` class tied to `STATE.playing`.
**Rationale**: The spinning record adds kinetic energy to the screen. It is crucial for simulating the "passive session" illusion—the app is alive and moving forward even when the user isn't interacting with it.

## 3. The Mini Player
**Decision**: We built a persistent Mini Player that sits above the bottom navigation tabs on Mobile, matching the real Spotify experience. Tapping it expands the full-screen Now Playing overlay.
**Rationale**: Without the Mini Player, leaving the "Now Playing" view means you lose sight of what's currently playing, which breaks the realism. The Mini Player allows the evaluator to browse the Library while keeping the transport controls visible.

## 4. State Management Fast-Path
**Decision**: In `render()`, we implemented a "fast path" that checks if *only* `progress` changed. If so, it updates the width of the progress bar directly and exits.
**Rationale**: Running a full DOM re-render every 1 second (1000ms) would cause lag and kill device batteries. Bypassing the heavy DOM updates for the simple progress bar tick ensures perfectly smooth performance.

## 5. Keyboard Navigation
**Decision**: Expanded the global key listeners to include `ArrowRight` (Next) and `ArrowLeft` (Previous).
**Rationale**: Continues treating the desktop layout as a native app, allowing testers to quickly skip through songs without clicking.
