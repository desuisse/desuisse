'use client';

import { useEffect, useRef, useState } from 'react';
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
 * Two things make this feel smooth, and both were bugs before:
 *
 * 1. TARGET SIZE. The input used to BE the 4px track, with a 26px thumb drawn
 *    overflowing it. A range input only receives pointer events inside its own
 *    box, so the real target was 4px tall and most presses missed it. The input
 *    is now a transparent 44px strip and the visible track is painted behind it.
 *
 * 2. WHO RE-RENDERS WHILE YOU DRAG. On a ring, every step changes the price in
 *    several places, which re-renders the whole product page — related products
 *    and all. Feeding the parent on every input event meant the thumb waited for
 *    that work before it moved, so a fast drag stuttered and felt like it had
 *    let go. The thumb now runs off local state (instant, cheap) and the parent
 *    is told at most once per animation frame. The price still tracks the drag;
 *    it just can no longer hold the thumb up.
 */
export default function RingSizeSlider({ value, onChange, min = RING_SIZE_MIN, max = RING_SIZE_MAX }: RingSizeSliderProps) {
  const [dragValue, setDragValue] = useState<number | null>(null);
  const frame = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  /* While dragging, what the user sees is local state. The rest of the time it
     follows whatever the parent says the size is. */
  const shown = dragValue ?? value;
  const percent = ((shown - min) / (max - min)) * 100;

  useEffect(() => () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
  }, []);

  const handleInput = (next: number) => {
    setDragValue(next);
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      onChangeRef.current(next);
    });
  };

  /* Hand control back to the parent once the drag is over, so an external
     change (a different material, a reset) is reflected again. */
  const endDrag = () => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    if (dragValue !== null) {
      onChangeRef.current(dragValue);
      setDragValue(null);
    }
  };

  return (
    <div className="ds-slider-wrap">
      <div className="ds-slider">
        <div className="ds-slider-badge" style={{ left: `${percent}%` }}>{shown}</div>

        {/* Painted track — purely visual, never receives the pointer */}
        <div className="ds-slider-track" aria-hidden="true">
          <div className="ds-slider-fill" style={{ width: `${percent}%` }} />
        </div>

        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={shown}
          onChange={e => handleInput(Number(e.target.value))}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onTouchEnd={endDrag}
          onBlur={endDrag}
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
