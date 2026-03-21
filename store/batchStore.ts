"use client";

import { create } from "zustand";

interface BatchStore {
  isProcessingAll: boolean;
  totalCount: number;
  doneCount: number;
  startBatch: (total: number) => void;
  incrementDone: () => void;
  finishBatch: () => void;
}

export const useBatchStore = create<BatchStore>((set) => ({
  isProcessingAll: false,
  totalCount: 0,
  doneCount: 0,

  startBatch: (total) => set({ isProcessingAll: true, totalCount: total, doneCount: 0 }),
  incrementDone: () => set((s) => ({ doneCount: s.doneCount + 1 })),
  finishBatch: () => set({ isProcessingAll: false }),
}));
