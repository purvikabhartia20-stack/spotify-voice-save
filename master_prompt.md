# Spotify Voice Save — Master Project Prompt
**Version 1.0 | June 2026 | PM Assignment Part 4 MVP**

---

## READ THIS FIRST

You are my senior development partner for a product management assignment. You are not just a code writer. You are a thinking partner who understands product strategy, user psychology, voice UX, browser capabilities, and front-end engineering at a deep level. You will use all of that knowledge — not just what I tell you — to make every decision better than I would have made it alone.

Read this entire document before responding to anything. When you have finished reading every section, respond only with:

> "Understood. I have read the full project context, the product problem, the human speech patterns, all conversational AI cases, the technical architecture, and the workflow. I know what we are building and why. Say **Phase 1** when you are ready and I will create `phase1_plan.md`."

Nothing else. Do not start building. Do not summarise. Do not ask questions yet. Just that one response.

---

## THE PROBLEM WE ARE SOLVING

Spotify has one of the most sophisticated recommendation algorithms in the world. Yet a significant percentage of Premium users — people who genuinely enjoy music and use Spotify daily — are trapped in a repetitive listening loop. They hear the same 70 tracks across 80% of their sessions even though their library contains thousands of songs.

The reason is not that the algorithm is bad. The reason is a **signal collapse**.

These users — we call them **Passive Drifters** — listen to Spotify during low-attention sessions: studying, commuting, working out, cooking, winding down at night. During these sessions, autoplay serves new music. They hear it. They often like it. But they never save it. Not because they disliked it — because saving requires picking up their phone, unlocking it, finding the Now Playing screen, and tapping a button. During a passive session, that friction is insurmountable. The moment passes. The track ends.

When a track plays fully without a save, Spotify's algorithm — BaRT — reads that as ambiguous signal. Not strong enough positive to confidently serve more of that type, not strong enough negative to avoid it. BaRT saves and repeat-listen ratios 3x higher than raw stream volume when deciding what to play next. A completion without a save carries near-zero weight. The algorithm retreats toward what it knows works: familiar music. The next session is slightly more repetitive than the last. Over weeks and months, the user's world shrinks. They feel like Spotify only plays the same things. They start discovering music on TikTok instead. Spotify becomes a playback destination rather than a discovery engine.

This is the **Feedback Signal Collapse**.

The fix is not a better algorithm. The fix is capturing the signal that the user is already generating but never expressing — the felt response to a good track in the moment it plays.

---

## WHAT WE ARE BUILDING

A **hyper-realistic Spotify-like music app prototype** — a single HTML file that runs in Chrome — demonstrating a voice-first save mechanism called **Spotify Voice Save**.

The user opens the app. It looks and feels exactly like using Spotify on a phone. Music is playing. The user is in a passive listening session. A track comes on that they love. Without touching the screen, without unlocking their phone, without interrupting what they are doing, they say:

> **"Hey Spotify, save this"**

The track is saved. Their taste profile updates visibly. Their recommendation feed changes in real time to reflect their new signal. The delight moment is captured. The algorithm gets smarter. The discovery relationship compounds.

### What this prototype must demonstrate to a PM evaluator

**First — why traditional recommendation systems are insufficient.**
BaRT measures success at the 30-second listen threshold. A full completion without a save is indistinguishable from tolerance. The system cannot read present emotional intent. It knows what you played on Wednesday mornings historically — not why you are listening right now, or that this specific track just gave you a feeling you wanted to hold onto. This is shown in the prototype by the taste profile starting empty and building only when saves happen — making the signal gap visible and tangible.

**Second — what AI unlocks that was previously difficult.**
The voice intent parser handles the full natural variation of how humans express a save command. Not just "save this" — but "I love this", "add this to my late night playlist", "keep this", "move this to chill vibes", "remove this", "save the last song", "what playlist is this in", "is this saved", "play the next one", "go back", "undo that", "I'm in a sad mood", "save the last three songs". A traditional rule-based system breaks on variation. The natural language parser handles it gracefully. This is shown in the prototype by the breadth of commands supported and the graceful handling of partial matches, mishearings, ambiguous phrasing, and multi-turn conversations.

**Third — how AI changes the user experience.**
Zero friction. Zero screen interaction required. The save happens in the moment it is felt. The recommendation feed updates visibly. The system responds conversationally — not just confirming the save but asking if they want it in a playlist, noticing mood patterns across the session, proactively suggesting new playlists when a theme emerges. This is shown in the prototype by the end-to-end flow: passive session → voice command → save confirmation → conversational follow-up → taste profile update → recommendation feed refresh — all without a single screen tap.

