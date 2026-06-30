const https = require('https');

function fetchCover(query) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`;
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.results && parsed.results.length > 0) {
          console.log(`[${query}]:`, parsed.results[0].artworkUrl100.replace('100x100bb', '600x600bb'));
        } else {
          console.log(`[${query}]: Not found`);
        }
      } catch(e) {
        console.error(e);
      }
    });
  });
}

fetchCover('Girlfriend Justin Bieber');
fetchCover('Butterfly Jass Manak');
