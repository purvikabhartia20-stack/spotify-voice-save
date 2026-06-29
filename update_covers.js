const fs = require('fs');

async function run() {
  const file = 'phase3.html';
  let html = fs.readFileSync(file, 'utf8');

  // Change storage key to break cache
  html = html.replace(/STORAGE_KEY = 'spotify_voice_save_state_v3(?:.\d+)?';/, "STORAGE_KEY = 'spotify_voice_save_state_v3.2';");

  const songs = [
    {title:"Blinding Lights", artist:"The Weeknd"},
    {title:"Levitating", artist:"Dua Lipa"},
    {title:"Glimpse of Us", artist:"Joji"},
    {title:"As It Was", artist:"Harry Styles"},
    {title:"Kill Bill", artist:"SZA"},
    {title:"Creepin'", artist:"Metro Boomin"},
    {title:"Anti-Hero", artist:"Taylor Swift"},
    {title:"Pink + White", artist:"Frank Ocean"},
    {title:"Cruel Summer", artist:"Taylor Swift"},
    {title:"Starboy", artist:"The Weeknd"},
    {title:"Lover", artist:"Taylor Swift"},
    {title:"Shape of You", artist:"Ed Sheeran"},
    {title:"Sunflower", artist:"Post Malone"},
    {title:"Sweater Weather", artist:"The Neighbourhood"},
    {title:"Save Your Tears", artist:"The Weeknd"},
    {title:"good 4 u", artist:"Olivia Rodrigo"},
    {title:"Heat Waves", artist:"Glass Animals"},
    {title:"Peaches", artist:"Justin Bieber"},
    {title:"Watermelon Sugar", artist:"Harry Styles"},
    {title:"Kiss Me More", artist:"Doja Cat"},
    {title:"Stay", artist:"The Kid LAROI"},
    {title:"INDUSTRY BABY", artist:"Lil Nas X"},
    {title:"Bad Habit", artist:"Steve Lacy"},
    {title:"golden hour", artist:"JVKE"},
    {title:"Vampire", artist:"Olivia Rodrigo"}
  ];

  const covers = [];

  for (let s of songs) {
    const q = encodeURIComponent(`${s.title} ${s.artist}`);
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${q}&entity=song&limit=1`);
      const data = await res.json();
      let url = "https://picsum.photos/300/300";
      if (data.results && data.results.length > 0) {
        url = data.results[0].artworkUrl100.replace('100x100bb', '600x600bb');
      }
      covers.push(url);
    } catch(e) {
      covers.push("https://picsum.photos/300/300");
    }
  }

  // Replace song array urls in HTML
  for (let i = 0; i < songs.length; i++) {
    const regex = new RegExp(`(title:"${songs[i].title.replace(/[.*+?^$\/{}()|\[\]\\]/g, '\\$&')}".*?cover:")([^"]+)(")`);
    html = html.replace(regex, `$1${covers[i]}$3`);
  }

  // Replace Made for You images
  const mfy1 = covers[10] || covers[0]; // Lover
  const mfy2 = covers[2] || covers[0];  // Glimpse of Us
  const mfy3 = covers[5] || covers[0];  // Creepin

  // Using simple string replace for the specific block
  html = html.replace(/<div class="shelf-item">\s*<img src="https:\/\/i.scdn.co[^"]+"/g, function(match) {
    if (!this.count) this.count = 0;
    this.count++;
    if (this.count === 1) return `<div class="shelf-item">\n              <img src="${mfy1}"`;
    if (this.count === 2) return `<div class="shelf-item">\n              <img src="${mfy2}"`;
    return `<div class="shelf-item">\n              <img src="${mfy3}"`;
  });

  // Replace Playlist images in state
  html = html.replace(/cover:"https:\/\/i\.scdn\.co[^"]+"/g, function(match) {
    if (!this.pcount) this.pcount = 0;
    this.pcount++;
    if (this.pcount === 1) return `cover:"${mfy1}"`;
    if (this.pcount === 2) return `cover:"${mfy2}"`;
    if (this.pcount === 3) return `cover:"${covers[0]}"`;
    return `cover:"${covers[4]}"`;
  });

  fs.writeFileSync(file, html);
  console.log("Updated HTML with valid Apple Music covers.");
}

run();
