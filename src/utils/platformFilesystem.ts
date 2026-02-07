import { Filesystem, Directory } from "@capacitor/filesystem";
import { Capacitor } from "@capacitor/core";

/**
 * Platform-aware Filesystem utilities with graceful fallbacks
 * Handles differences between native (iOS/Android) and web platforms
 */

interface FileWriteOptions {
  path: string;
  data: string;
  folder?: string;
}

interface FileReadOptions {
  path: string;
  folder?: string;
}

/**
 * Get the appropriate Directory for the current platform
 * Prefers External on Android, falls back to Data for iOS and web
 */
export function getPlatformDirectory(): Directory {
  const platform = Capacitor.getPlatform();

  // Android: Use External storage for documents/exports
  if (platform === "android") {
    return Directory.External;
  }

  // iOS and web: Use Data directory (app-specific storage)
  return Directory.Data;
}

/**
 * Safely write a file with platform detection
 * @param options - File write options
 * @returns Success status
 */
export async function safeWriteFile(options: FileWriteOptions): Promise<boolean> {
  try {
    const directory = getPlatformDirectory();
    const platform = Capacitor.getPlatform();

    console.log(`📝 Writing file to ${platform} using ${directory === Directory.External ? "External" : "Data"} storage`);

    await Filesystem.writeFile({
      path: options.path,
      data: options.data,
      directory: directory,
      recursive: true,
    });

    console.log(`✅ File written successfully: ${options.path}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to write file: ${options.path}`, error);
    // If External fails on Android, fall back to Data directory
    if (
      Capacitor.getPlatform() === "android" &&
      error instanceof Error &&
      (error.message.includes("Permission") || error.message.includes("EACCES"))
    ) {
      console.warn(`⚠️ External storage write failed, attempting fallback to Data directory`);
      try {
        await Filesystem.writeFile({
          path: options.path,
          data: options.data,
          directory: Directory.Data,
          recursive: true,
        });
        console.log(`✅ File written to fallback location: ${options.path}`);
        return true;
      } catch (fallbackError) {
        console.error(`❌ Fallback write also failed:`, fallbackError);
        return false;
      }
    }
    return false;
  }
}

/**
 * Safely read a file with platform detection
 * @param options - File read options
 * @returns File data or null if failed
 */
export async function safeReadFile(options: FileReadOptions): Promise<string | null> {
  try {
    const directory = getPlatformDirectory();
    const platform = Capacitor.getPlatform();

    console.log(`📖 Reading file from ${platform} using ${directory === Directory.External ? "External" : "Data"} storage`);

    const result = await Filesystem.readFile({
      path: options.path,
      directory: directory,
    });

    console.log(`✅ File read successfully: ${options.path}`);
    return result.data as string;
  } catch (error) {
    // Try alternative directory if primary fails
    if (Capacitor.getPlatform() === "android") {
      try {
        console.warn(`⚠️ Reading from External failed, trying Data directory`);
        const fallbackResult = await Filesystem.readFile({
          path: options.path,
          directory: Directory.Data,
        });
        return fallbackResult.data as string;
      } catch (fallbackError) {
        console.error(`❌ Could not read file from any location:`, fallbackError);
        return null;
      }
    }

    console.error(`❌ Failed to read file: ${options.path}`, error);
    return null;
  }
}

/**
 * Get platform-specific save path for user feedback
 */
export function getDisplayPath(fileName: string): string {
  const platform = Capacitor.getPlatform();

  switch (platform) {
    case "android":
      return `/storage/emulated/0/Android/data/com.catshare.official/files/${fileName}`;
    case "ios":
      return `App Documents/${fileName}`;
    default:
      return `Local Storage/${fileName}`;
  }
}

export default {
  getPlatformDirectory,
  safeWriteFile,
  safeReadFile,
  getDisplayPath,
};
