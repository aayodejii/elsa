import JSZip from "jszip";
import { saveAs } from "file-saver";
import { ImageItemState, canvasRegistry } from "@/store/editorStore";

export interface ExportOptions {
  jpegQuality: number;       // 0–100
  outputWidth: number | null;
  outputHeight: number | null;
}

function getExportFormat(image: ImageItemState): { mime: string; ext: string } {
  if (image.settings.background.mode === "remove") {
    return { mime: "image/png", ext: "png" };
  }
  return { mime: "image/jpeg", ext: "jpg" };
}

function getExportCanvas(src: HTMLCanvasElement, opts: ExportOptions): HTMLCanvasElement {
  if (!opts.outputWidth && !opts.outputHeight) return src;
  const targetW = opts.outputWidth ?? Math.round(src.width * (opts.outputHeight! / src.height));
  const targetH = opts.outputHeight ?? Math.round(src.height * (opts.outputWidth! / src.width));
  const out = document.createElement("canvas");
  out.width = targetW;
  out.height = targetH;
  out.getContext("2d")!.drawImage(src, 0, 0, targetW, targetH);
  return out;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mime: string,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("canvas toBlob failed"))),
      mime,
      quality
    );
  });
}

export async function downloadSingle(image: ImageItemState, opts?: ExportOptions): Promise<void> {
  const canvas = canvasRegistry.get(image.id);
  if (!canvas) return;
  const { mime, ext } = getExportFormat(image);
  const exportOpts = opts ?? image.settings.exportSettings;
  const quality = mime === "image/jpeg" ? exportOpts.jpegQuality / 100 : undefined;
  const exportCanvas = getExportCanvas(canvas, exportOpts);
  const blob = await canvasToBlob(exportCanvas, mime, quality);
  const baseName = image.file.name.replace(/\.[^.]+$/, "");
  saveAs(blob, `elsa-${baseName}.${ext}`);
}

export async function downloadAllAsZip(images: ImageItemState[]): Promise<void> {
  const zip = new JSZip();
  for (const image of images) {
    const canvas = canvasRegistry.get(image.id);
    if (!canvas) continue;
    const { mime, ext } = getExportFormat(image);
    const opts = image.settings.exportSettings;
    const quality = mime === "image/jpeg" ? opts.jpegQuality / 100 : undefined;
    const exportCanvas = getExportCanvas(canvas, opts);
    const blob = await canvasToBlob(exportCanvas, mime, quality);
    const baseName = image.file.name.replace(/\.[^.]+$/, "");
    zip.file(`elsa-${baseName}.${ext}`, blob);
  }
  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, "elsa-export.zip");
}
