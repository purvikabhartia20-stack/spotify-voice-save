# Phase 3 Plan (Updated: Real Posters & Hyper-Realistic UI)

## 1. Goal Description
The objective of Phase 3 is to build out the **Library Screen** to be fully functional, dynamic, and reactive to our central `STATE`. We are also going to vastly improve the UI realism by introducing real playlist covers, accurate fonts, and precise spacing that mimics the actual Spotify application.

## 2. Technical Architecture & State Management
Phase 3 will heavily rely on these state arrays:
- `STATE.likedSongs`: An array of objects `[{id: number, addedAt: timestamp}]`.
- `STATE.playlists`: An array of objects `[{id: "p1", name: "Late Night Drives", cover: "url", songIds: [...]}, ...]`. 
*Note: We are adding a `cover` attribute to store real poster URLs for each playlist.*

**Reactivity:**
Our existing `render()` function is triggered whenever `STATE` changes (via the Proxy setter). We will extend the `render()` function to:
1. Re-render the Liked Songs list inside the Library view.
2. Re-render the Playlist accordions inside the Library view.
3. Keep the "In X playlists" pill on the Now Playing screen perfectly synced.

## 3. Component Details & UX Micro-decisions

### A. The Liked Songs View
- **Real Posters**: We will use the official Spotify "Liked Songs" graphic (the purple/blue gradient with the white heart).
- **Reverse Chronological Order**: Render `STATE.likedSongs` in reverse order (newest additions at the top).
- **Relative Timestamps**: A `setInterval` running every 60 seconds will update the relative time strings (e.g., "Added 2 mins ago").
- **Empty State**: If `STATE.likedSongs.length === 0`, we will display a beautifully styled empty state ("Songs you like will appear here") with a CTA button to go back to Home.

### B. The Playlist Accordions
- **Real Posters**: We will source actual high-quality image URLs for iconic albums and standard Spotify playlist covers (e.g., the official "Discover Weekly" graphics). 
- **Expand/Collapse**: Each of the 4 playlists will be rendered as a collapsible accordion section. The header will feature the playlist cover, name, song count, and a chevron icon.
- **Chevron Rotation**: Clicking the playlist header will toggle a `.collapsed` CSS class. A CSS transition (`transform: rotate(-90deg)`) will smoothly animate the chevron.
- **Inline Removal**: Each song inside a playlist will have a subtle "Remove" icon that appears on hover. Clicking it will trigger a `removeFromPlaylist(playlistId, songId)` function, updating `STATE.playlists`.

### C. Cross-Component Reactivity
- **The Pill Update**: The "In X playlists" pill on the Now Playing screen calculates its value dynamically using `getPlaylistsForSong()`. It will update instantly when a song is removed from a playlist in the Library tab.

## 4. Implementation Steps

1. **State Schema Update**: 
   - Modify the `toggleHeart` function to store objects `{id: number, addedAt: number}`.
   - Update `STATE.playlists` to include `cover` URLs with real Spotify/album posters.
2. **Library DOM Structure**:
   - Clear the hardcoded `.lib-list` HTML in `phase3.html`.
   - Create two main container divs: `#liked-songs-container` and `#playlists-container`.
3. **Render Functions**:
   - Write `renderLikedSongs()`: Iterates over the liked songs state, formats the relative timestamp, and generates the HTML.
   - Write `renderPlaylists()`: Iterates over `STATE.playlists`. For each playlist, generate the accordion header with the real poster and the inner list of songs.
4. **Action Handlers**:
   - `togglePlaylist(playlistId)`
   - `removeFromPlaylist(playlistId, songId)`
5. **CSS Styling**:
   - Meticulously recreate the exact spacing, font sizes, and subtext colors (`#b3b3b3`) of the Spotify Library list items. Ensure pin icons (📌) and subtexts are perfectly aligned.
