import JSZip from "jszip";
import { saveAs } from "file-saver";
import { ImageItemState, canvasRegistry } from "@/store/editorStore";

function getExportFormat(image: ImageItemState): { mime: string; ext: string; quality?: number } {
  if (image.settings.background.mode === "remove") {
    return { mime: "image/png", ext: "png" };
  }
  return { mime: "image/jpeg", ext: "jpg", quality: 0.88 };
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

export async function downloadSingle(image: ImageItemState): Promise<void> {
  const canvas = canvasRegistry.get(image.id);
  if (!canvas) return;
  const { mime, ext, quality } = getExportFormat(image);
  const blob = await canvasToBlob(canvas, mime, quality);
  const baseName = image.file.name.replace(/\.[^.]+$/, "");
  saveAs(blob, `elsa-${baseName}.${ext}`);
}

export async function downloadAllAsZip(images: ImageItemState[]): Promise<void> {
  const zip = new JSZip();
  for (const image of images) {
    const canvas = canvasRegistry.get(image.id);
    if (!canvas) continue;
    const { mime, ext, quality } = getExportFormat(image);
    const blob = await canvasToBlob(canvas, mime, quality);
    const baseName = image.file.name.replace(/\.[^.]+$/, "");
    zip.file(`elsa-${baseName}.${ext}`, blob);
  }
  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, "elsa-export.zip");
}
