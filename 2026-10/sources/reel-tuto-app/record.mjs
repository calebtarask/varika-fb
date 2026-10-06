// Filme la vraie app Varika en mode démo (branche demo/mode-video, NEXT_PUBLIC_DEMO=1,
// http://localhost:3100) en vue mobile :
// connexion MetaMask, swap, dépôt dans le vault. Sortie : frames/*.jpg + timeline.json
// (instant de chaque image et des repères qui caleront les légendes).
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { launch, sleep } from './cdp.mjs';

const APP = process.env.APP_URL || 'http://localhost:3100';
rmSync('frames', { recursive: true, force: true }); mkdirSync('frames');

const page = await launch(9466);
// Effet de toucher (dans la top layer, au-dessus des <dialog>) + indicateur Next.js masqué.
await page.send('Page.addScriptToEvaluateOnNewDocument', { source: `
  addEventListener('DOMContentLoaded', () => {
    const s = document.createElement('style');
    s.textContent = 'nextjs-portal{display:none!important} .tapfx{position:fixed;inset:auto;margin:0;padding:0;border:0;background:transparent;overflow:visible;pointer-events:none}' +
      '.tapfx i{position:fixed;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:rgba(165,40,255,.35);border:2.5px solid #a528ff;animation:tapfx .55s ease-out forwards}' +
      '@keyframes tapfx{0%{transform:scale(.6);opacity:1}100%{transform:scale(1.6);opacity:0}}';
    document.head.appendChild(s);
  });
  window.__tapFx = (x, y) => {
    const p = document.createElement('div'); p.className = 'tapfx'; p.popover = 'manual';
    p.innerHTML = '<i style="left:' + x + 'px;top:' + y + 'px"></i>';
    document.body.appendChild(p); try { p.showPopover(); } catch (e) {}
    setTimeout(() => p.remove(), 700);
  };` });

// Préchauffage : compile les pages et charge la liste de jetons, hors caméra.
for (const p of ['/echanger', '/earn']) { await page.goto(APP + p); await sleep(4000); }
await page.eval(`localStorage.clear()`);
await page.goto(APP + '/echanger'); await sleep(4000);
await page.click('button', 'Plus tard', 1500).catch(() => {});

// --- capture continue ---
const frames = []; let t0 = null;
const ws_events = page.events;
await page.send('Page.startScreencast', { format: 'jpeg', quality: 90, everyNthFrame: 1 });
let stop = false;
const pump = (async () => {
  let seen = 0;
  while (!stop) {
    while (seen < ws_events.length) {
      const e = ws_events[seen++];
      if (e.method !== 'Page.screencastFrame') continue;
      const ts = e.params.metadata.timestamp;
      if (t0 === null) t0 = ts;
      const name = `frames/${String(frames.length).padStart(5, '0')}.jpg`;
      writeFileSync(name, Buffer.from(e.params.data, 'base64'));
      e.params.data = null;
      frames.push({ t: ts - t0, file: name });
      page.send('Page.screencastFrameAck', { sessionId: e.params.sessionId }).catch(() => {});
    }
    await sleep(5);
  }
})();
const markers = [];
const now = () => (t0 === null ? 0 : Date.now() / 1000 - wallT0);
let wallT0 = null;
while (t0 === null) await sleep(20);
wallT0 = Date.now() / 1000;
const mark = name => { markers.push({ name, t: now() }); console.log(name, now().toFixed(2)); };

try {
  // 1. Connexion
  mark('c1'); await sleep(2200);
  await page.click('button', 'Se connecter'); await sleep(1600);
  mark('c2'); await sleep(900);
  await page.click('button', 'MetaMask'); await sleep(1200);
  mark('c3'); await sleep(1600);
  await page.click('#demo-mm-approve'); await sleep(1500);
  mark('c4'); await sleep(3000);

  // 2. Swap
  mark('s1');
  await page.click('input'); await sleep(400); await page.type('50', 260);
  await page.waitFor('button', 'Signer et échanger'); await sleep(600);
  mark('s2'); await sleep(3200);
  mark('s3'); await sleep(600);
  await page.click('button', 'Signer et échanger'); await sleep(1400);
  mark('s4'); await sleep(2600);
  await page.click('#demo-mm-approve'); await sleep(500);
  await page.waitFor('button', 'Nouvel échange', 20000); mark('s5'); await sleep(3200);

  // 3. Earn
  mark('e1'); await page.click('a', 'Earn'); await sleep(3500);
  await page.click('button', 'Gauntlet USDC'); await sleep(1800);
  mark('e2'); await sleep(2600);
  await page.click('input[type=checkbox]'); await sleep(900);
  await page.click('button', 'Continuer'); await sleep(2200);
  mark('e3'); await page.click('input:not([type=checkbox])'); await sleep(400); await page.type('100', 260);
  await page.waitFor('button', 'Placer 100'); await sleep(2600);
  await page.click('button', 'Placer 100'); await sleep(1400);
  mark('e4'); await sleep(2400);
  await page.click('#demo-mm-approve'); await sleep(500);
  await page.waitFor('button', 'Terminé', 20000); mark('e5'); await sleep(3000);
  await page.click('button', 'Terminé'); await sleep(1500);
  mark('e6'); await sleep(3500);
  mark('end');
} finally {
  stop = true; await pump;
  await page.send('Page.stopScreencast').catch(() => {});
  page.close();
  writeFileSync('timeline.json', JSON.stringify({ frames, markers }, null, 1));
  console.log(`${frames.length} images, ${markers.at(-1)?.t.toFixed(1)} s`);
}
