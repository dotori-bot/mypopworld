import { addPath, getLineStyle, addText, addGroup } from './svgBuilder';

/**
 * Generates an SVG group for a Folding-Screen (병풍) mechanism.
 * A standalone accordion-pleated strip of panels that stands freely in a
 * zigzag once folded — no glue or spine attachment required.
 */
export const generateFoldingScreen = (svg, options = {}) => {
  const {
    cx = 105,
    cy = 148.5,
    panelCount = 4,
    panelWidth = 32,
    panelHeight = 85,
    isColor = true,
  } = options;

  const g = addGroup(svg, 'folding-screen-group');

  const cutStyle = getLineStyle('CUT', isColor);
  const mountainStyle = getLineStyle('MOUNTAIN_FOLD', isColor);
  const valleyStyle = getLineStyle('VALLEY_FOLD', isColor);

  const totalWidth = panelWidth * panelCount;
  const left = cx - totalWidth / 2;
  const right = cx + totalWidth / 2;
  const top = cy - panelHeight / 2;
  const bottom = cy + panelHeight / 2;

  // Outer boundary (the whole screen is cut out as a single piece)
  addPath(g, `M ${left} ${top} L ${right} ${top} L ${right} ${bottom} L ${left} ${bottom} Z`, cutStyle);

  // Accordion pleat folds between panels (alternating mountain/valley)
  for (let i = 1; i < panelCount; i++) {
    const x = left + panelWidth * i;
    const style = i % 2 === 1 ? mountainStyle : valleyStyle;
    addPath(g, `M ${x} ${top} L ${x} ${bottom}`, style);
  }

  // Panel numbers
  for (let i = 0; i < panelCount; i++) {
    addText(g, left + panelWidth * i + panelWidth / 2, top - 4, `${i + 1}`, 4, 'middle');
  }

  addText(g, cx, top - 12, '병풍 (접이식 배경막)', 4.5, 'middle');
  addText(g, cx, bottom + 8, '지그재그로 접으면 풀칠 없이도 혼자 서요. 칸마다 이어지는 그림을 그려보세요!', 2.6, 'middle');

  return g;
};
