#!/usr/bin/env node
/**
 * harvest-catalog.mjs — pull bike catalogs from Reykjavík shops WITHOUT scraping HTML.
 *
 * Most shop sites are Shopify or WooCommerce. Both expose public JSON feeds:
 *   Shopify:      https://SHOP/products.json?limit=250&page=N
 *                 https://SHOP/collections/HANDLE/products.json
 *   WooCommerce:  https://SHOP/wp-json/wc/store/v1/products?per_page=100&page=N
 *   Fallback:     https://SHOP/sitemap.xml -> product URLs (titles only)
 *
 * Usage:
 *   node scripts/harvest-catalog.mjs                 # all shops in SHOPS below
 *   node scripts/harvest-catalog.mjs --shop=Örninn   # one shop
 *   node scripts/harvest-catalog.mjs --detect https://example.is   # just tell me what platform it is
 *
 * Output: data/catalog.json + data/catalog.csv  (upload either at /admin)
 *
 * Node 18+ (global fetch). No dependencies.
 */

import fs from 'node:fs';
import path from 'node:path';

// ---- EDIT THIS LIST. `platform` can be 'shopify' | 'woo' | 'auto'. ---------
// URLs are the shop roots. Verify each one in a browser first (they change).
const SHOPS = [
  { name: 'Örninn', url: 'https://www.orninn.is', platform: 'auto', brands: ['Trek', 'Electra'] },
  { name: 'Kría Hjól', url: 'https://kriacycles.com', platform: 'auto', brands: [] },
  { name: 'Hvellur', url: 'https://www.hvellur.com', platform: 'auto', brands: [] },
  { name: 'Markið', url: 'https://www.markid.is', platform: 'auto', brands: [] },
  { name: 'GÁP', url: 'https://www.gap.is', platform: 'auto', brands: [] },
  { name: 'TRI', url: 'https://www.tri.is', platform: 'auto', brands: [] },
  { name: 'Reiðhjólaverzlunin Berlin', url: 'https://www.berlin.is', platform: 'auto', brands: [] },
  { name: 'Everest', url: 'https://www.everest.is', platform: 'auto', brands: [] },
  { name: 'Ellingsen', url: 'https://www.ellingsen.is', platform: 'auto', brands: [] },
  { name: 'Hjólasprettur', url: 'https://www.hjolasprettur.is', platform: 'auto', brands: [] },
];

// Words that mean "this product is a complete bicycle" (EN + IS). Tighten if you get helmets.
const BIKE_WORDS = /\b(hjól|reiðhjól|rafhjól|fjallahjól|götuhjól|barnahjól|racer|bike|bicycle|e-?bike|mtb|gravel|hybrid|cargo)\b/i;
const NOT_BIKE = /\b(hjálm|helmet|dekk|tire|tyre|slanga|tube|lás|lock|ljós|light|hanski|glove|jakki|jacket|skór|shoe|buxur|pants|pedal|hnakkur|saddle|bjalla|bell|kerra|trailer|bögglaberi|rack|brett|fender|festing|mount|tölva|computer|grip|keðja|chain|olía|oil|pumpa|pump|flaska|bottle|standur|stand|taska|bag|barnastóll|seat|gjörð|rim|nöf|hub|sveif|crank|stýri|handlebar|stell|frame only|varahlut|part)\b/i;

const KNOWN_BRANDS = ['Trek', 'Specialized', 'Giant', 'Liv', 'Cannondale', 'Scott', 'Cube', 'Orbea', 'Kona', 'Merida', 'Focus', 'Bianchi', 'BMC', 'Cervélo', 'Cervelo', 'Marin', 'Norco', 'Rocky Mountain', 'Santa Cruz', 'Brompton', 'Tern', 'Riese & Müller', 'Gazelle', 'Batavus', 'Raleigh', 'GT', 'Fuji', 'Surly', 'Salsa', 'Canyon', 'Electra', 'Winora', 'Haibike', 'Kalkhoff', 'Mongoose', 'Diamondback', 'Nishiki', 'DBS', 'Crescent', 'Monark', 'Puky', 'Woom', 'Frog', 'Fischer', 'Bergamont', 'Ghost', 'Lapierre', 'Wilier', 'Pinarello', 'Colnago', 'Ridley', 'Felt', 'Polygon', 'Kellys', 'Devinci', 'Cannondale', 'Bulls', 'Pegasus', 'Conway', 'Kross', 'Romet', 'Author', 'Superior', 'Rondo', 'Tenways', 'Fiido', 'Engwe', 'Rad Power', 'Babboe', 'Urban Arrow', 'Yuba', 'Larry vs Harry'];

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const UA = 'Mozilla/5.0 (compatible; HjolidMitt-catalog/1.0; +https://github.com/hjolidmitt)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/json' } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  const ct = r.headers.get('content-type') || '';
  if (!ct.includes('json')) throw new Error(`not json (${ct}) ${url}`);
  return r.json();
}

