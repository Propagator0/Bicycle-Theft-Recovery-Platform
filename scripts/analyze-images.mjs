#!/usr/bin/env node
/**
 * analyze-images.mjs — tag every scraped FB-group image with the SAME
 * controlled vocabulary the configurator uses, so matching is token-exact.
 *
 * Input : data/fb-posts.json  (Apify "Facebook Groups Scraper" dataset export, JSON)
 * Output: data/fb-dataset.json (upload at /admin -> "3 · FB-group dataset")
 *
 * Env   : OPENAI_API_KEY   (uses gpt-4o-mini vision; ~$0.002 per image => 1,000 images ≈ $2)
 *         MODEL=gpt-4o-mini (optional override)
 * Usage : node scripts/analyze-images.mjs [--limit=50] [--resume]
 *
 * --resume skips images already present in data/fb-dataset.json, so you can
 * stop/start freely and it never double-bills you.
 */

import fs from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const LIMIT = Number(args.limit || Infinity);
const MODEL = process.env.MODEL || 'gpt-4o-mini';
const KEY = process.env.OPENAI_API_KEY;
if (!KEY) { console.error('Set OPENAI_API_KEY'); process.exit(1); }

const IN = 'data/fb-posts.json';
const OUT = 'data/fb-dataset.json';

// Keep in sync with src/lib/vocabulary.ts
const VOCAB = {
  bikeType: ['road', 'mountain', 'gravel', 'hybrid', 'ebike', 'cargo', 'kids', 'folding', 'cruiser', 'fixie', 'bmx', 'unknown'],
  frameColor: ['black', 'matte_black', 'white', 'silver', 'red', 'dark_red', 'orange', 'yellow', 'green', 'dark_green', 'teal', 'blue', 'dark_blue', 'purple', 'pink', 'brown', 'gold', 'chrome', 'custom'],
  handlebarType: ['flat', 'drop', 'riser', 'swept', 'bullhorn', 'butterfly'],
  accessories: ['bell', 'front_light', 'rear_light', 'dynamo_light', 'computer', 'phone_mount', 'rear_rack', 'front_rack', 'pannier', 'basket', 'child_seat', 'trailer', 'fenders', 'studded_tires', 'kickstand', 'bottle_cage', 'mirror', 'lock_attached', 'suspension_fork', 'aftermarket_wheels', 'clipless_pedals'],
  lockType: ['u_lock', 'chain', 'cable', 'folding', 'wheel_lock'],
  saddleColor: ['Black', 'Brown / Tan', 'White', 'Red', 'Blue', 'Green', 'Grey', 'Other'],
  gripColor: ['Black', 'Brown', 'Tan / Cork', 'White', 'Red', 'Blue', 'Green', 'Orange', 'Grey', 'Multi-color'],
};

const SYSTEM = `You are a bicycle identification expert helping recover stolen bikes in Iceland.
You will see ONE photo from a Facebook lost/found/stolen bikes group, plus the post text (Icelandic or English).
Return ONLY a JSON object with these keys. Use ONLY the allowed values. If not visible/unsure, use null (or [] for arrays).
{
 "isBike": boolean,                       // false if the photo isn't mainly a bicycle (helmet, wheel only, screenshot, etc.)
 "bikeType": one of ${JSON.stringify(VOCAB.bikeType)},
 "brand": string|null,                    // read decals; also use the post text
 "model": string|null,
 "frameColor": one of ${JSON.stringify(VOCAB.frameColor)},
 "secondaryColors": array of frameColor values (accents, fork, logos),
 "handlebarType": one of ${JSON.stringify(VOCAB.handlebarType)} or null,
 "accessories": array from ${JSON.stringify(VOCAB.accessories)},
 "lockType": one of ${JSON.stringify(VOCAB.lockType)} or null,
 "saddleColor": one of ${JSON.stringify(VOCAB.saddleColor)} or null,
 "gripColor": one of ${JSON.stringify(VOCAB.gripColor)} or null,
 "distinctiveFeatures": array of short lowercase English phrases (max 8): stickers, scratches, dents, rust, tape, custom paint, missing parts, unusual components. Be concrete: "yellow sticker on downtube", "scratch right chainstay".
 "serialVisible": string|null,            // if a serial number is legible or written in the post
 "frameSizeGuess": "xs"|"s"|"m"|"l"|"xl"|null,
 "postKind": "found"|"stolen"|"lost"|"unknown",  // from the post text: fannst/fundið=found, stolið=stolen, týnt/tapað=lost
 "confidence": number 0..1,
 "notes": string|null                     // one sentence, anything else useful
}`;

