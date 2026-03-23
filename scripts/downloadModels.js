const https = require("https");
const fs = require("fs");
const path = require("path");

const FACE_API_BASE =
  "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights";

const MODELS_DIR = path.join(__dirname, "../public/models");

const FACE_API_FILES = [
  "tiny_face_detector_model-weights_manifest.json",
  "tiny_face_detector_model-shard1",
  "face_landmark_68_tiny_model-weights_manifest.json",
  "face_landmark_68_tiny_model-shard1",
];

const MEDIAPIPE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite";

function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) {
      console.log(`  skipping (exists): ${path.basename(dest)}`);
      return resolve();
    }
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          file.close();
          fs.unlinkSync(dest);
          download(res.headers.location, dest).then(resolve).catch(reject);
          return;
        }
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          console.log(`  downloaded: ${path.basename(dest)}`);
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlinkSync(dest);
        reject(err);
      });
  });
}

async function main() {
  if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR, { recursive: true });
  }

  console.log("Downloading face-api.js model weights...");
  for (const file of FACE_API_FILES) {
    await download(`${FACE_API_BASE}/${file}`, path.join(MODELS_DIR, file));
  }

  console.log("Downloading MediaPipe selfie segmentation model...");
  await download(
    MEDIAPIPE_MODEL_URL,
    path.join(MODELS_DIR, "selfie_multiclass_256x256.tflite")
  );

  console.log("Done.");
}

main().catch(console.error);
