'use client';
import { FRAME_COLORS, type BikeProfile } from '@/lib/vocabulary';

interface Props {
  profile: BikeProfile;
  compact?: boolean;
}

const SADDLE: Record<string, string> = { 'Brown / Tan': '#795548', White: '#eee', Red: '#e53935', Blue: '#1e88e5', Green: '#43a047', Grey: '#9e9e9e' };
const GRIP: Record<string, string> = { Brown: '#6d4c41', 'Tan / Cork': '#c8a27a', White: '#eee', Red: '#e53935', Blue: '#1e88e5', Green: '#43a047', Orange: '#fb8c00', Grey: '#9e9e9e', 'Multi-color': '#a855f7' };

export default function BikeVisual({ profile, compact }: Props) {
  const colorObj = FRAME_COLORS.find((c) => c.id === profile.frameColor);
  const frameColor = profile.frameColor === 'custom' && profile.frameColorHex.startsWith('#')
    ? profile.frameColorHex
    : colorObj && colorObj.hex !== 'gradient' ? colorObj.hex : profile.frameColor ? '#818cf8' : '#cbd5e1';

  const has = (id: string) => profile.accessories.includes(id);
  const isDrop = profile.handlebarType === 'drop' || (!profile.handlebarType && (profile.bikeType === 'road' || profile.bikeType === 'gravel'));
  const isMTB = profile.bikeType === 'mountain' || has('suspension_fork');
  const isKids = profile.bikeType === 'kids' || profile.bikeType === 'folding' || profile.bikeType === 'bmx';
  const isCargo = profile.bikeType === 'cargo';
  const isE = profile.bikeType === 'ebike';
  const wheelR = isKids ? 28 : isMTB ? 42 : 38;
  const saddle = SADDLE[profile.saddleColor] || '#222';
  const grip = GRIP[profile.gripColor] || '#444';
  const lockColor = /red|rau/i.test(profile.lockColor) ? '#ef4444' : /yellow|gul/i.test(profile.lockColor) ? '#f59e0b' : /blue|blá/i.test(profile.lockColor) ? '#3b82f6' : '#f59e0b';

  return (
    <div className={`relative w-full flex items-center justify-center ${compact ? 'py-1' : 'py-4'}`}>
      <svg viewBox="0 0 340 200" className="w-full max-w-sm" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.10))' }}>
        {/* Wheels */}
        {[80, 260].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy={150} r={wheelR} fill="none" stroke="#2d2d2d" strokeWidth={isMTB ? 8 : 6} />
            {has('studded_tires') && <circle cx={cx} cy={150} r={wheelR} fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="2 4" />}
            <circle cx={cx} cy={150} r={wheelR - 8} fill="none" stroke={has('aftermarket_wheels') ? '#a855f7' : '#555'} strokeWidth={has('aftermarket_wheels') ? 3 : 1.5} />
            <circle cx={cx} cy={150} r="5" fill="#333" />
            {[0, 30, 60, 90, 120, 150].map((a) => (
              <line key={a} x1={cx + Math.cos((a * Math.PI) / 180) * 5} y1={150 + Math.sin((a * Math.PI) / 180) * 5}
                x2={cx + Math.cos((a * Math.PI) / 180) * (wheelR - 9)} y2={150 + Math.sin((a * Math.PI) / 180) * (wheelR - 9)}
                stroke="#888" strokeWidth="1" />
            ))}
            {[0, 30, 60, 90, 120, 150].map((a) => (
              <line key={`b${a}`} x1={cx - Math.cos((a * Math.PI) / 180) * 5} y1={150 - Math.sin((a * Math.PI) / 180) * 5}
                x2={cx - Math.cos((a * Math.PI) / 180) * (wheelR - 9)} y2={150 - Math.sin((a * Math.PI) / 180) * (wheelR - 9)}
                stroke="#888" strokeWidth="1" />
            ))}
          </g>
        ))}

        {has('fenders') && (
          <>
            <path d={`M ${80 - wheelR + 6} 120 A ${wheelR + 3} ${wheelR + 3} 0 0 1 ${80 + wheelR - 6} 120`} fill="none" stroke={frameColor} strokeWidth="5" strokeLinecap="round" />
            <path d={`M ${260 - wheelR + 6} 120 A ${wheelR + 3} ${wheelR + 3} 0 0 1 ${260 + wheelR - 6} 120`} fill="none" stroke={frameColor} strokeWidth="5" strokeLinecap="round" />
          </>
        )}

        {/* Frame */}
        <line x1="80" y1="150" x2="200" y2="138" stroke={frameColor} strokeWidth="5" strokeLinecap="round" />
        <line x1="80" y1="150" x2="200" y2="80" stroke={frameColor} strokeWidth="4" strokeLinecap="round" />
        <line x1="260" y1="150" x2="175" y2="68" stroke={frameColor} strokeWidth={isE ? 10 : 6} strokeLinecap="round" />
        <line x1="200" y1="80" x2="175" y2="68" stroke={frameColor} strokeWidth="5" strokeLinecap="round" />
        <line x1="200" y1="138" x2="200" y2="78" stroke={frameColor} strokeWidth="6" strokeLinecap="round" />
        {isCargo && <rect x="20" y="118" width="60" height="22" rx="4" fill="none" stroke={frameColor} strokeWidth="4" />}
        {isMTB ? (
          <>
            <line x1="175" y1="68" x2="200" y2="96" stroke={frameColor} strokeWidth="5" strokeLinecap="round" />
            <line x1="200" y1="96" x2="260" y2="150" stroke="#9ca3af" strokeWidth="7" strokeLinecap="round" />
            <line x1="203" y1="99" x2="230" y2="123" stroke="#374151" strokeWidth="9" strokeLinecap="round" />
          </>
        ) : (
          <line x1="175" y1="68" x2="260" y2="150" stroke={frameColor} strokeWidth="5" strokeLinecap="round" />
        )}
        {isE && <rect x="204" y="96" width="14" height="30" rx="3" fill="#111827" transform="rotate(-44 211 111)" />}
        {isE && <circle cx="200" cy="138" r="12" fill="#111827" />}

        <circle cx="200" cy="138" r="8" fill={frameColor} />
        <line x1="200" y1="138" x2="216" y2="148" stroke="#555" strokeWidth="3" />
        <line x1="200" y1="138" x2="184" y2="128" stroke="#555" strokeWidth="3" />
        <rect x="213" y="146" width="10" height="4" rx="1" fill={has('clipless_pedals') ? '#dc2626' : '#333'} />
        <rect x="181" y="126" width="10" height="4" rx="1" fill={has('clipless_pedals') ? '#dc2626' : '#333'} />
        {has('kickstand') && <line x1="196" y1="142" x2="190" y2="172" stroke="#666" strokeWidth="3" strokeLinecap="round" />}

        {/* Saddle */}
        <line x1="200" y1="80" x2="200" y2="62" stroke="#444" strokeWidth="4" />
        <path d="M 186 60 Q 200 54 214 60" fill="none" stroke={saddle} strokeWidth="5" strokeLinecap="round" />

        {/* Bars */}
        <line x1="175" y1="68" x2="175" y2="52" stroke="#444" strokeWidth="4" />
        {isDrop ? (
          <path d="M 162 52 Q 175 46 188 52 Q 190 60 185 62" fill="none" stroke={grip} strokeWidth="4" strokeLinecap="round" />
        ) : profile.handlebarType === 'swept' ? (
          <path d="M 190 52 Q 175 48 160 56" fill="none" stroke={grip} strokeWidth="5" strokeLinecap="round" />
        ) : (
          <line x1="162" y1={profile.handlebarType === 'riser' ? 48 : 52} x2="188" y2="52" stroke={grip} strokeWidth="5" strokeLinecap="round" />
        )}

        {has('bell') && <ellipse cx="163" cy="52" rx="4" ry="5" fill="#f59e0b" />}
        {has('mirror') && <circle cx="158" cy="44" r="4" fill="#bfdbfe" stroke="#64748b" strokeWidth="1" />}
        {(has('front_light') || has('dynamo_light')) && <ellipse cx="274" cy="125" rx="6" ry="4" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />}
        {(has('rear_light') || has('dynamo_light')) && <ellipse cx="66" cy="125" rx="5" ry="4" fill="#fca5a5" stroke="#dc2626" strokeWidth="1" />}
        {has('rear_rack') && (
          <>
            <line x1="185" y1="72" x2="80" y2="118" stroke="#777" strokeWidth="3" strokeLinecap="round" />
            <line x1="185" y1="72" x2="185" y2="65" stroke="#777" strokeWidth="2" />
            <line x1="80" y1="118" x2="190" y2="68" stroke="#999" strokeWidth="1.5" strokeDasharray="3 2" />
          </>
        )}
        {has('pannier') && <rect x="60" y="112" width="26" height="22" rx="3" fill="#374151" />}
        {has('child_seat') && <path d="M 90 110 L 90 90 Q 100 84 110 90 L 110 108 Z" fill="#6b7280" />}
        {has('front_rack') && <line x1="250" y1="112" x2="290" y2="112" stroke="#777" strokeWidth="3" strokeLinecap="round" />}
        {has('basket') && <rect x="180" y="42" width="22" height="14" rx="2" fill="none" stroke="#a16207" strokeWidth="2" />}
        {has('computer') && <rect x="168" y="46" width="8" height="6" rx="1" fill="#334155" />}
        {has('phone_mount') && <rect x="178" y="44" width="6" height="10" rx="1" fill="#0f172a" />}
        {has('bottle_cage') && (
          <>
            <rect x="196" y="100" width="6" height="18" rx="3" fill="#60a5fa" opacity="0.8" />
            <rect x="194" y="98" width="10" height="3" rx="1" fill="#94a3b8" />
          </>
        )}
        {has('lock_attached') && (
          profile.lockType === 'chain' ? (
            <path d="M 82 138 Q 92 128 100 140" fill="none" stroke={lockColor} strokeWidth="4" strokeDasharray="4 2" strokeLinecap="round" />
          ) : (
            <path d="M 85 140 Q 90 128 95 140" fill="none" stroke={lockColor} strokeWidth="4" strokeLinecap="round" />
          )
        )}
        {has('trailer') && <line x1="60" y1="150" x2="40" y2="150" stroke="#777" strokeWidth="3" strokeLinecap="round" />}

        <ellipse cx="200" cy="138" rx="15" ry="15" fill="none" stroke="#666" strokeWidth="2" strokeDasharray="4 3" opacity="0.4" />

        {/* Damage spots (percent coords -> viewbox) */}
        {profile.damageSpots.map((s, i) => (
          <g key={i} transform={`translate(${(s.x / 100) * 340} ${(s.y / 100) * 200})`}>
            <circle r="7" fill="#ef4444" opacity="0.85" />
            <text textAnchor="middle" y="3" fontSize="8" fill="#fff" fontWeight="bold">{i + 1}</text>
          </g>
        ))}

        {profile.brand && profile.brand !== 'Unknown / Custom' && (
          <text x="218" y="118" textAnchor="middle" fontSize="7" fill="#fff" fontWeight="bold" opacity="0.9" transform="rotate(-44 218 118)" style={{ fontFamily: 'sans-serif', letterSpacing: 1 }}>
            {profile.brand.toUpperCase().slice(0, 12)}
          </text>
        )}
        {profile.stickersDecals.trim().length > 5 && <rect x="150" y="100" width="12" height="7" rx="1" fill="#f472b6" transform="rotate(-30 156 103)" />}
      </svg>

      {profile.frameColor && !compact && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-white/80 rounded-full px-2 py-1 text-xs text-zinc-600 border border-zinc-200">
          <div className="w-3 h-3 rounded-full border border-zinc-300" style={{ backgroundColor: frameColor }} />
          {profile.frameColor === 'custom' ? 'Custom' : colorObj?.label}
        </div>
      )}
    </div>
  );
}
