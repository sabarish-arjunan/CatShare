//editUtils.js
export const getCroppedImg = (src, pixelCrop, rotation = 0, flip = false) =>
  new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const scaleX = flip ? -1 : 1;
      const centerX = pixelCrop.width / 2;
      const centerY = pixelCrop.height / 2;

      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scaleX, 1);
      ctx.translate(-centerX, -centerY);

      ctx.drawImage(
        img,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      ctx.restore();

      resolve(canvas.toDataURL("image/png"));
    };
  });

export const applyAdjustments = (src, filters) =>
  new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const {
        brightness = 100,
        contrast = 100,
        saturation = 100,
        vibrance = 0,
        exposure = 0,
        shadows = 0,
        highlights = 0,
        blackpoint = 0,
      } = filters;

      const bFactor = (brightness - 100) * 2.55;
      const cFactor = contrast / 100;
      const sFactor = saturation / 100;

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Brightness and Contrast
        r = (r - 128) * cFactor + 128 + bFactor;
        g = (g - 128) * cFactor + 128 + bFactor;
        b = (b - 128) * cFactor + 128 + bFactor;

        // Saturation
        const gray = 0.3 * r + 0.59 * g + 0.11 * b;
        r = gray + (r - gray) * sFactor;
        g = gray + (g - gray) * sFactor;
        b = gray + (b - gray) * sFactor;

        // Vibrance
        const max = Math.max(r, g, b);
        const avg = (r + g + b) / 3;
        const amt = ((Math.abs(max - avg) * vibrance) / 100) || 0;
        r += (max - r) * amt;
        g += (max - g) * amt;
        b += (max - b) * amt;

        // Exposure (simple linear boost)
        r += exposure;
        g += exposure;
        b += exposure;

        // Shadows (lift blacks)
        if (shadows > 0) {
          const lift = (shadows / 100) * 50;
          r = Math.max(r, lift);
          g = Math.max(g, lift);
          b = Math.max(b, lift);
        }

        // Highlights (cap whites)
        if (highlights < 0) {
          const cap = 255 + (highlights * 2.5);
          r = Math.min(r, cap);
          g = Math.min(g, cap);
          b = Math.min(b, cap);
        }

        // Black Point adjustment
        r -= blackpoint;
        g -= blackpoint;
        b -= blackpoint;

        data[i] = Math.min(255, Math.max(0, r));
        data[i + 1] = Math.min(255, Math.max(0, g));
        data[i + 2] = Math.min(255, Math.max(0, b));
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
  });
