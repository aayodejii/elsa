# elsa

A browser-based AI portrait photo editor. All processing runs client-side, no uploads, no server or subscriptions.

![elsa demo](public/img/elsa-demo.png)

## Features

- **Background Remove / Blur** — MediaPipe segmentation isolates the subject for transparent backgrounds or bokeh-style blur
- **Skin Retouching** — Bilateral-filter approximation smooths skin while preserving edges and texture
- **Face Enhancement** — Brighten faces, boost eye contrast, whiten teeth with landmark-based masks
- **Manual Adjustments** — Brightness, contrast, saturation, hue, and sharpness sliders processed in a Web Worker
- **Batch Processing** — Upload multiple images, apply settings, process all, and download as ZIP
- **Undo / Redo** — Full settings history per image
- **Privacy First** — Everything runs in your browser. Images never leave your device.

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router + Turbopack)
- [TensorFlow.js](https://www.tensorflow.org/js) + [MediaPipe](https://mediapipe.dev) for AI inference
- [face-api](https://github.com/vladmandic/face-api) for face landmark detection
- [Zustand](https://zustand.docs.pmnd.rs) for state management
- [Tailwind CSS v4](https://tailwindcss.com) for styling
- Web Workers for off-main-thread pixel processing
- [JSZip](https://stuk.github.io/jszip/) for batch export

## Getting Started

```bash
git clone https://github.com/aayodejii/elsa.git
cd elsa
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and drop a portrait photo to start editing.

## How It Works

1. **Upload** — Drop images onto the canvas. Each is stored as an `ImageBitmap` (never mutated).
2. **Edit** — Adjust sliders in the sidebar. Settings changes are debounced and re-run the processing pipeline from the original bitmap.
3. **AI Pipeline** — Background segmentation, face detection, and skin masks are cached per image. Only the first run loads models; subsequent slider changes reuse cached results.
4. **Export** — Download the active image or batch-export all as a ZIP.

## Deploy

```bash
npm run build
npm start
```

Or deploy to [Vercel](https://vercel.com) — works out of the box with Next.js.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

AGPL-3.0
