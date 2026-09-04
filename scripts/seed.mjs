#!/usr/bin/env node
/**
 * seed.mjs — idempotent starter data so the app is useful on first boot.
 *  - catalog_bikes: brands commonly sold in Reykjavík with real model names + colourways
 *    (shop column says "verify" — replace with harvester output when you have it)
 *  - dataset_images: 40 DEMO rows tagged with the controlled vocabulary (is_demo=true),
 *    so matching demonstrably works before the real FB dataset is imported.
 * Run: node scripts/seed.mjs   (reads DATABASE_URL from .env)
 */
import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const CATALOG = [
  // brand, model, year, type, [colourways], sizes, shop
  ['Trek', 'FX 1', '2024', 'hybrid', ['Matte Trek Black', 'Viper Red', 'Alpine Blue'], ['S', 'M', 'L', 'XL'], 'Örninn (verify)'],
  ['Trek', 'FX 2', '2024', 'hybrid', ['Satin Trek Black', 'Dark Aquatic', 'Crimson'], ['S', 'M', 'L', 'XL'], 'Örninn (verify)'],
  ['Trek', 'FX 3 Disc', '2024', 'hybrid', ['Lithium Grey', 'Matte Trek Black', 'Deep Dark Blue'], ['S', 'M', 'L', 'XL'], 'Örninn (verify)'],
  ['Trek', 'Dual Sport 2', '2024', 'hybrid', ['Matte Trek Black', 'Juniper'], ['S', 'M', 'L', 'XL'], 'Örninn (verify)'],
  ['Trek', 'Marlin 5', '2024', 'mountain', ['Matte Trek Black', 'Dark Aquatic', 'Radioactive Red'], ['XS', 'S', 'M', 'L', 'XL'], 'Örninn (verify)'],
  ['Trek', 'Marlin 7', '2024', 'mountain', ['Matte Dnister Black', 'Alpine Blue', 'Lithium Grey'], ['S', 'M', 'L', 'XL'], 'Örninn (verify)'],
  ['Trek', 'Roscoe 7', '2024', 'mountain', ['Deep Smoke', 'Purple Flip'], ['S', 'M', 'L'], 'Örninn (verify)'],
  ['Trek', 'Domane AL 2', '2024', 'road', ['Trek Black', 'Crimson'], ['52', '54', '56', '58'], 'Örninn (verify)'],
  ['Trek', 'Checkpoint ALR 5', '2024', 'gravel', ['Deep Smoke', 'Era White'], ['52', '54', '56', '58'], 'Örninn (verify)'],
  ['Trek', 'Verve+ 2', '2024', 'ebike', ['Matte Trek Black', 'Dark Aquatic'], ['S', 'M', 'L'], 'Örninn (verify)'],
  ['Trek', 'Allant+ 7', '2023', 'ebike', ['Matte Trek Black', 'Slate'], ['M', 'L'], 'Örninn (verify)'],
  ['Trek', 'Precaliber 20', '2024', 'kids', ['Alpine Blue', 'Magenta', 'Volt'], ['20"'], 'Örninn (verify)'],
  ['Electra', 'Townie 7D', '2024', 'cruiser', ['Matte Black', 'Sky Blue', 'Cream'], ['One size'], 'Örninn (verify)'],
  ['Electra', 'Loft 7D', '2023', 'cruiser', ['Black', 'Alpine White'], ['M', 'L'], 'Örninn (verify)'],
  ['Scott', 'Sub Cross 30', '2024', 'hybrid', ['Dark Grey', 'Blue'], ['S', 'M', 'L', 'XL'], 'verify'],
  ['Scott', 'Aspect 950', '2024', 'mountain', ['Black', 'Red / Yellow'], ['S', 'M', 'L', 'XL'], 'verify'],
  ['Scott', 'Scale 970', '2024', 'mountain', ['Dark Grey', 'Green'], ['M', 'L', 'XL'], 'verify'],
  ['Scott', 'Speedster 40', '2024', 'road', ['Black', 'White'], ['52', '54', '56'], 'verify'],
  ['Scott', 'Speedster Gravel 40', '2024', 'gravel', ['Dark Grey', 'Green'], ['52', '54', '56', '58'], 'verify'],
  ['Scott', 'Sub eRide Evo', '2023', 'ebike', ['Black', 'Blue'], ['M', 'L'], 'verify'],
  ['Cube', 'Nature', '2024', 'hybrid', ['Black / Grey', 'Bluegrey'], ['50', '54', '58', '62'], 'verify'],
  ['Cube', 'Touring Hybrid One', '2024', 'ebike', ['Grey / Black', 'Blue / Green'], ['50', '54', '58'], 'verify'],
  ['Cube', 'Aim Race', '2024', 'mountain', ['Black / Azure', 'Flashwhite / Black'], ['16"', '18"', '20"', '22"'], 'verify'],
  ['Cube', 'Attention', '2024', 'mountain', ['Grey / Black', 'Green / Black'], ['16"', '18"', '20"'], 'verify'],
  ['Cube', 'Nuroad', '2024', 'gravel', ['Metalgrey / Black', 'Green'], ['53', '56', '58'], 'verify'],
  ['Cube', 'Kathmandu Hybrid Pro', '2023', 'ebike', ['Black', 'Nightgreen'], ['50', '54', '58'], 'verify'],
  ['Cube', 'Acid 240', '2024', 'kids', ['Black / Neon', 'Blue / Orange'], ['24"'], 'verify'],
  ['Giant', 'Escape 3', '2024', 'hybrid', ['Black', 'Metallic Navy', 'Grey'], ['S', 'M', 'L', 'XL'], 'verify'],
  ['Giant', 'Escape 2', '2024', 'hybrid', ['Black', 'Blue Ashes'], ['S', 'M', 'L', 'XL'], 'verify'],
  ['Giant', 'Talon 3', '2024', 'mountain', ['Black', 'Dark Blue', 'Sage'], ['S', 'M', 'L', 'XL'], 'verify'],
  ['Giant', 'Roam 3 Disc', '2024', 'hybrid', ['Black Diamond', 'Cold Iron'], ['S', 'M', 'L', 'XL'], 'verify'],
  ['Giant', 'Contend 3', '2024', 'road', ['Black', 'Cold Iron'], ['S', 'M', 'L'], 'verify'],
  ['Giant', 'Revolt 2', '2024', 'gravel', ['Black', 'Sage'], ['S', 'M', 'L'], 'verify'],
  ['Giant', 'Explore E+ 3', '2023', 'ebike', ['Black', 'Amber Glow'], ['S', 'M', 'L'], 'verify'],
  ['Liv', 'Alight 3', '2024', 'hybrid', ['Black', 'Blue Ashes', 'Sage'], ['XS', 'S', 'M'], 'verify'],
  ['Liv', 'Rove 3', '2024', 'hybrid', ['Black', 'Purple Sage'], ['XS', 'S', 'M'], 'verify'],
  ['Liv', 'Tempt 3', '2024', 'mountain', ['Black', 'Blue Ashes'], ['XS', 'S', 'M'], 'verify'],
  ['Specialized', 'Sirrus 2.0', '2024', 'hybrid', ['Gloss Cast Black', 'Gloss Ice Blue', 'Satin Redwood'], ['S', 'M', 'L', 'XL'], 'verify'],
  ['Specialized', 'Sirrus X 3.0', '2024', 'hybrid', ['Gloss Black', 'Oak Green'], ['S', 'M', 'L', 'XL'], 'verify'],
  ['Specialized', 'Rockhopper', '2024', 'mountain', ['Gloss Black', 'Satin Cast Blue', 'Gloss Dark Moss'], ['S', 'M', 'L', 'XL'], 'verify'],
  ['Specialized', 'Allez', '2024', 'road', ['Gloss Black', 'Satin Redwood'], ['52', '54', '56', '58'], 'verify'],
  ['Specialized', 'Diverge E5', '2024', 'gravel', ['Satin Black', 'Gloss Birch'], ['52', '54', '56', '58'], 'verify'],
  ['Specialized', 'Turbo Vado 3.0', '2023', 'ebike', ['Cast Black', 'Redwood'], ['S', 'M', 'L'], 'verify'],
  ['Cannondale', 'Quick 4', '2024', 'hybrid', ['Black', 'Blue', 'Sage'], ['S', 'M', 'L', 'XL'], 'verify'],
  ['Cannondale', 'Trail 6', '2024', 'mountain', ['Black', 'Grey', 'Acid Red'], ['S', 'M', 'L', 'XL'], 'verify'],
  ['Cannondale', 'Topstone 3', '2024', 'gravel', ['Black', 'Olive Green'], ['S', 'M', 'L'], 'verify'],
  ['Cannondale', 'Synapse 2', '2024', 'road', ['Black', 'Blue'], ['51', '54', '56'], 'verify'],
  ['Cannondale', 'Tesoro Neo X 3', '2023', 'ebike', ['Black', 'Grey'], ['M', 'L'], 'verify'],
  ['Kona', 'Dew', '2024', 'hybrid', ['Black', 'Cream', 'Blue'], ['S', 'M', 'L', 'XL'], 'verify'],
  ['Kona', 'Rove AL', '2024', 'gravel', ['Black', 'Gloss Ocean'], ['50', '52', '54', '56'], 'verify'],
  ['Kona', 'Lana\'i', '2024', 'mountain', ['Black', 'Blue'], ['S', 'M', 'L'], 'verify'],
  ['Marin', 'Fairfax 1', '2024', 'hybrid', ['Black', 'Gloss Teal'], ['S', 'M', 'L', 'XL'], 'verify'],
  ['Marin', 'Bolinas Ridge 1', '2024', 'mountain', ['Black / Red', 'Blue / Orange'], ['S', 'M', 'L', 'XL'], 'verify'],
  ['Marin', 'Nicasio', '2024', 'gravel', ['Black', 'Gloss Silver'], ['50', '52', '54', '56'], 'verify'],
  ['Brompton', 'C Line Explore', '2024', 'folding', ['Black', 'Racing Green', 'Cloud Blue', 'Flame Lacquer'], ['One size'], 'verify'],
  ['Tern', 'GSD S10', '2023', 'cargo', ['Black', 'Beetle Blue', 'Dragonfruit'], ['One size'], 'verify'],
  ['Tern', 'HSD P9', '2023', 'cargo', ['Black', 'Blue'], ['One size'], 'verify'],
  ['Riese & Müller', 'Load 75', '2023', 'cargo', ['Black', 'Grey', 'Coral Red'], ['One size'], 'verify'],
  ['Riese & Müller', 'Charger4', '2024', 'ebike', ['Black', 'Grey', 'Utility Grey'], ['46', '49', '53', '56'], 'verify'],
  ['Woom', 'Woom 4', '2024', 'kids', ['Red', 'Blue', 'Green', 'Purple', 'Yellow'], ['20"'], 'verify'],
  ['Woom', 'Woom 5', '2024', 'kids', ['Red', 'Blue', 'Green', 'Purple'], ['24"'], 'verify'],
  ['Puky', 'Cyke 20', '2024', 'kids', ['Blue', 'Berry', 'Black'], ['20"'], 'verify'],
  ['Merida', 'Crossway 20', '2024', 'hybrid', ['Silk Black', 'Matt Teal'], ['S', 'M', 'L', 'XL'], 'verify'],
  ['Merida', 'Big Nine 20', '2024', 'mountain', ['Matt Black', 'Silk Teal'], ['S', 'M', 'L', 'XL'], 'verify'],
  ['Merida', 'eSpresso 300', '2023', 'ebike', ['Black', 'Silk Blue'], ['S', 'M', 'L'], 'verify'],
  ['Orbea', 'Vector 20', '2024', 'hybrid', ['Metallic Night Black', 'Green'], ['S', 'M', 'L'], 'verify'],
  ['Orbea', 'Onna 40', '2024', 'mountain', ['Black', 'Blue', 'Red'], ['S', 'M', 'L', 'XL'], 'verify'],
  ['Orbea', 'Terra H40', '2024', 'gravel', ['Green', 'Black'], ['S', 'M', 'L'], 'verify'],
  ['Gazelle', 'Ultimate C8 HMB', '2023', 'ebike', ['Black', 'Dust Grey'], ['46', '49', '53', '57'], 'verify'],
  ['Gazelle', 'Paris C7 HMB', '2023', 'ebike', ['Black', 'Petrol Blue'], ['49', '53', '57'], 'verify'],
  ['Nishiki', 'Manitoba', '2023', 'hybrid', ['Black', 'Red', 'Silver'], ['M', 'L'], 'verify'],
  ['DBS', 'Intruder', '2023', 'hybrid', ['Black', 'Dark Blue'], ['M', 'L'], 'verify'],
  ['Crescent', 'Femto', '2023', 'hybrid', ['Black', 'Grey'], ['M', 'L'], 'verify'],
  ['Bergamont', 'Sweep 4', '2024', 'hybrid', ['Black', 'Grey'], ['S', 'M', 'L'], 'verify'],
  ['Bergamont', 'Revox 3', '2024', 'mountain', ['Black', 'Blue'], ['M', 'L', 'XL'], 'verify'],
];

