/**
 * Removes white/light background from an image, producing a die-cut vinyl sticker effect.
 * Returns a data URL of the processed image with transparent background.
 *
 * Algorithm:
 * 1. Sample the 4 corners to detect the dominant background color
 * 2. Remove all pixels within tolerance of that color
 * 3. Feather the edges for a smooth cut
 * 4. Return as PNG with alpha channel
 */

export async function removeBackground(
  file: File,
  tolerance: number = 40,
  featherRadius: number = 1
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

      // Draw image
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Sample corners to detect background color
      const corners = [
        { x: 0, y: 0 },
        { x: canvas.width - 1, y: 0 },
        { x: 0, y: canvas.height - 1 },
        { x: canvas.width - 1, y: canvas.height - 1 },
      ];
      let bgR = 0, bgG = 0, bgB = 0;
      corners.forEach(({ x, y }) => {
        const i = (y * canvas.width + x) * 4;
        bgR += data[i];
        bgG += data[i + 1];
        bgB += data[i + 2];
      });
      bgR = Math.round(bgR / 4);
      bgG = Math.round(bgG / 4);
      bgB = Math.round(bgB / 4);

      // If background is already transparent (alpha < 128 in corners), skip removal
      const avgAlpha = corners.reduce((sum, { x, y }) => {
        return sum + data[(y * canvas.width + x) * 4 + 3];
      }, 0) / 4;

      if (avgAlpha < 200) {
        // Already has transparency — return as-is
        resolve(canvas.toDataURL("image/png"));
        return;
      }

      // Create alpha mask based on color distance from background
      const alphaMask = new Float32Array(canvas.width * canvas.height);
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          const dr = data[i] - bgR;
          const dg = data[i + 1] - bgG;
          const db = data[i + 2] - bgB;
          const dist = Math.sqrt(dr * dr + dg * dg + db * db);
          // Map distance to alpha: 0 = background, 1 = foreground
          alphaMask[y * canvas.width + x] = Math.min(1, dist / tolerance);
        }
      }

      // Feather the alpha mask
      if (featherRadius > 0) {
        const feathered = new Float32Array(canvas.width * canvas.height);
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            let sum = 0;
            let count = 0;
            for (let dy = -featherRadius; dy <= featherRadius; dy++) {
              for (let dx = -featherRadius; dx <= featherRadius; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < canvas.width && ny >= 0 && ny < canvas.height) {
                  sum += alphaMask[ny * canvas.width + nx];
                  count++;
                }
              }
            }
            feathered[y * canvas.width + x] = sum / count;
          }
        }
        // Copy feathered result back
        for (let i = 0; i < alphaMask.length; i++) {
          alphaMask[i] = feathered[i];
        }
      }

      // Apply alpha mask to image data
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          const alpha = alphaMask[y * canvas.width + x];
          data[i + 3] = Math.round(alpha * 255);
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Quick check: does this image already have transparency?
 * If yes, skip background removal.
 */
export function hasTransparency(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    // PNG files may have alpha; JPG never does
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "jpg" || ext === "jpeg") {
      resolve(false);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.min(img.width, 100);
      canvas.height = Math.min(img.height, 100);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      // Check if any pixel has alpha < 250
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 250) { resolve(true); return; }
      }
      resolve(false);
    };
    img.onerror = () => resolve(false);
    img.src = URL.createObjectURL(file);
  });
}
