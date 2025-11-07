#!/usr/bin/env node

/**
 * Package script to create distribution packages for Chrome and Firefox
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const packagesDir = path.join(rootDir, 'packages');

// Get target from command line (chrome, firefox, or both)
const target = process.argv[2] || 'both';

console.log('🎁 Packaging extension for:', target);

// Clean packages directory
if (fs.existsSync(packagesDir)) {
  fs.rmSync(packagesDir, { recursive: true });
}
fs.mkdirSync(packagesDir, { recursive: true });

/**
 * Copy directory recursively
 */
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Create a zip file
 */
function createZip(sourceDir, outputPath) {
  const sourceName = path.basename(sourceDir);
  const parentDir = path.dirname(sourceDir);

  try {
    // Change to parent directory and zip the folder
    execSync(`cd "${parentDir}" && zip -r "${outputPath}" "${sourceName}"`, {
      stdio: 'inherit'
    });
    console.log(`✅ Created: ${path.basename(outputPath)}`);
  } catch (error) {
    console.error(`❌ Failed to create zip: ${error.message}`);
  }
}

/**
 * Package for Chrome
 */
function packageChrome() {
  console.log('\n📦 Packaging for Chrome...');

  const chromeDir = path.join(packagesDir, 'chrome');
  copyDir(distDir, chromeDir);

  // Read and modify manifest for Chrome (remove Firefox-specific fields)
  const manifestPath = path.join(chromeDir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  // Remove Firefox-specific settings
  delete manifest.browser_specific_settings;

  // Write modified manifest
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  // Create zip
  const zipPath = path.join(packagesDir, 'read-aloud-chrome-v1.0.0.zip');
  createZip(chromeDir, zipPath);

  console.log('✨ Chrome package ready!');
}

/**
 * Package for Firefox
 */
function packageFirefox() {
  console.log('\n🦊 Packaging for Firefox...');

  const firefoxDir = path.join(packagesDir, 'firefox');
  copyDir(distDir, firefoxDir);

  // Read and modify manifest for Firefox (convert to Manifest V2)
  const manifestPath = path.join(firefoxDir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  // Convert to Manifest V2 for Firefox
  manifest.manifest_version = 2;

  // Change action to browser_action
  manifest.browser_action = manifest.action;
  delete manifest.action;

  // Change background service_worker to scripts
  manifest.background = {
    scripts: ['background.js'],
    persistent: false
  };

  // Remove offscreen permission (not in MV2)
  manifest.permissions = manifest.permissions.filter(p => p !== 'offscreen');

  // Move host_permissions to permissions for MV2
  if (manifest.host_permissions) {
    manifest.permissions = [...manifest.permissions, ...manifest.host_permissions];
    delete manifest.host_permissions;
  }

  // Ensure browser_specific_settings exists
  if (!manifest.browser_specific_settings) {
    manifest.browser_specific_settings = {
      gecko: {
        id: 'read-aloud-tts@hodu-extensions.io',
        strict_min_version: '79.0'
      }
    };
  }

  // Write modified manifest
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  // Create zip
  const zipPath = path.join(packagesDir, 'read-aloud-firefox-v1.0.0.zip');
  createZip(firefoxDir, zipPath);

  console.log('✨ Firefox package ready (Manifest V2)!');
}

// Package based on target
if (target === 'chrome' || target === 'both') {
  packageChrome();
}

if (target === 'firefox' || target === 'both') {
  packageFirefox();
}

console.log('\n🎉 Packaging complete!');
console.log(`📁 Packages location: ${packagesDir}`);
console.log('\nNext steps:');
console.log('  Chrome: Upload packages/read-aloud-chrome-v1.0.0.zip to Chrome Web Store');
console.log('  Firefox: Upload packages/read-aloud-firefox-v1.0.0.zip to Firefox Add-ons');
