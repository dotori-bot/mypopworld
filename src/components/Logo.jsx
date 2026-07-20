import React from 'react';

/**
 * PopWorldMark — the brand mark: a flat, "construction-paper" open pop-up card
 * (two folded panels) with a star popping up out of it. Pure flat fills that
 * reference the design tokens, so it recolors automatically with the palette.
 */
export function PopWorldMark({ size = 34, className }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-hidden="true"
    >
      {/* open card — left panel (marigold), right panel (tomato) */}
      <path d="M24 40 L6 33 V16 L24 23 Z" fill="var(--warm-main)" />
      <path d="M24 40 L42 33 V16 L24 23 Z" fill="var(--primary-main)" />
      <path d="M24 23 V40" stroke="rgba(46,36,25,0.18)" strokeWidth="1.4" />
      {/* star popping up */}
      <path
        d="M24 3 l3 6.2 6.8 1 -4.9 4.8 1.2 6.8 -6.1 -3.2 -6.1 3.2 1.2 -6.8 -4.9 -4.8 6.8 -1 Z"
        fill="var(--warm-main)"
        stroke="var(--neutral-900)"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Full logo lockup: mark + two-tone wordmark. */
export default function Logo() {
  return (
    <>
      <PopWorldMark className="logo-icon" />
      <span className="logo-text">
        MyPop<span className="logo-text-accent">World</span>
      </span>
    </>
  );
}
