# Contributing to elsa

Thanks for your interest in contributing!

## Getting Started

```bash
git clone https://github.com/aayodejii/elsa.git
cd elsa
npm install
npm run dev
```

## Project Structure

- `app/` — Next.js App Router pages and layout
- `components/` — React components (editor, sidebar, batch, upload)
- `hooks/` — Custom hooks (image processing pipeline, canvas worker)
- `lib/ai/` — AI feature implementations (segmentation, face detection, skin retouch, face enhance)
- `store/` — Zustand state management
- `workers/` — Web Worker for off-main-thread pixel processing
- `types/` — TypeScript type definitions

## How to Contribute

1. Fork the repo and create a branch from `main`
2. Make your changes — keep commits small and focused
3. Use conventional commit format: `type(scope): description`
   e.g. `feat(sidebar): add vignette slider`, `fix(worker): handle empty image data`
4. Open a pull request with a clear description of what changed and why

## Guidelines

- All processing must remain **client-side only** — no sending images to a server
- Keep AI model loading lazy and cached — don't reload on every render
- Pixel manipulation should go through the Web Worker, not the main thread
- Follow existing TypeScript patterns — interfaces must include all relevant fields
- No unnecessary comments; code should be self-explanatory

## Reporting Bugs

Open an issue with steps to reproduce, browser/OS, and a sample image if possible (portrait photos only — no sensitive content).

## License

By contributing, you agree your contributions are licensed under AGPL-3.0.
