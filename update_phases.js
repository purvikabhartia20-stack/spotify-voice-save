const fs = require('fs');

const phase5 = fs.readFileSync('phase5.html', 'utf8');

// 1. Extract the songs array from phase5.html
const songsMatch = phase5.match(/songs: \[([\s\S]*?)\],[\s\S]*?playlists: /);
if (!songsMatch) {
    console.error("Could not find songs array in phase5");
    process.exit(1);
}
const songsContent = songsMatch[1];
const replacementForSongs = `songs: [${songsContent}],\n    playlists: `;
const replacementForMock = `[\n${songsContent}\n]`;

// Update Phase 1 and 2 (MOCK_SONGS)
['phase1.html', 'phase2.html'].forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/MOCK_SONGS = \[([\s\S]*?)\];/, `MOCK_SONGS = ${replacementForMock};`);
    fs.writeFileSync(file, content);
    console.log(`Updated songs in ${file}`);
});

// Update Phase 3 and 4 (DEFAULT_STATE.songs)
['phase3.html', 'phase4.html'].forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/songs: \[([\s\S]*?)\],[\s\S]*?playlists: /, replacementForSongs);
    fs.writeFileSync(file, content);
    console.log(`Updated songs in ${file}`);
});

// 2. Fix Voice Engine in Phase 4
let phase4 = fs.readFileSync('phase4.html', 'utf8');

// Fix wakeWords
phase4 = phase4.replace(/wakeWords: \["hey spotify".*?\],/, 'wakeWords: ["hey spotify"],');

// Fix handleTranscript
const oldHandleTranscript = `
    handleTranscript(interim, final) {
      if (this.isSpeaking) return; // Prevent hearing its own voice through speakers

      if (final) {`;

const newHandleTranscript = `
    handleTranscript(interim, final) {
      if (this.isSpeaking) return; // Prevent hearing its own voice through speakers

      const vTrans = document.getElementById('voice-transcript');
      if (vTrans && !this.followUpWindow) {
         if (final) {
            vTrans.textContent = final;
            vTrans.classList.remove('interim');
         } else if (interim) {
            vTrans.textContent = interim;
            vTrans.classList.add('interim');
         }
      }

      if (final) {`;
phase4 = phase4.replace(oldHandleTranscript, newHandleTranscript);

const oldFinalMatch = `
        let command = null;
        for (let w of this.wakeWords) {
          const idx = final.indexOf(w);
          if (idx !== -1) {
            command = final.substring(idx + w.length).trim();`;

const newFinalMatch = `
        let command = null;
        let cleanFinal = final.replace(/[.,!?]/g, '');
        for (let w of this.wakeWords) {
          const idx = cleanFinal.indexOf(w);
          if (idx !== -1) {
            command = cleanFinal.substring(idx + w.length).trim();`;
phase4 = phase4.replace(oldFinalMatch, newFinalMatch);

fs.writeFileSync('phase4.html', phase4);
console.log('Fixed Voice Engine in phase4.html');
