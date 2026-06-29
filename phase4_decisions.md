# Phase 4 Decisions

## The "Always On" Architecture
I implemented the Voice Engine using `webkitSpeechRecognition` initialized with `continuous = true` and `interimResults = true`. 
To achieve the "always on" requirement, the `onend` event includes a 500ms `setTimeout` that automatically calls `recognition.start()` again. This creates a persistent listening loop that only stops if the user explicitly disables the mic.

## Wake Word Detection (Fuzzy Substrings)
Instead of relying on perfect transcription of "hey spotify", the engine scans the `interim` results buffer for an array of substrings: `["hey spotify", "hey spot", "spotify", "ok spotify", "okay spotify", "hi spotify", "yo spotify", "ey spotify"]`. 
This guarantees that casual or misheard triggers instantly activate the "Command Mode" visual state (the pulsing green dot turns solid white and enlarges).

## Intent Parsing via Regex
Because I am limited to vanilla JS with no external NLP libraries, I built a robust regex-based intent parser inside `parseIntent()`. 
- **Undo**: `/(undo|cancel that|wait no|take that back|changed my mind)/`
- **Save Current**: `/(save|add|like|keep|remember|bookmark)( this| the song| it)?/`
- **Save Previous**: `/(save|add|like|keep) (the )?(last|previous|one before)/`
This allows for massive variation in user input without breaking.

## Conversational Follow-Ups
When a save occurs, the system pushes `followUpWindow = 'playlist_add'` and renders the `conversation-card`. For the next 8 seconds, the engine skips wake-word detection and routes all text directly to `handleFollowUpInput()`, attempting a fuzzy match against the user's playlists. 

## The 10-Second Undo
Every mutative action triggers `snapshotState()`, which stringifies `_rawState` into a backup variable and starts a 10-second expiration timer. If the user says "Undo", we simply parse the JSON back into `_rawState`, call `saveState()`, and call `render()`. This provides a universal, bulletproof undo mechanism for every possible voice command.

## Speech Synthesis
I wrapped `window.speechSynthesis` in a `speak()` function that checks `STATE.voiceFeedbackEnabled`. Before speaking a new confirmation, it calls `synth.cancel()` to instantly cut off any currently playing speech.

## File Injection
Because the Voice Engine adds ~400 lines of complex logic, HTML, and CSS to `phase3.html`, I wrote a temporary Node script (`build_phase4.js`) to parse `phase4.html` and perfectly inject the UI overlays and the JS engine into their correct locations without risking regex mismatches.
