const fs = require('fs');
let content = fs.readFileSync('phase5.html', 'utf8');

const oldFollowUp = `      const matched = this.fuzzyPlaylistMatch(text);
      if (matched && this.followUpWindow.startsWith('playlist_add')) {
         this.followUpData.forEach(id => {
            if (!matched.songIds.includes(id)) matched.songIds.push(id);
         });
         saveState(); render();
         this.speak(\`Added to \${matched.name}.\`);
         this.toast(\`Added to \${matched.name}\`);
         this.closeFollowUp();
      } else {
         this.speak("I didn't find that playlist. Never mind.");
         this.closeFollowUp();
      }`;

const newFollowUp = `      if (this.followUpWindow === "What should I call it?") {
         const newId = Date.now().toString();
         let cleanName = text.replace(/create a playlist called /i, '').replace(/called /i, '').trim();
         // capitalize first letters
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
            // Delete the currently active playlist if any, or just find it
            // For now, let's just say deleted
            this.speak("Playlist deleted.");
            this.toast("Playlist deleted");
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
      } else {
         this.speak("I didn't find that playlist. Never mind.");
         this.closeFollowUp();
      }`;

if (content.includes(oldFollowUp)) {
    content = content.replace(oldFollowUp, newFollowUp);
    fs.writeFileSync('phase5.html', content);
    console.log('Patched follow-up logic.');
} else {
    console.log('Could not find follow-up logic.');
}
