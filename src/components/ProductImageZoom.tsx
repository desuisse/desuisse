'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import styles from './ProductImageZoom.module.css';

type Props = {
  images: string[];
  initialIndex: number;
  productName: string;
  language: string;
  onClose: () => void;
  onImageChange: (index: number) => void;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function ProductImageZoom({ images, initialIndex, productName, language, onClose, onImageChange }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const stageRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null);
  const movedRef = useRef(false);
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    closeRef.current?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  const resetZoom = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const changeImage = (direction: number) => {
    if (images.length < 2) return;
    const next = (index + direction + images.length) % images.length;
    setIndex(next);
    onImageChange(next);
    resetZoom();
  };

  const changeZoom = (direction: number) => {
    const next = clamp(zoom + direction * 0.5, 1, 3);
    setZoom(next);
    setOffset({ x: 0, y: 0 });
  };

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (zoom === 1) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, originX: offset.x, originY: offset.y };
    movedRef.current = false;
    setDragging(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    const stage = stageRef.current;
    if (!drag || !stage) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) movedRef.current = true;
    const bounds = stage.getBoundingClientRect();
    setOffset({
      x: clamp(drag.originX + dx, -(zoom - 1) * bounds.width / 2, (zoom - 1) * bounds.width / 2),
      y: clamp(drag.originY + dy, -(zoom - 1) * bounds.height / 2, (zoom - 1) * bounds.height / 2),
    });
  };

  const onPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current = null;
    setDragging(false);
  };

  const onStageClick = () => {
    if (movedRef.current) { movedRef.current = false; return; }
    changeZoom(zoom === 1 ? 2 : -4);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); changeImage(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); changeImage(1); }
    if (event.key === '+' || event.key === '=') { event.preventDefault(); changeZoom(1); }
    if (event.key === '-') { event.preventDefault(); changeZoom(-1); }
  };

  const sq = language === 'sq';

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="product-zoom-title"
      onCancel={event => { event.preventDefault(); onClose(); }}
      onKeyDown={onKeyDown}
    >
      <div className={styles.viewer}>
        <header className={styles.header}>
          <div className={styles.heading}>
            <h2 id="product-zoom-title" className={styles.title}>{productName}</h2>
            {images.length > 1 && <span className={styles.count}>{index + 1} / {images.length}</span>}
          </div>
          <button ref={closeRef} type="button" className={styles.close} onClick={onClose} aria-label={sq ? 'Mbyll foton' : 'Close photo'}>×</button>
        </header>

        <button
          ref={stageRef}
          type="button"
          className={styles.stage}
          style={{ cursor: zoom === 1 ? 'zoom-in' : 'grab' }}
          aria-label={zoom === 1 ? (sq ? 'Zmadho foton' : 'Zoom in on photo') : (sq ? 'Rivendos zmadhimin' : 'Reset photo zoom')}
          onClick={onStageClick}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <Image
            src={images[index]}
            alt={`${productName} ${index + 1}`}
            fill
            unoptimized
            className={styles.image}
            style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`, transition: dragging ? 'none' : undefined }}
          />
        </button>

        <div className={styles.controls}>
          <button type="button" onClick={() => changeImage(-1)} disabled={images.length < 2} aria-label={sq ? 'Fotoja e mëparshme' : 'Previous photo'}>‹</button>
          <button type="button" onClick={() => changeZoom(-1)} disabled={zoom === 1} aria-label={sq ? 'Zvogëlo' : 'Zoom out'}>−</button>
          <span className={styles.zoomLevel} aria-live="polite">{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => changeZoom(1)} disabled={zoom === 3} aria-label={sq ? 'Zmadho' : 'Zoom in'}>+</button>
          <button type="button" onClick={() => changeImage(1)} disabled={images.length < 2} aria-label={sq ? 'Fotoja tjetër' : 'Next photo'}>›</button>
        </div>
      </div>
    </dialog>
  );
}
