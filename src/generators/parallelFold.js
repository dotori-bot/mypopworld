import { addPath, getLineStyle, addText, addGroup } from './svgBuilder';

/**
 * Generates an SVG group for a Parallel-Fold (staircase) popup mechanism.
 * Math: height(α) = d × sin(α/2) — see utils/math.js calculateParallelFoldHeight.
 *
 * Each step nests inside the previous one (telescoping), so `levels` must
 * have strictly decreasing `width`, like real stairs: the free outer edge
 * of one step doubles as the hinge line for the next, narrower step.
 */
export const generateParallelFold = (svg, options = {}) => {
  const {
    cx = 105,       // Spine X (center)
    cy = 148.5,     // Spine Y
    levels = [
      { width: 90, depth: 15 },
      { width: 60, depth: 15 },
      { width: 30, depth: 15 },
    ],
    isColor = true,
  } = options;

  const g = addGroup(svg, 'parallel-fold-group');

  const cutStyle = getLineStyle('CUT', isColor);
  const mountainStyle = getLineStyle('MOUNTAIN_FOLD', isColor);
  const valleyStyle = getLineStyle('VALLEY_FOLD', isColor);

  let acc = 0; // depth already accumulated from the spine
  let lastInnerOffset = 0; // captured for the top step's decoration area

  levels.forEach((level, i) => {
    const halfW = level.width / 2;
    const left = cx - halfW;
    const right = cx + halfW;
    const isLast = i === levels.length - 1;
    const nextHalfW = isLast ? 0 : levels[i + 1].width / 2;

    const innerOffset = acc;
    const outerOffset = acc + level.depth;

    [1, -1].forEach((dir) => {
      const inner = cy + dir * innerOffset;
      const outer = cy + dir * outerOffset;

      // Side cuts bounding this step
      addPath(g, `M ${left} ${inner} L ${left} ${outer}`, cutStyle);
      addPath(g, `M ${right} ${inner} L ${right} ${outer}`, cutStyle);

      // Outer edge: fully cut for the last step. For earlier steps, cut
      // only the "shoulders" beyond the next (narrower) step's footprint —
      // the middle strip stays uncut so it becomes that next step's hinge.
      if (isLast) {
        addPath(g, `M ${left} ${outer} L ${right} ${outer}`, cutStyle);
      } else {
        addPath(g, `M ${left} ${outer} L ${cx - nextHalfW} ${outer}`, cutStyle);
        addPath(g, `M ${cx + nextHalfW} ${outer} L ${right} ${outer}`, cutStyle);
      }

      // Inner hinge of this step (mountain fold - pops toward viewer)
      addPath(g, `M ${left} ${inner} L ${right} ${inner}`, mountainStyle);
    });

    addText(g, right + 2, cy - (innerOffset + outerOffset) / 2, `${i + 1}단`, 2.5);

    acc = outerOffset;
    lastInnerOffset = innerOffset;
  });

  // General card spine fold (valley), only outside the staircase footprint
  // so it doesn't overlap the first step's own mountain-fold hinge.
  const baseHalfW = levels[0].width / 2;
  addPath(g, `M ${cx - baseHalfW - 15} ${cy} L ${cx - baseHalfW} ${cy}`, valleyStyle);
  addPath(g, `M ${cx + baseHalfW} ${cy} L ${cx + baseHalfW + 15} ${cy}`, valleyStyle);

  addText(g, cx, cy - acc - 9, '평행 접기 (계단식 무대)', 4, 'middle');
  addText(g, cx, cy - acc - 3, '맨 위 칸에 인형이나 장식을 세워보세요!', 2.5, 'middle');

  // Decoration area: the top (last) step's own riser band — the part of
  // the staircase that actually becomes the highest, most visible wall —
  // sized from that level's own width/depth instead of a fixed square.
  const topHalfW = levels[levels.length - 1].width / 2;
  const decorationAreas = [
    {
      x: cx - topHalfW,
      y: cy - acc,
      width: topHalfW * 2,
      height: acc - lastInnerOffset,
      label: '맨 위 칸',
    },
  ];

  return { group: g, decorationAreas };
};
