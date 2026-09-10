'use client';

import { RING_SIZE_MIN, RING_SIZE_MAX } from '@/data/products';

interface RingSizeSliderProps {
  value: number;
  onChange: (size: number) => void;
  min?: number;
  max?: number;
}

/**
 * Drag-to-select ring size, EU sizing 45–75 by default.
 * Uses a native <input type="range"> underneath (so it's keyboard- and
 * touch-accessible for free) with custom styling + a floating value badge
 * on top, since a native range thumb can't show text by itself.
 */
export default function RingSizeSlider({ value, onChange, min = RING_SIZE_MIN, max = RING_SIZE_MAX }: RingSizeSliderProps) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ position: 'relative', height: 36, display: 'flex', alignItems: 'center' }}>
        <div
          style={{
            position: 'absolute',
            left: `${percent}%`,
            transform: 'translateX(-50%)',
            top: -8,
            background: '#1a0a0a',
            color: '#fff',
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: 12,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="ring-size-range"
          style={{ ['--fill' as string]: `${percent}%`, marginTop: 20 } as React.CSSProperties}
          aria-label="Ring size"
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#bbb' }}>{min}</span>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#bbb' }}>{max}</span>
      </div>
    </div>
  );
}
