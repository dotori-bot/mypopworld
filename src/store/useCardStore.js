import { create } from 'zustand';

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

  // 사용자가 업로드한 자기 그림 (data URL). 2D 도안의 '내 그림' 장식 페이지와
  // 3D 시뮬레이션의 장식 면(--user-art CSS 변수)에 함께 적용된다.
  userArt: null,

  // 도안 배경 꾸미기: 모든 도안 페이지(재단선 안쪽)와 3D 시뮬레이션의 카드
  // 면에 함께 칠해지는 색/이미지. color·image 값은 type을 바꿔도 보존되어
  // 팝오버에서 왔다갔다 해도 마지막 선택이 유지된다.
  cardSkin: { type: 'none', color: '#f7e8d0', image: null },

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
  // Clearing the art while the 2D decoration page is in 'user-image' mode
  // drops that page's source, so fall back to the freehand guide.
  setUserArt: (art) =>
    set((s) => ({
      userArt: art,
      decorationMode: !art && s.decorationMode === 'user-image' ? 'freehand' : s.decorationMode,
    })),
  // Partial update ({ type }·{ color }·{ image } 아무 조합). 이미지를 지우면
  // 'image' 타입은 표시할 것이 없으므로 'none'으로 되돌린다.
  setCardSkin: (patch) =>
    set((s) => {
      const next = { ...s.cardSkin, ...patch };
      if (next.type === 'image' && !next.image) next.type = 'none';
      return { cardSkin: next };
    }),
  addMessage: (msg) => set(s => ({ messages: [...s.messages, msg] })),
  setTyping: (v) => set({ isTyping: v }),
  setCardParams: (p) => set({ cardParams: p }),
  setGenerating: (v) => set({ isGenerating: v }),
  setPages: (p) => set({ pages: p, currentPage: 0 }),
  setCurrentPage: (p) => set({ currentPage: p }),
  resetChat: () => set({ messages: [], cardParams: null, pages: [] }),
}));

export default useCardStore;
