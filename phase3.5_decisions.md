# Phase 3.5 Decisions (Audio Engine)

## 1. Using iTunes Search API for Previews
**Decision**: We implemented an asynchronous `fetchPreviewUrl(song)` function that hits the public `itunes.apple.com/search` API to dynamically retrieve a 30-second `.m4a` audio preview of the specific track requested.
**Rationale**: A UI prototype feels 100x more "real" if the music actually plays. Since we cannot host copyright MP3 files, the iTunes API is the most reliable, unauthenticated way to get high-quality audio previews of hit songs.

## 2. Global `<audio>` Element
**Decision**: A single `<audio id="global-audio-player">` was added to the DOM, mapped to our existing `STATE` machine. The visual progress bar is now driven directly by the `timeupdate` event of this HTML5 audio element.
**Rationale**: This ensures perfect synchronicity between the sound being played and the visual representation in the UI, avoiding the inevitable drift that a simulated `setInterval` causes.

## 3. Fallback Mechanism
**Decision**: If the iTunes API fails (e.g., rate limits, missing song), the engine falls back to a generic royalty-free track from `soundhelix.com`.
**Rationale**: A live presentation cannot have a broken "Play" button. Graceful degradation ensures the audio experience never entirely fails.
