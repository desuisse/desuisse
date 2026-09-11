'use client';

import { useEffect, useRef, useState } from 'react';
import { RING_SIZE_MIN, RING_SIZE_MAX } from '@/data/products';

interface RingSizeSliderProps {
  value: number;
  onChange: (size: number) => void;
  min?: number;
  max?: number;
  /**
   * Optional. Given a size, return the price to show beside the thumb while
   * dragging. This is what lets the page stay still during a drag without the
   * customer losing sight of what the size costs.
   */
  formatPrice?: (size: number) => string;
}

/**
 * Drag-to-select ring size, EU sizing 45–75.
 *
 * WHY THE PARENT IS NOT TOLD ON EVERY STEP
 *
 * On a ring with a size-dependent price, each step rewrites the price in the
 * headline figure and on every material button. That re-renders the product
 * page, and measurement on a 6x-throttled phone showed a fast drag producing a
 * ~50ms stalled frame on such a ring and none at all on a ring whose price is
 * flat — which is exactly the difference people reported feeling.
 *
 * Throttling those updates to one per animation frame (the previous attempt)
 * reduced how often the work happened but not how long it took, so a fast drag
 * still stuttered. The only real fix is to keep that work out of the drag.
 *
 * So: the thumb runs off local state, the price for the size under your finger
 * is rendered by this component alone, and the parent is told exactly once —
 * when you let go. Nothing competes with the gesture.
 *
 * An earlier version also committed after ~220ms of holding still. On a heavily
 * throttled phone the gaps between touch events exceed that, so it fired mid-
 * drag and put a 63ms stall back in. Release-only is the predictable rule.
 */
export default function RingSizeSlider({
  value,
  onChange,
  min = RING_SIZE_MIN,
  max = RING_SIZE_MAX,
  formatPrice,
}: RingSizeSliderProps) {
  const [dragValue, setDragValue] = useState<number | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const pendingRef = useRef<number | null>(null);

  const shown = dragValue ?? value;
  const percent = ((shown - min) / (max - min)) * 100;

  /* If the component goes away mid-drag, the size still counts. */
  useEffect(() => () => {
    if (pendingRef.current !== null) onChangeRef.current(pendingRef.current);
  }, []);

  const handleInput = (next: number) => {
    pendingRef.current = next;
    setDragValue(next);
  };

  const commit = () => {
    if (pendingRef.current !== null) {
      onChangeRef.current(pendingRef.current);
      pendingRef.current = null;
      setDragValue(null);
    }
  };

  const livePrice = formatPrice ? formatPrice(shown) : null;

  return (
    <div className="ds-slider-wrap">
      <div className="ds-slider">
        <div className="ds-slider-badge" style={{ left: `${percent}%` }}>
          <span className="ds-slider-size">{shown}</span>
          {livePrice && <span className="ds-slider-badge-price">{livePrice}</span>}
        </div>

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
          onPointerUp={commit}
          onPointerCancel={commit}
          onTouchEnd={commit}
          onMouseUp={commit}
          onKeyUp={commit}
          onBlur={commit}
          className="ds-slider-input"
          aria-label="Ring size"
          aria-valuetext={livePrice ? `${shown} — ${livePrice}` : String(shown)}
        />
      </div>

      <div className="ds-slider-scale">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