const COLOR_SYNONYMS = { black: 'black', matte: 'matte_black', matt: 'matte_black', white: 'white', birch: 'white', cream: 'white', silver: 'silver', grey: 'silver', gray: 'silver', iron: 'silver', slate: 'silver', smoke: 'silver', red: 'red', crimson: 'red', redwood: 'dark_red', burgundy: 'dark_red', coral: 'red', orange: 'orange', amber: 'orange', yellow: 'yellow', volt: 'yellow', green: 'green', sage: 'dark_green', moss: 'dark_green', olive: 'dark_green', juniper: 'dark_green', teal: 'teal', aquatic: 'teal', ocean: 'teal', blue: 'blue', azure: 'blue', navy: 'dark_blue', 'dark blue': 'dark_blue', 'deep dark blue': 'dark_blue', petrol: 'dark_blue', purple: 'purple', berry: 'purple', magenta: 'pink', dragonfruit: 'pink', pink: 'pink', brown: 'brown', gold: 'gold', copper: 'gold', chrome: 'chrome', flame: 'orange' };
function normColor(name) {
  const s = name.toLowerCase();
  for (const k of Object.keys(COLOR_SYNONYMS).sort((a, b) => b.length - a.length)) if (s.includes(k)) return COLOR_SYNONYMS[k];
  return '';
}

