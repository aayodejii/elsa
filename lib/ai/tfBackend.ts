/**
 * Shared TensorFlow.js backend initialization.
 * Both faceDetection.ts and segmentation.ts must call ensureTfReady()
 * before using any TF.js-dependent API. This guarantees the WebGL backend
 * is registered and ready exactly once, avoiding double-init races.
 */

let readyPromise: Promise<void> | null = null;

export async function ensureTfReady(): Promise<void> {
  if (readyPromise) return readyPromise;

  readyPromise = (async () => {
    // Import the WebGL backend so it registers itself, then wait for TF.js
    await import("@tensorflow/tfjs-backend-webgl");
    const tf = await import("@tensorflow/tfjs");
    await tf.setBackend("webgl");
    await tf.ready();
  })();

  return readyPromise;
}
