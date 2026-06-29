# Phase 3.5 Plan: Real Audio Engine

## 1. Goal Description
The objective of Phase 3.5 is to integrate a real `HTMLAudioElement` into the prototype and connect it to a public music API so that clicking "Play" actually plays the songs in our database.

## 2. Technical Architecture & Music Source
Since we do not have local MP3 files for the 25 hit songs, we will dynamically fetch **30-second audio previews** from the public iTunes Search API.

When `playSong(id)` is triggered:
1. We will pause the current audio.
2. We will `fetch` from `https://itunes.apple.com/search?term={title}+{artist}&entity=song&limit=1`.
3. We will extract the `previewUrl` (a 30s `.m4a` file).
4. We will load this URL into a global `<audio>` element and call `.play()`.

## 3. Component Details & UX Micro-decisions

### A. The Audio Engine
- We will instantiate a hidden `<audio id="global-audio-player">` element in the DOM.
- We will map the `togglePlay()` function to call `audio.play()` and `audio.pause()`.

### B. Progress Bar Synchronization
- We will remove the fake `setInterval` that artificially incremented the progress bar.
- Instead, we will attach an event listener to the audio player's `timeupdate` event.
- The progress bar and the `0:00` timers will perfectly mirror the `audio.currentTime` and `audio.duration` (which will be 30 seconds for previews).

### C. Fallback Mechanism
- If the iTunes API fails to find a specific song, we will silently fallback to a generic royalty-free placeholder MP3 so the UI doesn't break and audio still plays.