const IMGS = [
  'https://images.pexels.com/photos/11697008/pexels-photo-11697008.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
  'https://images.pexels.com/photos/28237105/pexels-photo-28237105.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
  'https://images.pexels.com/photos/5911709/pexels-photo-5911709.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
  'https://images.pexels.com/photos/14544309/pexels-photo-14544309.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
  'https://images.pexels.com/photos/22748687/pexels-photo-22748687.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
  'https://images.pexels.com/photos/28237108/pexels-photo-28237108.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
  'https://images.pexels.com/photos/32403277/pexels-photo-32403277.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
  'https://images.pexels.com/photos/9982029/pexels-photo-9982029.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
  'https://images.pexels.com/photos/6186034/pexels-photo-6186034.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  'https://images.pexels.com/photos/17856917/pexels-photo-17856917.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  'https://images.pexels.com/photos/18953825/pexels-photo-18953825.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  'https://images.pexels.com/photos/31256734/pexels-photo-31256734.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
];

// [kind, postText, analysis]
const DEMO = [
  ['found', 'Fannst við Hlemm í morgun. Blátt Trek hjól með bögglabera og framljósi. Er hjá mér, hafið samband.', { bikeType: 'hybrid', brand: 'Trek', model: 'FX 3', frameColor: 'blue', secondaryColors: ['white'], handlebarType: 'flat', accessories: ['rear_rack', 'front_light', 'kickstand'], distinctiveFeatures: ['white logo decals', 'scuffed rear rack'], confidence: 0.8 }],
  ['found', 'Fundið í Laugardal, svart borgarhjól með brettum og bjöllu. Læst við staur með rauðum lás.', { bikeType: 'hybrid', brand: null, frameColor: 'black', accessories: ['fenders', 'bell', 'lock_attached'], lockType: 'u_lock', handlebarType: 'flat', distinctiveFeatures: ['red u-lock still attached', 'rust on chain'], confidence: 0.6 }],
  ['stolen', 'Stolið frá BSÍ í nótt! Trek Marlin 7, svart matt, rauðar merkingar. Rispa á efra röri. Fundarlaun.', { bikeType: 'mountain', brand: 'Trek', model: 'Marlin 7', frameColor: 'matte_black', secondaryColors: ['red'], handlebarType: 'riser', accessories: ['suspension_fork', 'bottle_cage'], distinctiveFeatures: ['scratch on top tube', 'red decals'], confidence: 0.85 }],
  ['found', 'Fann þetta hjól í Fossvogi. Grænt racer með drop stýri. Brúnn hnakkur.', { bikeType: 'road', brand: null, frameColor: 'green', handlebarType: 'drop', saddleColor: 'Brown / Tan', gripColor: 'Brown', accessories: [], distinctiveFeatures: ['brown leather saddle', 'brown bar tape'], confidence: 0.7 }],
  ['found', 'Found near Kringlan. Silver Giant Escape, has a black basket up front and a bell.', { bikeType: 'hybrid', brand: 'Giant', model: 'Escape', frameColor: 'silver', handlebarType: 'flat', accessories: ['basket', 'bell'], distinctiveFeatures: ['black wire basket'], confidence: 0.75 }],
  ['stolen', 'Rafhjól stolið í Hafnarfirði — Cube Touring Hybrid, grátt/svart, barnastóll aftan á og töskur.', { bikeType: 'ebike', brand: 'Cube', model: 'Touring Hybrid', frameColor: 'silver', secondaryColors: ['black'], accessories: ['child_seat', 'pannier', 'rear_rack', 'fenders', 'front_light', 'rear_light'], distinctiveFeatures: ['grey child seat', 'black ortlieb panniers'], confidence: 0.9 }],
  ['found', 'Barnahjól fannst í Breiðholti. Rautt Woom með hvítum dekkjum.', { bikeType: 'kids', brand: 'Woom', frameColor: 'red', accessories: ['kickstand'], distinctiveFeatures: ['white tyres'], confidence: 0.8 }],
  ['found', 'Fannst í Grafarvogi. Hvítt Specialized Sirrus, með límmiða á stellinu (regnbogi). Framljós.', { bikeType: 'hybrid', brand: 'Specialized', model: 'Sirrus', frameColor: 'white', handlebarType: 'flat', accessories: ['front_light', 'bottle_cage'], distinctiveFeatures: ['rainbow sticker downtube', 'worn grips'], confidence: 0.8 }],
  ['stolen', 'Stolið við Háskólann. Scott Sub Cross, dökkgrátt, með Garmin festingu og rauðum gripum.', { bikeType: 'hybrid', brand: 'Scott', model: 'Sub Cross 30', frameColor: 'silver', handlebarType: 'flat', gripColor: 'Red', accessories: ['computer', 'fenders', 'rear_rack'], distinctiveFeatures: ['red grips', 'garmin mount'], confidence: 0.85 }],
  ['found', 'Found in Vesturbær, orange gravel bike, Kona Rove, no lights. Dent on downtube.', { bikeType: 'gravel', brand: 'Kona', model: 'Rove', frameColor: 'orange', handlebarType: 'drop', accessories: ['bottle_cage'], distinctiveFeatures: ['dent on downtube', 'black bar tape'], confidence: 0.8 }],
  ['found', 'Fannst í Kópavogi. Blátt Cannondale Quick með speglum og bjöllu og nagladekkjum.', { bikeType: 'hybrid', brand: 'Cannondale', model: 'Quick', frameColor: 'blue', accessories: ['mirror', 'bell', 'studded_tires', 'fenders'], distinctiveFeatures: ['studded winter tyres', 'bar-end mirror'], confidence: 0.8 }],
  ['stolen', 'Stolið í miðbænum: Brompton, grænt, samanbrjótanlegt, með Brooks hnakk.', { bikeType: 'folding', brand: 'Brompton', model: 'C Line', frameColor: 'dark_green', saddleColor: 'Brown / Tan', accessories: ['front_rack', 'fenders', 'dynamo_light'], distinctiveFeatures: ['brooks saddle', 'front carrier block'], confidence: 0.9 }],
  ['found', 'Found a purple Liv Alight by the pond (Tjörnin). Pink grips.', { bikeType: 'hybrid', brand: 'Liv', model: 'Alight', frameColor: 'purple', gripColor: 'Multi-color', accessories: ['kickstand', 'bell'], distinctiveFeatures: ['pink grips'], confidence: 0.75 }],
  ['found', 'Fannst í Árbæ. Svart fjallahjól, Giant Talon, framdempari, gult flöskustatíf.', { bikeType: 'mountain', brand: 'Giant', model: 'Talon', frameColor: 'black', accessories: ['suspension_fork', 'bottle_cage'], handlebarType: 'riser', distinctiveFeatures: ['yellow bottle cage', 'scratches on fork'], confidence: 0.8 }],
  ['stolen', 'Stolið: Tern GSD flutningahjól, blátt, með tveimur barnastólum. Í Garðabæ.', { bikeType: 'cargo', brand: 'Tern', model: 'GSD', frameColor: 'blue', accessories: ['child_seat', 'rear_rack', 'front_light', 'rear_light', 'fenders', 'kickstand'], distinctiveFeatures: ['two child seats', 'yellow reflective tape'], confidence: 0.95 }],
  ['found', 'Fundið hjá Sundhöllinni. Rautt Nishiki með körfu og bögglabera. Brún grip.', { bikeType: 'hybrid', brand: 'Nishiki', frameColor: 'red', gripColor: 'Brown', accessories: ['basket', 'rear_rack', 'fenders'], distinctiveFeatures: ['wicker basket'], confidence: 0.7 }],
  ['found', 'Found: dark blue Trek FX with a Kryptonite lock still on the frame. Near Harpa.', { bikeType: 'hybrid', brand: 'Trek', model: 'FX', frameColor: 'dark_blue', accessories: ['lock_attached', 'rear_light'], lockType: 'u_lock', distinctiveFeatures: ['kryptonite u-lock on frame', 'name sticker on top tube'], confidence: 0.8 }],
  ['stolen', 'Stolið í Mosfellsbæ. Cube Aim Race, svart/blátt, rispur á keðjustagi hægra megin.', { bikeType: 'mountain', brand: 'Cube', model: 'Aim Race', frameColor: 'black', secondaryColors: ['blue'], accessories: ['suspension_fork'], distinctiveFeatures: ['scratch right chainstay', 'blue decals'], confidence: 0.85 }],
  ['found', 'Gult racer fannst við Ægisíðu. Bullhorn stýri. Engir gírar.', { bikeType: 'fixie', brand: null, frameColor: 'yellow', handlebarType: 'bullhorn', accessories: [], distinctiveFeatures: ['single speed', 'white rims'], confidence: 0.7 }],
  ['found', 'Fannst í Seljahverfi. Grátt Merida Crossway, framljós og afturljós, standari.', { bikeType: 'hybrid', brand: 'Merida', model: 'Crossway', frameColor: 'silver', accessories: ['front_light', 'rear_light', 'kickstand', 'fenders'], distinctiveFeatures: ['reflective sidewalls'], confidence: 0.75 }],
  ['stolen', 'Stolið: hvítt Specialized Allez, drop stýri, rauð stýrisborði. Frá Laugavegi.', { bikeType: 'road', brand: 'Specialized', model: 'Allez', frameColor: 'white', handlebarType: 'drop', gripColor: 'Red', accessories: ['bottle_cage', 'computer'], distinctiveFeatures: ['red bar tape', 'wahoo mount'], confidence: 0.9 }],
  ['found', 'Found in Hlíðar — teal Marin Fairfax, black fenders, phone mount.', { bikeType: 'hybrid', brand: 'Marin', model: 'Fairfax', frameColor: 'teal', accessories: ['fenders', 'phone_mount'], distinctiveFeatures: ['black fenders', 'quad lock mount'], confidence: 0.8 }],
  ['found', 'Fannst við Elliðaár. Appelsínugult barnahjól, Puky.', { bikeType: 'kids', brand: 'Puky', frameColor: 'orange', accessories: ['kickstand', 'bell'], distinctiveFeatures: [], confidence: 0.7 }],
  ['stolen', 'Rafhjól stolið: Gazelle Ultimate, svart, með körfu framan og töskum. Vesturbær.', { bikeType: 'ebike', brand: 'Gazelle', model: 'Ultimate', frameColor: 'black', accessories: ['basket', 'pannier', 'rear_rack', 'fenders', 'dynamo_light', 'wheel_lock'], lockType: 'wheel_lock', distinctiveFeatures: ['front basket', 'ring lock'], confidence: 0.9 }],
  ['found', 'Found near Perlan, green Cannondale Topstone, gravel bike, scratch on left crank.', { bikeType: 'gravel', brand: 'Cannondale', model: 'Topstone', frameColor: 'dark_green', handlebarType: 'drop', accessories: ['bottle_cage'], distinctiveFeatures: ['scratch left crank arm'], confidence: 0.8 }],
  ['found', 'Fannst í Vogahverfi. Svart Electra Townie, breitt stýri, hvítur hnakkur.', { bikeType: 'cruiser', brand: 'Electra', model: 'Townie', frameColor: 'black', handlebarType: 'swept', saddleColor: 'White', accessories: ['fenders', 'bell'], distinctiveFeatures: ['white saddle', 'cream tyres'], confidence: 0.8 }],
  ['stolen', 'Stolið í Kópavogi. Orbea Onna, rautt fjallahjól, með límmiða "Jón" á sætispósti.', { bikeType: 'mountain', brand: 'Orbea', model: 'Onna', frameColor: 'red', accessories: ['suspension_fork'], distinctiveFeatures: ['name sticker jon on seatpost'], confidence: 0.85 }],
  ['found', 'Bleikt hjól fannst í Norðlingaholti. Liv Rove.', { bikeType: 'hybrid', brand: 'Liv', model: 'Rove', frameColor: 'pink', accessories: ['kickstand'], distinctiveFeatures: [], confidence: 0.7 }],
  ['found', 'Found: BMX, chrome, Mongoose, near Egilshöll.', { bikeType: 'bmx', brand: 'Mongoose', frameColor: 'chrome', accessories: [], distinctiveFeatures: ['pegs on rear axle'], confidence: 0.75 }],
  ['stolen', 'Stolið á Akureyri (já ég veit, ekki Rvk): Scott Aspect 950 svart með rauðum. Framdempari, nagladekk.', { bikeType: 'mountain', brand: 'Scott', model: 'Aspect 950', frameColor: 'black', secondaryColors: ['red'], accessories: ['suspension_fork', 'studded_tires'], distinctiveFeatures: ['red fork decals'], confidence: 0.85 }],
  ['found', 'Fannst í Hafnarfirði. Brúnt/tan hjól, Crescent, með dynamo ljósum og körfu.', { bikeType: 'hybrid', brand: 'Crescent', frameColor: 'brown', accessories: ['dynamo_light', 'basket', 'fenders', 'rear_rack'], distinctiveFeatures: ['leather grips'], confidence: 0.7 }],
  ['found', 'Found by the Reykjavík swimming pool: dark red Trek Dual Sport, rear light, kickstand.', { bikeType: 'hybrid', brand: 'Trek', model: 'Dual Sport', frameColor: 'dark_red', accessories: ['rear_light', 'kickstand'], distinctiveFeatures: ['torn saddle'], confidence: 0.8 }],
  ['stolen', 'Stolið í Breiðholti: Giant Escape 3, svart, með lásnum enn á (keðjulás, gulur).', { bikeType: 'hybrid', brand: 'Giant', model: 'Escape 3', frameColor: 'black', accessories: ['lock_attached', 'rear_rack'], lockType: 'chain', distinctiveFeatures: ['yellow chain lock', 'sticker on seat tube'], confidence: 0.85 }],
  ['found', 'Fundið: gullið/kopar hjól með drop stýri við Grandagarð. Óþekkt merki.', { bikeType: 'road', brand: null, frameColor: 'gold', handlebarType: 'drop', accessories: [], distinctiveFeatures: ['copper paint', 'white bar tape'], gripColor: 'White', confidence: 0.6 }],
  ['found', 'Found a Riese & Müller Load cargo bike abandoned in Grafarholt — grey, rain cover.', { bikeType: 'cargo', brand: 'Riese & Müller', model: 'Load 75', frameColor: 'silver', accessories: ['child_seat', 'front_light', 'rear_light', 'fenders'], distinctiveFeatures: ['rain canopy', 'scuffed cargo box'], confidence: 0.9 }],
  ['stolen', 'Stolið: Cube Nuroad, grátt gravel hjól, með Garmin og tveimur flöskustatífum.', { bikeType: 'gravel', brand: 'Cube', model: 'Nuroad', frameColor: 'silver', handlebarType: 'drop', accessories: ['computer', 'bottle_cage'], distinctiveFeatures: ['two bottle cages', 'garmin mount'], confidence: 0.85 }],
  ['found', 'Fannst í Laugarnesi. Dökkblátt DBS hjól, bretti, bögglaberi, standari, bjalla.', { bikeType: 'hybrid', brand: 'DBS', frameColor: 'dark_blue', accessories: ['fenders', 'rear_rack', 'kickstand', 'bell'], distinctiveFeatures: [], confidence: 0.7 }],
  ['found', 'Found: white Cube Kathmandu e-bike with child seat, Smáralind.', { bikeType: 'ebike', brand: 'Cube', model: 'Kathmandu', frameColor: 'white', accessories: ['child_seat', 'rear_rack', 'fenders', 'front_light', 'rear_light'], distinctiveFeatures: ['thule child seat'], confidence: 0.85 }],
  ['stolen', 'Stolið í Vesturbæ: Trek Checkpoint, hvítt, rispur á neðra röri, svart stýrisborði.', { bikeType: 'gravel', brand: 'Trek', model: 'Checkpoint', frameColor: 'white', handlebarType: 'drop', gripColor: 'Black', accessories: ['bottle_cage'], distinctiveFeatures: ['scratches downtube'], confidence: 0.85 }],
  ['found', 'Fannst við Ráðhúsið. Grænt Woom 5 barnahjól.', { bikeType: 'kids', brand: 'Woom', model: 'Woom 5', frameColor: 'green', accessories: ['kickstand'], distinctiveFeatures: [], confidence: 0.8 }],
];