function loadPosts() {
  const raw = JSON.parse(fs.readFileSync(IN, 'utf8'));
  const items = Array.isArray(raw) ? raw : raw.items || [];
  const rows = [];
  for (const p of items) {
    const postId = p.postId || p.id || p.url || p.postUrl || '';
    const text = p.text || p.postText || p.message || '';
    const url = p.url || p.postUrl || p.facebookUrl || '';
    const time = p.time || p.date || p.postedAt || p.timestamp || null;
    // Apify FB group scraper puts images in `attachments` (image.uri) or `media` or `imageUrls`
    const imgs = [];
    for (const a of p.attachments || []) {
      if (a?.image?.uri) imgs.push(a.image.uri);
      else if (a?.url && /\.(jpe?g|png|webp)/i.test(a.url)) imgs.push(a.url);
      else if (a?.thumbnail) imgs.push(a.thumbnail);
    }
    for (const m of p.media || []) if (m?.thumbnail || m?.image?.uri || m?.url) imgs.push(m.thumbnail || m.image?.uri || m.url);
    for (const u of p.imageUrls || p.images || []) if (typeof u === 'string') imgs.push(u);
    if (p.imageUrl) imgs.push(p.imageUrl);
    [...new Set(imgs)].forEach((img, i) => rows.push({
      externalId: `${postId}#${i}`.slice(0, 160), imageUrl: img, postUrl: url, postText: text, postedAt: time,
    }));
  }
  return rows;
}

async function analyze(row) {
  const body = {
    model: MODEL,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: [
        { type: 'text', text: `Post text:\n${(row.postText || '(none)').slice(0, 1500)}` },
        { type: 'image_url', image_url: { url: row.imageUrl, detail: 'low' } },
      ] },
    ],
  };
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST', headers: { authorization: `Bearer ${KEY}`, 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  const j = await r.json();
  return JSON.parse(j.choices[0].message.content);
}

async function main() {
  const rows = loadPosts();
  console.log(`${rows.length} images found in ${IN}`);
  let done = [];
  if (args.resume && fs.existsSync(OUT)) done = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  const doneIds = new Set(done.map((d) => d.externalId));
  const todo = rows.filter((r) => !doneIds.has(r.externalId)).slice(0, LIMIT);
  console.log(`${todo.length} to analyse (${doneIds.size} already done)`);

  let n = 0;
  for (const row of todo) {
    try {
      const a = await analyze(row);
      const analysis = a.isBike === false ? { confidence: 0, notes: 'not a bike photo' } : a;
      done.push({ ...row, postKind: a.postKind || 'unknown', analysis, isDemo: false });
      n++;
      if (n % 10 === 0) { fs.writeFileSync(OUT, JSON.stringify(done, null, 1)); console.log(`  ${n}/${todo.length} saved`); }
      await new Promise((r) => setTimeout(r, 250)); // be polite to rate limits
    } catch (e) {
      console.error(`  ✗ ${row.externalId}: ${e.message.slice(0, 200)}`);
    }
  }
  fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(done, null, 1));
  console.log(`✔ wrote ${OUT} (${done.length} rows). Upload at /admin, or:`);
  console.log(`  curl -X POST http://localhost:3000/api/dataset -H 'content-type: application/json' --data @${OUT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
