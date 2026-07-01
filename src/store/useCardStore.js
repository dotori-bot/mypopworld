import { create } from 'zustand';

const useCardStore = create((set) => ({
  // Settings
  paperSize: 'A4', 
  colorMode: 'color', 
  language: 'ko',
  
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
  addMessage: (msg) => set(s => ({ messages: [...s.messages, msg] })),
  setTyping: (v) => set({ isTyping: v }),
  setCardParams: (p) => set({ cardParams: p }),
  setPages: (p) => set({ pages: p, currentPage: 0 }),
  setCurrentPage: (p) => set({ currentPage: p }),
  resetChat: () => set({ messages: [], cardParams: null, pages: [] }),
}));

export default useCardStore;
