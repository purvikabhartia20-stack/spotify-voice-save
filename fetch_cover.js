const https = require('https');

function search(query) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`;
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const json = JSON.parse(data);
      if (json.results && json.results.length > 0) {
        console.log(query, '->', json.results[0].artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg'));
      } else {
        console.log('No results for', query);
      }
    });
  });
}

search('I Think They Call This Love Elliot James Reay');
search('Girlfriend Justin Bieber');
search('Butterfly Jass Manak');
