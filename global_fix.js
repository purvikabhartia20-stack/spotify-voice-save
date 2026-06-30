const fs = require('fs');

const files = ['phase1.html', 'phase2.html', 'phase3.html', 'phase4.html', 'phase5.html'];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Fix Elliot James Reay poster
    content = content.replace(
        /https:\/\/is1-ssl\.mzstatic\.com\/image\/thumb\/Music116\/v4\/6c\/11\/d6\/6c11d681-aa3a-d59e-4c2e-f77e181026ab\/190295092665\.jpg\/600x600bb\.jpg/g,
        'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/30/a8/f1/30a8f1b6-e75d-55b4-ee88-667a062e0103/24UM1IM12416.rgb.jpg/600x600bb.jpg'
    );
    // Be careful, Levitating also uses that URL in some phases!
    // Let's do a more precise replace for Elliot
    content = content.replace(
        /{id:26, title:"I Think They Call This Love", artist:"Elliot James Reay", album:"Single", duration:180, cover:"https:\/\/is1-ssl\.mzstatic\.com\/image\/thumb\/Music116\/v4\/6c\/11\/d6\/6c11d681-aa3a-d59e-4c2e-f77e181026ab\/190295092665\.jpg\/600x600bb\.jpg"/g,
        '{id:26, title:"I Think They Call This Love", artist:"Elliot James Reay", album:"Single", duration:180, cover:"https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/30/a8/f1/30a8f1b6-e75d-55b4-ee88-667a062e0103/24UM1IM12416.rgb.jpg/600x600bb.jpg"'
    );
    // Also update grid item if it had it hardcoded
    content = content.replace(
        /<div class="home-grid-item" onclick="playSong\(26\)">\s*<img src="https:\/\/is1-ssl\.mzstatic\.com\/image\/thumb\/Music116\/v4\/6c\/11\/d6\/6c11d681-aa3a-d59e-4c2e-f77e181026ab\/190295092665\.jpg\/600x600bb\.jpg"/g,
        '<div class="home-grid-item" onclick="playSong(26)">\n              <img src="https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/30/a8/f1/30a8f1b6-e75d-55b4-ee88-667a062e0103/24UM1IM12416.rgb.jpg/600x600bb.jpg"'
    );

    // 2. Fix Girlfriend to Boyfriend
    content = content.replace(
        /{id:27, title:"Girlfriend", artist:"Justin Bieber"/g,
        '{id:27, title:"Boyfriend", artist:"Justin Bieber"'
    );
    // Also update grid item span
    content = content.replace(
        /<div class="home-grid-item" onclick="playSong\(27\)">([\s\S]*?)<span>Girlfriend<\/span>/g,
        '<div class="home-grid-item" onclick="playSong(27)">$1<span>Boyfriend</span>'
    );

    // 3. Fix handleTranscript case sensitivity and Intent 'rid' (only in Phase 4 and 5)
    if (file === 'phase4.html' || file === 'phase5.html') {
        content = content.replace(
            /let cleanFinal = final\.replace\(\/\[\.,!\?\]\/g, ''\);/g,
            "let cleanFinal = final.toLowerCase().replace(/[.,!?]/g, '');"
        );
        
        content = content.replace(
            /REMOVE_CURRENT: { remove: 3, unlike: 3, dislike: 3, unsave: 3, delete: 2 },/g,
            "REMOVE_CURRENT: { remove: 3, unlike: 3, dislike: 3, unsave: 3, delete: 2, rid: 3 },"
        );
        
        content = content.replace(
            /PLAYLIST_REMOVE: { remove: 3, delete: 3, take: 2, out: 2 },/g,
            "PLAYLIST_REMOVE: { remove: 3, delete: 3, take: 2, out: 2, rid: 3 },"
        );
    }

    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
});
