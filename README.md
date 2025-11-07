# 🔊 Read Aloud - Browser Extension

A modern browser extension that reads selected text aloud using OpenAI's Text-to-Speech API.

Built with **Vue 3**, **TypeScript**, **Bun.sh**, and **Vite** for Manifest V3.

## ✨ Features

- 🎯 **Simple Text Selection**: Highlight any text on a webpage and click "Read Aloud"
- 🎙️ **Multiple Voices**: Choose from 6 different OpenAI voices (Alloy, Echo, Fable, Onyx, Nova, Shimmer)
- ⚡ **High Quality**: Support for both standard (tts-1) and HD (tts-1-hd) models
- 🎚️ **Speed Control**: Adjust playback speed from 0.25x to 4.0x
- 🖱️ **Context Menu**: Right-click selected text and choose "Read Aloud"
- 💾 **Persistent Settings**: Your API key and preferences are stored locally
- 🎨 **Modern UI**: Beautiful gradient interface built with Vue 3

## 📋 Prerequisites

- **Bun.js** runtime (v1.0+) - [Install Bun](https://bun.sh)
- **OpenAI API Key** - [Get your API key](https://platform.openai.com/api-keys)
- A modern browser (Chrome, Edge, or Brave)

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-username/hodu-extensions.git
cd hodu-extensions

# Install dependencies using Bun
bun install
```

### 2. Generate Icons

Before building, you need to generate PNG icons from the SVG source:

```bash
cd src/assets
./generate-icons.sh
# OR manually convert icon.svg to icon-16.png, icon-48.png, icon-128.png
cd ../..
```

### 3. Build the Extension

```bash
# Development build with watch mode
bun run dev

# Production build
bun run build
```

This will create a `dist/` directory with the compiled extension.

### 4. Load in Browser

#### Chrome/Edge/Brave:

1. Open `chrome://extensions/` (or `edge://extensions/`)
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `dist/` folder

#### Firefox:

1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Navigate to `dist/` and select `manifest.json`

### 5. Configure API Key

1. Click the extension icon in your browser toolbar
2. Enter your OpenAI API key in the settings
3. Choose your preferred voice and model
4. You're ready to go!

## 📖 Usage

### Method 1: Extension Popup

1. Highlight text on any webpage
2. Click the extension icon
3. Click "Read Selected Text"
4. Listen to the audio playback

### Method 2: Context Menu

1. Highlight text on any webpage
2. Right-click the selected text
3. Choose "Read Aloud" from the context menu
4. Audio will play automatically

### Stop Playback

- Click the extension icon and press "Stop" button
- Or select new text to interrupt current playback

## 🛠️ Development

### Project Structure

```
hodu-extensions/
├── src/
│   ├── popup.vue          # Vue 3 popup component
│   ├── popup.ts           # Popup entry point
│   ├── background.ts      # Service worker (API calls, audio)
│   ├── content.ts         # Content script (text selection)
│   ├── audioPlayer.ts     # Audio playback module
│   ├── types.ts           # TypeScript type definitions
│   └── assets/
│       ├── icon.svg       # Source icon
│       └── icon-*.png     # Generated PNG icons
├── manifest.json          # Extension manifest (V3)
├── popup.html            # Popup HTML template
├── package.json          # Dependencies
├── bunfig.toml          # Bun configuration
├── tsconfig.json        # TypeScript config
├── vite.config.ts       # Vite build config
└── README.md            # This file
```

### Available Scripts

```bash
# Development mode (watch and rebuild)
bun run dev

# Production build
bun run build

# Type checking
bun run type-check
```

### Tech Stack

- **Vue 3** - Reactive UI framework
- **TypeScript** - Type-safe JavaScript
- **Bun.sh** - Fast JavaScript runtime and bundler
- **Vite** - Modern build tool
- **Manifest V3** - Latest extension API
- **OpenAI API** - Text-to-Speech service

## 🔧 Configuration

### OpenAI API Settings

All settings are configured through the extension popup:

- **API Key**: Your OpenAI API key (required)
- **Model**:
  - `tts-1` - Standard quality (faster, cheaper)
  - `tts-1-hd` - High definition (better quality)
- **Voice**: Alloy, Echo, Fable, Onyx, Nova, or Shimmer
- **Speed**: 0.25x to 4.0x playback speed

### Storage

Settings are stored locally using `chrome.storage.local` and persist across sessions.

## 🔒 Security & Privacy

- ✅ API key is stored locally in your browser (never sent to third parties)
- ✅ Only text you explicitly select is sent to OpenAI
- ✅ No analytics or tracking
- ✅ No external dependencies at runtime
- ✅ Minimal permissions (only what's needed)

### Permissions Used

- `activeTab` - Access selected text on current tab
- `contextMenus` - Add "Read Aloud" to right-click menu
- `scripting` - Inject content script for text selection
- `storage` - Save your settings locally
- `https://api.openai.com/*` - Make API calls to OpenAI

## 📝 API Usage & Costs

This extension uses the OpenAI Text-to-Speech API. Pricing (as of 2024):

- **tts-1**: $0.015 per 1,000 characters
- **tts-1-hd**: $0.030 per 1,000 characters

Example: Reading a 500-word article (~3,000 characters) costs about $0.045 with tts-1.

See [OpenAI Pricing](https://openai.com/pricing) for current rates.

## 🐛 Troubleshooting

### "No API key configured"

Make sure you've entered your OpenAI API key in the extension popup settings.

### "Failed to read aloud"

- Check that your API key is valid
- Ensure you have sufficient credits in your OpenAI account
- Verify internet connection

### "No text selected"

Highlight text on the webpage before clicking "Read Selected Text".

### Extension doesn't load

- Make sure you've run `bun run build`
- Check that `dist/` folder exists
- Try reloading the extension in browser settings

### Icons not showing

- Run `./src/assets/generate-icons.sh` to generate PNG icons
- Or manually convert the SVG to PNG files

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- [OpenAI](https://openai.com) for the Text-to-Speech API
- [Vue.js](https://vuejs.org) for the reactive framework
- [Bun](https://bun.sh) for the fast runtime
- [Vite](https://vitejs.dev) for the build tool

## 📧 Support

If you encounter any issues or have questions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Open an issue on GitHub
3. Check OpenAI API status at [status.openai.com](https://status.openai.com)

## 🗺️ Roadmap

- [ ] Add support for Firefox Mobile
- [ ] Batch reading (multiple paragraphs)
- [ ] Download audio option
- [ ] Custom voice settings per website
- [ ] Keyboard shortcuts
- [ ] Reading progress indicator
- [ ] Support for other TTS providers

---

Made with ❤️ using Vue 3, TypeScript, and Bun.sh
