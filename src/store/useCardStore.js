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
  addMessage: (msg) => set(s => ({ messages: [...s.messages, msg] })),
  setTyping: (v) => set({ isTyping: v }),
  setCardParams: (p) => set({ cardParams: p }),
  setGenerating: (v) => set({ isGenerating: v }),
  setPages: (p) => set({ pages: p, currentPage: 0 }),
  setCurrentPage: (p) => set({ currentPage: p }),
  resetChat: () => set({ messages: [], cardParams: null, pages: [] }),
}));

export default useCardStore;
