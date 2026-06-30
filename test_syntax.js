const fs = require('fs');
const html = fs.readFileSync('phase4.html', 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (scriptMatch) {
  fs.writeFileSync('temp.js', scriptMatch[1]);
  require('child_process').exec('node -c temp.js', (err, stdout, stderr) => {
    if (err) console.error("Syntax Error:", stderr);
    else console.log("Syntax OK");
  });
} else {
  console.log("No script tag found.");
}
