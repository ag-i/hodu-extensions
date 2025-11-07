# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a browser extension repository for **hodu-extensions**, which currently contains the **Custom TTS Reader** extension as a git submodule from https://github.com/BassGaming/customtts.git.

### Structure

```
hodu-extensions/
└── customtts/              # Git submodule - Custom TTS Reader browser extension
    ├── manifest.json       # Extension manifest (v2)
    ├── background.js       # Service worker handling TTS API calls
    ├── popup.html/js       # Browser action popup UI
    ├── options.html/js     # Extension options page
    └── icons/              # Extension icons
```

## Custom TTS Reader Extension

### Architecture

The extension is a Firefox/Chrome-compatible browser extension (manifest v2) that converts selected text to speech using an OpenAI-compatible TTS API.

**Core Components:**

1. **background.js** (Service Worker)
   - Main TTS processing logic
   - API communication with TTS backend
   - Audio playback management (mp3 and PCM streaming)
   - Mobile/desktop platform detection
   - Three modes: split-text mode, streaming mode, download mode

2. **popup.js** (Browser Action UI)
   - Settings interface in popup
   - Configuration management (API URL, key, voice, speed, volume)
   - Stop playback control

3. **options.js** (Options Page)
   - Full settings page with identical functionality to popup
   - Accessed via browser extension settings

### Key Features & Implementation Details

**Text Processing Modes:**

1. **Split-Text Mode** (default for text > 200 chars)
   - Splits text into sentences using regex: `/[^.。\n]*[.。\n]|[^.。\n]+$/g`
   - Supports English (.) and Chinese (。) sentence endings
   - Queues sentence audio sequentially
   - Each sentence fetched as separate MP3

2. **Streaming Mode** (`streamingMode: true`)
   - Uses PCM audio format for low-latency playback
   - Processes PCM stream using Web Audio API
   - Sample rate: 24000 Hz, mono channel
   - Real-time audio buffer creation and scheduling
   - Cannot be enabled with download mode

3. **Download Mode** (`downloadMode: true`)
   - Desktop: Uses browser.downloads.download API
   - Mobile: Injects content script to trigger download
   - Filenames: `tts-audio-YYYY-MM-DD_HH-MM-SS.mp3`
   - Mutually exclusive with streaming mode

**Platform Handling:**

- Detects mobile (Android) using `browser.runtime.getPlatformInfo()`
- Mobile: Browser action shows no popup, handles click directly
- Desktop: Shows popup and uses context menu
- Context menu: "Read Selected Text" on text selection

**API Integration:**

- Endpoint: `{apiUrl}/audio/speech`
- Default: `http://host.docker.internal:8880/v1`
- Payload format:
  ```javascript
  {
    model: "kokoro",
    input: text,
    voice: "af_bella+af_sky",
    response_format: "mp3" | "pcm",
    speed: 1.0
  }
  ```
- Authorization: Bearer token (default: "not-needed")

**State Management:**

- Uses `browser.storage.local` for persistence
- Settings: `apiUrl`, `apiKey`, `speechSpeed`, `voice`, `model`, `streamingMode`, `downloadMode`, `outputVolume`
- Listens to storage changes for real-time config updates
- Audio queue management for sequential playback
- Abort controller for cancellable requests

**Audio Playback:**

- MP3 mode: Uses Audio API with blob URLs
- PCM mode: Web Audio API with custom buffer creation
- Volume control via GainNode (0-1 range)
- Stop functionality clears queue and aborts in-flight requests

### Development Notes

**Browser Compatibility:**
- Uses `browser.*` namespace (WebExtensions API)
- Compatible with Firefox and Chrome (with polyfill)
- Manifest v2 (not v3)
- Minimum Firefox version: 79.0

**Permissions Required:**
- `storage` - Persist settings
- `contextMenus` - Add "Read Selected Text" option
- `activeTab`, `tabs` - Access selected text
- `webRequest`, `webRequestBlocking` - Intercept requests if needed
- `downloads` - Download audio files
- `<all_urls>` - Fetch from any TTS API endpoint

**Important Implementation Details:**

1. **Text Splitting**: The regex handles English, Chinese, and line breaks. Be careful when modifying to not break sentence detection.

2. **PCM Audio Processing**: The streaming implementation (background.js:486-564) uses precise byte alignment:
   - 2 bytes per sample (16-bit)
   - Handles leftover bytes between chunks
   - Schedules audio to prevent gaps using `pcmPlaybackTime`
   - Little-endian signed 16-bit PCM decoding

3. **Mobile Download Workaround**: Mobile Firefox doesn't support `browser.downloads.download`, so the extension injects a content script that creates a temporary `<a>` element to trigger download (background.js:387-484).

4. **Mutual Exclusivity**: Streaming and download modes cannot be enabled simultaneously. The UI enforces this in both popup.js and options.js.

5. **Audio Queue**: The sentence-based playback uses a queue to ensure sequential playback without gaps or overlaps (background.js:12-172).

### Working with This Codebase

**When modifying the extension:**

- Remember this is a **git submodule** - changes should typically be made in the upstream repository
- Test on both desktop and mobile Firefox/Chrome
- Verify all three modes: split-text, streaming, download
- Test volume control, stop functionality, and settings persistence
- Check sentence splitting with mixed English/Chinese text
- Verify PCM streaming doesn't introduce audio artifacts or gaps

**Testing locally:**

- Firefox: about:debugging → "This Firefox" → Load Temporary Add-on → select manifest.json
- Chrome: chrome://extensions → Developer mode → Load unpacked → select customtts folder

**Common pitfalls:**

- Don't use `chrome.*` API directly - use `browser.*` for cross-browser compatibility
- Be careful with URL construction - the code handles both trailing slash and no trailing slash cases
- PCM audio timing is critical - modifying the playback scheduling can cause audio glitches
- Mobile detection affects UI behavior - test both platforms when changing interaction flow