async function detectPlatform(root) {
  try { const j = await getJson(`${root}/products.json?limit=1`); if (j && j.products) return 'shopify'; } catch {}
  try { const j = await getJson(`${root}/wp-json/wc/store/v1/products?per_page=1`); if (Array.isArray(j)) return 'woo'; } catch {}
  try { const j = await getJson(`${root}/wp-json/wc/v3/products?per_page=1`); if (Array.isArray(j)) return 'woo'; } catch {}
  return 'unknown';
}

const strip = (html) => String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

function splitBrandModel(title, vendor, knownBrands) {
  const t = title.replace(/\s+/g, ' ').trim();
  const candidates = [...knownBrands, ...KNOWN_BRANDS].filter(Boolean).sort((a, b) => b.length - a.length);
  for (const b of candidates) {
    const re = new RegExp(`^${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b\\s*[-–:]?\\s*`, 'i');
    if (re.test(t)) return { brand: b, model: t.replace(re, '').trim() };
  }
  if (vendor && vendor.trim() && !/^(default|shop|vendor)$/i.test(vendor)) {
    const re = new RegExp(`^${vendor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b\\s*[-–:]?\\s*`, 'i');
    return { brand: vendor.trim(), model: t.replace(re, '').trim() || t };
  }
  const [first, ...rest] = t.split(' ');
  return { brand: first, model: rest.join(' ') || t };
}

function extractYear(s) {
  const m = String(s).match(/\b(20[1-3]\d)\b/);
  return m ? m[1] : '';
}

function cleanModel(model) {
  return model.replace(/\b(20[1-3]\d)\b/g, '').replace(/\b(rafhjól|rafmagnshjól|reiðhjól|fjallahjól|götuhjól|barnahjól|hjól)\b/gi, '').replace(/\s{2,}/g, ' ').replace(/^[\s\-–,]+|[\s\-–,]+$/g, '').trim();
}

