# Phase 3 Decisions (Library Screen)

## 1. Migration to Object-Based Liked Songs
**Decision**: `STATE.likedSongs` was migrated from a simple array of IDs (`[1, 2]`) to an array of objects (`[{id: 1, addedAt: timestamp}]`).
**Rationale**: Realism. The library experience heavily depends on sorting (newest first) and relative timestamps ("Added 2 mins ago"). We needed to break the simple array to support the time metrics required for the library view to feel like a living system.

## 2. Hyper-Realistic Assets
**Decision**: We abandoned `picsum.photos` for playlists and used official Spotify CDNs for "Discover Weekly," "Chill Hits," and the iconic "Liked Songs" cover art. We matched the `#b3b3b3` subtext and exact padding.
**Rationale**: The PM argument is stronger when the prototype looks indistinguishable from the real app. Dummy data breaks the illusion.

## 3. Inline Playlist Removal
**Decision**: We added a hover-based "Remove" (trash can/X) icon to songs inside the playlist accordions, which directly mutates `STATE.playlists`.
**Rationale**: It's crucial to show the end-to-end reactivity of the prototype. If a user manually removes a song from a playlist here, the "In X playlists" pill on the Now Playing screen updates instantaneously because of the Proxy state structure. This sets the stage for Phase 4, where the Voice engine will be performing these exact same state mutations.
