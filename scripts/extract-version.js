#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the build.gradle file
const buildGradlePath = path.join(__dirname, '../android/app/build.gradle');
const buildGradleContent = fs.readFileSync(buildGradlePath, 'utf-8');

// Extract versionName using regex
const versionMatch = buildGradleContent.match(/versionName\s+["']([^"']+)["']/);

if (!versionMatch || !versionMatch[1]) {
  console.error('❌ Could not find versionName in build.gradle');
  process.exit(1);
}

const version = versionMatch[1];
console.log(`✅ Extracted version: ${version}`);

// Create the version config file
const configDir = path.join(__dirname, '../src/config');
const versionFilePath = path.join(configDir, 'version.ts');

// Ensure directory exists
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
  console.log(`✨ Created directory: ${configDir}`);
}

// Write the version file
const versionContent = `// Version automatically extracted from android/app/build.gradle
// Do not edit manually - run: npm run extract-version
export const APP_VERSION = "${version}";
`;

fs.writeFileSync(versionFilePath, versionContent);
console.log(`✅ Updated ${versionFilePath} with version ${version}`);
