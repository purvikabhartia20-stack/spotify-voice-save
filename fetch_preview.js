const https = require('https');

function searchPreview(query) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`;
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const json = JSON.parse(data);
      if (json.results && json.results.length > 0) {
        console.log(query, '->', json.results[0].previewUrl);
        console.log('   Matched:', json.results[0].trackName, 'by', json.results[0].artistName);
      } else {
        console.log('No results for', query);
      }
    });
  });
}

searchPreview('I Think They Call This Love Elliot James Reay');
searchPreview('Girlfriend Justin Bieber');
searchPreview('Butterfly Jass Manak');
