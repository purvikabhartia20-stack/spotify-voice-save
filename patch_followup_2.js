const fs = require('fs');
let content = fs.readFileSync('phase5.html', 'utf8');

const oldFollowUp = `    handleFollowUpInput(text) {
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
         this.speak(\`Added to \${matched.name}.\`);
         this.toast(\`Added to \${matched.name}\`);
         this.closeFollowUp();
      } else if (this.followUpWindow === 'playlist_proactive_mood' && /(yes|sure|okay|do it|create)/.test(text)) {
         const newId = 'p' + (STATE.playlists.length + 1);
         const m = this.followUpData.mood;
         const pName = m.charAt(0).toUpperCase() + m.slice(1) + " Picks";
         const songIds = STATE.sessionSignals.filter(s => s.mood === m).map(s => s.songId);
         
         // remove dupes
         const uniqueIds = [...new Set(songIds)];
         _rawState.playlists.push({ id: newId, name: pName, songIds: uniqueIds });
         saveState(); render();
         
         this.speak(\`Created playlist \${pName} with \${uniqueIds.length} songs.\`);
         this.toast(\`Created \${pName}\`);
         this.closeFollowUp();
      } else {
         this.speak("I didn't find that playlist. Never mind.");
         this.closeFollowUp();
      }
    },`;

const newFollowUp = `    handleFollowUpInput(text) {
      if (/(no|skip|never mind|cancel)/.test(text)) {
        this.closeFollowUp();
        this.speak("Okay.");
        return;
      }
      
      if (this.followUpWindow === "What should I call it?") {
         const newId = 'p' + (STATE.playlists.length + 1);
         let cleanName = text.replace(/create a playlist called /i, '').replace(/called /i, '').trim();
         cleanName = cleanName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
         _rawState.playlists.push({ id: newId, name: cleanName, songIds: [] });
         saveState(); render();
         this.speak(\`Created playlist \${cleanName}.\`);
         this.toast(\`Created \${cleanName}\`);
         this.closeFollowUp();
         return;
      }

      if (this.followUpWindow === "Are you sure?") {
         if (/(yes|yeah|sure|do it)/.test(text)) {
            // Delete the last recognized playlist from followUpData
            if (this.followUpData && this.followUpData.playlistId) {
                _rawState.playlists = _rawState.playlists.filter(p => p.id !== this.followUpData.playlistId);
                saveState(); render();
                this.speak("Playlist deleted.");
                this.toast("Playlist deleted");
            }
         } else {
            this.speak("Okay, canceled.");
         }
         this.closeFollowUp();
         return;
      }

      const matched = this.fuzzyPlaylistMatch(text);
      if (matched && this.followUpWindow.startsWith('playlist_add')) {
         this.followUpData.forEach(id => {
            if (!matched.songIds.includes(id)) matched.songIds.push(id);
         });
         saveState(); render();
         this.speak(\`Added to \${matched.name}.\`);
         this.toast(\`Added to \${matched.name}\`);
         this.closeFollowUp();
      } else if (this.followUpWindow === 'playlist_proactive_mood' && /(yes|sure|okay|do it|create)/.test(text)) {
         const newId = 'p' + (STATE.playlists.length + 1);
         const m = this.followUpData.mood;
         const pName = m.charAt(0).toUpperCase() + m.slice(1) + " Picks";
         const songIds = STATE.sessionSignals.filter(s => s.mood === m).map(s => s.songId);
         
         const uniqueIds = [...new Set(songIds)];
         _rawState.playlists.push({ id: newId, name: pName, songIds: uniqueIds });
         saveState(); render();
         
         this.speak(\`Created playlist \${pName} with \${uniqueIds.length} songs.\`);
         this.toast(\`Created \${pName}\`);
         this.closeFollowUp();
      } else {
         this.speak("I didn't find that playlist. Never mind.");
         this.closeFollowUp();
      }
    },`;

if (content.includes(oldFollowUp)) {
    content = content.replace(oldFollowUp, newFollowUp);
    fs.writeFileSync('phase5.html', content);
    console.log('Patched handleFollowUpInput.');
} else {
    console.log('Could not find handleFollowUpInput logic block.');
}
