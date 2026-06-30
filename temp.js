
    // --- VOICE ENGINE ---
  const VoiceEngine = {
    recognition: null,
    synth: window.speechSynthesis,
    isListening: false,
    wakeWords: ["hey spotify", "hey spot", "spotify", "ok spotify", "okay spotify", "hi spotify", "yo spotify", "ey spotify"],
    followUpWindow: null, 
    followUpData: null,
    followUpTimeout: null,
    undoSnapshot: null,
    undoTimeout: null,

    // Vocabulary with weights for intents
    vocab: {
      SAVE_CURRENT: { save: 3, add: 3, like: 2, keep: 2, bookmark: 2, remember: 2, this: 1, song: 1, fire: 3, banger: 3 },
      SAVE_PREVIOUS: { save: 2, add: 2, like: 2, last: 5, previous: 5, before: 3 },
      REMOVE_CURRENT: { remove: 3, unlike: 3, dislike: 3, unsave: 3, delete: 2 },
      UNDO: { undo: 4, cancel: 3, wait: 2, mind: 3, back: 2, mistake: 2 },
      PLAYBACK_NEXT: { next: 4, skip: 4 },
      PLAYBACK_PREV: { back: 4, previous: 2, last: 1 },
      PLAYBACK_PAUSE: { pause: 4, stop: 4 },
      PLAYBACK_PLAY: { play: 4, resume: 3, continue: 3 },
      SLEEP_TIMER: { sleep: 3, timer: 3, stop: 1, minutes: 2, hour: 2 },
      BATCH_SAVE: { three: 4, "3": 4, all: 3, everything: 3 }
    },

    init() {
      if (!('webkitSpeechRecognition' in window)) {
        console.warn("Speech API not supported");
        return;
      }
      
      // Explicitly request microphone to force the browser prompt instantly
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
         // Stop the explicit track, we just wanted the permission prompt to trigger
         stream.getTracks().forEach(track => track.stop());
         
         this.recognition = new webkitSpeechRecognition();
         this.recognition.continuous = true;
         this.recognition.interimResults = true;
         this.recognition.lang = 'en-US';

         this.recognition.onstart = () => {
           this.isListening = true;
           document.getElementById('voice-bar').classList.add('active');
           document.querySelector('.voice-indicator').classList.add('listening');
           document.querySelector('.voice-indicator').classList.remove('command');
           document.getElementById('voice-transcript').textContent = 'Listening...';
           document.getElementById('voice-transcript').classList.add('interim');
           document.getElementById('mic-status-text').textContent = 'Active (Listening)';
         };

         this.recognition.onresult = (e) => {
           let interim = '';
           let final = '';
           for (let i = e.resultIndex; i < e.results.length; ++i) {
             if (e.results[i].isFinal) final += e.results[i][0].transcript.toLowerCase();
             else interim += e.results[i][0].transcript.toLowerCase();
           }
           this.handleTranscript(interim, final);
         };

         this.recognition.onerror = (e) => {
           console.error("Speech Error:", e.error);
           if (e.error === 'not-allowed') {
             this.isListening = false;
             document.getElementById('mic-status-text').textContent = 'Blocked! Please allow mic access.';
             document.getElementById('mic-status-text').style.color = 'var(--red)';
           }
         };

         this.recognition.onend = () => {
           if (this.isListening) {
             setTimeout(() => {
               try { this.recognition.start(); } catch(e){}
             }, 500);
           }
         };

         // Start listening immediately after initialization
         this.start();
      }).catch(err => {
         console.error("Mic denied at getUserMedia", err);
         document.getElementById('mic-status-text').textContent = 'Blocked! Please allow mic access.';
         document.getElementById('mic-status-text').style.color = 'var(--red)';
      });
    },

    start() {
      if (this.recognition && !this.isListening) {
        try { this.recognition.start(); } catch(e){}
      }
    },

    stop() {
      this.isListening = false;
      if (this.recognition) this.recognition.stop();
      document.getElementById('voice-bar').classList.remove('active');
      document.getElementById('mic-status-text').textContent = 'Stopped';
    },

    speak(text) {
      if (!STATE.voiceFeedbackEnabled) return;
      this.synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.1;
      this.synth.speak(u);
    },

    toast(msg) {
      const q = document.getElementById('toast-container');
      const el = document.createElement('div');
      el.className = 'toast';
      el.textContent = msg;
      q.appendChild(el);
      setTimeout(() => el.classList.add('show'), 10);
      setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 300);
      }, 3000);
    },

    showFollowUp(text, options) {
      const card = document.getElementById('conversation-card');
      document.getElementById('conv-text').textContent = text;
      const optEl = document.getElementById('conv-options');
      optEl.innerHTML = options.map(o => `<button class="conv-pill">${o}</button>`).join('');
      card.classList.add('show');
      
      optEl.querySelectorAll('button').forEach(btn => {
        btn.onclick = () => this.handleFollowUpInput(btn.textContent.toLowerCase());
      });

      clearTimeout(this.followUpTimeout);
      this.followUpTimeout = setTimeout(() => this.closeFollowUp(), 8000);
    },

    closeFollowUp() {
      document.getElementById('conversation-card').classList.remove('show');
      this.followUpWindow = null;
      this.followUpData = null;
    },

    // NLP: Levenshtein distance for fuzzy matching
    levenshtein(a, b) {
      if (a.length === 0) return b.length;
      if (b.length === 0) return a.length;
      const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
      for (let i = 0; i <= a.length; i += 1) matrix[0][i] = i;
      for (let j = 0; j <= b.length; j += 1) matrix[j][0] = j;
      for (let j = 1; j <= b.length; j += 1) {
        for (let i = 1; i <= a.length; i += 1) {
          const ind = a[i - 1] === b[j - 1] ? 0 : 1;
          matrix[j][i] = Math.min(
            matrix[j][i - 1] + 1, 
            matrix[j - 1][i] + 1, 
            matrix[j - 1][i - 1] + ind
          );
        }
      }
      return matrix[b.length][a.length];
    },

    // NLP: Score text against an intent vocabulary
    scoreIntent(words, intentName) {
      const v = this.vocab[intentName];
      let score = 0;
      for (let word of words) {
        for (let [kw, weight] of Object.entries(v)) {
          // If perfect match or very close fuzzy match (distance <= 1)
          if (word === kw || (word.length > 3 && this.levenshtein(word, kw) <= 1)) {
            score += weight;
          }
        }
      }
      return score;
    },

    handleTranscript(interim, final) {
      const vTrans = document.getElementById('voice-transcript');
      const vInd = document.querySelector('.voice-indicator');
      
      if (interim) {
        const hasWake = this.wakeWords.some(w => interim.includes(w));
        vInd.classList.toggle('command', hasWake);
        vInd.classList.toggle('listening', !hasWake);
        vTrans.textContent = interim;
        vTrans.classList.add('interim');
      }

      if (final) {
        vTrans.textContent = final;
        vTrans.classList.remove('interim');
        vInd.classList.remove('command');
        vInd.classList.add('listening');

        if (this.followUpWindow) {
          this.handleFollowUpInput(final);
          return;
        }

        let command = null;
        for (let w of this.wakeWords) {
          const idx = final.indexOf(w);
          if (idx !== -1) {
            command = final.substring(idx + w.length).trim();
            break;
          }
        }

        if (command === "") {
           this.toast("Hey - what can I do for you?");
           this.speak("Hey, what can I do for you? Try 'save this'.");
           return;
        }
        if (command) this.parseIntent(command);
      }
    },

    snapshotState() {
      this.undoSnapshot = JSON.stringify(_rawState);
      clearTimeout(this.undoTimeout);
      this.undoTimeout = setTimeout(() => { this.undoSnapshot = null; }, 10000);
    },

    undo() {
      if (!this.undoSnapshot) {
        this.speak("It's been a moment, I can't undo that anymore.");
        this.toast("Cannot undo anymore.");
        return;
      }
      _rawState = JSON.parse(this.undoSnapshot);
      saveState(); render();
      this.speak("Undone.");
      this.toast("Action undone.");
      this.undoSnapshot = null;
    },

    fuzzyPlaylistMatch(text) {
      let bestMatch = null;
      let minDistance = 999;
      
      // Clean up common filler words in the text
      const cleanText = text.replace(/(add to|save to|put in)/g, '').trim();

      for (let p of STATE.playlists) {
        const dist = this.levenshtein(cleanText, p.name.toLowerCase());
        // Exact substring matches win immediately
        if (cleanText.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(cleanText)) {
          return p;
        }
        if (dist < minDistance && dist <= 3) { // Allow up to 3 typos
          minDistance = dist;
          bestMatch = p;
        }
      }
      return bestMatch;
    },

    parseIntent(cmd) {
      this.snapshotState();
      
      // Tokenize input and clean punctuation
      const words = cmd.replace(/[.,!?]/g, '').split(' ').filter(w => w.length > 0);
      
      // Calculate scores for all intents
      const scores = {
        SAVE_PREVIOUS: this.scoreIntent(words, 'SAVE_PREVIOUS'),
        SAVE_CURRENT: this.scoreIntent(words, 'SAVE_CURRENT'),
        REMOVE_CURRENT: this.scoreIntent(words, 'REMOVE_CURRENT'),
        UNDO: this.scoreIntent(words, 'UNDO'),
        PLAYBACK_NEXT: this.scoreIntent(words, 'PLAYBACK_NEXT'),
        PLAYBACK_PREV: this.scoreIntent(words, 'PLAYBACK_PREV'),
        PLAYBACK_PAUSE: this.scoreIntent(words, 'PLAYBACK_PAUSE'),
        PLAYBACK_PLAY: this.scoreIntent(words, 'PLAYBACK_PLAY'),
        SLEEP_TIMER: this.scoreIntent(words, 'SLEEP_TIMER'),
        BATCH_SAVE: this.scoreIntent(words, 'BATCH_SAVE')
      };

      // Find highest score
      let topIntent = null;
      let maxScore = 0;
      for (const [intent, score] of Object.entries(scores)) {
        if (score > maxScore) { maxScore = score; topIntent = intent; }
      }

      // If confidence is too low, treat as unknown
      if (maxScore < 2) topIntent = 'UNKNOWN';

      switch(topIntent) {
        case 'UNDO':
          this.undo();
          return;
          
        case 'BATCH_SAVE':
          const hist = [STATE.currentSongId, STATE.previousSongId, STATE.previousPreviousSongId].filter(id => id);
          hist.forEach(id => {
             if (!STATE.likedSongs.some(ls => ls.id === id)) {
               _rawState.likedSongs.push({id, addedAt: Date.now()});
             }
          });
          saveState(); render();
          const titles = hist.map(id => getSong(id).title).join(", ");
          this.speak(`Saved ${hist.length} songs: ${titles}. Want to add them to a playlist?`);
          this.toast(`Saved ${hist.length} songs`);
          this.followUpWindow = 'playlist_add_batch';
          this.followUpData = hist;
          this.showFollowUp("Want to add them to a playlist?", STATE.playlists.map(p=>p.name));
          return;

        case 'SAVE_PREVIOUS':
          if (!STATE.previousSongId) {
             this.speak("There is no previous song yet in this session.");
             return;
          }
          const pSong = getSong(STATE.previousSongId);
          if (!STATE.likedSongs.some(ls => ls.id === pSong.id)) {
             _rawState.likedSongs.push({id: pSong.id, addedAt: Date.now()});
             saveState(); render();
          }
          this.speak(`Saved the last song, ${pSong.title}. Want to add it to a playlist?`);
          this.toast(`❤️ Saved - ${pSong.title}`);
          this.followUpWindow = 'playlist_add';
          this.followUpData = [pSong.id];
          this.showFollowUp("Want to add it to a playlist?", STATE.playlists.map(p=>p.name));
          return;

        case 'SAVE_CURRENT':
          const song = getSong(STATE.currentSongId);
          const isLiked = STATE.likedSongs.some(ls => ls.id === song.id);
          if (!isLiked) {
            _rawState.likedSongs.push({id: song.id, addedAt: Date.now()});
            saveState(); render();
          }
          
          // Secondary intent check: Did they say a playlist name in the same sentence?
          const matched = this.fuzzyPlaylistMatch(cmd);
          if (matched) {
             if (!matched.songIds.includes(song.id)) matched.songIds.push(song.id);
             saveState(); render();
             this.speak(`Added ${song.title} to ${matched.name}.`);
             this.toast(`Added to ${matched.name}`);
          } else {
             this.speak(`Saved ${song.title}. Want to add it to a playlist?`);
             this.toast(`❤️ Saved - ${song.title}`);
             this.followUpWindow = 'playlist_add';
             this.followUpData = [song.id];
             this.showFollowUp("Saved to Liked Songs ❤️ — want to add it to a playlist?", STATE.playlists.map(p=>p.name).concat(['No thanks']));
          }
          return;

        case 'REMOVE_CURRENT':
          const s = getSong(STATE.currentSongId);
          _rawState.likedSongs = STATE.likedSongs.filter(ls => ls.id !== s.id);
          saveState(); render();
          this.speak(`Removed ${s.title}.`);
          this.toast(`Removed ${s.title}`);
          return;

        case 'PLAYBACK_NEXT': playNext(); this.toast("Skipping"); return;
        case 'PLAYBACK_PREV': playPrev(); this.toast("Going back"); return;
        case 'PLAYBACK_PAUSE': if(STATE.playing) togglePlay(); this.toast("Paused"); return;
        case 'PLAYBACK_PLAY': if(!STATE.playing) togglePlay(); this.toast("Playing"); return;
        
        case 'SLEEP_TIMER':
          const sleepMatch = cmd.match(/(\\d+)/);
          const mins = sleepMatch ? sleepMatch[1] : "30";
          this.speak(`Sleep timer set for ${mins} minutes.`);
          this.toast(`Timer: ${mins}m`);
          return;

        default:
          // Check for Volume command which is a bit dynamic
          if (/(louder|volume up|turn it up)/.test(cmd)) {
             this.toast("Volume: 85%");
             return;
          }
          
          // Unknown handler
          _rawState.unknownCommandCount++;
          if (STATE.unknownCommandCount >= 3) {
             _rawState.unknownCommandCount = 0;
             this.toast("Cheatsheet: Try 'save this', 'next song', or 'add to playlist'");
             this.speak("Having trouble? Try saying save this, or next song.");
          } else {
             this.speak("I didn't quite catch that.");
          }
          return;
      }
    },

    handleFollowUpInput(text) {
      if (/(no|skip|never mind|cancel)/.test(text)) {
        this.closeFollowUp();
        this.speak("Okay.");
        return;
      }
      
      const matched = this.fuzzyPlaylistMatch(text);
      if (matched && this.followUpWindow.startsWith('playlist_add')) {
         this.followUpData.forEach(id => {
            if (!matched.songIds.includes(id)) matched.songIds.push(id);
         });
         saveState(); render();
         this.speak(`Added to ${matched.name}.`);
         this.toast(`Added to ${matched.name}`);
         this.closeFollowUp();
      } else {
         this.speak(`I don't see that playlist. Which one?`);
      }
    }
  };



  // 25 SONGS DATABASE
  const DEFAULT_STATE = {
    activeTab: 'home',
    nowPlayingExpanded: false,
    likedExpanded: true,
    songs: [
      {id:1, title:"Blinding Lights", artist:"The Weeknd", album:"After Hours", duration:200, cover:"https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/a6/6e/bf/a66ebf79-5008-8948-b352-a790fc87446b/19UM1IM04638.rgb.jpg/600x600bb.jpg", color:"#b02a2a"},
      {id:2, title:"Levitating", artist:"Dua Lipa", album:"Future Nostalgia", duration:203, cover:"https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/6c/11/d6/6c11d681-aa3a-d59e-4c2e-f77e181026ab/190295092665.jpg/600x600bb.jpg", color:"#a832a8"},
      {id:3, title:"Glimpse of Us", artist:"Joji", album:"Smithereens", duration:234, cover:"https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/d0/2a/43/d02a433a-3ab8-9a94-b07d-1dc599b64966/93624864387.jpg/600x600bb.jpg", color:"#222222"},
      {id:4, title:"As It Was", artist:"Harry Styles", album:"Harry's House", duration:167, cover:"https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/2a/19/fb/2a19fb85-2f70-9e44-f2a9-82abe679b88e/886449990061.jpg/600x600bb.jpg", color:"#8c512a"},
      {id:5, title:"Kill Bill", artist:"SZA", album:"SOS", duration:153, cover:"https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/bd/3b/a9/bd3ba9fb-9609-144f-bcfe-ead67b5f6ab3/196589564931.jpg/600x600bb.jpg", color:"#1a4361"},
      {id:6, title:"Creepin'", artist:"Metro Boomin", album:"Heroes & Villains", duration:221, cover:"https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/82/f7/2b/82f72ba4-524c-fc9d-cb8c-5a96d2ddf536/22UM1IM35267.rgb.jpg/600x600bb.jpg", color:"#611a1a"},
      {id:7, title:"Anti-Hero", artist:"Taylor Swift", album:"Midnights", duration:200, cover:"https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/3d/01/f2/3d01f2e5-5a08-835f-3d30-d031720b2b80/22UM1IM07364.rgb.jpg/600x600bb.jpg", color:"#43346b"},
      {id:8, title:"Pink + White", artist:"Frank Ocean", album:"Blonde", duration:184, cover:"https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/bb/45/68/bb4568f3-68cd-619d-fbcb-4e179916545d/BlondCover-Final.jpg/600x600bb.jpg", color:"#6b6734"},
      {id:9, title:"Cruel Summer", artist:"Taylor Swift", album:"Lover", duration:178, cover:"https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/49/3d/ab/493dab54-f920-9043-6181-80993b8116c9/19UMGIM53909.rgb.jpg/600x600bb.jpg", color:"#8a2364"},
      {id:10, title:"Starboy", artist:"The Weeknd", album:"Starboy", duration:230, cover:"https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b5/92/bb/b592bb72-52e3-e756-9b26-9f56d08f47ab/16UMGIM67864.rgb.jpg/600x600bb.jpg", color:"#141738"},
      {id:11, title:"Lover", artist:"Taylor Swift", album:"Lover", duration:221, cover:"https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/49/3d/ab/493dab54-f920-9043-6181-80993b8116c9/19UMGIM53909.rgb.jpg/600x600bb.jpg", color:"#8a2364"},
      {id:12, title:"Shape of You", artist:"Ed Sheeran", album:"Divide", duration:233, cover:"https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/15/e6/e8/15e6e8a4-4190-6a8b-86c3-ab4a51b88288/190295851286.jpg/600x600bb.jpg", color:"#22567d"},
      {id:13, title:"Sunflower", artist:"Post Malone", album:"Spider-Man", duration:158, cover:"https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/4b/30/2c/4b302cb6-7a14-5464-4e97-0577e9d0be49/18UMGIM82277.rgb.jpg/600x600bb.jpg", color:"#7a7d22"},
      {id:14, title:"Sweater Weather", artist:"The Neighbourhood", album:"I Love You.", duration:240, cover:"https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/28/71/00/287100fb-5c31-0195-5343-e6b3625886d0/886443969834.jpg/600x600bb.jpg", color:"#363636"},
      {id:15, title:"Save Your Tears", artist:"The Weeknd", album:"After Hours", duration:215, cover:"https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/83/3a/f7/833af71b-2e0c-3303-24f5-8f5c546c073b/20UMGIM21167.rgb.jpg/600x600bb.jpg", color:"#b02a2a"},
      {id:16, title:"good 4 u", artist:"Olivia Rodrigo", album:"SOUR", duration:178, cover:"https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/76/46/48/76464884-0e9c-1951-a3f6-ce02f74c2b19/21UMGIM26093.rgb.jpg/600x600bb.jpg", color:"#5b3678"},
      {id:17, title:"Heat Waves", artist:"Glass Animals", album:"Dreamland", duration:238, cover:"https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/da/8b/77/da8b7731-6f4f-eacf-5e74-8b23389eefa1/20UMGIM03371.rgb.jpg/600x600bb.jpg", color:"#783636"},
      {id:18, title:"Peaches", artist:"Justin Bieber", album:"Justice", duration:198, cover:"https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/e0/92/da/e092da2d-9f6d-11dc-7843-2021e95a2b61/21UMGIM17518.rgb.jpg/600x600bb.jpg", color:"#6f7a36"},
      {id:19, title:"Watermelon Sugar", artist:"Harry Styles", album:"Fine Line", duration:174, cover:"https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/2b/c4/c9/2bc4c9d4-3bc6-ab13-3f71-df0b89b173de/886448022213.jpg/600x600bb.jpg", color:"#7a365b"},
      {id:20, title:"Kiss Me More", artist:"Doja Cat", album:"Planet Her", duration:208, cover:"https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/14/f3/28/14f32832-b9d9-1ba1-e20a-18c2ff8b6a80/886449410873.jpg/600x600bb.jpg", color:"#753245"},
      {id:21, title:"Stay", artist:"The Kid LAROI", album:"F*CK LOVE", duration:141, cover:"https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/89/59/6a/89596ab9-fa3c-8d08-4d95-a6450fa2013c/886449400515.jpg/600x600bb.jpg", color:"#222222"},
      {id:22, title:"INDUSTRY BABY", artist:"Lil Nas X", album:"MONTERO", duration:212, cover:"https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/f7/16/67/f7166746-6299-5e54-8c7c-9535e941a53e/886449403929.jpg/600x600bb.jpg", color:"#6e1531"},
      {id:23, title:"Bad Habit", artist:"Steve Lacy", album:"Gemini Rights", duration:232, cover:"https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/df/63/3d/df633d60-5e7f-7050-0857-0327c0a3649e/196589380630.jpg/600x600bb.jpg", color:"#595821"},
      {id:24, title:"golden hour", artist:"JVKE", album:"this is what...", duration:209, cover:"https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/8d/1a/7b/8d1a7b44-316f-7c7f-4380-935673fb697a/5056167175650.jpg/600x600bb.jpg", color:"#594721"},
      {id:25, title:"Vampire", artist:"Olivia Rodrigo", album:"GUTS", duration:219, cover:"https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/08/9e/07/089e0799-b405-9e69-b648-e6a19df9879c/24UMGIM30485.rgb.jpg/600x600bb.jpg", color:"#261536"}
    ],
    playlists: [
      {id:"p1", name:"Discover Weekly", cover:"https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/49/3d/ab/493dab54-f920-9043-6181-80993b8116c9/19UMGIM53909.rgb.jpg/600x600bb.jpg", songIds:[1, 15, 22], expanded: true},
      {id:"p2", name:"Chill Hits", cover:"https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/d0/2a/43/d02a433a-3ab8-9a94-b07d-1dc599b64966/93624864387.jpg/600x600bb.jpg", songIds:[14, 17, 23], expanded: false},
      {id:"p3", name:"Late Night Drives", cover:"https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/a6/6e/bf/a66ebf79-5008-8948-b352-a790fc87446b/19UM1IM04638.rgb.jpg/600x600bb.jpg", songIds:[], expanded: false},
      {id:"p4", name:"Study Mode", cover:"https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/bd/3b/a9/bd3ba9fb-9609-144f-bcfe-ead67b5f6ab3/196589564931.jpg/600x600bb.jpg", songIds:[3, 5, 8], expanded: false}
    ],
    likedSongs: [{id: 2, addedAt: Date.now() - 3600000}, {id: 4, addedAt: Date.now() - 120000}], 
    voiceFeedbackEnabled: true, unknownCommandCount: 0,
    currentSongId: 1, previousSongId: null, playHistory: [], playing: true, progress: 0, volume: 70
  };

  // OVERRIDE FOR PHASE 3 TO CLEAR OLD STORAGE
  const STORAGE_KEY = 'spotify_voice_save_state_v4';
  let _rawState = {};
  let progressInterval = null;
  let libraryTimeInterval = null;
  const audioPlayer = document.getElementById('global-audio-player');

  function loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        _rawState = { ...DEFAULT_STATE, ...JSON.parse(stored) };
        _rawState.nowPlayingExpanded = false; 
      } else { _rawState = { ...DEFAULT_STATE }; }
    } catch (e) { _rawState = { ...DEFAULT_STATE }; }
  }

  let saveTimeout = null;
  function saveState() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      try {
        const toSave = { ..._rawState };
        delete toSave.nowPlayingExpanded;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      } catch(e) {}
    }, 100);
  }

  const proxyHandler = {
    set(target, property, value) {
      target[property] = value;
      if (property !== 'progress') saveState(); 
      render(property);
      return true;
    }
  };
  
  loadState();
  const STATE = new Proxy(_rawState, proxyHandler);

  function formatTime(s) { const m=Math.floor(s/60); const sc=Math.floor(s%60); return `${m}:${sc<10?'0':''}${sc}`; }
  function timeAgo(ms) {
    const diff = Math.floor((Date.now() - ms) / 1000);
    if (diff < 60) return 'Just now';
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins} min${mins!==1?'s':''} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr${hrs!==1?'s':''} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days!==1?'s':''} ago`;
  }
  
  function getSong(id) { return STATE.songs.find(s => s.id === id) || STATE.songs[0]; }
  function getPlaylistsForSong(id) { return STATE.playlists.filter(p => p.songIds.includes(id)); }

  function togglePlay() { 
    if (STATE.playing) {
      STATE.playing = false;
      audioPlayer.pause();
    } else {
      STATE.playing = true;
      if (!audioPlayer.src || audioPlayer.src === window.location.href) {
        const song = getSong(STATE.currentSongId);
        fetchPreviewUrl(song).then(url => {
          audioPlayer.src = url;
          audioPlayer.currentTime = STATE.progress;
          audioPlayer.play().catch(e => { STATE.playing = false; });
        });
      } else {
        audioPlayer.play().catch(e => { STATE.playing = false; });
      }
    }
  }
  function toggleMobileNowPlaying() { STATE.nowPlayingExpanded = !STATE.nowPlayingExpanded; }
  
  async function fetchPreviewUrl(song) {
    try {
      const q = encodeURIComponent(`${song.title} ${song.artist}`);
      const res = await fetch(`https://itunes.apple.com/search?term=${q}&entity=song&limit=1`);
      const data = await res.json();
      if (data.results && data.results.length > 0 && data.results[0].previewUrl) {
        return data.results[0].previewUrl;
      }
    } catch (e) {
      console.log('Failed to fetch preview from iTunes:', e);
    }
    // Fallback royalty-free track if fetch fails or no preview exists
    return "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
  }

  async function playSong(id) {
    STATE.previousSongId = STATE.currentSongId;
    _rawState.currentSongId = id;
    _rawState.progress = 0;
    _rawState.playing = true;
    
    // Pause current
    audioPlayer.pause();
    saveState();
    render('songChange');
    
    // Fetch and play new song
    const song = getSong(id);
    const previewUrl = await fetchPreviewUrl(song);
    audioPlayer.src = previewUrl;
    audioPlayer.play().catch(e => { STATE.playing = false; });
  }

  function playNext() {
    STATE.previousSongId = STATE.currentSongId;
    STATE.playHistory.push(STATE.currentSongId);
    const currentIndex = STATE.songs.findIndex(s => s.id === STATE.currentSongId);
    const nextIndex = (currentIndex + 1) % STATE.songs.length;
    playSong(STATE.songs[nextIndex].id);
  }

  function playPrev() {
    if (STATE.progress > 3) {
      _rawState.progress = 0;
      audioPlayer.currentTime = 0;
      saveState();
      render('progress');
    } else {
      const currentIndex = STATE.songs.findIndex(s => s.id === STATE.currentSongId);
      const prevIndex = (currentIndex - 1 + STATE.songs.length) % STATE.songs.length;
      playSong(STATE.songs[prevIndex].id);
    }
  }

  function toggleHeart() {
    const id = STATE.currentSongId;
    const isLiked = STATE.likedSongs.some(ls => ls.id === id);
    if (isLiked) {
      STATE.likedSongs = STATE.likedSongs.filter(ls => ls.id !== id);
    } else {
      STATE.likedSongs = [...STATE.likedSongs, {id: id, addedAt: Date.now()}];
    }
  }

  function toggleLibrarySection(type, id) {
    if (type === 'liked') {
      STATE.likedExpanded = !STATE.likedExpanded;
    } else {
      const idx = STATE.playlists.findIndex(p => p.id === id);
      if (idx !== -1) {
        const newPlaylists = [...STATE.playlists];
        newPlaylists[idx].expanded = !newPlaylists[idx].expanded;
        STATE.playlists = newPlaylists;
      }
    }
  }

  function removeFromPlaylist(pid, sid) {
    const idx = STATE.playlists.findIndex(p => p.id === pid);
    if (idx !== -1) {
      const newPlaylists = [...STATE.playlists];
      newPlaylists[idx].songIds = newPlaylists[idx].songIds.filter(id => id !== sid);
      STATE.playlists = newPlaylists;
    }
  }

  function startEngine() {
    // Sync progress from HTMLAudioElement instead of artificial timer
    audioPlayer.addEventListener('timeupdate', () => {
      if (!audioPlayer.paused) {
        _rawState.progress = audioPlayer.currentTime;
        render('progress');
      }
    });

    audioPlayer.addEventListener('ended', () => {
      playNext();
    });

    // Handle initial state if playing from reload
    const song = getSong(STATE.currentSongId);
    fetchPreviewUrl(song).then(url => {
      audioPlayer.src = url;
      audioPlayer.currentTime = STATE.progress;
      if (STATE.playing) {
        audioPlayer.play().catch(e => { 
          console.log('Autoplay prevented on load'); 
          STATE.playing = false; 
          render('songChange');
        });
      }
    });

    if (libraryTimeInterval) clearInterval(libraryTimeInterval);
    libraryTimeInterval = setInterval(() => {
      renderLibrary(); // Re-render library every minute for relative timestamps
    }, 60000);
  }

  function renderLibrary() {
    const container = document.getElementById('library-container');
    if (!container) return;
    
    let html = '';
    
    // Liked Songs Accordion
    html += `
      <div class="lib-accordion">
        <div class="lib-accordion-header" onclick="toggleLibrarySection('liked')">
          <img src="https://misc.scdn.co/liked-songs/liked-songs-640.png" alt="Liked Songs">
          <div class="lib-item-info">
            <span class="lib-item-title">Liked Songs</span>
            <span class="lib-item-desc"><span class="pin-icon">📌</span> Playlist • ${STATE.likedSongs.length} song${STATE.likedSongs.length!==1?'s':''}</span>
          </div>
          <svg class="chevron ${STATE.likedExpanded ? '' : 'collapsed'}" viewBox="0 0 24 24"><path d="M12 16l-6-6h12z"/></svg>
        </div>
        <div class="lib-accordion-content ${STATE.likedExpanded ? 'open' : ''}">
    `;
    
    if (STATE.likedSongs.length === 0) {
       html += `<div class="empty-state">Songs you like will appear here.</div>`;
    } else {
       const reversedLiked = [...STATE.likedSongs].sort((a,b) => b.addedAt - a.addedAt);
       reversedLiked.forEach(ls => {
          const s = getSong(ls.id);
          html += `
            <div class="lib-track">
              <img src="${s.cover}" alt="">
              <div class="lib-track-info" onclick="playSong(${s.id})">
                <span class="lib-track-title">${s.title}</span>
                <span class="lib-track-artist">${s.artist}</span>
              </div>
              <span class="lib-track-time">${timeAgo(ls.addedAt)}</span>
            </div>
          `;
       });
    }
    html += `</div></div>`; // Close accordion
    
    // Playlists Accordions
    STATE.playlists.forEach(p => {
       html += `
       <div class="lib-accordion">
        <div class="lib-accordion-header" onclick="toggleLibrarySection('playlist', '${p.id}')">
          <img src="${p.cover}" alt="">
          <div class="lib-item-info">
            <span class="lib-item-title">${p.name}</span>
            <span class="lib-item-desc">Playlist • ${p.songIds.length} song${p.songIds.length!==1?'s':''}</span>
          </div>
          <svg class="chevron ${p.expanded ? '' : 'collapsed'}" viewBox="0 0 24 24"><path d="M12 16l-6-6h12z"/></svg>
        </div>
        <div class="lib-accordion-content ${p.expanded ? 'open' : ''}">
       `;
       if (p.songIds.length === 0) {
         html += `<div class="empty-state">This playlist is empty.</div>`;
       } else {
         p.songIds.forEach(sid => {
           const s = getSong(sid);
           html += `
            <div class="lib-track">
              <img src="${s.cover}" alt="">
              <div class="lib-track-info" onclick="playSong(${s.id})">
                <span class="lib-track-title">${s.title}</span>
                <span class="lib-track-artist">${s.artist}</span>
              </div>
              <button class="remove-btn" onclick="event.stopPropagation(); removeFromPlaylist('${p.id}', ${s.id})" title="Remove">
                <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12l1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"/></svg>
              </button>
            </div>
           `;
         });
       }
       html += `</div></div>`;
    });
    
    container.innerHTML = html;
  }

  function render(changedProp) {
    const song = getSong(STATE.currentSongId);
    const isLiked = STATE.likedSongs.some(ls => ls.id === song.id);
    const playSvg = STATE.playing ? 
      `<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>` : 
      `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
      
    if (changedProp === 'progress') {
      const duration = audioPlayer.duration && !isNaN(audioPlayer.duration) ? audioPlayer.duration : 30; // default 30s preview
      const pct = (STATE.progress / duration) * 100 + '%';
      document.querySelectorAll('.dyn-progress').forEach(el => el.style.width = pct);
      document.querySelectorAll('.dyn-time-curr').forEach(el => el.textContent = formatTime(STATE.progress));
      return;
    }

    const duration = audioPlayer.duration && !isNaN(audioPlayer.duration) ? audioPlayer.duration : 30;
    document.documentElement.style.setProperty('--dynamic-color', song.color);
    document.querySelectorAll('.dyn-title').forEach(el => el.textContent = song.title);
    document.querySelectorAll('.dyn-artist').forEach(el => el.textContent = song.artist);
    document.querySelectorAll('.dyn-time-total').forEach(el => el.textContent = formatTime(duration));
    document.querySelectorAll('.dyn-art').forEach(el => {
      if (el.src !== song.cover) el.src = song.cover;
      el.classList.toggle('playing', STATE.playing);
    });

    const pct = (STATE.progress / duration) * 100 + '%';
    document.querySelectorAll('.dyn-progress').forEach(el => el.style.width = pct);
    document.querySelectorAll('.dyn-time-curr').forEach(el => el.textContent = formatTime(STATE.progress));

    document.querySelectorAll('.dyn-playbtn').forEach(el => el.innerHTML = playSvg);
    document.querySelectorAll('.dyn-heart').forEach(el => { el.classList.toggle('active', isLiked); });

    const pill = document.querySelector('.dyn-pill');
    const inPlaylists = getPlaylistsForSong(song.id);
    if (inPlaylists.length > 0) {
      pill.textContent = `In ${inPlaylists.length} playlist${inPlaylists.length > 1 ? 's' : ''}`;
      pill.classList.add('visible');
    } else {
      pill.classList.remove('visible');
    }

    const npOverlay = document.getElementById('mobile-now-playing');
    if (npOverlay) npOverlay.classList.toggle('expanded', STATE.nowPlayingExpanded);

    const tab = STATE.activeTab || 'home';
    document.querySelectorAll('.view-section').forEach(el => el.classList.toggle('active', el.id === 'view-' + tab));
    document.querySelectorAll('[data-tab]').forEach(el => el.classList.toggle('active', el.getAttribute('data-tab') === tab));

    if (changedProp === 'likedSongs' || changedProp === 'playlists' || changedProp === 'likedExpanded' || changedProp === undefined) {
      renderLibrary();
    }
  }

  function toggleVoiceFeedback() {
    STATE.voiceFeedbackEnabled = !STATE.voiceFeedbackEnabled;
    document.getElementById('toggle-voice-feedback').classList.toggle('on', STATE.voiceFeedbackEnabled);
  }

  document.addEventListener('DOMContentLoaded', () => {
    VoiceEngine.init();
    document.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        if (STATE.activeTab !== targetTab) STATE.activeTab = targetTab;
      });
    });

    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      else if (e.code === 'ArrowRight') { e.preventDefault(); playNext(); }
      else if (e.code === 'ArrowLeft') { e.preventDefault(); playPrev(); }
    });

    render();
    startEngine();
  });

