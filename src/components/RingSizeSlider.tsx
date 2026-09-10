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
 *
 * Why the track is a separate element from the input:
 * the input used to BE the track — 4px tall — with a 26px thumb drawn
 * overflowing it. A native range input only receives pointer events inside
 * its own box, so on a phone you had a 4px-tall target: most presses landed
 * on the wrapper instead of the input, the drag never started, and it felt
 * like you had to let go and grab again to move the number.
 *
 * Now the input is a transparent 44px-tall strip covering the whole control
 * (a proper thumb-sized target), and the visible 4px track is painted by the
 * divs underneath it with pointer-events: none. Same native input, same
 * keyboard and screen-reader behaviour — just a target you can actually hold.
 */
export default function RingSizeSlider({ value, onChange, min = RING_SIZE_MIN, max = RING_SIZE_MAX }: RingSizeSliderProps) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className="ds-slider-wrap">
      <div className="ds-slider">
        <div className="ds-slider-badge" style={{ left: `${percent}%` }}>{value}</div>

        {/* Painted track — purely visual, never receives the pointer */}
        <div className="ds-slider-track" aria-hidden="true">
          <div className="ds-slider-fill" style={{ width: `${percent}%` }} />
        </div>

        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="ds-slider-input"
          aria-label="Ring size"
        />
      </div>

      <div className="ds-slider-scale">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
