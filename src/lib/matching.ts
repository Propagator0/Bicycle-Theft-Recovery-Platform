import type { ImageAnalysis } from '@/db/schema';

/**
 * Attribute-weighted matcher. For every attribute the VICTIM supplied we add
 * its weight to `possible`; if the dataset image agrees we add it to `earned`.
 * Score = earned / possible, so a sparse profile isn't punished for missing
 * fields, but a rich profile that disagrees on many fields sinks fast.
 * Hard contradictions (different brand, clearly different color) subtract.
 */

export interface MatchInput {
  bikeType: string;
  brand: string;
  model: string;
  frameColor: string;
  secondaryColor: string;
  handlebarType: string;
  accessories: string[];
  lockType: string;
  saddleColor: string;
  gripColor: string;
  stickersDecals: string;
  damage: string;
  serialNumber: string;
}

export interface MatchReason {
  label: string;
  kind: 'hit' | 'miss' | 'conflict';
  points: number;
}

export interface MatchResult {
  score: number; // 0..100
  reasons: MatchReason[];
}

const W = {
  serial: 100,
  brand: 25,
  model: 20,
  bikeType: 15,
  frameColor: 20,
  secondaryColor: 6,
  handlebar: 6,
  accessory: 5, // each, capped
  accessoryCap: 25,
  lockType: 6,
  saddle: 4,
  grip: 4,
  feature: 6, // each distinctive-feature token overlap, capped
  featureCap: 18,
};

const STOP = new Set(['the', 'and', 'with', 'on', 'a', 'an', 'of', 'in', 'near', 'og', 'með', 'á', 'í', 'small', 'large', 'big']);

export function tokenize(s: string): string[] {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9áðéíóúýþæö\s-]/g, ' ')
    .split(/\s+/)
    .map((t) => t.replace(/-/g, ''))
    .filter((t) => t.length >= 3 && !STOP.has(t));
}

function norm(s?: string | null) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

const RELATED_TYPES: Record<string, string[]> = {
  road: ['gravel', 'fixie'],
  gravel: ['road', 'hybrid'],
  hybrid: ['gravel', 'ebike', 'cruiser'],
  ebike: ['hybrid', 'cargo'],
  mountain: ['ebike'],
  cruiser: ['hybrid'],
};

const RELATED_COLORS: Record<string, string[]> = {
  black: ['matte_black'], matte_black: ['black'], silver: ['chrome', 'white'], chrome: ['silver'],
  red: ['dark_red', 'orange'], dark_red: ['red', 'purple'], blue: ['dark_blue', 'teal'], dark_blue: ['blue', 'black'],
  green: ['dark_green', 'teal'], dark_green: ['green'], teal: ['blue', 'green'], gold: ['orange', 'brown'],
  brown: ['gold'], purple: ['dark_blue', 'pink'], pink: ['purple', 'red'], yellow: ['orange', 'gold'],
};

