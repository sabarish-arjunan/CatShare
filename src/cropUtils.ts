// cropUtils.ts
export const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<string> => {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = imageSrc;

  await new Promise((resolve) => {
    image.onload = resolve;
  });

  // Step 1: Create a canvas from the cropped area
  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = pixelCrop.width;
  cropCanvas.height = pixelCrop.height;
  const cropCtx = cropCanvas.getContext("2d");

  if (!cropCtx) throw new Error("Could not get canvas context");

  cropCtx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Step 2: Downscale if larger than 600x600
  const maxSize = 600;
  const scale = Math.min(
    1,
    maxSize / cropCanvas.width,
    maxSize / cropCanvas.height
  );

  const outputWidth = Math.floor(cropCanvas.width * scale);
  const outputHeight = Math.floor(cropCanvas.height * scale);

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = outputWidth;
  outputCanvas.height = outputHeight;
  const outputCtx = outputCanvas.getContext("2d");

  if (!outputCtx) throw new Error("Could not get output canvas context");

  outputCtx.drawImage(cropCanvas, 0, 0, outputWidth, outputHeight);

  // Step 3: Export to Base64 JPEG (80% quality)
  return outputCanvas.toDataURL("image/jpeg", 0.8);
};
