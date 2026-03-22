"use client";

import { create } from "zustand";
import { DEFAULT_SETTINGS, EditorSettings, ProcessingStatus } from "@/types/editor";

export const canvasRegistry = new Map<string, HTMLCanvasElement>();
export const bitmapRegistry = new Map<string, ImageBitmap>();

export interface ImageItemState {
  id: string;
  file: File;
  thumbnail: string;
  previewUrl: string;
  status: ProcessingStatus;
  settings: EditorSettings;
  settingsHistory: EditorSettings[];
  historyIndex: number;
  width: number;
  height: number;
}

interface EditorStore {
  images: ImageItemState[];
  activeImageId: string | null;
  isProcessing: boolean;
  processingProgress: number;
  compareMode: boolean;

  addImages: (files: File[]) => Promise<void>;
  setActiveImage: (id: string) => void;
  updateSettings: (id: string, patch: Partial<EditorSettings>) => void;
  updatePreview: (id: string, dataUrl: string) => void;
  setStatus: (id: string, status: ProcessingStatus) => void;
  setProcessingProgress: (progress: number) => void;
  setIsProcessing: (v: boolean) => void;
  setCompareMode: (v: boolean) => void;
  undo: (id: string) => EditorSettings | null;
  redo: (id: string) => EditorSettings | null;
  resetImage: (id: string) => void;
  removeImage: (id: string) => void;
}

function generateId() {
  return `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createThumbnail(bitmap: ImageBitmap): Promise<string> {
  const MAX = 120;
  const ratio = Math.min(MAX / bitmap.width, MAX / bitmap.height);
  const w = Math.round(bitmap.width * ratio);
  const h = Math.round(bitmap.height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.7);
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  images: [],
  activeImageId: null,
  isProcessing: false,
  processingProgress: 0,
  compareMode: false,

  addImages: async (files) => {
    const newItems: ImageItemState[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      const id = generateId();
      const bitmap = await createImageBitmap(file);

      bitmapRegistry.set(id, bitmap);

      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bitmap, 0, 0);
      canvasRegistry.set(id, canvas);

      const thumbnail = await createThumbnail(bitmap);
      const previewUrl = canvas.toDataURL("image/jpeg", 0.85);

      const settings = structuredClone(DEFAULT_SETTINGS);
      newItems.push({
        id,
        file,
        thumbnail,
        previewUrl,
        status: "idle",
        settings,
        settingsHistory: [settings],
        historyIndex: 0,
        width: bitmap.width,
        height: bitmap.height,
      });
    }

    if (newItems.length === 0) return;

    set((state) => ({
      images: [...state.images, ...newItems],
      activeImageId: state.activeImageId ?? newItems[0].id,
    }));
  },

  setActiveImage: (id) => set({ activeImageId: id }),

  updateSettings: (id, patch) => {
    set((state) => ({
      images: state.images.map((img) => {
        if (img.id !== id) return img;
        const merged = {
          ...img.settings,
          ...patch,
          skinRetouch: { ...img.settings.skinRetouch, ...(patch.skinRetouch ?? {}) },
          background: { ...img.settings.background, ...(patch.background ?? {}) },
          faceEnhance: { ...img.settings.faceEnhance, ...(patch.faceEnhance ?? {}) },
          manual: { ...img.settings.manual, ...(patch.manual ?? {}) },
        };
        const trimmed = img.settingsHistory.slice(0, img.historyIndex + 1);
        return {
          ...img,
          settings: merged,
          settingsHistory: [...trimmed, merged],
          historyIndex: trimmed.length,
        };
      }),
    }));
  },

  updatePreview: (id, dataUrl) => {
    set((state) => ({
      images: state.images.map((img) =>
        img.id === id ? { ...img, previewUrl: dataUrl } : img
      ),
    }));
  },

  setStatus: (id, status) => {
    set((state) => ({
      images: state.images.map((img) =>
        img.id === id ? { ...img, status } : img
      ),
    }));
  },

  setProcessingProgress: (progress) => set({ processingProgress: progress }),
  setIsProcessing: (v) => set({ isProcessing: v }),
  setCompareMode: (v) => set({ compareMode: v }),

  undo: (id) => {
    const images = get().images;
    const img = images.find((i) => i.id === id);
    if (!img || img.historyIndex <= 0) return null;
    const newIndex = img.historyIndex - 1;
    const settings = img.settingsHistory[newIndex];
    set((state) => ({
      images: state.images.map((i) =>
        i.id === id ? { ...i, historyIndex: newIndex, settings } : i
      ),
    }));
    return settings;
  },

  redo: (id) => {
    const images = get().images;
    const img = images.find((i) => i.id === id);
    if (!img || img.historyIndex >= img.settingsHistory.length - 1) return null;
    const newIndex = img.historyIndex + 1;
    const settings = img.settingsHistory[newIndex];
    set((state) => ({
      images: state.images.map((i) =>
        i.id === id ? { ...i, historyIndex: newIndex, settings } : i
      ),
    }));
    return settings;
  },

  resetImage: (id) => {
    const bitmap = bitmapRegistry.get(id);
    if (!bitmap) return;
    const canvas = canvasRegistry.get(id);
    if (canvas) {
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0);
    }
    const settings = structuredClone(DEFAULT_SETTINGS);
    set((state) => ({
      images: state.images.map((img) =>
        img.id === id
          ? {
              ...img,
              settings,
              settingsHistory: [settings],
              historyIndex: 0,
              previewUrl: canvas?.toDataURL("image/jpeg", 0.85) ?? img.previewUrl,
              status: "idle",
            }
          : img
      ),
    }));
  },

  removeImage: (id) => {
    bitmapRegistry.get(id)?.close();
    bitmapRegistry.delete(id);
    canvasRegistry.delete(id);
    set((state) => {
      const remaining = state.images.filter((i) => i.id !== id);
      const activeId =
        state.activeImageId === id
          ? (remaining[0]?.id ?? null)
          : state.activeImageId;
      return { images: remaining, activeImageId: activeId };
    });
  },
}));