export function scoreMatch(v: MatchInput, a: ImageAnalysis, postText = ''): MatchResult {
  const reasons: MatchReason[] = [];
  let earned = 0;
  let possible = 0;

  // Serial number: instant near-certain match if it appears in the post or analysis
  const serial = norm(v.serialNumber);
  if (serial.length >= 5) {
    const hay = norm(postText) + norm(a.serialVisible || '') + norm(a.notes || '');
    if (hay.includes(serial)) {
      reasons.push({ label: 'Serial number appears in post', kind: 'hit', points: W.serial });
      return { score: 99, reasons };
    }
  }

  // Brand
  if (v.brand && v.brand !== 'Unknown / Custom') {
    possible += W.brand;
    const vb = norm(v.brand);
    const ab = norm(a.brand);
    const inText = vb.length >= 3 && norm(postText).includes(vb);
    if ((ab && (ab === vb || ab.includes(vb) || vb.includes(ab))) || inText) {
      earned += W.brand;
      reasons.push({ label: `Brand: ${v.brand}`, kind: 'hit', points: W.brand });
    } else if (ab && ab !== 'unknown') {
      earned -= W.brand * 0.6;
      reasons.push({ label: `Brand conflict (${a.brand})`, kind: 'conflict', points: -Math.round(W.brand * 0.6) });
    } else {
      reasons.push({ label: 'Brand not visible in image', kind: 'miss', points: 0 });
    }
  }

  // Model
  if (v.model) {
    possible += W.model;
    const vm = norm(v.model);
    const hay = norm(a.model) + ' ' + norm(postText);
    if (vm.length >= 2 && hay.includes(vm)) {
      earned += W.model;
      reasons.push({ label: `Model: ${v.model}`, kind: 'hit', points: W.model });
    } else {
      reasons.push({ label: 'Model not confirmed', kind: 'miss', points: 0 });
    }
  }

  // Bike type
  if (v.bikeType && v.bikeType !== 'unknown') {
    possible += W.bikeType;
    if (a.bikeType === v.bikeType) {
      earned += W.bikeType;
      reasons.push({ label: `Type: ${v.bikeType}`, kind: 'hit', points: W.bikeType });
    } else if (a.bikeType && RELATED_TYPES[v.bikeType]?.includes(a.bikeType)) {
      earned += W.bikeType * 0.5;
      reasons.push({ label: `Similar type (${a.bikeType})`, kind: 'hit', points: Math.round(W.bikeType * 0.5) });
    } else if (a.bikeType && a.bikeType !== 'unknown') {
      earned -= W.bikeType * 0.5;
      reasons.push({ label: `Type conflict (${a.bikeType})`, kind: 'conflict', points: -Math.round(W.bikeType * 0.5) });
    }
  }

  // Frame color
  if (v.frameColor && v.frameColor !== 'custom') {
    possible += W.frameColor;
    const ac = a.frameColor || '';
    if (ac === v.frameColor) {
      earned += W.frameColor;
      reasons.push({ label: `Color: ${v.frameColor}`, kind: 'hit', points: W.frameColor });
    } else if (RELATED_COLORS[v.frameColor]?.includes(ac) || (a.secondaryColors || []).includes(v.frameColor)) {
      earned += W.frameColor * 0.5;
      reasons.push({ label: `Similar color (${ac})`, kind: 'hit', points: Math.round(W.frameColor * 0.5) });
    } else if (ac) {
      earned -= W.frameColor * 0.5;
      reasons.push({ label: `Color conflict (${ac})`, kind: 'conflict', points: -Math.round(W.frameColor * 0.5) });
    }
  }

  // Secondary color text -> ids
  if (v.secondaryColor) {
    possible += W.secondaryColor;
    const toks = tokenize(v.secondaryColor);
    const secondary = (a.secondaryColors || []).map((c) => c.replace('_', ' '));
    const hit = toks.some((t) => secondary.some((c) => c.includes(t)) || (a.frameColor || '').includes(t));
    if (hit) {
      earned += W.secondaryColor;
      reasons.push({ label: 'Accent color matches', kind: 'hit', points: W.secondaryColor });
    }
  }

  // Handlebar
  if (v.handlebarType) {
    possible += W.handlebar;
    if (a.handlebarType === v.handlebarType) {
      earned += W.handlebar;
      reasons.push({ label: `Handlebar: ${v.handlebarType}`, kind: 'hit', points: W.handlebar });
    } else if (a.handlebarType) {
      earned -= W.handlebar * 0.5;
      reasons.push({ label: `Handlebar differs (${a.handlebarType})`, kind: 'conflict', points: -Math.round(W.handlebar * 0.5) });
    }
  }

  // Accessories
  if (v.accessories.length) {
    const cap = Math.min(v.accessories.length * W.accessory, W.accessoryCap);
    possible += cap;
    const aAcc = new Set(a.accessories || []);
    const hits = v.accessories.filter((x) => aAcc.has(x));
    const pts = Math.min(hits.length * W.accessory, cap);
    earned += pts;
    if (hits.length) reasons.push({ label: `Accessories: ${hits.map((h) => h.replace(/_/g, ' ')).join(', ')}`, kind: 'hit', points: pts });
    else reasons.push({ label: 'No accessory overlap', kind: 'miss', points: 0 });
  }

  // Lock
  if (v.lockType) {
    possible += W.lockType;
    if (a.lockType === v.lockType) {
      earned += W.lockType;
      reasons.push({ label: `Lock: ${v.lockType}`, kind: 'hit', points: W.lockType });
    }
  }

  // Saddle / grips
  if (v.saddleColor) {
    possible += W.saddle;
    if (norm(a.saddleColor) && norm(v.saddleColor).startsWith(norm(a.saddleColor).slice(0, 4))) {
      earned += W.saddle;
      reasons.push({ label: `Saddle: ${v.saddleColor}`, kind: 'hit', points: W.saddle });
    }
  }
  if (v.gripColor) {
    possible += W.grip;
    if (norm(a.gripColor) && norm(v.gripColor).startsWith(norm(a.gripColor).slice(0, 4))) {
      earned += W.grip;
      reasons.push({ label: `Grips: ${v.gripColor}`, kind: 'hit', points: W.grip });
    }
  }

  // Distinctive features: stickers / damage tokens vs analysis features + post text
  const featureText = `${v.stickersDecals} ${v.damage}`.trim();
  if (featureText.length > 3) {
    const toks = new Set(tokenize(featureText));
    const hay = tokenize(`${(a.distinctiveFeatures || []).join(' ')} ${a.notes || ''} ${postText}`);
    const overlap = [...new Set(hay.filter((t) => toks.has(t)))];
    const cap = Math.min(Math.max(toks.size, 1) * W.feature, W.featureCap);
    possible += cap;
    const pts = Math.min(overlap.length * W.feature, cap);
    earned += pts;
    if (overlap.length) reasons.push({ label: `Distinctive: ${overlap.slice(0, 4).join(', ')}`, kind: 'hit', points: pts });
  }

  if (possible === 0) return { score: 0, reasons };
  const raw = Math.max(0, earned) / possible;
  // small bonus for model-confidence of the vision agent
  const conf = typeof a.confidence === 'number' ? 0.85 + 0.15 * a.confidence : 1;
  const score = Math.round(Math.min(98, raw * 100 * conf));
  return { score, reasons };
}

export function confidenceLabel(score: number) {
  if (score >= 70) return { label: 'Strong match', color: '#10b981' };
  if (score >= 50) return { label: 'Possible match', color: '#3b82f6' };
  if (score >= 30) return { label: 'Weak match', color: '#f59e0b' };
  return { label: 'Unlikely', color: '#9ca3af' };
}