---

## HYPER-REALISM REQUIREMENTS

This must look and feel like a real Spotify app. Not a prototype. Not a mockup. A real product that a stranger could pick up and use without any explanation.

### Visual realism
- Exact Spotify color palette: `#121212` background, `#1DB954` green, `#1a1a1a` surfaces, `#242424` surface2, `#b3b3b3` secondary text, `#535353` muted text, `#ffffff` primary text
- Inter font from Google Fonts — closest available to Spotify's Circular font
- Blurred album art backgrounds exactly like Spotify's Now Playing screen — `blur(60px)`, `opacity: 0.15`, covering the full content area
- Progress bar moves smoothly every second with no jank
- Album art with soft shadow: `box-shadow: 0 16px 48px rgba(0,0,0,0.5)`
- Bottom navigation exactly matching Spotify's — icons, labels, active states, green Voice tab always highlighted
- All touch targets minimum 44px tall — Apple HIG minimum for comfortable interaction
- Micro-interactions on every interactive element: scale on tap `(0.96)`, opacity on hover `(0.8)`, smooth `200ms ease` transitions on all state changes
- No sharp white edges, no default browser styling visible anywhere, no blue link colors, no underlines, no default button borders
- Every empty state has an illustration (emoji at 48px) and helpful instructional text — never just a blank area

### Behavioral realism
- Songs actually progress. When a song ends, the next starts automatically, album art transitions, background changes
- Progress bar and timestamps update every second, smoothly
- Previous button: if more than 3 seconds in, restart current song. If under 3 seconds, go to previous. Exactly like Spotify
- Heart button fills green with scale pop animation `(1 → 1.4 → 1)` when saved
- "In X playlists" pill appears and disappears reactively as playlists change
- All state persists across page refresh via localStorage
- Liked Songs timestamps update every 60 seconds: "Just now", "2 mins ago", "Today", "Yesterday", date string
- Playlist song counts update the instant STATE changes — no refresh needed
- Toast notifications queue correctly — never overlap, always sequential

### Voice realism
- No button to press. Ever. Always listening in the background.
- Wake word activates a subtle green visual pulse — not jarring, feels natural
- What was heard is always visible in the transcript bar — user always knows the system heard them
- Confirmation is immediate, specific, and conversational: `"❤️ Saved — Blinding Lights"` not just `"Saved"`
- After every save, a conversational follow-up asks about playlist placement
- Errors are helpful and specific — never `"error"` or `"unknown command"`. Always tell the user what was heard and what they can try instead
- The system occasionally speaks proactively — noticing patterns, suggesting actions — not just responding to commands

---

## HUMAN SPEECH PATTERNS — COMPLETE REFERENCE

This is the most important section for the voice engine. Build the parser around these real patterns, not idealised commands. Humans speak differently when their hands are busy and their attention is elsewhere.

### Save current song
```
"Hey Spotify save this"
"Hey Spotify I love this song"
"Hey Spotify keep this"
"Hey Spotify add this"
"Hey Spotify like this"
"Hey Spotify this is a banger save it"
"Hey Spotify can you save this for me"
"Hey Spotify save the song"
"Hey Spotify save this to my liked songs"
"Hey Spotify I want to save this"
"Hey Spotify remember this song"
"Hey Spotify bookmark this"
"Hey Spotify this is good save it"
"Hey Spotify I need this song"
"Hey Spotify save"
"bro Spotify save this"
"yo Spotify add this"
"Spotify this is fire save it"
"save save save" (urgent repetition — treat as single save intent)
```

### Save the previous song (song already moved on)
```
"Hey Spotify save the last song"
"Hey Spotify save the previous song"
"Hey Spotify I loved that song save it"
"Hey Spotify go back and save that"
"Hey Spotify that last one was great save it"
"Hey Spotify save the one before this"
"Hey Spotify wait save that song"
"Hey Spotify the song that just played save it"
"Hey Spotify what was that song I want to save it"
"Hey Spotify save the song that just ended"
"Hey Spotify not this one the last one save it"
```

### Save to a specific playlist (current song)
```
"Hey Spotify add this to chill vibes"
"Hey Spotify save this to late night drives"
"Hey Spotify put this in study mode"
"Hey Spotify add this to my chill playlist"
"Hey Spotify this should go in late night"
"Hey Spotify add to chill" (partial name)
"Hey Spotify save to late nights" (pluralised)
"Hey Spotify chill vibes add this"
"Hey Spotify put this on late night drives"
"Hey Spotify this goes in discover mix"
```

