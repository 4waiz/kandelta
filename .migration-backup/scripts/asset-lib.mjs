import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const ASSETS = path.join(ROOT, 'data', 'oriane-assets.json');
const assets = fs.existsSync(ASSETS) ? JSON.parse(fs.readFileSync(ASSETS, 'utf8')) : {};

export async function asset(text) {
  if (assets[text]) return assets[text];
  const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8');
  const key = /ORIANE_API_KEY=(.+)/.exec(env)[1].trim();
  const r = await fetch('https://connect.oriane.xyz/rest/assets', {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ type: 'text', text }),
  });
  const j = await r.json();
  if (!j.data?.id) throw new Error('asset failed ' + r.status + ' ' + JSON.stringify(j).slice(0, 300));
  assets[text] = j.data.id;
  fs.writeFileSync(ASSETS, JSON.stringify(assets, null, 2));
  return j.data.id;
}

