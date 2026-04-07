"use client";

import { useRef, useEffect, useCallback } from "react";
import { EditorSettings } from "@/types/editor";

type WorkerRequest =
  | {
      type: "MANUAL_FILTER";
      imageData: ImageData;
      settings: EditorSettings["manual"];
    }
  | {
      type: "SKIN_RETOUCH";
      imageData: ImageData;
      blurData: ImageData;
      maskData: ImageData;
      strength: number;
    }
  | {
      type: "FREQ_SEP";
      imageData: ImageData;
      blurSmall: ImageData;
      blurLarge: ImageData;
      maskData: ImageData;
      strength: number;
    }
  | {
      type: "GRAIN";
      imageData: ImageData;
      strength: number;
      size: number;
    }
  | {
      type: "DENOISE";
      imageData: ImageData;
      strength: number;
    };

interface WorkerResponse {
  type: "RESULT";
  imageData: ImageData;
}

export function useCanvasWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<((data: ImageData) => void) | null>(null);
  const rejectRef = useRef<((err: unknown) => void) | null>(null);

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/imageProcessor.worker.ts", import.meta.url)
    );

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      if (e.data.type === "RESULT" && pendingRef.current) {
        pendingRef.current(e.data.imageData);
        pendingRef.current = null;
        rejectRef.current = null;
      }
    };

    worker.onerror = (e) => {
      if (rejectRef.current) {
        rejectRef.current(new Error(e.message ?? "worker error"));
        pendingRef.current = null;
        rejectRef.current = null;
      }
    };

    workerRef.current = worker;
    return () => worker.terminate();
  }, []);

  const runWorker = useCallback((request: WorkerRequest): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
      const worker = workerRef.current;
      if (!worker) return reject(new Error("worker not ready"));
      pendingRef.current = resolve;
      rejectRef.current = reject;

      const transferables: Transferable[] = [request.imageData.data.buffer];
      if (request.type === "SKIN_RETOUCH") {
        transferables.push(request.blurData.data.buffer, request.maskData.data.buffer);
      }
      if (request.type === "FREQ_SEP") {
        transferables.push(request.blurSmall.data.buffer, request.blurLarge.data.buffer, request.maskData.data.buffer);
      }

      worker.postMessage(request, transferables);
    });
  }, []);

  return { runWorker };
}