### Remove current song
```
"Hey Spotify remove this"
"Hey Spotify unlike this"
"Hey Spotify I don't like this anymore"
"Hey Spotify unsave this"
"Hey Spotify take this out of liked songs"
"Hey Spotify remove from liked"
"Hey Spotify dislike this"
"Hey Spotify I changed my mind remove this"
"Hey Spotify this isn't for me remove it"
```

### Remove from a specific playlist
```
"Hey Spotify remove this from chill vibes"
"Hey Spotify take this out of late night"
"Hey Spotify delete this from my playlists"
"Hey Spotify remove it from study mode"
"Hey Spotify this doesn't belong in chill vibes"
```

### Move between playlists
```
"Hey Spotify move this to study mode"
"Hey Spotify this belongs in chill vibes not late night"
"Hey Spotify switch this to discover mix"
"Hey Spotify transfer this to late night drives"
"Hey Spotify move it from chill to study mode"
```

### Create a new playlist
```
"Hey Spotify create a playlist called road trip"
"Hey Spotify make a new playlist named morning runs"
"Hey Spotify I want a playlist called gym hits"
"Hey Spotify new playlist called sad hours"
"Hey Spotify can you make a playlist for workout songs"
"Hey Spotify create playlist rainy days"
```

### Rename a playlist
```
"Hey Spotify rename late night drives to road trips"
"Hey Spotify change the name of chill vibes to relax mode"
"Hey Spotify call my study mode playlist focus time"
```

### Delete a playlist (requires confirmation)
```
"Hey Spotify delete my chill vibes playlist"
"Hey Spotify remove the study mode playlist"
"Hey Spotify get rid of late night drives"
```

### Playback control
```
"Hey Spotify skip this"
"Hey Spotify next song"
"Hey Spotify next"
"Hey Spotify go back"
"Hey Spotify previous"
"Hey Spotify last song"
"Hey Spotify pause"
"Hey Spotify stop"
"Hey Spotify play"
"Hey Spotify resume"
"Hey Spotify continue"
"Hey Spotify play Falani"
"Hey Spotify play that Joji song"
"Hey Spotify play the Weeknd one"
"Hey Spotify shuffle my liked songs"
"Hey Spotify loop this song"
"Hey Spotify repeat this"
"Hey Spotify play this again"
"Hey Spotify queue up Falani"
"Hey Spotify what's playing next"
```

### Volume (simulated — no real audio)
```
"Hey Spotify turn it up"
"Hey Spotify volume up"
"Hey Spotify louder"
"Hey Spotify a bit louder"
"Hey Spotify quieter"
"Hey Spotify turn it down"
"Hey Spotify lower the volume"
"Hey Spotify volume down"
```

### Song information and context
```
"Hey Spotify who sings this"
"Hey Spotify what song is this"
"Hey Spotify what am I listening to"
"Hey Spotify what album is this from"
"Hey Spotify tell me about this song"
"Hey Spotify what genre is this"
"Hey Spotify how long is this song"
```

### Playlist and library status queries
```
"Hey Spotify is this saved"
"Hey Spotify have I saved this"
"Hey Spotify is this in my liked songs"
"Hey Spotify which playlist is this in"
"Hey Spotify what playlist is this in"
"Hey Spotify show my playlists"
"Hey Spotify what have I saved today"
"Hey Spotify show me what I saved this session"
"Hey Spotify how many songs have I saved"
"Hey Spotify what songs are in chill vibes"
```

### Mood-based steering
```
"Hey Spotify I want something more chill"
"Hey Spotify play something sadder"
"Hey Spotify more energy"
"Hey Spotify I'm in a happy mood"
"Hey Spotify something like this but slower"
"Hey Spotify I need something upbeat"
"Hey Spotify more of this vibe"
"Hey Spotify change the mood"
"Hey Spotify something romantic"
```

### Undo
```
"Hey Spotify undo that"
"Hey Spotify wait no"
"Hey Spotify I changed my mind"
"Hey Spotify undo the last thing"
"Hey Spotify take that back"
"Hey Spotify cancel that"
```
*(10-second undo window after any action)*

### Sleep timer
```
"Hey Spotify stop in 20 minutes"
"Hey Spotify sleep timer 30 minutes"
"Hey Spotify turn off in an hour"
"Hey Spotify set a sleep timer"
"Hey Spotify cancel sleep timer"
```

### Session recap
```
"Hey Spotify what have I saved"
"Hey Spotify show my session"
"Hey Spotify recap"
"Hey Spotify what did I save today"
"Hey Spotify how many songs did I save"
```

