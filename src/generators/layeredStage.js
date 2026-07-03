import { addPath, getLineStyle, addText, addGroup } from './svgBuilder';

/**
 * Generates an SVG group for a Layered-Stage popup mechanism.
 * Several independent standing "flats" are hinged directly to the card
 * at increasing distance from the spine, producing a diorama-style scene
 * with parallax depth (near = short & wide, far = tall & narrow).
 * Unlike parallel-fold, layers do not nest into each other — each has its
 * own hinge and is separated from its neighbour by a small gap.
 */
export const generateLayeredStage = (svg, options = {}) => {
  const {
    cx = 105,
    cy = 148.5,
    layers = [
      { width: 90, height: 18, label: '앞쪽' },
      { width: 65, height: 32, label: '중간' },
      { width: 40, height: 46, label: '배경' },
    ],
    gap = 5,
    isColor = true,
  } = options;

  const g = addGroup(svg, 'layered-stage-group');

  const cutStyle = getLineStyle('CUT', isColor);
  const mountainStyle = getLineStyle('MOUNTAIN_FOLD', isColor);
  const valleyStyle = getLineStyle('VALLEY_FOLD', isColor);

  let offset = 0; // distance already used up from the spine

  layers.forEach((layer) => {
    const halfW = layer.width / 2;
    const left = cx - halfW;
    const right = cx + halfW;
    const innerOffset = offset;
    const outerOffset = offset + layer.height;

    [1, -1].forEach((dir) => {
      const inner = cy + dir * innerOffset;
      const outer = cy + dir * outerOffset;

      // 3 free-cut sides
      addPath(g, `M ${left} ${inner} L ${left} ${outer}`, cutStyle);
      addPath(g, `M ${right} ${inner} L ${right} ${outer}`, cutStyle);
      addPath(g, `M ${left} ${outer} L ${right} ${outer}`, cutStyle);

      // Hinge (mountain fold) at the inner edge, glued flat to the card
      addPath(g, `M ${left} ${inner} L ${right} ${inner}`, mountainStyle);
    });

    addText(g, cx, cy - (innerOffset + outerOffset) / 2, layer.label, 2.8, 'middle');

    offset = outerOffset + gap;
  });

  // Card spine fold (valley), outside the widest layer's footprint
  const maxHalfW = Math.max(...layers.map((l) => l.width / 2));
  addPath(g, `M ${cx - maxHalfW - 15} ${cy} L ${cx - maxHalfW} ${cy}`, valleyStyle);
  addPath(g, `M ${cx + maxHalfW} ${cy} L ${cx + maxHalfW + 15} ${cy}`, valleyStyle);

  const topEdgeOffset = offset - gap; // outer edge of the farthest (tallest) layer
  addText(g, cx, cy - topEdgeOffset - 9, '다층 무대 (Layered Stage)', 4, 'middle');
  addText(g, cx, cy - topEdgeOffset - 3, '가까운 벽부터 순서대로 접어 세우고, 그림을 붙여 풍경을 완성해요!', 2.5, 'middle');

  return g;
};
