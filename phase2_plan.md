# Phase 2 Plan

## What this phase builds
- The **Now Playing Screen**, the visual and functional heart of the prototype.
- A rich, immersive UI featuring a full-screen blurred album art background (on mobile) and a dedicated bottom playbar (on desktop).
- A real-time progress bar that smoothly increments every second.
- Transport controls (Play/Pause, Previous, Next).
- The "Heart" (Save) button with an animated fill and scale effect when toggled.
- An "In X playlists" dynamic pill that appears when a song is saved to multiple playlists.
- Automatic song advancement when the progress bar reaches the end.
- Full integration with the JS Proxy `STATE` we built in Phase 1.

## Why this phase matters for the PM argument
- **The "Passive Session" Illusion**: To prove that Voice Save solves friction, the evaluator must first *feel* the passive listening experience. The automatic progression of music, the moving progress bar, and the changing backgrounds create the illusion of time passing in a listening session.
- **The Core Action**: The Heart button is the manual alternative to Voice Save. Its behavior here (saving the song) is exactly what the voice command will eventually automate. 

## Visual design decisions — every choice with reasoning
- **Blurred Backgrounds**: On mobile, the background will be a dynamically generated, heavily blurred (`blur(60px)`) version of the current song's album art with `opacity: 0.15` to ensure high text readability while keeping the screen visually connected to the music.
- **Album Art Shadow**: The main album art will feature a soft, deep shadow (`box-shadow: 0 16px 48px rgba(0,0,0,0.5)`) to lift it off the dark background, matching Spotify's premium feel.
- **Responsive Adaption**: 
  - *Mobile*: The Now Playing view takes over the main screen vertically.
  - *Desktop*: The Now Playing view acts as the bottom Playbar (housing transport controls and small album art), while the main content area remains free for the Home/Library views.

## Component breakdown — every element, every state, every interaction, every edge case per component
**1. Blurred Background Layer**
- *Element*: Absolute positioned `div` behind the main content (on mobile).
- *State*: Reads `STATE.songs[currentIndex].cover`.
- *Interaction*: Transitions smoothly on song change.
- *Edge Case*: Image fails to load. Fallback to a gradient based on `STATE.songs[currentIndex].mood`.

**2. Album Art Image**
- *Element*: `<img class="album-art">`.
- *State*: Updates `src` based on current song.
- *Interaction*: Scales down slightly when active/pressed.

**3. Transport Controls (Play, Prev, Next)**
- *Element*: SVG buttons.
- *State*: Play button changes path based on `STATE.playing` (Play vs Pause icon).
- *Interaction*: 
  - Play/Pause toggles `STATE.playing`.
  - Next increments `currentSongId`. 
  - Prev checks `STATE.progress`: if > 3s, resets progress to 0. If < 3s, decrements `currentSongId`.
- *Edge Case*: Reaching the end of the song list. It will loop back to the first song.

**4. Progress Bar & Timestamps**
- *Element*: A horizontal track `div` with a fill `div` and two text timestamps.
- *State*: Reads `STATE.progress` (seconds) and `duration`.
- *Interaction*: None yet (scrubbing is complex and not strictly required, but the progress bar itself must visually move).
- *Edge Case*: `setInterval` overlapping. Must clear old intervals before setting new ones.

**5. Heart Button**
- *Element*: SVG button.
- *State*: Filled green if `currentSongId` is in `STATE.likedSongs`, else outlined white.
- *Interaction*: Tapping adds/removes the ID from `STATE.likedSongs` and triggers a pop animation (`scale 1 -> 1.4 -> 1`).

**6. "In X playlists" Pill**
- *Element*: Small rounded pill below the song title.
- *State*: Calculates how many playlists contain `currentSongId`.
- *Interaction*: None.
- *Edge Case*: Zero playlists. The pill receives `display: none`.

## Data flow — what reads STATE, what writes STATE, what triggers re-renders, in what order
- **Timer Loop**: A central `setInterval` runs every 1000ms. If `STATE.playing` is true, it increments `STATE.progress` by 1.
- **Auto-Advance**: If `STATE.progress >= duration`, it updates `STATE.previousSongId = currentSongId`, changes `currentSongId` to the next song, and resets `progress = 0`.
- **Proxy Magic**: Because we built the Proxy in Phase 1, simply doing `STATE.progress++` automatically triggers `render()`, which smoothly updates the DOM width of the progress bar without any extra wiring.

## Voice considerations — how this phase interacts with or prepares for the voice system
- The `previousSongId` tracking is critical for Phase 4. When auto-advance happens, we must strictly record what just finished playing so the voice command *"save the last song"* works perfectly.
- The Heart button logic (add to `likedSongs`) is exactly what the intent parser will call when the user says *"save this"*.

