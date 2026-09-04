/**
 * SINGLE SOURCE OF TRUTH for every controlled vocabulary in the system.
 * - The victim's form uses these ids.
 * - The vision-agent prompt (scripts/analyze-images.mjs) is generated FROM these.
 * - The matching engine compares ids, not prose.
 */

export const BIKE_TYPES = [
  { id: 'road', label: 'Road', is: 'Racer / götuhjól', icon: '🚴', desc: 'Drop bars, lightweight, fast pavement' },
  { id: 'mountain', label: 'Mountain', is: 'Fjallahjól', icon: '🚵', desc: 'Knobby tires, suspension, off-road' },
  { id: 'gravel', label: 'Gravel', is: 'Malarhjól', icon: '🛤️', desc: 'Drop bars, wider tires, mixed terrain' },
  { id: 'hybrid', label: 'Hybrid / City', is: 'Borgarhjól', icon: '🚲', desc: 'Flat bars, upright, commuter' },
  { id: 'ebike', label: 'E-Bike', is: 'Rafhjól', icon: '⚡', desc: 'Electric assist motor' },
  { id: 'cargo', label: 'Cargo', is: 'Flutningahjól', icon: '📦', desc: 'Long-tail or front-loader' },
  { id: 'kids', label: "Kids'", is: 'Barnahjól', icon: '🎠', desc: 'Child-sized frame' },
  { id: 'folding', label: 'Folding', is: 'Samanbrjótanlegt', icon: '🔀', desc: 'Compact, foldable frame' },
  { id: 'cruiser', label: 'Cruiser', is: 'Cruiser', icon: '🏖️', desc: 'Upright, comfortable, relaxed' },
  { id: 'fixie', label: 'Fixed / Single Speed', is: 'Fixie', icon: '⚙️', desc: 'No gears, minimal' },
  { id: 'bmx', label: 'BMX', is: 'BMX', icon: '🤸', desc: 'Small, trick-oriented' },
  { id: 'unknown', label: 'Not Sure', is: 'Veit ekki', icon: '❓', desc: "I'm not certain of the type" },
] as const;

export const FALLBACK_BRANDS = [
  'Trek', 'Specialized', 'Giant', 'Liv', 'Cannondale', 'Scott', 'Cube', 'Orbea', 'Kona', 'Merida',
  'Focus', 'Bianchi', 'BMC', 'Cervélo', 'Marin', 'Norco', 'Rocky Mountain', 'Santa Cruz',
  'Brompton', 'Tern', 'Riese & Müller', 'Gazelle', 'Batavus', 'Raleigh', 'GT', 'Fuji', 'Surly',
  'Salsa', 'Canyon', 'Electra', 'Winora', 'Haibike', 'Kalkhoff', 'Cannondale', 'Mongoose', 'Diamondback',
  'Nishiki', 'DBS', 'Crescent', 'Monark', 'Puky', 'Woom', 'Frog', 'Fischer', 'Bergamont', 'Ghost',
  'Lapierre', 'Wilier', 'Pinarello', 'Colnago', 'Ridley', 'Felt', 'Polygon', 'Kellys', 'Devinci',
];

export const FRAME_COLORS = [
  { id: 'black', label: 'Black', hex: '#1a1a1a' },
  { id: 'matte_black', label: 'Matte Black', hex: '#2b2b2b' },
  { id: 'white', label: 'White', hex: '#f5f5f5' },
  { id: 'silver', label: 'Silver / Grey', hex: '#9e9e9e' },
  { id: 'red', label: 'Red', hex: '#e53935' },
  { id: 'dark_red', label: 'Dark Red / Burgundy', hex: '#7f1d1d' },
  { id: 'orange', label: 'Orange', hex: '#fb8c00' },
  { id: 'yellow', label: 'Yellow', hex: '#fdd835' },
  { id: 'green', label: 'Green', hex: '#43a047' },
  { id: 'dark_green', label: 'Dark Green / Olive', hex: '#2e5b32' },
  { id: 'teal', label: 'Teal / Turquoise', hex: '#00897b' },
  { id: 'blue', label: 'Blue', hex: '#1e88e5' },
  { id: 'dark_blue', label: 'Dark Blue / Navy', hex: '#1a237e' },
  { id: 'purple', label: 'Purple', hex: '#8e24aa' },
  { id: 'pink', label: 'Pink', hex: '#e91e63' },
  { id: 'brown', label: 'Brown / Tan', hex: '#795548' },
  { id: 'gold', label: 'Gold / Copper', hex: '#d4ac0d' },
  { id: 'chrome', label: 'Chrome / Polished', hex: '#b0bec5' },
  { id: 'custom', label: 'Custom / Multi-color', hex: 'gradient' },
] as const;

