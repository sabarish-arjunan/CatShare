// MediaLibraryUtils.js - Updated to use /storage/emulated/0/CatShare/Library for external storage

import { Filesystem, Directory } from "@capacitor/filesystem";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { v4 as uuidv4 } from "uuid";

export const MEDIA_DIR = Directory.Documents;
export const MEDIA_FOLDER = "CatShare/Library";

export async function ensureMediaFolderExists() {
  try {
    await Filesystem.readdir({ path: MEDIA_FOLDER, directory: MEDIA_DIR });
  } catch {
    await Filesystem.mkdir({
      path: MEDIA_FOLDER,
      directory: MEDIA_DIR,
      recursive: true,
    });
  }
}

export async function loadMediaIndex() {
  await ensureMediaFolderExists();
  const result = await Filesystem.readdir({ path: MEDIA_FOLDER, directory: MEDIA_DIR });
  return result.files
    .filter((f) => f.name.endsWith(".png"))
    .map((f) => {
      return {
        id: f.name.replace(".png", ""),
        name: f.name,
        path: `${MEDIA_FOLDER}/${f.name}`,
        timestamp: new Date().toISOString(),
      };
    });
}

export async function saveMediaIndex(index) {
  // No longer needed — handled by file listing
}

export async function addImageToLibrary(source = "photos", allowMultiple = false) {
  await ensureMediaFolderExists();

  if (source === "photos" && allowMultiple) {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.multiple = true;

      input.onchange = async () => {
        const files = Array.from(input.files);
        const addedItems = [];

        for (const file of files) {
          const reader = new FileReader();
          const result = await new Promise((res) => {
            reader.onload = () => res(reader.result);
            reader.readAsDataURL(file);
          });

          const base64 = result.split(",")[1];
          const id = uuidv4();
          const filename = `media_${id}.png`;

          await Filesystem.writeFile({
            path: `${MEDIA_FOLDER}/${filename}`,
            data: base64,
            directory: MEDIA_DIR,
            recursive: true,
          });

          addedItems.push({
            id,
            name: filename,
            path: `${MEDIA_FOLDER}/${filename}`,
            timestamp: new Date().toISOString(),
          });
        }

        resolve(addedItems);
      };

      input.click();
    });
  }

  const image = await Camera.getPhoto({
    resultType: CameraResultType.Base64,
    source: source === "camera" ? CameraSource.Camera : CameraSource.Photos,
    quality: 90,
  });

  const id = uuidv4();
  const filename = `media_${id}.png`;

  await Filesystem.writeFile({
    path: `${MEDIA_FOLDER}/${filename}`,
    data: image.base64String,
    directory: MEDIA_DIR,
    recursive: true,
  });

  return [
    {
      id,
      name: filename,
      path: `${MEDIA_FOLDER}/${filename}`,
      timestamp: new Date().toISOString(),
    },
  ];
}
