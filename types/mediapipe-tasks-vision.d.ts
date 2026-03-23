declare module "@mediapipe/tasks-vision" {
  interface WasmFileset {
    wasmLoaderPath: string;
    wasmBinaryPath: string;
  }

  class FilesetResolver {
    static forVisionTasks(basePath?: string): Promise<WasmFileset>;
  }

  interface BaseOptions {
    modelAssetPath?: string;
    delegate?: "CPU" | "GPU";
  }

  interface ImageSegmenterOptions {
    baseOptions?: BaseOptions;
    runningMode?: "IMAGE" | "VIDEO";
    outputConfidenceMasks?: boolean;
    outputCategoryMask?: boolean;
  }

  class MPMask {
    readonly width: number;
    readonly height: number;
    getAsFloat32Array(): Float32Array;
    getAsUint8Array(): Uint8Array;
    close(): void;
  }

  class ImageSegmenterResult {
    readonly confidenceMasks?: MPMask[];
    readonly categoryMask?: MPMask;
    close(): void;
  }

  class ImageSegmenter {
    static createFromOptions(
      fileset: WasmFileset,
      options: ImageSegmenterOptions
    ): Promise<ImageSegmenter>;
    segment(image: HTMLCanvasElement | HTMLImageElement | ImageData | ImageBitmap): ImageSegmenterResult;
    getLabels(): string[];
    close(): void;
  }

  export { FilesetResolver, ImageSegmenter, ImageSegmenterResult, MPMask };
}
