# Packaging Guide

This guide explains how to build distributable packages for Chrome and Firefox.

## Build Packages

### Build Both Chrome and Firefox

```bash
npm run package
```

This will:
1. Build the extension (`npm run build`)
2. Create `packages/chrome/` folder with Chrome-optimized manifest
3. Create `packages/firefox/` folder with Firefox-specific settings
4. Generate zip files ready for store submission:
   - `packages/read-aloud-chrome-v1.0.0.zip`
   - `packages/read-aloud-firefox-v1.0.0.zip`

### Build Chrome Only

```bash
npm run package:chrome
```

### Build Firefox Only

```bash
npm run package:firefox
```

## Package Differences

### Chrome Package
- Removes `browser_specific_settings` from manifest
- Uses offscreen document for audio playback
- Ready for Chrome Web Store

### Firefox Package
- Includes `browser_specific_settings` with extension ID
- Falls back to popup-based audio playback
- Ready for Firefox Add-ons (AMO)

## Distribution

### Chrome Web Store

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click "New Item"
3. Upload `packages/read-aloud-chrome-v1.0.0.zip`
4. Fill in store listing details
5. Submit for review

### Firefox Add-ons

1. Go to [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/)
2. Click "Submit a New Add-on"
3. Upload `packages/read-aloud-firefox-v1.0.0.zip`
4. Choose "On this site" distribution
5. Fill in listing details
6. Submit for review

## Testing Packages

### Test Chrome Package

```bash
# Extract the zip
unzip packages/read-aloud-chrome-v1.0.0.zip -d test-chrome

# Load in Chrome
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the test-chrome/chrome folder
```

### Test Firefox Package

```bash
# Extract the zip
unzip packages/read-aloud-firefox-v1.0.0.zip -d test-firefox

# Load in Firefox
# 1. Go to about:debugging#/runtime/this-firefox
# 2. Click "Load Temporary Add-on"
# 3. Select any file in test-firefox/firefox folder
```

## Version Updates

To release a new version:

1. Update version in `package.json`
2. Update version in `manifest.json`
3. Run `npm run package`
4. Upload new packages to respective stores

## Files Structure

```
packages/
├── chrome/
│   ├── manifest.json          # Chrome manifest (no browser_specific_settings)
│   ├── background.js
│   ├── offscreen.js
│   ├── popup.html
│   └── assets/
├── firefox/
│   ├── manifest.json          # Firefox manifest (with browser_specific_settings)
│   ├── background.js
│   ├── offscreen.js
│   ├── popup.html
│   └── assets/
├── read-aloud-chrome-v1.0.0.zip
└── read-aloud-firefox-v1.0.0.zip
```

## Automated Process

The packaging script (`scripts/package.js`):
1. Cleans `packages/` directory
2. Copies `dist/` to `packages/chrome/` and `packages/firefox/`
3. Modifies Chrome manifest to remove Firefox-specific fields
4. Creates zip files for both browsers
5. Provides upload instructions

## Notes

- Both packages work from the same source code
- Browser detection happens at runtime (no build-time differences)
- Chrome uses offscreen documents, Firefox uses popup audio player
- Packages folder is git-ignored (won't be committed)