## Edge cases — for each: how to prevent it from happening, and if it cannot be prevented, exactly how to handle it gracefully
- **Janky Progress Bar**: Running `render()` every second might cause DOM thrashing if it rebuilds everything. 
  - *Prevention*: The `render()` function will only update the `width` percentage of the progress bar and the text node of the timestamp if it's the only thing that changed, bypassing a full DOM wipe.
- **Spamming Next/Prev**: Rapid clicks could cause multiple intervals or song skips.
  - *Prevention*: The interval is managed as a singleton. Clearing it on every click prevents overlap.
- **Missing Album Art**: 
  - *Prevention*: Use the `onerror` attribute on the `<img>` tag to swap to a solid color block immediately.

## Accessibility — keyboard navigation, screen reader labels, touch targets, reduced motion, contrast ratios
- **Keyboard Navigation**: As established, `Space` toggles play/pause. Left/Right arrows will trigger Prev/Next track.
- **Screen Reader**: `aria-live="polite"` on the song title so screen readers announce track changes.
- **Reduced Motion**: The Heart button pop animation will be disabled if `prefers-reduced-motion` is true.

## Performance — what could cause lag or memory issues and exactly how to prevent each one
- **Image Loading on song change**: Blank flashes while the next image downloads from `picsum.photos`.
  - *Prevention*: A hidden `Image` object will preload `STATE.songs[nextIndex].cover` in the background so it is instantly ready when the song advances.
- **Interval Memory Leaks**: 
  - *Prevention*: Ensure the interval ID is stored in a global variable and explicitly cleared if the component is ever unmounted or if multiple play commands are fired.

## Browser and device considerations — Chrome desktop, Chrome Android, Safari iOS (best effort), known API limitations
- **No real audio**: Browsers block auto-playing audio without user interaction. Fortunately, our prototype simulates audio (just a progress bar), which completely sidesteps the browser auto-play policy nightmare.
- **vh units on Mobile**: We will ensure the mobile Now Playing screen height uses `100dvh` so it doesn't get cut off by Safari/Chrome URL bars.

## Testing checklist — step by step exactly what to do to verify every feature in this phase works
1. Verify the song title, artist, and album art load correctly.
2. Ensure the background is appropriately blurred (mobile) or integrated into the playbar (desktop).
3. Press Play. Verify the progress bar moves smoothly every second.
4. Wait for the progress bar to reach the end. Verify it auto-advances to the next track.
5. Press Prev when time > 3s. Verify progress resets to 0:00.
6. Press Prev when time < 3s. Verify it loads the previous track.
7. Click the Heart button. Verify the green fill and scale animation, and that the state saves.
8. (Desktop) Press the Spacebar to pause/play and Left/Right arrows to skip.

---

## 💡 Creative Suggestions for Phase 2
Since you asked for suggestions, here are three ways to make the Now Playing screen vastly superior for the PM assignment:

1. **The Dynamic Color Extraction (Like Real Spotify)**:
   - *Idea*: Instead of just a generic background, we use a tiny bit of math (via a hidden canvas or pre-calculated colors) to extract the dominant color from the album art and use it to tint the background gradient and the playbar background. 
   - *Why*: This is Spotify's signature visual hallmark. It immediately screams "hyper-realism". (I can easily simulate this by mapping each song in our `DEFAULT_STATE` to a specific HEX color code based on its mood/genre).
2. **Vinyl / Disc Spin Animation**:
   - *Idea*: When the music is playing, the album art could slowly rotate. When paused, it stops. 
   - *Why*: It adds kinetic energy to the "passive listening" illusion, proving the app is alive even when the user isn't touching it.
3. **Lyrics / "Storyline" Teaser Pill**:
   - *Idea*: Add a small, clickable "Lyrics" or "Behind the Lyrics" card peaking up from the bottom of the mobile screen.
   - *Why*: It makes the screen look completely finished and true to life, giving the PM evaluator exactly what they expect to see on a modern Spotify screen.

## Questions for review
- Do you want to approve the **Dynamic Color Extraction** and **Vinyl Spin** creative suggestions?
- On Desktop, the Now Playing controls live in the bottom Playbar. Do you want the Mobile layout to *also* have a "Mini Player" that sits just above the bottom nav tabs (like real Spotify), which can be tapped to expand the full Now Playing screen? Or should we just have a dedicated "Now Playing" tab for simplicity? (I strongly recommend the Mini Player for ultimate realism).
