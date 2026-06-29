# Phase 3 Plan

## 1. Goal Description
The objective of Phase 3 is to build out the **Library Screen** to be fully functional, dynamic, and reactive to our central `STATE`. Currently, the Library screen is a static visual shell. We need to transform it into a working data view that supports Liked Songs, multiple playlists with expand/collapse mechanics, inline track removal, empty states, and real-time cross-component reactivity (e.g., updating the "In X playlists" pill on the Now Playing screen when a song is removed from a playlist).

## 2. Technical Architecture & State Management
We already have `STATE.likedSongs` and `STATE.playlists` defined in our Proxy state. Phase 3 will heavily rely on these arrays.
- `STATE.likedSongs`: An array of song IDs (e.g., `[2, 5, 16]`).
- `STATE.playlists`: An array of objects `[{id: "p1", name: "Late Night Drives", songIds: [...]}, ...]`.

**Reactivity:**
Our existing `render()` function is triggered whenever `STATE` changes (via the Proxy setter). We will extend the `render()` function to:
1. Re-render the Liked Songs list inside the Library view.
2. Re-render the Playlist accordions inside the Library view.
3. Keep the "In X playlists" pill on the Now Playing screen perfectly synced.

## 3. Component Details & UX Micro-decisions

### A. The Liked Songs View
- **Reverse Chronological Order**: We will render `STATE.likedSongs` in reverse order (newest additions at the top) by mapping `STATE.likedSongs.slice().reverse()`.
- **Relative Timestamps**: We will store the timestamp of when a song was liked. (We will need to update `STATE.likedSongs` from an array of IDs to an array of objects: `{id: songId, addedAt: Date.now()}`). A `setInterval` running every 60 seconds will update the relative time strings (e.g., "Added 2 mins ago").
- **Empty State**: If `STATE.likedSongs.length === 0`, we will display a beautifully styled empty state ("Songs you like will appear here") with a CTA button to go back to Home.

### B. The Playlist Accordions
- **Expand/Collapse**: Each of the 4 playlists will be rendered as a collapsible accordion section. The header will feature the playlist name, song count, and a chevron icon.
- **Chevron Rotation**: Clicking the playlist header will toggle a `.collapsed` CSS class. A CSS transition (`transform: rotate(-90deg)`) will smoothly animate the chevron.
- **Inline Removal**: Each song inside a playlist will have a subtle "Remove" icon (an 'X' or trash can) that appears on hover. Clicking it will trigger a `removeFromPlaylist(playlistId, songId)` function, which updates `STATE.playlists` and triggers a re-render.
- **Empty State**: If a playlist has 0 songs, expanding it will reveal a minimal empty state ("This playlist is empty").

### C. Cross-Component Reactivity
- **The Pill Update**: The "In X playlists" pill on the Now Playing screen calculates its value dynamically using `getPlaylistsForSong(STATE.currentSongId)`. Because `render()` fires whenever `STATE.playlists` is mutated, this pill will update instantly when a user removes the currently playing song from a playlist in the Library tab.

## 4. Implementation Steps

1. **State Schema Update**: 
   - Modify the `toggleHeart` function to store objects `{id: number, addedAt: number}` instead of just IDs in `STATE.likedSongs`.
2. **Library DOM Structure**:
   - Clear the hardcoded `.lib-list` HTML in `phase3.html`.
   - Create two main container divs: `#liked-songs-container` and `#playlists-container`.
3. **Render Functions**:
   - Write `renderLikedSongs()`: Iterates over the liked songs state, formats the relative timestamp, and generates the HTML.
   - Write `renderPlaylists()`: Iterates over `STATE.playlists`. For each playlist, generate the accordion header and the inner list of songs.
   - Integrate these functions into the main `render()` pipeline.
4. **Action Handlers**:
   - `togglePlaylist(playlistId)`: Toggles the open/closed state of the accordion (this can be managed via local DOM state rather than global Proxy state for performance).
   - `removeFromPlaylist(playlistId, songId)`: Filters the song out of the specific playlist's `songIds` array.
5. **CSS Styling**:
   - Add transition styles for the accordion expansion (`max-height` or grid-template transitions).
   - Add hover states for the inline remove buttons.
   - Style the empty states to be centered, using `#b3b3b3` text, matching Spotify's aesthetic.
