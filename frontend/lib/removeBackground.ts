/**
 * Robust background removal for die-cut vinyl sticker effect.
 *
 * Algorithm:
 * 1. Sample ALL pixels along the 4 edges to find dominant background color
 * 2. Build a color histogram of edge pixels
 * 3. Remove pixels within tolerance of the dominant background
 * 4. Apply aggressive alpha threshold (binary-like cut)
 * 5. Dilate alpha to remove edge artifacts
 */

export async function removeBackground(
  file: File,
  tolerance: number = 55,
  featherPx: number = 1
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const w = img.width;
      const h = img.height;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0);
      const src = ctx.getImageData(0, 0, w, h);
      const data = src.data;

      // ── Step 1: Sample ALL edge pixels (not just corners) ──
      const edgePixels: { r: number; g: number; b: number }[] = [];

      // Top edge
      for (let x = 0; x < w; x++) {
        const i = x * 4;
        edgePixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
      }
      // Bottom edge
      for (let x = 0; x < w; x++) {
        const i = ((h - 1) * w + x) * 4;
        edgePixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
      }
      // Left edge
      for (let y = 1; y < h - 1; y++) {
        const i = y * w * 4;
        edgePixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
      }
      // Right edge
      for (let y = 1; y < h - 1; y++) {
        const i = (y * w + (w - 1)) * 4;
        edgePixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
      }

      // ── Step 2: Build histogram, find most common color cluster ──
      // Quantize to 16 levels per channel (4096 bins)
      const bins = new Map<number, number>();
      edgePixels.forEach(({ r, g, b }) => {
        const qr = Math.round(r / 16) * 16;
        const qg = Math.round(g / 16) * 16;
        const qb = Math.round(b / 16) * 16;
        const key = (qr << 16) | (qg << 8) | qb;
        bins.set(key, (bins.get(key) || 0) + 1);
      });

      // Find most frequent
      let bestKey = 0, bestCount = 0;
      bins.forEach((count, key) => {
        if (count > bestCount) { bestCount = count; bestKey = key; }
      });

      const bgR = (bestKey >> 16) & 0xff;
      const bgG = (bestKey >> 8) & 0xff;
      const bgB = bestKey & 0xff;

      // Is the background light or dark?
      const bgLuminance = (bgR * 0.299 + bgG * 0.587 + bgB * 0.114) / 255;
      const isDarkBg = bgLuminance < 0.15;

      // ── Step 3: Create alpha channel ──
      for (let i = 0; i < data.length; i += 4) {
        const dr = data[i] - bgR;
        const dg = data[i + 1] - bgG;
        const db = data[i + 2] - bgB;
        const dist = Math.sqrt(dr * dr + dg * dg + db * db);

        // Map distance to alpha: 0 = background (transparent), 255 = foreground (opaque)
        // Use steeper curve for dark backgrounds (more aggressive cut)
        let alpha: number;
        if (isDarkBg) {
          // Dark bg: anything not-dark is foreground, steep threshold
          alpha = Math.min(255, (dist / tolerance) * 300);
        } else {
          // Light bg: smoother transition
          alpha = Math.min(255, (dist / tolerance) * 255);
        }
        data[i + 3] = Math.round(Math.max(0, Math.min(255, alpha)));
      }

      // ── Step 4: Dilate alpha (remove edge fringing) ──
      if (featherPx > 0) {
        const alpha = new Uint8Array(w * h);
        for (let i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3];

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            if (alpha[idx] > 200) continue; // already fully opaque

            // Check neighbors: if any neighbor is fully opaque, reduce alpha here
            let maxNeighbor = 0;
            for (let dy = -featherPx; dy <= featherPx; dy++) {
              for (let dx = -featherPx; dx <= featherPx; dx++) {
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                  maxNeighbor = Math.max(maxNeighbor, alpha[ny * w + nx]);
                }
              }
            }
            // Pull alpha toward opaque if near opaque pixels
            if (maxNeighbor > 200) {
              data[idx * 4 + 3] = Math.max(data[idx * 4 + 3], 200);
            }
            // Pull alpha toward 0 if far from opaque pixels
            if (maxNeighbor < 30) {
              data[idx * 4 + 3] = 0;
            }
          }
        }
      }

      ctx.putImageData(src, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

export function hasTransparency(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "jpg" || ext === "jpeg" || ext === "webp") {
      resolve(false);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = Math.min(img.width, 100);
      c.height = Math.min(img.height, 100);
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let transparentPixels = 0;
      for (let i = 3; i < d.length; i += 4) {
        if (d[i] < 200) transparentPixels++;
      }
      // If >5% of sampled pixels have alpha < 200, it has transparency
      resolve(transparentPixels > d.length * 0.001);
    };
    img.onerror = () => resolve(false);
    img.src = URL.createObjectURL(file);
  });
}
