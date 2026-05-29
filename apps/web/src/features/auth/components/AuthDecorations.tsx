'use client';

import type { LoginProfile } from '@/lib/auth-theme';
import { getProfileAccentColor } from '@/lib/auth-theme';

interface Props {
  profile: LoginProfile;
}

type DecorationType = 'bars' | 'warehouse' | 'trend' | 'grid' | 'packages' | 'shelf';

interface ScatterItem {
  type: DecorationType;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  size: number;
  rotate: number;
  opacity: number;
  delay?: string;
}

/** Posições fixas espalhadas pelo viewport (aparência orgânica, sem re-layout). */
const SCATTERED: ScatterItem[] = [
  { type: 'bars', top: '6%', left: '4%', size: 72, rotate: -14, opacity: 0.14, delay: '0s' },
  { type: 'warehouse', top: '12%', right: '6%', size: 80, rotate: 8, opacity: 0.12, delay: '1.2s' },
  { type: 'trend', top: '38%', left: '2%', size: 96, rotate: -6, opacity: 0.1, delay: '0.6s' },
  { type: 'grid', bottom: '18%', left: '8%', size: 64, rotate: 12, opacity: 0.11, delay: '2s' },
  { type: 'packages', top: '22%', right: '14%', size: 56, rotate: -18, opacity: 0.13, delay: '0.3s' },
  { type: 'shelf', bottom: '8%', right: '5%', size: 88, rotate: 6, opacity: 0.12, delay: '1.5s' },
  { type: 'bars', bottom: '32%', right: '22%', size: 48, rotate: 22, opacity: 0.09, delay: '2.4s' },
  { type: 'trend', top: '58%', right: '3%', size: 104, rotate: -10, opacity: 0.08, delay: '1s' },
  { type: 'warehouse', top: '72%', left: '12%', size: 68, rotate: -8, opacity: 0.1, delay: '1.8s' },
  { type: 'grid', top: '8%', left: '42%', size: 52, rotate: 0, opacity: 0.07, delay: '0.9s' },
];

function DecorationSvg({ type, color, size }: { type: DecorationType; color: string; size: number }) {
  const common = {
    width: size,
    height: size,
    className: 'transition-[fill,stroke] duration-300',
  };

  switch (type) {
    case 'bars':
      return (
        <svg {...common} viewBox="0 0 48 48" fill="none" aria-hidden>
          <rect x="6" y="28" width="8" height="14" rx="1" fill={color} fillOpacity={0.9} />
          <rect x="18" y="18" width="8" height="24" rx="1" fill={color} fillOpacity={0.7} />
          <rect x="30" y="24" width="8" height="18" rx="1" fill={color} fillOpacity={0.5} />
        </svg>
      );
    case 'warehouse':
      return (
        <svg {...common} viewBox="0 0 48 48" fill="none" aria-hidden>
          <path
            d="M4 20 L24 8 L44 20 V42 H4 Z"
            stroke={color}
            strokeWidth="1.5"
            strokeLinejoin="round"
            fill={color}
            fillOpacity={0.08}
          />
          <rect x="14" y="26" width="8" height="16" fill={color} fillOpacity={0.35} />
          <rect x="26" y="26" width="8" height="16" fill={color} fillOpacity={0.2} />
        </svg>
      );
    case 'trend':
      return (
        <svg {...common} viewBox="0 0 48 48" fill="none" aria-hidden>
          <polyline
            points="4,36 14,28 22,30 32,16 44,22"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="44" cy="22" r="3" fill={color} fillOpacity={0.6} />
        </svg>
      );
    case 'grid':
      return (
        <svg {...common} viewBox="0 0 48 48" fill={color} aria-hidden>
          {[0, 1, 2, 3].map((row) =>
            [0, 1, 2, 3].map((col) => (
              <rect
                key={`${row}-${col}`}
                x={6 + col * 10}
                y={6 + row * 10}
                width="6"
                height="6"
                rx="1"
                opacity={0.15 + ((row + col) % 3) * 0.12}
              />
            )),
          )}
        </svg>
      );
    case 'packages':
      return (
        <svg {...common} viewBox="0 0 48 48" fill="none" aria-hidden>
          <rect x="8" y="20" width="14" height="14" rx="1" fill={color} fillOpacity={0.45} />
          <rect x="26" y="24" width="14" height="14" rx="1" fill={color} fillOpacity={0.3} />
          <rect x="18" y="10" width="14" height="14" rx="1" fill={color} fillOpacity={0.55} />
        </svg>
      );
    case 'shelf':
      return (
        <svg {...common} viewBox="0 0 48 48" fill="none" aria-hidden>
          <line x1="4" y1="14" x2="44" y2="14" stroke={color} strokeWidth="1.5" opacity={0.5} />
          <line x1="4" y1="26" x2="44" y2="26" stroke={color} strokeWidth="1.5" opacity={0.5} />
          <line x1="4" y1="38" x2="44" y2="38" stroke={color} strokeWidth="1.5" opacity={0.5} />
          <rect x="8" y="6" width="10" height="8" rx="1" fill={color} fillOpacity={0.4} />
          <rect x="22" y="18" width="12" height="8" rx="1" fill={color} fillOpacity={0.35} />
          <rect x="10" y="30" width="14" height="8" rx="1" fill={color} fillOpacity={0.3} />
        </svg>
      );
    default:
      return null;
  }
}

export function AuthDecorations({ profile }: Props) {
  const color = getProfileAccentColor(profile);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {SCATTERED.map((item, index) => (
        <div
          key={`${item.type}-${index}`}
          className="auth-decoration-float absolute"
          style={{
            top: item.top,
            left: item.left,
            right: item.right,
            bottom: item.bottom,
            opacity: item.opacity,
            animationDelay: item.delay,
          }}
        >
          <div style={{ transform: `rotate(${item.rotate}deg)` }}>
            <DecorationSvg type={item.type} color={color} size={item.size} />
          </div>
        </div>
      ))}
    </div>
  );
}
