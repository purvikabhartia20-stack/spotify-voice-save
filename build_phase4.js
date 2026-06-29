const fs = require('fs');

function run() {
  const file = 'phase4.html';
  let html = fs.readFileSync(file, 'utf8');

  // Change title and storage key
  html = html.replace(/<title>.*?<\/title>/, '<title>Spotify Voice Save prototype - Phase 4</title>');
  html = html.replace(/STORAGE_KEY = 'spotify_voice_save_state_v3[^']*';/, "STORAGE_KEY = 'spotify_voice_save_state_v4';");

  // Add styles
  const styles = fs.readFileSync('voice_styles.css', 'utf8');
  html = html.replace('</style>', styles + '\n</style>');

  // Add Voice UI overlays
  const overlays = `
  <!-- TOAST QUEUE -->
  <div id="toast-container"></div>
  
  <!-- CONVERSATION OVERLAY -->
  <div id="conversation-card">
    <div class="conv-text" id="conv-text">Want to add it to a playlist?</div>
    <div class="conv-options" id="conv-options"></div>
  </div>
  
  <!-- VOICE STATUS BAR -->
  <div id="voice-bar">
     <div class="voice-indicator"></div>
     <div class="voice-transcript" id="voice-transcript">Say "Hey Spotify"</div>
  </div>
  `;
  html = html.replace('<div id="app-container">', '<div id="app-container">\n' + overlays);

  // Replace Voice Settings Tab
  const voiceUI = fs.readFileSync('voice_ui.html', 'utf8');
  html = html.replace(/<section id="view-voice"[^>]*>[\s\S]*?<\/section>/, `<section id="view-voice" class="view-section">\n${voiceUI}\n</section>`);

  // Extend DEFAULT_STATE
  html = html.replace(/(currentSongId: 1,)/, "voiceFeedbackEnabled: true, unknownCommandCount: 0,\n    $1");

  // Add VoiceEngine logic
  const engineJs = fs.readFileSync('voice_engine.js', 'utf8');
  html = html.replace('// 25 SONGS DATABASE', engineJs + '\n\n  // 25 SONGS DATABASE');

  // Initialize VoiceEngine on DOM content loaded
  html = html.replace("document.addEventListener('DOMContentLoaded', () => {", "function toggleVoiceFeedback() {\n    STATE.voiceFeedbackEnabled = !STATE.voiceFeedbackEnabled;\n    document.getElementById('toggle-voice-feedback').classList.toggle('on', STATE.voiceFeedbackEnabled);\n  }\n\n  document.addEventListener('DOMContentLoaded', () => {\n    VoiceEngine.init();");

  fs.writeFileSync(file, html);
  console.log("Built phase4.html!");
}

run();