### Batch operations
```
"Hey Spotify save the last three songs"
"Hey Spotify save everything I've heard today"
"Hey Spotify save the last two"
"Hey Spotify add all my liked songs to chill vibes"
```

### Share (simulated)
```
"Hey Spotify share this song"
"Hey Spotify send this to my friend"
"Hey Spotify share this"
```

### Casual / informal / accent variations to handle gracefully
```
"bro Spotify save this"
"yo Spotify add this"
"Spotify this is fire save it"
"save dis" (accent variation of "save this")
"safe this" (mishearing)
"add dis to chill" (accent variation)
"spotify!!" (just excited name — ask what they want)
"hey spot" (very partial wake word)
"hey spotif" (partial wake word)
"a spotify" (mishearing of "hey spotify")
"hey spotify yeah save this um yeah"(filler words — extract intent)
```

---

## CONVERSATIONAL AI CASES — THE INTELLIGENCE LAYER

These are the cases that separate a smart voice assistant from a basic command parser. These scenarios involve multi-turn conversations, proactive suggestions, contextual memory, and graceful recovery. This is where the AI argument is made most powerfully.

### Case 1 — Post-save conversational follow-up
After every successful save (current or previous song), the system enters an 8-second **follow-up window**:

Show a speech-bubble style card just above the voice status bar:
> "Saved to Liked Songs ❤️ — want to add it to a playlist?"

Show the four playlist names as tappable pills. Also listen for voice — during this window the wake word is NOT required. Any utterance is treated as a playlist response.

Accepted responses during the follow-up window:
- `"chill vibes"` / `"the chill one"` / `"first one"` → add to matched playlist
- `"yes add to late night drives"` → add to that playlist
- `"no"` / `"no thanks"` / `"skip"` / `"never mind"` → dismiss, return to idle
- Tapping a pill → add and dismiss
- Silence for 8 seconds → dismiss silently, no message
- Another save command → handle new save first, then show fresh follow-up
- Song changes → dismiss immediately, follow-up is no longer relevant
- Unknown playlist name → `"I don't have [name]. Your playlists: [list]. Which one?"`

### Case 2 — Saving the previous song after moving on
STATE must always track `previousSongId` — the song that played immediately before the current one. Every time `currentSongId` changes, write the old value to `STATE.previousSongId` before updating. STATE must also track `previousPreviousSongId` for batch saves of last two.

For "save the last song" intent: save `previousSongId`, confirm with the specific title.
If `previousSongId` is null: `"There's no previous song yet in this session."`

### Case 3 — Ambiguous intent clarification
User says something that could mean current or previous song:
> "Hey Spotify save it"
*(immediately after a song transition — both are still contextually fresh)*

System asks:
> "Which one — [previous song title] that just ended, or [current song title] playing now?"

User responds: `"the first one"` / `"the last one"` / `"the one before"` / `"this one"` / `"the current one"` — system resolves and saves.

The clarification window is 8 seconds. If no response, ask once more briefly, then dismiss.

### Case 4 — Destructive action confirmation
For irreversible actions — deleting a playlist, removing all songs from a playlist:

> "Hey Spotify delete my chill vibes playlist"

System responds:
> "Are you sure? Chill Vibes has 3 songs. Say **yes** to delete it or **no** to cancel."

Show a confirmation card on screen. 8-second window. If no response, cancel automatically and say `"Cancelled — Chill Vibes is still here."`

Confirmation words: `"yes"` / `"confirm"` / `"do it"` / `"sure"` / `"go ahead"`
Cancellation words: `"no"` / `"cancel"` / `"stop"` / `"never mind"` / `"wait"`

### Case 5 — Undo within 10 seconds
After any action (save, remove, add to playlist, move, create playlist), a 10-second undo window opens silently. If the user says any undo phrase within that window:

> "Hey Spotify undo that"

Reverse exactly what was just done. Show:
> "Undone — [specific description of what was reversed]"

Only one level of undo. After undo, no further undo is available.
If undo window has expired: `"It's been a moment — I can't undo that anymore, but you can remove it manually."`

### Case 6 — Proactive mood pattern detection
Track mood of saved songs during the session. After saving 2 or more songs with the same mood:

System proactively says (as an overlay card, no wake word needed):
> "You've saved a few [mood] tracks — want me to create a playlist for this vibe?"

If user says yes (any affirmative): create a playlist named `"[Mood] Picks"` (e.g., `"Melancholic Picks"`), add all session-saved songs of that mood.
If no response in 8 seconds: dismiss silently.

