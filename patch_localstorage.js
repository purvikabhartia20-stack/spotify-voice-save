const fs = require('fs');

const files = ['phase2.html', 'phase3.html', 'phase4.html', 'phase5.html'];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    const oldBlock = `      if (stored) {
        _rawState = { ...DEFAULT_STATE, ...JSON.parse(stored) };
        _rawState.nowPlayingExpanded = false; 
      } else { _rawState = { ...DEFAULT_STATE }; }`;

    const newBlock = `      if (stored) {
        _rawState = { ...DEFAULT_STATE, ...JSON.parse(stored) };
        _rawState.nowPlayingExpanded = false; 
        
        // Fix stale cache by forcing songs from code
        if (typeof DEFAULT_STATE !== 'undefined' && DEFAULT_STATE.songs) {
            _rawState.songs = DEFAULT_STATE.songs;
        } else if (typeof MOCK_SONGS !== 'undefined') {
            _rawState.songs = MOCK_SONGS;
        }
      } else { _rawState = { ...DEFAULT_STATE }; }`;

    if (content.includes(oldBlock)) {
        content = content.replace(oldBlock, newBlock);
        fs.writeFileSync(file, content);
        console.log(`Updated localStorage logic in ${file}`);
    } else {
        console.log(`Could not find localStorage block in ${file}`);
    }
});