const SIZE_RE = /^(xxs|xs|s|m|l|xl|xxl|\d{2}(\.\d)?\s?(cm|")?|\d{2}\/\d{2}|one size)$/i;

function looksLikeBike(title, type, tags) {
  const hay = `${title} ${type} ${(tags || []).join(' ')}`;
  if (NOT_BIKE.test(title)) return false;
  return BIKE_WORDS.test(hay) || /\b(bikes?|reiðhjól|hjól)\b/i.test(type || '');
}

// ---- Shopify ---------------------------------------------------------------
async function harvestShopify(shop) {
  const out = [];
  for (let page = 1; page <= 40; page++) {
    let j;
    try { j = await getJson(`${shop.url}/products.json?limit=250&page=${page}`); } catch (e) { console.error('  !', e.message); break; }
    const products = j.products || [];
    if (!products.length) break;
    for (const p of products) {
      if (!looksLikeBike(p.title, p.product_type, p.tags)) continue;
      const { brand, model } = splitBrandModel(p.title, p.vendor, shop.brands);
      const year = extractYear(p.title) || extractYear((p.tags || []).join(' '));
      // Shopify options: find which option is Color and which is Size
      const colorIdx = (p.options || []).findIndex((o) => /colou?r|litur/i.test(o.name));
      const sizeIdx = (p.options || []).findIndex((o) => /size|stærð/i.test(o.name));
      const byColor = new Map();
      for (const v of p.variants || []) {
        const opts = [v.option1, v.option2, v.option3];
        const color = colorIdx >= 0 ? opts[colorIdx] : (opts.find((o) => o && !SIZE_RE.test(o) && o !== 'Default Title') || '');
        const size = sizeIdx >= 0 ? opts[sizeIdx] : (opts.find((o) => o && SIZE_RE.test(o)) || '');
        const key = color || '';
        const e = byColor.get(key) || { sizes: new Set(), price: null, image: '' };
        if (size) e.sizes.add(size);
        if (v.price && (!e.price || Number(v.price) < e.price)) e.price = Number(v.price);
        if (v.featured_image?.src) e.image = v.featured_image.src;
        byColor.set(key, e);
      }
      if (!byColor.size) byColor.set('', { sizes: new Set(), price: null, image: '' });
      for (const [color, e] of byColor) {
        out.push({
          brand, model: cleanModel(model), year, colorName: color, sizes: [...e.sizes],
          shop: shop.name, sourceUrl: `${shop.url}/products/${p.handle}`,
          imageUrl: e.image || p.images?.[0]?.src || '', priceIsk: e.price,
        });
      }
    }
    await sleep(600);
  }
  return out;
}

// ---- WooCommerce (Store API, public, no auth) -------------------------------
async function harvestWoo(shop) {
  const out = [];
  for (let page = 1; page <= 60; page++) {
    let items;
    try { items = await getJson(`${shop.url}/wp-json/wc/store/v1/products?per_page=100&page=${page}`); } catch (e) { console.error('  !', e.message); break; }
    if (!Array.isArray(items) || !items.length) break;
    for (const p of items) {
      const cats = (p.categories || []).map((c) => c.name).join(' ');
      if (!looksLikeBike(p.name, cats, (p.tags || []).map((t) => t.name))) continue;
      const brandAttr = (p.attributes || []).find((a) => /brand|merki|framleiðandi/i.test(a.name));
      const vendor = brandAttr?.terms?.[0]?.name || '';
      const { brand, model } = splitBrandModel(strip(p.name), vendor, shop.brands);
      const colorAttr = (p.attributes || []).find((a) => /colou?r|litur/i.test(a.name));
      const sizeAttr = (p.attributes || []).find((a) => /size|stærð/i.test(a.name));
      const colors = colorAttr?.terms?.map((t) => t.name) || [''];
      const sizes = sizeAttr?.terms?.map((t) => t.name) || [];
      const price = p.prices?.price ? Math.round(Number(p.prices.price) / Math.pow(10, p.prices.currency_minor_unit || 0)) : null;
      for (const color of colors) {
        out.push({
          brand, model: cleanModel(model), year: extractYear(p.name), colorName: color, sizes,
          shop: shop.name, sourceUrl: p.permalink, imageUrl: p.images?.[0]?.src || '', priceIsk: price,
        });
      }
    }
    await sleep(600);
  }
  return out;
}

// ---- Sitemap fallback: titles only, still gives you brand+model list --------
async function harvestSitemap(shop) {
  const out = [];
  try {
    const r = await fetch(`${shop.url}/sitemap.xml`, { headers: { 'user-agent': UA } });
    const xml = await r.text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const productSitemaps = locs.filter((l) => /product/i.test(l) && l.endsWith('.xml'));
    const productUrls = locs.filter((l) => /\/(products?|vara|voru|shop)\//i.test(l));
    for (const sm of productSitemaps.slice(0, 5)) {
      const rr = await fetch(sm, { headers: { 'user-agent': UA } });
      const x = await rr.text();
      productUrls.push(...[...x.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
      await sleep(400);
    }
    for (const u of [...new Set(productUrls)]) {
      const slug = decodeURIComponent(u.split('/').filter(Boolean).pop() || '').replace(/[-_]+/g, ' ');
      if (!looksLikeBike(slug, '', [])) continue;
      const { brand, model } = splitBrandModel(slug, '', shop.brands);
      out.push({ brand, model: cleanModel(model), year: extractYear(slug), colorName: '', sizes: [], shop: shop.name, sourceUrl: u, imageUrl: '', priceIsk: null });
    }
  } catch (e) {
    console.error('  sitemap failed:', e.message);
  }
  return out;
}

function toCsv(rows) {
  const cols = ['brand', 'model', 'year', 'bikeType', 'colorName', 'sizes', 'shop', 'sourceUrl', 'imageUrl', 'priceIsk'];
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(Array.isArray(r[c]) ? r[c].join('|') : r[c])).join(','))].join('\n');
}

async function main() {
  if (args.detect) {
    console.log(args.detect, '->', await detectPlatform(args.detect.replace(/\/$/, '')));
    return;
  }
  const shops = SHOPS.filter((s) => !args.shop || s.name.toLowerCase() === String(args.shop).toLowerCase());
  const all = [];
  for (const shop of shops) {
    const root = shop.url.replace(/\/$/, '');
    let platform = shop.platform;
    if (platform === 'auto') platform = await detectPlatform(root);
    console.log(`\n▶ ${shop.name} (${root}) — ${platform}`);
    let rows = [];
    if (platform === 'shopify') rows = await harvestShopify({ ...shop, url: root });
    else if (platform === 'woo') rows = await harvestWoo({ ...shop, url: root });
    else rows = await harvestSitemap({ ...shop, url: root });
    console.log(`  ${rows.length} bike rows`);
    all.push(...rows);
  }
  // de-dupe on brand+model+year+color
  const seen = new Set();
  const dedup = all.filter((r) => {
    const k = `${r.brand}|${r.model}|${r.year}|${r.colorName}`.toLowerCase();
    if (seen.has(k) || !r.model) return false;
    seen.add(k);
    return true;
  });
  fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync(path.join('data', 'catalog.json'), JSON.stringify(dedup, null, 2));
  fs.writeFileSync(path.join('data', 'catalog.csv'), toCsv(dedup));
  console.log(`\n✔ wrote data/catalog.json + data/catalog.csv (${dedup.length} rows). Upload at /admin, or:`);
  console.log(`  curl -X POST http://localhost:3000/api/catalog -H 'content-type: application/json' --data @data/catalog.json`);
}

main().catch((e) => { console.error(e); process.exit(1); });
