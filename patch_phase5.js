const fs = require('fs');
let content = fs.readFileSync('phase5.html', 'utf8');

// 1. Update DEFAULT_STATE
const oldState = `    voiceFeedbackEnabled: true, unknownCommandCount: 0,
    sessionSignals: [],`;
const newState = `    voiceFeedbackEnabled: true, unknownCommandCount: 0,
    sessionSignals: [],
    consecutiveUnsavedSongs: 0,
    unknownCommandTimestamps: [],
    proactiveNudgeShown2: false,`;
if (content.includes(oldState)) content = content.replace(oldState, newState);

// 2. Add intents to vocab
const oldVocab = `      SESSION_RECAP: { recap: 4, "have i saved": 4, "did i save": 4, session: 3 },
      CANCEL: { nevermind: 5, cancel: 5, ignore: 5, abort: 5 }`;
const newVocab = `      SESSION_RECAP: { recap: 4, "have i saved": 4, "did i save": 4, session: 3 },
      CANCEL: { nevermind: 5, cancel: 5, ignore: 5, abort: 5 },
      PLAYLIST_ADD: { add: 4, put: 3, to: 1, in: 1, move: 4 },
      PLAYLIST_CREATE: { create: 4, make: 4, new: 3, playlist: 2 },
      PLAYLIST_DELETE: { delete: 4, remove: 3, rid: 3, playlist: 2 },
      MOOD_STEERING: { chill: 4, energy: 4, upbeat: 4, happy: 4, sad: 4, romantic: 4, mood: 2 },
      QUERY_SONG_INFO: { what: 3, song: 2, is: 1, this: 1, who: 3, sings: 3 },
      QUERY_SAVED_STATUS: { is: 2, saved: 4, liked: 4, have: 2, i: 1 }`;
if (content.includes(oldVocab)) content = content.replace(oldVocab, newVocab);

// 3. Update trackSaveSignal to reset unsaved counter
const oldTrackSave = `      // Update taste profile`;
const newTrackSave = `      // Reset unsaved counter
      _rawState.consecutiveUnsavedSongs = 0;
      saveState();

      // Update taste profile`;
if (content.includes(oldTrackSave)) content = content.replace(oldTrackSave, newTrackSave);

// 4. Update playNext to increment counter and show nudge
const oldPlayNext = `  function playNext() {
    STATE.previousSongId = STATE.currentSongId;`;
const newPlayNext = `  function playNext() {
    _rawState.consecutiveUnsavedSongs++;
    if (_rawState.consecutiveUnsavedSongs >= 3 && !_rawState.proactiveNudgeShown2) {
      _rawState.proactiveNudgeShown2 = true;
      VoiceEngine.toast("You've been listening for a while — heard anything you love? Say 'Hey Spotify, save this' to keep it.");
    }
    STATE.previousSongId = STATE.currentSongId;`;
if (content.includes(oldPlayNext)) content = content.replace(oldPlayNext, newPlayNext);

// 5. Update parseIntent cases
const oldUnknown = `        case 'UNKNOWN':
          this.speak("I didn't quite catch that.");
          this.toast("Unknown command");
          this.closeVoiceUI();
          return;
        }`;
const newCases = `        case 'QUERY_SONG_INFO':
          const songInfo = getSong(STATE.currentSongId);
          this.speak(\`This is \${songInfo.title} by \${songInfo.artist}\`);
          this.toast(\`\${songInfo.title} by \${songInfo.artist}\`);
          this.closeVoiceUI();
          return;
        case 'QUERY_SAVED_STATUS':
          const isSaved = STATE.playlists[0].songs.includes(STATE.currentSongId);
          if (isSaved) {
             this.speak("Yes, this is saved to your Liked Songs");
             this.toast("Saved to Liked Songs");
          } else {
             this.speak("No, this is not saved");
             this.toast("Not saved");
          }
          this.closeVoiceUI();
          return;
        case 'PLAYLIST_CREATE':
          const newId = Date.now().toString();
          _rawState.playlists.push({ id: newId, name: "New Playlist", songs: [] });
          saveState();
          this.speak("Created a new playlist. What should I call it?");
          this.showFollowUpWindow("What should I call it?");
          return;
        case 'PLAYLIST_DELETE':
          this.speak("Are you sure you want to delete this playlist?");
          this.showFollowUpWindow("Are you sure?");
          return;
        case 'MOOD_STEERING':
          this.speak("Playing something more chill");
          this.toast("Steering mood");
          this.closeVoiceUI();
          return;
        case 'PLAYLIST_ADD':
          this.speak("Added to playlist");
          this.toast("Added to playlist");
          this.closeVoiceUI();
          return;
        case 'UNKNOWN':
          const now = Date.now();
          _rawState.unknownCommandTimestamps.push(now);
          // Filter to last 60 seconds
          _rawState.unknownCommandTimestamps = _rawState.unknownCommandTimestamps.filter(t => now - t < 60000);
          saveState();
          
          if (_rawState.unknownCommandTimestamps.length >= 3) {
             this.toast("Cheatsheet: Try saying 'Save this', 'Skip', or 'Add to chill'");
             _rawState.unknownCommandTimestamps = []; // reset
             saveState();
          } else {
             this.speak("I didn't quite catch that.");
             this.toast("Unknown command");
          }
          this.closeVoiceUI();
          return;
        }`;

if (content.includes(oldUnknown)) content = content.replace(oldUnknown, newCases);

fs.writeFileSync('phase5.html', content);
console.log('Patched phase5.html');
