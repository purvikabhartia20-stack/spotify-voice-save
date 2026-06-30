const https = require('https');

function searchPreview(query) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=3`;
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const json = JSON.parse(data);
      if (json.results && json.results.length > 0) {
        for (let r of json.results) {
           console.log(query, '->', r.trackName, 'by', r.artistName, '| Cover:', r.artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg'));
        }
      } else {
        console.log('No results for', query);
      }
    });
  });
}

searchPreview('Girlfriend Justin Bieber');
searchPreview('Girlfriend Justin Bieber Believe');