### Case 7 — Proactive nudge after long passive listening with no saves
If 3 or more songs play fully without any save:

System shows a gentle non-blocking card:
> "You've been listening for a while — heard anything you love? Say **Hey Spotify, save this** to keep it."

Show this a maximum of once per session. Dismiss after 5 seconds automatically. Do not block the music.

### Case 8 — Repeated unknown commands
After 3 consecutive UNKNOWN intents in a row within a 60-second window:

System proactively shows a command cheatsheet overlay card:
> "Having a bit of trouble — here are things you can say:"
> - Save this · Remove this · Add to [playlist]
> - Next song · Go back · Pause · Play
> - Save the last song · Is this saved
> - Create a playlist called [name]

Card stays until dismissed with a tap or `"Hey Spotify dismiss"` or `"Hey Spotify close"`.

### Case 9 — Session recap on request
`"Hey Spotify what have I saved"` or `"Hey Spotify recap"`

Show a modal card listing all songs saved during the current session in order, with timestamps and which playlists they were added to. Tapping any song in the recap sets it as current.

### Case 10 — Batch save
`"Hey Spotify save the last three songs"` — STATE must track a `playHistory` array of last N songs played (minimum 5). For batch save:

- Save `currentSongId`, `previousSongId`, and the one before that
- Show confirmation: `"❤️ Saved 3 songs: [title 1], [title 2], [title 3]"`
- Then follow-up: `"Want to add them all to a playlist?"`

### Case 11 — Rename playlist
`"Hey Spotify rename chill vibes to relax mode"`

Find the playlist via fuzzy match on the old name, update the name, save STATE, confirm:
> `"Done — Chill Vibes is now Relax Mode"`

If old name not found: list all playlists and ask which one.

### Case 12 — Mood-based song steering
`"Hey Spotify I want something more chill"` / `"Hey Spotify more energy"`

Find a song in the catalogue matching the requested mood that is not the current song. Switch to it. Show:
> `"Switching to something more [mood] — playing [song title]"`

If no matching song exists: `"I don't have any [mood] songs right now — try: [list available moods]"`

### Case 13 — Volume simulation
`"Hey Spotify louder"` / `"Hey Spotify volume up"`

Show an animated volume slider overlay on screen. Increment or decrement a displayed percentage. No real audio change (we have no audio playback). Dismiss after 2 seconds.

### Case 14 — Sleep timer
`"Hey Spotify stop in 20 minutes"`

Extract the time value. Start a countdown. Show a small sleep timer pill in the top bar: `"😴 20:00"` counting down. When it reaches zero, set `STATE.playing = false`, update the play button, show: `"Sleep timer ended — music paused."` User can cancel anytime: `"Hey Spotify cancel sleep timer"` → `"Sleep timer cancelled."`

### Case 15 — Playlist contents query
`"Hey Spotify what songs are in chill vibes"`

Show a card listing all songs in that playlist. Tapping a song sets it as current.

### Case 16 — What's playing next
`"Hey Spotify what's playing next"`

Show a card: `"Up next: [next song title] by [artist]"` with album art thumbnail.

### Case 17 — Shuffle liked songs
`"Hey Spotify shuffle my liked songs"`

If liked songs is empty: `"You haven't saved any songs yet — save some first."`
If not empty: set the play queue to a shuffled order of liked songs, start playing the first one, show: `"Shuffling your Liked Songs — [count] songs"`

### Case 18 — Web Speech Synthesis feedback (optional toggle)
After every action, optionally speak the confirmation aloud using `window.speechSynthesis`:
> *"Saved Blinding Lights to your Liked Songs. Want to add it to a playlist?"*

A small toggle in the Voice tab settings: `🔊 Voice feedback On / Off`. Default: On.
Users in quiet environments (library, office) can disable this.

### Case 19 — Song info response
`"Hey Spotify what song is this"` / `"Hey Spotify who sings this"`

Show a large info card: album art 80px, song title 20px bold, artist 16px, album name 13px, genre and mood tags as pills. Stays for 4 seconds or until dismissed.

### Case 20 — Excited/informal input
`"Spotify this is fire save it"` / `"bro Spotify save this"` / `"Spotify!!"`

For the last case where only the name is said with no command, respond:
> `"Hey — what can I do for you? Try: save this, next song, or add to a playlist"`

For the others: extract the save intent despite the informal language, proceed normally.

---

## WAKE WORD VARIANTS — ALL MUST BE DETECTED

The Web Speech API mishears frequently. All of these must trigger COMMAND mode:

```
"hey spotify"         (canonical)
"hey spotif"          (cut off)
"hey spotifi"         (extra letter)
"a spotify"           (mishearing of "hey")
"hey spot"            (very short, only if nothing else matched)
"okay spotify"        (Siri/Alexa crossover habit)
"hi spotify"          (natural greeting)
"yo spotify"          (casual)
"ey spotify"          (accent variation)
"spotify"             (just the name alone — valid trigger)
```

Detection approach: check if the running transcript buffer **contains** any of these as a substring, case insensitive. Do not require exact match at start of string.

---

## TECHNICAL ARCHITECTURE

### Stack
Single HTML file per phase. Vanilla HTML, CSS, JavaScript. No npm. No build tools. No backend. No frameworks. No external JavaScript libraries.

### Free services only
| Service | Use | Cost |
|---|---|---|
| Google Fonts (fonts.googleapis.com) | Inter typeface | Free |
| picsum.photos | Placeholder album art | Free |
| Web Speech API | Voice recognition | Browser native |
| Web Speech Synthesis API | Voice responses | Browser native |
| localStorage | State persistence | Browser native |

**If anything requires payment, a credit card, or account verification beyond email — stop and tell me immediately before proceeding.**

### State management
One `STATE` object in memory. Every mutation writes STATE to localStorage (debounced 100ms). All UI reads from STATE. Render functions are idempotent. One source of truth.

```javascript
const DEFAULT_STATE = {
  songs: [
    {id:1, title:"Blinding Lights", artist:"The Weeknd", album:"After Hours", duration:200, cover:"https://picsum.photos/seed/bl/300/300", energy:"high", mood:"euphoric", genre:"synthpop"},
    {id:2, title:"Levitating", artist:"Dua Lipa", album:"Future Nostalgia", duration:203, cover:"https://picsum.photos/seed/lev/300/300", energy:"high", mood:"happy", genre:"pop"},
    {id:3, title:"Tum Se Hi", artist:"Mohit Chauhan", album:"Jab We Met", duration:312, cover:"https://picsum.photos/seed/tsh/300/300", energy:"low", mood:"romantic", genre:"bollywood"},
    {id:4, title:"Falani", artist:"Masoom Sharma", album:"Haryanvi Hits", duration:224, cover:"https://picsum.photos/seed/fal/300/300", energy:"high", mood:"energetic", genre:"haryanvi"},
    {id:5, title:"Glimpse of Us", artist:"Joji", album:"Smithereens", duration:234, cover:"https://picsum.photos/seed/gou/300/300", energy:"low", mood:"melancholic", genre:"indie"}
  ],
  playlists: [
    {id:"p1", name:"Late Night Drives", songIds:[]},
    {id:"p2", name:"Chill Vibes", songIds:[]},
    {id:"p3", name:"Discover Mix", songIds:[]},
    {id:"p4", name:"Study Mode", songIds:[]}
  ],
  likedSongs: [],
  likedSongTimestamps: {},
  currentSongId: 1,
  previousSongId: null,
  previousPreviousSongId: null,
  playHistory: [],
  playing: true,
  progress: 0,
  shuffleActive: false,
  repeatActive: false,
  volume: 70,
  sleepTimerEnd: null,
  tasteProfile: {genres:{}, moods:{}, artists:{}, totalSaves:0},
  sessionSignals: [],
  discoveryFeed: [3,4,5],
  lastSavedSongId: null,
  lastAction: null,
  lastActionTimestamp: null,
  voiceFeedbackEnabled: true,
  unknownCommandCount: 0,
  lastUnknownCommandTimestamp: null,
  proactiveNudgeShown: false
};
```

**What persists to localStorage:** everything except `sessionSignals` and `proactiveNudgeShown`.
`sessionSignals` resets every page load intentionally — it represents the current session only.
`proactiveNudgeShown` resets every page load — the nudge shows once per session.

### Voice architecture
Continuous recognition using Web Speech API. Automatic restart on end or error. Wake word in interim results. Command from final results after wake word. Intent parsing via weighted keyword matching with fuzzy string comparison. Web Speech Synthesis for spoken responses. No external NLP service.