async function main() {
  const c = await pool.connect();
  try {
    const { rows: [{ n: catalogCount }] } = await c.query('select count(*)::int as n from catalog_bikes');
    if (catalogCount === 0) {
      let inserted = 0;
      for (const [brand, model, year, type, colors, sizes, shop] of CATALOG) {
        for (const color of colors) {
          await c.query(
            `insert into catalog_bikes (brand, model, year, bike_type, color_name, frame_color, sizes, shop, source_url, image_url)
             values ($1,$2,$3,$4,$5,$6,$7,$8,'','')`,
            [brand, model, year, type, color, normColor(color), JSON.stringify(sizes), shop],
          );
          inserted++;
        }
      }
      console.log(`catalog: inserted ${inserted} rows`);
    } else console.log(`catalog: ${catalogCount} rows already present, skipping`);

    const { rows: [{ n: demoCount }] } = await c.query('select count(*)::int as n from dataset_images where is_demo');
    const { rows: [{ n: realCount }] } = await c.query('select count(*)::int as n from dataset_images where not is_demo');
    if (demoCount === 0 && realCount === 0) {
      let i = 0;
      for (const [kind, text, analysis] of DEMO) {
        const daysAgo = 1 + (i * 7) % 120;
        const searchText = [analysis.bikeType, analysis.brand, analysis.model, analysis.frameColor, ...(analysis.secondaryColors || []), analysis.handlebarType, ...(analysis.accessories || []), analysis.lockType, analysis.saddleColor, analysis.gripColor, ...(analysis.distinctiveFeatures || []), text].filter(Boolean).join(' ').toLowerCase();
        await c.query(
          `insert into dataset_images (external_id, image_url, post_url, post_text, posted_at, post_kind, analysis, search_text, is_demo)
           values ($1,$2,$3,$4, now() - ($5 || ' days')::interval, $6, $7, $8, true) on conflict (external_id) do nothing`,
          [`demo-${i}`, IMGS[i % IMGS.length], 'https://www.facebook.com/groups/hjoladot', text, String(daysAgo), kind, JSON.stringify(analysis), searchText],
        );
        i++;
      }
      console.log(`dataset: inserted ${i} demo rows`);
    } else console.log(`dataset: ${demoCount} demo + ${realCount} real rows present, skipping`);
  } finally {
    c.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
