// Petit pilote Chrome headless (protocole DevTools) : vue mobile, clics, saisie, captures.
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const W = 390, H = 844, DPR = 2;

export async function launch(port = 9444) {
  const chrome = spawn('google-chrome', ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run',
    '--hide-scrollbars', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'chr-'))}`, 'about:blank'], { stdio: 'ignore' });
  let targets;
  for (let i = 0; i < 60 && !targets; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); }
    catch { await sleep(200); }
  }
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  let id = 0; const pending = new Map(); const events = [];
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    else if (m.method) events.push(m);
  });
  const send = (method, params = {}) => new Promise((res, rej) => {
    const i = ++id; pending.set(i, m => m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result));
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: DPR, mobile: true });
  await send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36' });
  await send('Page.enable'); await send('Runtime.enable');

  const page = {
    send, events,
    async goto(url) {
      events.length = 0;
      await send('Page.navigate', { url });
      for (let i = 0; i < 600 && !events.some(e => e.method === 'Page.loadEventFired'); i++) await sleep(100);
    },
    async eval(expr) {
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    },
    async shot(format = 'jpeg') {
      return Buffer.from((await send('Page.captureScreenshot', { format, quality: format === 'jpeg' ? 92 : undefined })).data, 'base64');
    },
    /** Centre d'un élément trouvé par sélecteur CSS et/ou texte visible. */
    async locate(sel, text) {
      return page.eval(`(() => {
        const els = [...document.querySelectorAll(${JSON.stringify(sel)})].filter(e => {
          const r = e.getBoundingClientRect(); if (!r.width || !r.height) return false;
          const label = ((e.innerText || '') + ' ' + (e.getAttribute('aria-label') || '')).toLowerCase(); return ${text ? `label.includes(${JSON.stringify(String(text).toLowerCase())})` : 'true'};
        });
        const e = els[els.length - 1]; if (!e) return null;
        e.scrollIntoView({ block: 'center' });
        const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      })()`);
    },
    async waitFor(sel, text, ms = 20000) {
      for (let t = 0; t < ms; t += 200) { const p = await page.locate(sel, text); if (p) return p; await sleep(200); }
      throw new Error(`introuvable : ${sel} ${text ?? ''}`);
    },
    async tap(x, y) {
      await page.eval(`window.__tapFx && window.__tapFx(${x}, ${y})`);
      for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased'])
        await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
    },
    async click(sel, text, ms) { const p = await page.waitFor(sel, text, ms); await page.tap(p.x, p.y); return p; },
    async type(text, perChar = 70) { for (const c of text) { await send('Input.insertText', { text: c }); await sleep(perChar); } },
    async buttons() {
      return page.eval(`[...document.querySelectorAll('button,a,[role=button],input,select')].filter(e=>e.getBoundingClientRect().width).map(e=>(e.tagName+' '+(e.innerText||e.placeholder||e.value||e.getAttribute('aria-label')||'').replace(/\\s+/g,' ').trim()).slice(0,80))`);
    },
    close() { ws.close(); chrome.kill(); },
  };
  return page;
}

export const sleep = ms => new Promise(r => setTimeout(r, ms));