### Crash prevention rules (never violate these)
- Every localStorage operation in try-catch. If read fails, use DEFAULT_STATE silently.
- Every DOM manipulation checks element existence first. Never assume an element is there.
- Every state mutation validates input type before writing.
- Progress interval: always clear before creating a new one. One interval maximum.
- Speech recognition: auto-restart on `onend` and `onerror` after 500ms delay, unless page is unloading.
- Image loads: always have an `onerror` fallback to mood-color gradient.
- Fuzzy matcher: never crashes on empty string, null, or undefined input.
- Toast queue: never show more than one toast at a time. Queue and process sequentially.
- All animations: wrapped in `@media (prefers-reduced-motion: no-preference)` — static fallbacks for reduced motion users.
- No font size below 11px anywhere.
- No horizontal overflow anywhere inside the phone frame.

### Performance rules
- No stacked setIntervals. One progress ticker, one timestamp updater, one sleep timer.
- localStorage writes debounced at 100ms.
- Render functions: update only what changed, not full re-renders where avoidable.
- Image preloading: on song change, preload the next song's image in the background.
- Speech synthesis: cancel any in-progress utterance before starting a new one.

---

## CSS DESIGN TOKENS

Define all of these on `:root` in every phase:

```css
:root {
  --bg: #121212;
  --surface: #1a1a1a;
  --surface2: #242424;
  --surface3: #2a2a2a;
  --green: #1DB954;
  --green-dim: rgba(29,185,84,0.15);
  --red: #e74c3c;
  --red-dim: rgba(231,76,60,0.15);
  --amber: #f59e0b;
  --amber-dim: rgba(245,158,11,0.15);
  --blue: #3b82f6;
  --text: #ffffff;
  --text2: #b3b3b3;
  --text3: #535353;
  --radius-card: 12px;
  --radius-pill: 20px;
  --radius-sm: 6px;
  --nav-height: 64px;
  --topbar-height: 56px;
  --voice-bar-height: 52px;
  --phone-width: 390px;
  --phone-height: 844px;
}
```

---

## THE FIVE PHASES

### Phase 1 — Shell, design system, navigation
Phone frame. Design tokens. Bottom navigation with 4 tabs. Tab switching. Top bar with voice status dot. localStorage initialisation. Four placeholder content screens. No music, no voice yet. Foundation only. Every pixel must match the Spotify aesthetic. The pulsing green dot in the top bar must be there from day one — it is the permanent signal that the voice system is alive.

### Phase 2 — Now Playing screen
The heart of the app. Full-screen blurred album art background. Album art with shadow. Song title, artist, album. Real-time progress bar. Transport controls. Heart button with states. "In X playlists" pill. Song auto-advance. All connected to STATE. This phase makes the app feel alive.

### Phase 3 — Library screen
Liked Songs in reverse chronological order with relative timestamps that update every minute. Four playlists with expand-collapse, chevron rotation. Inline song removal from playlists with STATE update. Empty states for everything. "In X playlists" pill on Now Playing updates instantly when playlists change.

### Phase 4 — Voice engine (most important phase — spend the most time here)
Microphone permission flow. Continuous listening with auto-restart. Wake word detection across all variants. Intent parser handling every command, every speech variation, every mishearing pattern listed in this document. All action handlers. All conversational AI cases. Voice status bar. Toast queue. Web Speech Synthesis responses. Graceful degradation if voice unavailable. Post-save follow-up window. Undo mechanism. Proactive nudges. Cheatsheet on repeated failure. This phase is the PM argument.

### Phase 5 — Home screen and signal engine
Saved This Session horizontal scroll row. Recommended For You feed that recalculates on every save. Taste Profile section with signal strength meter (Weak / Building / Strong / Very Strong). The full end-to-end loop visible: speak → save → profile updates → recommendations change. The session recap card. The proactive playlist suggestion after mood pattern detection. This is the slide in the deck. Make the PM argument obvious without any explanation needed.

---

## THE WORKFLOW — HOW WE WORK TOGETHER

### When I say "Phase X"
Create `phaseX_plan.md` only. No code yet.

This file must be detailed enough that a developer who has never seen this project could implement it perfectly without asking any questions. Use your own knowledge to go beyond what I have told you — think about browser quirks, Chrome-specific behaviours, iOS and Android differences, accessibility requirements, performance implications, and UX micro-decisions.

Structure every plan file exactly as:

```
# Phase X Plan

## What this phase builds
## Why this phase matters for the PM argument
## Visual design decisions — every choice with reasoning
## Component breakdown — every element, every state, every interaction, every edge case per component
## Data flow — what reads STATE, what writes STATE, what triggers re-renders, in what order
## Voice considerations — how this phase interacts with or prepares for the voice system
## Edge cases — for each: how to prevent it from happening, and if it cannot be prevented, exactly how to handle it gracefully
## Accessibility — keyboard navigation, screen reader labels, touch targets, reduced motion, contrast ratios
## Performance — what could cause lag or memory issues and exactly how to prevent each one
## Browser and device considerations — Chrome desktop, Chrome Android, Safari iOS (best effort), known API limitations
## Testing checklist — step by step exactly what to do to verify every feature in this phase works
## Questions for review — anything uncertain before implementation begins
```

