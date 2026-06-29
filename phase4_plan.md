# Phase 4 Plan: The Voice Engine

## What this phase builds
This phase builds the Voice Save Intent Engine, the core feature of the prototype. We will implement continuous background listening using the Web Speech API, wake word detection, a natural language intent parser, multi-turn conversational follow-ups, and audio feedback via the Web Speech Synthesis API.

## Why this phase matters for the PM argument
This phase makes the argument that AI solves the "signal collapse" problem by removing all friction from saving music during passive listening sessions. By demonstrating that the system can handle natural, informal speech ("this is fire", "save the last one", "add to chill vibes") rather than robotic commands, we prove that capturing genuine emotional reactions to music is possible without ever touching a screen.

## Visual design decisions
- **Voice Status Bar**: A subtle, persistent overlay at the bottom of the screen (above the playbar). It will use a smooth, pulsing green gradient to indicate active listening without being distracting.
- **Transcript Display**: Real-time text display in the voice bar so the user always knows what the engine heard, building trust.
- **Conversational Cards**: Speech-bubble style overlay cards for multi-turn interactions (e.g., "Want to add it to a playlist?").
- **Settings Toggle**: A settings view in the "Voice" tab allowing users to toggle Voice Feedback (TTS) on/off.

## Component breakdown
- **Microphone Permission Flow**: Requesting access, handling denials gracefully with instructional UI.
- **Web Speech API Engine**: Continuous `SpeechRecognition` instance, automatically restarting on `onend` and `onerror` after a 500ms delay.
- **Wake Word Detector**: A fuzzy-matching substring scanner looking for variants like "hey spotify", "hey spot", "spotify!!", "bro spotify", etc., in the interim transcript buffer.
- **Intent Parser**: A regex-based weighted keyword matcher that takes the final result string (after the wake word) and routes it to specific action handlers.
- **Follow-up / Conversation Manager**: A state machine managing 8-second windows for contextual replies (e.g., post-save playlist routing, destructive confirmation, undo windows).
- **Web Speech Synthesis**: A singleton TTS wrapper that speaks confirmations aloud (e.g., "Saved Blinding Lights to Liked Songs") with an easy toggle.

## Data flow
1. `SpeechRecognition` captures audio -> Interim transcript updates the Voice Bar UI.
2. Final transcript triggers Wake Word Detection.
3. If Wake Word matched -> Strip Wake Word -> Pass to Intent Parser.
4. Intent Parser identifies action (e.g., `SAVE_CURRENT`) -> Calls action handler.
5. Action handler reads `STATE` -> Mutates `STATE` -> Triggers `saveState()` and UI `render()`.
6. Action handler opens a follow-up window (if applicable) -> Modifies conversation state.
7. Action handler triggers Speech Synthesis (if enabled) and pushes a visual Toast notification.

## Voice considerations
- **Ambiguity Handling**: If the user says "save it" immediately after a song transition, the system must ask "Which one?" and enter an 8-second resolution window.
- **Fuzzy Matching**: Playlists ("chill vibes") must be fuzzy-matched against spoken text ("add to chill").
- **The 10-Second Undo**: Every action must snapshot the previous state, allowing "Hey Spotify, undo that" to revert the mutation instantly.

## Edge cases
- **Microphone Denied**: Show a clear, non-blocking UI state in the Voice tab explaining how to enable it.
- **Speech API Crash**: The `onerror` event will trigger a silent 500ms timeout followed by `recognition.start()`, ensuring it's "Always On".
- **Empty / Null State reads**: Try-catch blocks around all `STATE` mutations.
- **Repeated Failures**: If 3 `UNKNOWN` intents are parsed within 60 seconds, a proactive "Cheatsheet" overlay is triggered.

## Accessibility
- Speech Synthesis provides crucial audio feedback for visually impaired users or hands-free contexts.
- The Voice tab will have a manual start/stop override button for screen readers.

## Performance
- The `SpeechRecognition` engine runs entirely natively in the browser, meaning zero API latency.
- The intent parser uses optimized RegExp patterns to resolve intents in under 5ms, preventing main-thread blocking.

## Browser and device considerations
- Web Speech API is fully supported in Chrome (Desktop & Android).
- Safari/iOS support for continuous listening is notoriously flaky; we will use standard polyfills/fallbacks if running on WebKit, but Chrome is the target environment for the PM presentation.

## Testing checklist
- [ ] Deny mic permission -> verify graceful failure.
- [ ] Allow mic -> verify continuous green pulse.
- [ ] Say "Hey Spotify save this" -> verify song saves, TTS speaks, and follow-up card appears.
- [ ] Say "Chill vibes" during follow-up -> verify song added to playlist.
- [ ] Say "Hey Spotify undo that" -> verify song is removed.
- [ ] Say "Hey Spotify save the last song" -> verify previous song saves.
- [ ] Say 3 gibberish commands -> verify Cheatsheet appears.

## Questions for review
Are we ready to proceed with writing `phase4.html` and wiring up the Web Speech API?
