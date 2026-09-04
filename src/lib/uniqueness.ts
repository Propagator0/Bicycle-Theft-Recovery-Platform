import type { BikeProfile } from './vocabulary';

export interface ScoreBreakdown {
  total: number;
  max: number;
  percentage: number;
  level: 'weak' | 'fair' | 'good' | 'strong' | 'exceptional';
  label: string;
  color: string;
  items: { label: string; points: number; earned: boolean }[];
}

export function calcUniqueness(profile: BikeProfile): ScoreBreakdown {
  const items: { label: string; points: number; earned: boolean }[] = [
    { label: 'Bike type selected', points: 3, earned: !!profile.bikeType && profile.bikeType !== 'unknown' },
    { label: 'Brand identified', points: 5, earned: !!profile.brand && profile.brand !== 'Unknown / Custom' },
    { label: 'Model specified', points: 6, earned: !!profile.model },
    { label: 'Year known', points: 3, earned: !!profile.year },
    { label: 'Frame color set', points: 5, earned: !!profile.frameColor },
    { label: 'Secondary color noted', points: 3, earned: !!profile.secondaryColor },
    { label: 'Frame size recorded', points: 2, earned: !!profile.frameSize && profile.frameSize !== 'unknown' },
    { label: 'Handlebar type noted', points: 2, earned: !!profile.handlebarType },
    { label: 'Serial number provided', points: 15, earned: profile.serialNumber.trim().length >= 5 },
    { label: 'Serial number photo', points: 6, earned: !!profile.serialPhotoName },
    { label: 'Stickers / decals described', points: 8, earned: profile.stickersDecals.trim().length > 5 },
    { label: 'Damage / scratches noted', points: 7, earned: profile.damage.trim().length > 5 },
    { label: 'Damage spots marked on diagram', points: 5, earned: profile.damageSpots.length > 0 },
    { label: 'Accessories listed (2+)', points: 4, earned: profile.accessories.length >= 2 },
    { label: 'Many accessories (5+)', points: 4, earned: profile.accessories.length >= 5 },
    { label: 'Lock type noted', points: 3, earned: !!profile.lockType },
    { label: 'Saddle color noted', points: 2, earned: !!profile.saddleColor },
    { label: 'Grip / bar tape color', points: 2, earned: !!profile.gripColor },
    { label: 'Theft location provided', points: 3, earned: !!profile.theftLocation },
    { label: 'Photos uploaded', points: 5, earned: profile.photoCount > 0 },
    { label: 'Multiple photos (3+)', points: 4, earned: profile.photoCount >= 3 },
  ];

  const total = items.filter((i) => i.earned).reduce((a, i) => a + i.points, 0);
  const max = items.reduce((a, i) => a + i.points, 0);
  const percentage = Math.round((total / max) * 100);

  let level: ScoreBreakdown['level'] = 'weak';
  let label = 'Very Low — Hard to identify';
  let color = '#ef4444';
  if (percentage >= 80) { level = 'exceptional'; label = 'Exceptional — Highly identifiable!'; color = '#10b981'; }
  else if (percentage >= 60) { level = 'strong'; label = 'Strong — Good recovery signal'; color = '#3b82f6'; }
  else if (percentage >= 40) { level = 'good'; label = 'Good — Getting distinctive'; color = '#8b5cf6'; }
  else if (percentage >= 20) { level = 'fair'; label = 'Fair — Keep adding details'; color = '#f59e0b'; }

  return { total, max, percentage, level, label, color, items };
}