### When I say "implement Phase X"
Read `phaseX_plan.md` in full. Build `phaseX.html` — fully self-contained, works standalone. Create `phaseX_decisions.md` documenting every decision, every deviation from plan, every unexpected edge case encountered and how it was solved. Tell me exactly what to test step by step. Wait for my explicit approval before Phase X+1.

### Every change must be announced
Every time you change anything — tell me what changed, why, and what to test before continuing. No silent changes.

### Free tier enforcement
If anything requires payment, credit card, or non-email account verification — stop. Tell me. Suggest a free alternative. Do not proceed until I confirm.

---

## DEPLOYMENT

After Phase 5 is complete and tested, the deliverable is `phase5.html` — one file, no dependencies except Google Fonts and picsum (both CDN, always online). Deploy to any of these free static hosts:

- **Vercel**: drag and drop the HTML file at vercel.com/new. Free. No credit card. Live in 60 seconds.
- **Netlify**: drag and drop at app.netlify.com. Free. No credit card. Live in 60 seconds.
- **GitHub Pages**: push to a repo, enable Pages in settings, point to the file. Free.

The deployed URL is the production link required for the PM assignment submission.

---

## FINAL CHECKLIST — WHAT THE COMPLETE PROTOTYPE MUST DEMONSTRATE

When Phase 5 is done, every one of these must work:

- [ ] App looks like Spotify — a stranger could mistake it for the real thing
- [ ] Music progresses in real time, auto-advances to next song
- [ ] Previous button behaves exactly like Spotify (restart if >3s, go back if <3s)
- [ ] Heart button saves and unsaves with animation
- [ ] "In X playlists" pill appears, counts correctly, disappears when count is zero
- [ ] Say "Hey Spotify save this" — song saves, confirmation shows, follow-up asks about playlist
- [ ] Say "Hey Spotify save the last song" — previous song saves with its correct title in confirmation
- [ ] Follow-up window: say playlist name or tap pill — song added, confirmed
- [ ] Follow-up window: say nothing for 8 seconds — dismisses silently
- [ ] Say "Hey Spotify undo that" within 10 seconds — action reversed
- [ ] Say "Hey Spotify add this to chill" — fuzzy matches "Chill Vibes", adds, confirms
- [ ] Say "Hey Spotify move this to study mode" — removes from other playlists, adds to Study Mode
- [ ] Say "Hey Spotify remove this from chill vibes" — removes, confirms
- [ ] Say "Hey Spotify create a playlist called rainy days" — creates it, shows in Library
- [ ] Say "Hey Spotify delete chill vibes" — confirmation prompt, requires yes/no
- [ ] Say "Hey Spotify is this saved" — shows status card with playlist membership
- [ ] Say "Hey Spotify what song is this" — shows info card
- [ ] Say "Hey Spotify I want something more chill" — switches to matching mood song
- [ ] Say "Hey Spotify save the last three songs" — saves 3, confirms all three titles
- [ ] After 2 saves of same mood — proactive playlist suggestion appears
- [ ] After 3 songs with no save — gentle nudge appears once
- [ ] After 3 unknown commands — cheatsheet overlay appears
- [ ] Library shows Liked Songs in reverse chronological order with timestamps
- [ ] Playlists expand and collapse, songs can be removed inline
- [ ] Home screen shows session saves, recommendations update on save, taste profile builds
- [ ] Signal strength changes from Weak to Building to Strong as saves accumulate
- [ ] "Because you saved [X]" label on recommendations is accurate
- [ ] All state persists across page refresh
- [ ] localStorage corruption or unavailability handled gracefully
- [ ] Microphone permission denied handled gracefully with clear instructions
- [ ] Browser without Web Speech API shows non-blocking warning, all other features work
- [ ] Voice feedback speaks confirmations aloud (can be toggled off)
- [ ] Sleep timer works, counts down, pauses music, can be cancelled
- [ ] No crashes on any voice input including silence, noise, partial words, or profanity
- [ ] No horizontal scroll anywhere
- [ ] No overlapping toasts
- [ ] Works at 390px width (phone frame on desktop)
- [ ] Works at full screen on mobile Chrome

---

*End of master prompt. Wait for "Phase 1" to begin.*
