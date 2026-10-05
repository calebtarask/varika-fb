// Rendu de reel.html en MP4 1080x1920 via Chrome headless (protocole DevTools) + ffmpeg.
// Usage : node render.mjs [sortie.mp4]        -> vidéo complète
//         node render.mjs --stills 5,20,40     -> captures PNG à ces secondes (vérification)
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const FPS = 30, PORT = 9333;
const args = process.argv.slice(2);
const stills = args[0] === '--stills' ? args[1].split(',').map(Number) : null;
const out = (!stills && args[0]) || join(here, 'video-muette.mp4');

const chrome = spawn('google-chrome', ['--headless=new', `--remote-debugging-port=${PORT}`, '--no-first-run',
  '--hide-scrollbars', '--allow-file-access-from-files', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'chr-'))}`, 'about:blank'],
  { stdio: 'ignore' });

let targets;
for (let i = 0; i < 50 && !targets; i++) {
  try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); }
  catch { await new Promise(r => setTimeout(r, 200)); }
}
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let id = 0; const pending = new Map(), events = [];
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else events.push(m.method);
});
const send = (method, params = {}) => new Promise((res, rej) => {
  const i = ++id; pending.set(i, m => m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result));
  ws.send(JSON.stringify({ id: i, method, params }));
});
const evalJs = async expr => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result.value;

await send('Emulation.setDeviceMetricsOverride', { width: 1080, height: 1920, deviceScaleFactor: 1, mobile: false });
await send('Page.enable');
await send('Page.navigate', { url: 'file://' + join(here, 'reel.html') });
while (!events.includes('Page.loadEventFired')) await new Promise(r => setTimeout(r, 50));
await evalJs('document.fonts.ready.then(()=>document.fonts.check("700 80px Figtree"))');
const total = await evalJs('TOTAL');

const shot = async (t, format) => {
  await evalJs(`render(${t})`);
  return Buffer.from((await send('Page.captureScreenshot', { format, quality: format === 'jpeg' ? 95 : undefined })).data, 'base64');
};

if (stills) {
  for (const s of stills) writeFileSync(join(here, `still-${s}.png`), await shot(s, 'png'));
  console.log('captures :', stills.join(', '));
} else {
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '19', '-preset', 'medium', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round(total * FPS);
  for (let i = 0; i < n; i++) {
    if (!ff.stdin.write(await shot(i / FPS, 'jpeg'))) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 300 === 0) console.log(`${i}/${n}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  console.log(`${out} : ${total.toFixed(1)} s`);
}
ws.close(); chrome.kill();
