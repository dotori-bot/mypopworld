import { create } from 'zustand';
import { getElements } from './cardModel';

// Mechanism composition signature: userArts is keyed by flattened slot index,
// so slot meanings only survive while the card keeps the same mechanisms in
// the same order. Param tweaks (sliders) keep the signature; swapping or
// adding/removing mechanisms changes it and must drop the now-mismapped arts.
const mechanismSignature = (cardParams) =>
  getElements(cardParams)
    .map((el) => el.mechanism)
    .join('+');

const useCardStore = create((set) => ({
  // Settings
  paperSize: 'A4',
  colorMode: 'color',
  // PDF instruction-page labels support 'en' (see pdfExporter.addInstructionPage),
  // but INSTRUCTION_TEXT content itself is Korean-only — no UI toggle for this
  // until the instruction copy is actually translated, to avoid a half-English page.
  language: 'ko',
  // 'ai-image': embed the AI-generated image itself as the cuttable page-2 artwork.
  // 'freehand' (default): show a draw-it-yourself guide (outline/size/position)
  // with the AI image reduced to a small inspirational reference thumbnail.
  decorationMode: 'freehand',

  // 'kids' (default): AI-chat-driven flow. 'expert': direct mechanism picking
  // + full parameter editing without the AI in the loop.
  appMode: 'kids',

  // 사용자가 업로드한 자기 그림들 (data URL), 장식 슬롯별 맵.
  // 키 = getDecorationSlots()가 돌려주는 평탄화된 슬롯 인덱스 (요소 순서대로
  // 이어붙인 순번). 각 슬롯의 권장 크기는 UserArtSlots가 미리 보여주고,
  // 업로드된 그림은 2D 도안의 '내 그림' 장식 페이지(해당 슬롯 페이지)와
  // 3D 시뮬레이션의 해당 장식 면(--user-art/--slot-art-* CSS 변수)에 적용된다.
  userArts: {},

  // Chat
  messages: [],
  isTyping: false,
  
  // Card parameters (set by AI)
  cardParams: null,
  
  // Generated template
  pages: [], // Array of SVG strings
  currentPage: 0,
  isGenerating: false,
  
  // Actions
  setPaperSize: (size) => set({ paperSize: size }),
  setColorMode: (mode) => set({ colorMode: mode }),
  setLanguage: (lang) => set({ language: lang }),
  setDecorationMode: (mode) => set({ decorationMode: mode }),
  setAppMode: (mode) => set({ appMode: mode }),
  // Set/clear one slot's uploaded drawing. Clearing the LAST drawing while
  // the 2D decoration pages are in 'user-image' mode drops that mode's only
  // source, so fall back to the freehand guide.
  setUserArtAt: (index, art) =>
    set((s) => {
      const next = { ...s.userArts };
      if (art) next[index] = art;
      else delete next[index];
      const hasAny = Object.values(next).some(Boolean);
      return {
        userArts: next,
        decorationMode: !hasAny && s.decorationMode === 'user-image' ? 'freehand' : s.decorationMode,
      };
    }),
  addMessage: (msg) => set(s => ({ messages: [...s.messages, msg] })),
  setTyping: (v) => set({ isTyping: v }),
  setCardParams: (p) =>
    set((s) => {
      if (mechanismSignature(p) === mechanismSignature(s.cardParams)) {
        return { cardParams: p };
      }
      // Different mechanism line-up → the slot-indexed uploads no longer mean
      // what they meant; clear them (and leave 'user-image' mode, which just
      // lost its sources).
      return {
        cardParams: p,
        userArts: {},
        decorationMode: s.decorationMode === 'user-image' ? 'freehand' : s.decorationMode,
      };
    }),
  setGenerating: (v) => set({ isGenerating: v }),
  setPages: (p) => set({ pages: p, currentPage: 0 }),
  setCurrentPage: (p) => set({ currentPage: p }),
  resetChat: () => set({ messages: [], cardParams: null, pages: [], userArts: {} }),
}));

export default useCardStore;
