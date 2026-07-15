import { addPath, addPolygon, addRect, getLineStyle, addText, addGroup, createTemplate } from './svgBuilder';

/**
 * Generates an SVG group for a Straw Rocket mechanism
 * A straw rocket consists of a small rectangular paper tube that fits over a straw,
 * sealed at the top, with decorations attached to the front/back.
 */
export const generateStrawRocket = (svg, options = {}) => {
  const {
    cx = 105,      // Center X position
    cy = 148,      // Center Y position 
    isColor = true,
    theme = 'rocket' // rocket, butterfly, bird, etc.
  } = options;

  const g = addGroup(svg, 'straw-rocket-group');
  
  const cutStyle = getLineStyle('CUT', isColor);
  const mountainStyle = getLineStyle('MOUNTAIN_FOLD', isColor);
  const glueStyle = getLineStyle('GLUE_TAB', isColor);

  // 1. The Tube (Fits a standard 6mm straw)
  // Tube width needs to wrap around 6mm straw = circumference ≈ 19mm
  // We'll make it 22mm (snug fit + glue tab) so a short tube still grips.
  // Tube height is insertion depth onto the straw tip only — launch force comes
  // from air pressure on the sealed cap, not insertion depth, so this stays
  // shallow (~3x the straw diameter) rather than reaching down the straw.
  const tubeWidth = 22;
  const tubeHeight = 20;
  const tabWidth = 6;
  const tubeX = cx - (tubeWidth + tabWidth) / 2;
  const tubeY = cy + 20; // Place below the decoration

  // Tube Outline (Cut)
  addRect(g, tubeX, tubeY, tubeWidth + tabWidth, tubeHeight, cutStyle);
  
  // Tube fold line (separating main tube body from glue tab)
  addPath(g, `M ${tubeX + tubeWidth} ${tubeY} L ${tubeX + tubeWidth} ${tubeY + tubeHeight}`, mountainStyle);
  
  // Tube glue tab indicator
  addPolygon(g, [
    [tubeX + tubeWidth, tubeY],
    [tubeX + tubeWidth + tabWidth, tubeY],
    [tubeX + tubeWidth + tabWidth, tubeY + tubeHeight],
    [tubeX + tubeWidth, tubeY + tubeHeight]
  ], glueStyle);
  addText(g, tubeX + tubeWidth + tabWidth / 2, tubeY + tubeHeight / 2 + 1, '풀칠', 2, 'middle');

  // Top Seal Tab (to close the top of the tube so air pushes it)
  const sealHeight = 8;
  addPath(g, `M ${tubeX} ${tubeY} L ${tubeX} ${tubeY - sealHeight} L ${tubeX + tubeWidth} ${tubeY - sealHeight} L ${tubeX + tubeWidth} ${tubeY}`, cutStyle);
  addPath(g, `M ${tubeX} ${tubeY} L ${tubeX + tubeWidth} ${tubeY}`, mountainStyle);
  addPolygon(g, [
    [tubeX, tubeY - sealHeight],
    [tubeX + tubeWidth, tubeY - sealHeight],
    [tubeX + tubeWidth, tubeY],
    [tubeX, tubeY]
  ], glueStyle);
  addText(g, tubeX + tubeWidth/2, tubeY - 2, '접고 풀칠 (Seal Top)', 2, 'middle');

  // 2. The Decoration Silhouettes (Front and Back)
  const decWidth = 60;
  const decHeight = 50;
  const decY = cy - 40;
  
  // Front Decoration — labels sit in the waste area around the cut box, never
  // inside it: the box front is the rocket's visible face.
  const frontX = cx - decWidth - 5;
  addRect(g, frontX, decY, decWidth, decHeight, cutStyle); // Placeholder box
  addText(g, frontX + decWidth/2, decY - 2, `[${theme} 앞면]`, 4, 'middle');
  addText(g, frontX + decWidth/2, decY + decHeight + 4, '뒷면 가운데에 튜브 부착', 2, 'middle');

  // Back Decoration (Mirror)
  const backX = cx + 5;
  addRect(g, backX, decY, decWidth, decHeight, cutStyle); // Placeholder box
  addText(g, backX + decWidth/2, decY - 2, `[${theme} 뒷면]`, 4, 'middle');

  // Instruction text
  addText(g, cx, cy - 60, "💡 빨대 로켓 (Straw Rocket) 도안", 4, 'middle');
  addText(g, cx, cy - 50, "1. 튜브를 말아서 풀칠합니다. 2. 윗부분을 접어 막습니다. 3. 튜브 앞뒤로 장식을 붙입니다. 4. 빨대를 꽂아 붑니다!", 2.5, 'middle');

  return g;
};

/**
 * Render Straw Rocket onto a complete printable SVG template (page outline + spine).
 * @param {Object} [params={}]
 * @param {'A4'|'LETTER'} [params.paperSize='A4']
 * @param {'color'|'bw'} [params.colorMode='color']
 * @param {string} [params.theme='rocket']
 * @returns {{ svg: SVGSVGElement }}
 */
export function renderStrawRocket(params = {}) {
  const { paperSize = 'A4', colorMode = 'color', ...opts } = params;
  // Parts-only sheet (tube + decorations — the rocket is not a folded card),
  // so no spine fold line is printed (it used to cross the decoration boxes).
  const { svg, contentGroup, paper, spineY } = createTemplate(paperSize, colorMode, { spine: false });
  generateStrawRocket(contentGroup, {
    cx: paper.width / 2,
    cy: spineY,
    ...opts,
    isColor: colorMode !== 'bw',
  });
  return { svg };
}