/** Maps shop colorway words (EN + IS) to FRAME_COLORS ids. Used by the harvester. */
export const COLOR_SYNONYMS: Record<string, string> = {
  black: 'black', svart: 'black', svartur: 'black', matte: 'matte_black', 'matt black': 'matte_black',
  white: 'white', hvítt: 'white', hvítur: 'white', silver: 'silver', grey: 'silver', gray: 'silver',
  grátt: 'silver', grár: 'silver', red: 'red', rautt: 'red', rauður: 'red', burgundy: 'dark_red',
  maroon: 'dark_red', vínrautt: 'dark_red', orange: 'orange', appelsínugult: 'orange',
  yellow: 'yellow', gult: 'yellow', gulur: 'yellow', green: 'green', grænt: 'green', grænn: 'green',
  olive: 'dark_green', 'dark green': 'dark_green', dökkgrænt: 'dark_green', teal: 'teal',
  turquoise: 'teal', aqua: 'teal', blue: 'blue', blátt: 'blue', blár: 'blue', navy: 'dark_blue',
  'dark blue': 'dark_blue', dökkblátt: 'dark_blue', purple: 'purple', fjólublátt: 'purple',
  lilac: 'purple', pink: 'pink', bleikt: 'pink', bleikur: 'pink', brown: 'brown', tan: 'brown',
  brúnt: 'brown', gold: 'gold', copper: 'gold', bronze: 'gold', chrome: 'chrome', raw: 'chrome',
};

export const FRAME_SIZES = [
  { id: 'xs', label: 'XS / 44–47cm' },
  { id: 's', label: 'S / 48–51cm' },
  { id: 'm', label: 'M / 52–55cm' },
  { id: 'l', label: 'L / 56–59cm' },
  { id: 'xl', label: 'XL / 60–63cm' },
  { id: 'xxl', label: 'XXL / 64cm+' },
  { id: 'unknown', label: "Don't know" },
] as const;

export const ACCESSORIES = [
  { id: 'bell', label: 'Bell / Horn', icon: '🔔', category: 'handlebar' },
  { id: 'front_light', label: 'Front Light', icon: '💡', category: 'lights' },
  { id: 'rear_light', label: 'Rear Light', icon: '🔴', category: 'lights' },
  { id: 'dynamo_light', label: 'Dynamo Lights', icon: '⚡', category: 'lights' },
  { id: 'computer', label: 'Bike Computer / GPS', icon: '📱', category: 'electronics' },
  { id: 'phone_mount', label: 'Phone Mount', icon: '📲', category: 'electronics' },
  { id: 'rear_rack', label: 'Rear Rack', icon: '📦', category: 'carrying' },
  { id: 'front_rack', label: 'Front Rack', icon: '🧳', category: 'carrying' },
  { id: 'pannier', label: 'Panniers / Bags', icon: '👜', category: 'carrying' },
  { id: 'basket', label: 'Basket', icon: '🧺', category: 'carrying' },
  { id: 'child_seat', label: 'Child Seat', icon: '👶', category: 'carrying' },
  { id: 'trailer', label: 'Trailer Hitch', icon: '🚛', category: 'carrying' },
  { id: 'fenders', label: 'Fenders / Mudguards', icon: '🛡️', category: 'weather' },
  { id: 'studded_tires', label: 'Studded Winter Tires', icon: '❄️', category: 'weather' },
  { id: 'kickstand', label: 'Kickstand', icon: '🦵', category: 'utility' },
  { id: 'bottle_cage', label: 'Bottle Cage', icon: '🧴', category: 'utility' },
  { id: 'mirror', label: 'Mirror', icon: '🪞', category: 'safety' },
  { id: 'lock_attached', label: 'Lock Still On It', icon: '🔒', category: 'security' },
  { id: 'suspension_fork', label: 'Suspension Fork', icon: '🔩', category: 'parts' },
  { id: 'aftermarket_wheels', label: 'Aftermarket Wheels', icon: '⭕', category: 'parts' },
  { id: 'clipless_pedals', label: 'Clipless Pedals', icon: '👟', category: 'parts' },
] as const;

export const ACCESSORY_CATEGORIES = [
  { id: 'lights', label: '💡 Lights' },
  { id: 'handlebar', label: '🔔 Handlebar' },
  { id: 'electronics', label: '📱 Electronics' },
  { id: 'carrying', label: '📦 Carrying' },
  { id: 'weather', label: '🛡️ Weather' },
  { id: 'utility', label: '🔧 Utility' },
  { id: 'safety', label: '🪞 Safety' },
  { id: 'security', label: '🔒 Security' },
  { id: 'parts', label: '🔩 Unusual parts' },
] as const;

