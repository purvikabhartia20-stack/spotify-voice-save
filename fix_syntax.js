const fs = require('fs');
let html = fs.readFileSync('phase4.html', 'utf8');

// Fix escaped backticks
html = html.replace(/\\`/g, '`');
// Fix escaped dollar signs
html = html.replace(/\\\$/g, '$');

fs.writeFileSync('phase4.html', html);
console.log("Syntax fixed!");
