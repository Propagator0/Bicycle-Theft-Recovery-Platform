# Apify runbook — Hjólið Mitt

Two separate jobs. Do them in this order. Budget: both fit inside one free-credit account
($5) if you follow the limits below.

---

## JOB A — the FB group (you already did this once; this is how to do it repeatably)

Actor: **`apify/facebook-groups-scraper`** (Apify Store → search "Facebook Groups Scraper").

INPUT (paste into the JSON tab):

```json
{
  "startUrls": [{ "url": "https://www.facebook.com/groups/hjoladot" }],
  "resultsLimit": 1500,
  "viewOption": "CHRONOLOGICAL",
  "onlyPostsNewerThan": "2024-01-01",
  "commentsMode": "NONE",
  "maxRequestRetries": 3
}
```

- `onlyPostsNewerThan` is the secret to re-running cheaply: next month set it to
  the date of your last run and you only pay for new posts.
- Replace the group URL slug with the real one (open the group, copy the address bar).
- When it finishes: **Storage → Dataset → Export → JSON** → save as `data/fb-posts.json`.

Then tag the images:

```bash
export OPENAI_API_KEY=sk-...
node scripts/analyze-images.mjs --limit=20     # test on 20 first, look at data/fb-dataset.json
node scripts/analyze-images.mjs --resume       # do the rest; safe to Ctrl-C and re-run
```

Upload `data/fb-dataset.json` at **/admin → 3 · FB-group dataset**, or:

```bash
curl -X POST http://localhost:3000/api/dataset -H 'content-type: application/json' --data @data/fb-dataset.json
```

Re-uploading is safe: rows are upserted on `externalId`.

---

## JOB B — reference images for the shop catalog

### B1. Build the catalog (no Apify needed, free)

```bash
node scripts/harvest-catalog.mjs --detect https://www.orninn.is    # what platform is it?
node scripts/harvest-catalog.mjs --shop=Örninn                       # one shop
node scripts/harvest-catalog.mjs                                     # all shops in the list
```

Output: `data/catalog.json` + `data/catalog.csv`. Open the CSV in a spreadsheet,
delete junk rows (helmets that slipped through, "gift card", etc.), fix obvious
brand/model splits. This is the one manual step and it is worth 20 minutes.

Upload at **/admin → 1 · Bike catalog**, or:

```bash
curl -X POST http://localhost:3000/api/catalog -H 'content-type: application/json' --data @data/catalog.json
```

### B2. If a shop resists (no JSON feed, no sitemap)

Use Apify **`apify/web-scraper`** with a *tiny* page function — you're only after
title, price, variant names. Input:

```json
{
  "startUrls": [{ "url": "https://SHOP/collections/hjol" }],
  "linkSelector": "a[href*='/products/'], a[href*='/vara/'], a[href*='/product/']",
  "globs": [{ "glob": "https://SHOP/**" }],
  "maxPagesPerCrawl": 400,
  "pageFunction": "async function pageFunction(context){const {$,request}=context;const t=$('h1').first().text().trim();if(!t)return null;const opts={};$('select, [data-option], .variant, .swatch, label').each((i,el)=>{const n=$(el).attr('name')||$(el).attr('data-option')||$(el).text().trim();if(n)opts[n.slice(0,40)]=$(el).find('option').map((j,o)=>$(o).text().trim()).get().filter(Boolean)});return {url:request.url,title:t,price:$('[class*=price]').first().text().trim(),options:opts,image:$('img').first().attr('src')||''}}"
}
```

Export → JSON → hand-map `title` → `brand,model,colorName` in a spreadsheet → save as CSV
with the header `brand,model,year,colorName,sizes,shop,sourceUrl,imageUrl` → upload at /admin.

### B3. Fetch reference images with Apify

1. `/admin → 2 · Apify reference-image jobs → ⬇ Apify INPUT (json)`
   (or `curl 'http://localhost:3000/api/apify/jobs?format=json&onlyMissing=1' -o apify-input.json`)
2. Actor: search the Store for **"Google Images Scraper"** (several exist; any that
   takes a `queries` array works). Paste the `apifyInput` object from the file.
   Keep `maxResultsPerQuery: 3`. ~1 result-credit per query; 400 queries ≈ pennies.
3. Export → JSON. Upload at **/admin → Upload Apify image results**. The write-back
   matches on `catalogId` (if the actor echoes it) or on the exact `query` string.

You now have: brand → model → colourway → sizes → picture, for every bike sold in town.
That list is what the Brand step of the configurator reads from.

---

## Costs (rough, 2025 prices)

| step | tool | cost |
|---|---|---|
| FB group, 1,500 posts | apify/facebook-groups-scraper | ≈ $3–4 of credit |
| Vision tagging, 1,200 images | gpt-4o-mini, detail=low | ≈ $2–3 |
| Catalog harvest | node script | free |
| 400 image queries | Google Images actor | < $1 |

## Etiquette / legal-ish

- The harvester sends a UA string, sleeps 600 ms between pages, and only reads public JSON
  feeds the shops publish for their own storefronts. Don't hammer them.
- FB group data: keep it inside this tool, never republish other people's photos or names.
  The match page links back to the original post rather than re-hosting it.
