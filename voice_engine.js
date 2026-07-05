  // --- VOICE ENGINE ---
  const VoiceEngine = {
    recognition: null,
    synth: window.speechSynthesis,
    isListening: false,
    wakeWords: ["hey spotify", "hey spot", "spotify", "ok spotify", "okay spotify", "hi spotify", "yo spotify", "ey spotify"],
    followUpWindow: null, // 'playlist_add', 'delete_confirm', 'clarify_song'
    followUpData: null,
    followUpTimeout: null,
    undoSnapshot: null,
    undoTimeout: null,

    init() {
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRec) {
        console.warn("Speech API not supported on this device/browser.");
        this.toast("Voice not supported on this browser. Please use Chrome.");
        return;
      }
      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      // ---- Microphone permission check ----
      this.micGranted = false;
      navigator.mediaDevices.getUserMedia({audio:true})
        .then(stream => {
          // Permission granted – we can stop the tracks immediately
          stream.getTracks().forEach(t => t.stop());
          this.micGranted = true;
          // Enable the Start button if it exists
          const btn = document.querySelector('button[onclick*="VoiceEngine.start"]');
          if (btn) btn.disabled = false;
        })
        .catch(err => {
          console.error('Mic permission error:', err);
          this.toast('Microphone permission denied. Please allow access in the browser settings.');
          const btn = document.querySelector('button[onclick*="VoiceEngine.start"]');
          if (btn) btn.disabled = true;
        });

      this.recognition.onstart = () => {
        this.isListening = true;
        document.getElementById('voice-bar').classList.add('active');
        document.querySelector('.voice-indicator').classList.add('listening');
        document.querySelector('.voice-indicator').classList.remove('command');
        document.getElementById('voice-transcript').textContent = 'Listening...';
        document.getElementById('voice-transcript').classList.add('interim');
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
          this.toast("Microphone access denied.");
        } else if (e.error !== 'no-speech') {
          this.toast("Mic Error: " + e.error);
        }
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          // auto restart to keep "always on"
          setTimeout(() => {
            try { this.recognition.start(); } catch(e){}
          }, 500);
        }
      };
    },

    start() {
      if (!this.micGranted) {
        this.toast('Microphone not accessible. Please grant permission and reload the page.');
        return;
      }
      if (this.recognition && !this.isListening) {
        try { this.recognition.start(); } catch(e){}
      }
    },

    // New push‑to‑talk API
    startListening() {
      // Called on mousedown – only start if mic granted and not already listening
      if (!this.micGranted) {
        this.toast('Microphone not accessible.');
        return;
      }
      if (this.recognition && !this.isListening) {
        try { this.recognition.start(); } catch(e){}
      }
    },
    stopListening() {
      // Called on mouseup / mouseleave – stop listening but keep engine ready
      if (this.recognition && this.isListening) {
        this.recognition.stop();
        this.isListening = false;
        document.getElementById('voice-bar').classList.remove('active');
      }
    },

    stop() {
      // Legacy stop (used by UI if needed)
      this.isListening = false;
      if (this.recognition) this.recognition.stop();
      document.getElementById('voice-bar').classList.remove('active');
    },

    speak(text) {
      if (!STATE.voiceFeedbackEnabled) return;
      this.synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.1;
      u.pitch = 1.0;
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
      const textEl = document.getElementById('conv-text');
      const optEl = document.getElementById('conv-options');
      textEl.textContent = text;
      optEl.innerHTML = options.map(o => `<button class="conv-pill">${o}</button>`).join('');
      card.classList.add('show');
      
      optEl.querySelectorAll('button').forEach(btn => {
        btn.onclick = () => this.handleFollowUpInput(btn.textContent.toLowerCase());
      });

      clearTimeout(this.followUpTimeout);
      this.followUpTimeout = setTimeout(() => {
        this.closeFollowUp();
      }, 8000);
    },

    closeFollowUp() {
      document.getElementById('conversation-card').classList.remove('show');
      this.followUpWindow = null;
      this.followUpData = null;
    },

    handleTranscript(interim, final) {
      const vTrans = document.getElementById('voice-transcript');
      const vInd = document.querySelector('.voice-indicator');
      
      if (interim) {
        // Check for wake word in interim
        const hasWake = this.wakeWords.some(w => interim.includes(w));
        if (hasWake) {
          vInd.classList.add('command');
          vInd.classList.remove('listening');
        } else {
          vInd.classList.remove('command');
          vInd.classList.add('listening');
        }
        vTrans.textContent = interim;
        vTrans.classList.add('interim');
      }

      if (final) {
        vTrans.textContent = final;
        vTrans.classList.remove('interim');
        vInd.classList.remove('command');
        vInd.classList.add('listening');

        // Are we in a follow up window?
        if (this.followUpWindow) {
          this.handleFollowUpInput(final);
          return;
        }

        // Detect wake word
        let command = null;
        for (let w of this.wakeWords) {
          const idx = final.indexOf(w);
          if (idx !== -1) {
            command = final.substring(idx + w.length).trim();
            break;
          }
        }
        // If it was just "spotify" as the wake word with no command, ask what they want
        if (command === "") {
           this.toast("Hey - what can I do for you?");
           this.speak("Hey, what can I do for you? Try 'save this' or 'next song'.");
           return;
        }

        if (command) {
          this.parseIntent(command);
        }
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
      saveState();
      render();
      this.speak("Undone.");
      this.toast("Action undone.");
      this.undoSnapshot = null;
    },

    fuzzyPlaylistMatch(text) {
      for (let p of STATE.playlists) {
        if (text.includes(p.name.toLowerCase()) || 
            text.includes(p.name.toLowerCase().split(' ')[0]) || 
            p.name.toLowerCase().includes(text.replace(/add to |save to |put in /, '').trim())) {
          return p;
        }
      }
      return null;
    },

    parseIntent(cmd) {
      this.snapshotState();
      
      // UNDO
      if (/(undo|cancel that|wait no|take that back|changed my mind)/.test(cmd)) {
        this.undo();
        return;
      }

      // SAVE CURRENT OR BATCH
      if (/(save|add|like|keep|remember|bookmark)( this| the song| it)?/.test(cmd) && !/playlist/.test(cmd) && !/last|previous/.test(cmd)) {
        if (/last three|last 3/.test(cmd)) {
            // Case 10: Batch save
            const hist = [STATE.currentSongId, STATE.previousSongId, STATE.previousPreviousSongId].filter(id => id);
            hist.forEach(id => {
               if (!STATE.likedSongs.some(ls => ls.id === id)) {
                 _rawState.likedSongs.push({id, addedAt: Date.now()});
               }
            });
            saveState();
            render();
            const titles = hist.map(id => getSong(id).title).join(", ");
            this.speak(`Saved 3 songs: ${titles}. Want to add them to a playlist?`);
            this.toast(`Saved 3 songs`);
            this.followUpWindow = 'playlist_add_batch';
            this.followUpData = hist;
            this.showFollowUp("Want to add them to a playlist?", STATE.playlists.map(p=>p.name));
            return;
        }

        // Ambiguity case: if song just changed < 5s ago
        const song = getSong(STATE.currentSongId);
        const isLiked = STATE.likedSongs.some(ls => ls.id === song.id);
        if (!isLiked) {
          _rawState.likedSongs.push({id: song.id, addedAt: Date.now()});
          saveState();
          render();
        }
        
        // Is there a specific playlist mentioned?
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
      }

      // SAVE PREVIOUS
      if (/(save|add|like|keep) (the )?(last|previous|one before)/.test(cmd)) {
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
      }

      // REMOVE CURRENT
      if (/(remove|unlike|dislike|unsave)/.test(cmd)) {
        const song = getSong(STATE.currentSongId);
        _rawState.likedSongs = STATE.likedSongs.filter(ls => ls.id !== song.id);
        saveState(); render();
        this.speak(`Removed ${song.title}.`);
        this.toast(`Removed ${song.title}`);
        return;
      }

      // PLAYBACK
      if (/(next|skip)/.test(cmd)) { playNext(); this.toast("Skipping"); return; }
      if (/(back|previous)/.test(cmd)) { playPrev(); this.toast("Going back"); return; }
      if (/(pause|stop)/.test(cmd)) { if(STATE.playing) togglePlay(); this.toast("Paused"); return; }
      if (/(play|resume|continue)/.test(cmd)) { if(!STATE.playing) togglePlay(); this.toast("Playing"); return; }

      // SLEEP TIMER
      const sleepMatch = cmd.match(/stop in (\d+) minute/);
      if (sleepMatch) {
         this.speak(`Sleep timer set for ${sleepMatch[1]} minutes.`);
         this.toast(`Timer: ${sleepMatch[1]}m`);
         return;
      }

      // VOLUME SIMULATION
      if (/(louder|volume up|turn it up)/.test(cmd)) {
         this.toast("Volume: 85%");
         return;
      }

      // UNKNOWN COMMAND
      _rawState.unknownCommandCount++;
      if (STATE.unknownCommandCount >= 3) {
         _rawState.unknownCommandCount = 0;
         this.toast("Cheatsheet: Try 'save this', 'next song', or 'add to playlist'");
         this.speak("Having trouble? Try saying save this, or next song.");
      } else {
         this.speak("I didn't quite catch that.");
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
