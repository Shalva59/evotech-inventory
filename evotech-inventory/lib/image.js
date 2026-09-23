/**
 * Shrinks an uploaded image to a small square-ish thumbnail and returns it as
 * a data URL.
 *
 * A phone photo is 4–5 MB. The browser store in demo mode holds about 5 MB
 * in total, and even with a real server nobody needs a 4000-pixel logo in a
 * dropdown. 256px WebP is roughly 10–20 KB and still sharp on a retina screen.
 */
export async function resizeImage(file, maxSize = 256, quality = 0.82) {
  const bitmap = await loadBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);

  // Safari before 17 cannot encode WebP and silently returns PNG; either works.
  return canvas.toDataURL("image/webp", quality);
}

function loadBitmap(file) {
  if (typeof createImageBitmap === "function") return createImageBitmap(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
