// Assemble le reel 1080x1920 : compose.html (habillage Varika) + l'enregistrement de l'app.
// Usage : node compose.mjs [sortie.mp4]   |   node compose.mjs --stills 2,10,40
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './cdp.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const FPS = 30;
const args = process.argv.slice(2);
const stills = args[0] === '--stills' ? args[1].split(',').map(Number) : null;
const out = (!stills && args[0]) || join(here, 'video-muette.mp4');
const { frames, markers } = JSON.parse(readFileSync(join(here, 'timeline.json'), 'utf8'));

const page = await launch(9477);
await page.send('Emulation.setDeviceMetricsOverride', { width: 1080, height: 1920, deviceScaleFactor: 1, mobile: false });
await page.goto('file://' + join(here, 'compose.html'));
await page.eval('document.fonts.ready.then(()=>1)');
const total = await page.eval(`setup(${JSON.stringify(markers)})`);

let fi = 0, shown = null;
function frameAt(t) {
  if (t < frames[fi]?.t) fi = 0;
  while (fi < frames.length - 1 && frames[fi + 1].t <= t) fi++;
  return join(here, frames[fi].file);
}
async function draw(t) {
  const at = await page.eval(`render(${t})`);
  if (at !== null) {
    const f = frameAt(at);
    if (f !== shown) {
      await page.eval(`(()=>{const i=document.getElementById('app');i.src=${JSON.stringify('file://' + f)};return i.decode().then(()=>1)})()`);
      shown = f;
    }
  }
}

if (stills) {
  for (const s of stills) { await draw(s); writeFileSync(join(here, `still-${s}.png`), await page.shot('png')); }
  console.log('captures :', stills.join(', '));
} else {
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '19', '-preset', 'medium', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round(total * FPS);
  for (let i = 0; i < n; i++) {
    await draw(i / FPS);
    if (!ff.stdin.write(await page.shot('jpeg'))) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 300 === 0) console.log(`${i}/${n}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  console.log(`${out} : ${total.toFixed(1)} s`);
}
page.close();
