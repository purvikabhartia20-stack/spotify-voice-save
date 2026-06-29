const fs = require('fs');

function run() {
  const file = 'phase3.html';
  let html = fs.readFileSync(file, 'utf8');

  // Extract songs array from JS
  const songsMatch = html.match(/songs: \[\s*({[\s\S]*?})\s*\],/);
  if (!songsMatch) {
    console.error("Could not find songs array");
    return;
  }
  
  // Quick parse of the songs strings to build an ID to cover map
  const coverMap = {};
  const songRegex = /{id:(\d+),.*?cover:"([^"]+)"/g;
  let m;
  while ((m = songRegex.exec(songsMatch[1])) !== null) {
    coverMap[m[1]] = m[2];
  }

  // Replace Home Grid images
  html = html.replace(/<div class="home-grid-item" onclick="playSong\((\d+)\)">\s*<img src="https:\/\/picsum\.photos[^"]+" alt="">/g, (match, id) => {
    return `<div class="home-grid-item" onclick="playSong(${id})">\n              <img src="${coverMap[id]}" alt="">`;
  });

  // Replace Recently Played images
  html = html.replace(/<div class="shelf-item" onclick="playSong\((\d+)\)">\s*<img src="https:\/\/picsum\.photos[^"]+" alt="">/g, (match, id) => {
    return `<div class="shelf-item" onclick="playSong(${id})">\n              <img src="${coverMap[id]}" alt="">`;
  });

  fs.writeFileSync(file, html);
  console.log("Updated HTML hardcoded images.");
}

run();