export const LOCK_TYPES = [
  { id: 'u_lock', label: 'U-Lock / D-Lock' },
  { id: 'chain', label: 'Chain Lock' },
  { id: 'cable', label: 'Cable Lock' },
  { id: 'folding', label: 'Folding Lock' },
  { id: 'wheel_lock', label: 'Wheel / Frame Lock (built-in)' },
] as const;

export const HANDLEBAR_TYPES = [
  { id: 'flat', label: 'Flat Bar' },
  { id: 'drop', label: 'Drop Bar (road style)' },
  { id: 'riser', label: 'Riser Bar (mountain)' },
  { id: 'swept', label: 'Swept-back / Cruiser' },
  { id: 'bullhorn', label: 'Bullhorn' },
  { id: 'butterfly', label: 'Butterfly / Touring' },
] as const;

export const SADDLE_COLORS = ['Black', 'Brown / Tan', 'White', 'Red', 'Blue', 'Green', 'Grey', 'Other'] as const;
export const GRIP_COLORS = ['Black', 'Brown', 'Tan / Cork', 'White', 'Red', 'Blue', 'Green', 'Orange', 'Grey', 'Multi-color'] as const;

/** The profile the configurator builds. Files are kept client-side only. */
export interface BikeProfile {
  bikeType: string;
  brand: string;
  model: string;
  year: string;
  frameColor: string;
  frameColorHex: string;
  secondaryColor: string;
  frameSize: string;
  handlebarType: string;
  serialNumber: string;
  serialPhotoName: string;
  stickersDecals: string;
  damage: string;
  damageSpots: { x: number; y: number; note: string }[];
  accessories: string[];
  lockType: string;
  lockColor: string;
  saddleColor: string;
  gripColor: string;
  ownerName: string;
  contactEmail: string;
  contactPhone: string;
  theftDate: string;
  theftLocation: string;
  additionalNotes: string;
  photoCount: number;
}

export const defaultProfile: BikeProfile = {
  bikeType: '', brand: '', model: '', year: '', frameColor: '', frameColorHex: '', secondaryColor: '',
  frameSize: '', handlebarType: '', serialNumber: '', serialPhotoName: '', stickersDecals: '', damage: '',
  damageSpots: [], accessories: [], lockType: '', lockColor: '', saddleColor: '', gripColor: '',
  ownerName: '', contactEmail: '', contactPhone: '', theftDate: '', theftLocation: '', additionalNotes: '',
  photoCount: 0,
};

/** Normalize a free-text color word to a FRAME_COLORS id (or ''). */
export function normalizeColor(input: string): string {
  const s = (input || '').toLowerCase().trim();
  if (!s) return '';
  if (FRAME_COLORS.some((c) => c.id === s)) return s;
  // longest synonym first so "dark blue" beats "blue"
  const keys = Object.keys(COLOR_SYNONYMS).sort((a, b) => b.length - a.length);
  for (const k of keys) if (s.includes(k)) return COLOR_SYNONYMS[k];
  return '';
}

/** Guess a bike type from a product title / category string (EN + IS). */
export function guessBikeType(text: string): string {
  const s = (text || '').toLowerCase();
  const rules: [RegExp, string][] = [
    [/\b(e-?bike|electric|rafhjól|rafmagns|e-?mtb|pedelec|bosch|shimano steps)\b/, 'ebike'],
    [/\b(cargo|flutninga|longtail|long-tail|bakfiets)\b/, 'cargo'],
    [/\b(kids?|barna|børn|children|junior|20"|24"|16"|balance)\b/, 'kids'],
    [/\b(folding|samanbrjót|brompton|tern link)\b/, 'folding'],
    [/\b(gravel|malar|allroad|all-road|cyclocross|cx)\b/, 'gravel'],
    [/\b(mtb|mountain|fjalla|trail|enduro|hardtail|full.?suspension|downhill)\b/, 'mountain'],
    [/\b(road|racer|götu|aero|endurance|triathlon|tt)\b/, 'road'],
    [/\b(bmx)\b/, 'bmx'],
    [/\b(fixie|fixed|single.?speed)\b/, 'fixie'],
    [/\b(cruiser|beach)\b/, 'cruiser'],
    [/\b(hybrid|city|borgar|urban|commut|fitness|trekking|touring|dutch)\b/, 'hybrid'],
  ];
  for (const [re, id] of rules) if (re.test(s)) return id;
  return 'unknown';
}
