// Renders verse-reel.html to frames, then ffmpeg encodes MP4 (1080x1920, 30fps) with music.
// usage: node render.js <outDir> <output.mp4>
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const [outDir, outFile] = process.argv.slice(2);
const FPS = 30, DURATION = 12;
(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + path.resolve(__dirname, 'verse-reel.html') + '?render');
  await p.evaluate(() => document.fonts.ready);
  for (let i = 0; i < FPS * DURATION; i++) {
    await p.evaluate(t => setT(t), i / FPS);
    await p.screenshot({ path: path.join(outDir, `f${String(i).padStart(4, '0')}.png`) });
  }
  await b.close();
  execFileSync('ffmpeg', ['-y', '-framerate', FPS, '-i', path.join(outDir, 'f%04d.png'),
    '-ss', '20', '-t', DURATION, '-i', path.resolve(__dirname, '../audio/music1.mp3'),
    '-af', `volume=0.6,afade=t=in:d=1.5,afade=t=out:st=${DURATION - 2}:d=2`,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-c:a', 'aac', '-shortest', outFile], { stdio: 'inherit' });
})();
