/**
 * Background service worker - Handles TTS API calls and audio playback
 */

import { MessageType, type Message, type TTSConfig, type TTSRequest, type PlaybackStatus } from './types';

// Default configuration
const DEFAULT_CONFIG: TTSConfig = {
  apiUrl: 'http://localhost:8880/v1',
  apiKey: '',
  model: 'tts-1',
  voice: 'alloy',
  speed: 1.0,
  volume: 1.0
};

let currentConfig: TTSConfig = { ...DEFAULT_CONFIG };
let isPlaying = false;
let isPaused = false;

// Detect if we're in Firefox (which doesn't support offscreen documents)
const isFirefox = typeof (globalThis as any).browser !== 'undefined' ||
                  navigator.userAgent.includes('Firefox');

/**
 * Ensure offscreen document exists for audio playback (Chrome only)
 */
async function ensureOffscreenDocument(): Promise<void> {
  // Firefox doesn't support offscreen documents, skip
  if (isFirefox) {
    return;
  }

  try {
    // @ts-ignore - offscreen API types not yet in @types/chrome
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT']
    });

    if (existingContexts.length > 0) {
      return;
    }

    // @ts-ignore - offscreen API types not yet in @types/chrome
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'Playing TTS audio from API response'
    });
  } catch (error) {
    console.warn('Offscreen document not supported, using fallback');
  }
}

/**
 * Convert blob to base64
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove the data:audio/mpeg;base64, prefix
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Load configuration from storage
 */
async function loadConfig(): Promise<TTSConfig> {
  try {
    const result = await chrome.storage.local.get('config');
    if (result.config) {
      currentConfig = { ...DEFAULT_CONFIG, ...result.config };
    }
  } catch (error) {
    console.error('Failed to load config:', error);
  }
  return currentConfig;
}

/**
 * Save configuration to storage
 */
async function saveConfig(config: TTSConfig): Promise<void> {
  try {
    await chrome.storage.local.set({ config });
    currentConfig = config;
  } catch (error) {
    console.error('Failed to save config:', error);
  }
}

/**
 * Call OpenAI TTS API (or compatible local API)
 */
async function callOpenAITTS(text: string): Promise<Blob> {
  if (!currentConfig.apiUrl) {
    throw new Error('API URL not configured');
  }

  // Construct the full API endpoint URL
  let apiEndpoint = currentConfig.apiUrl.trim();
  // Remove trailing slash if present
  if (apiEndpoint.endsWith('/')) {
    apiEndpoint = apiEndpoint.slice(0, -1);
  }
  // Add the speech endpoint if not already included
  if (!apiEndpoint.endsWith('/audio/speech')) {
    apiEndpoint = `${apiEndpoint}/audio/speech`;
  }

  // Detect if this is OpenAI's official API or a local/custom API
  const isOpenAIAPI = apiEndpoint.includes('api.openai.com');

  // Build request based on API type
  let request: any;
  if (isOpenAIAPI) {
    // Standard OpenAI API format
    request = {
      model: currentConfig.model,
      voice: currentConfig.voice,
      input: text,
      speed: currentConfig.speed,
      response_format: 'mp3'
    };
  } else {
    // Local/custom API format (like Kokoro TTS) - matching HAR file format exactly
    request = {
      input: text,
      voice: currentConfig.voice,
      response_format: 'mp3',
      download_format: 'mp3',
      stream: true,
      speed: Math.round(currentConfig.speed) || 1,
      return_download_link: true
    };
    // DO NOT add model field for local APIs - they don't support it
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  // Add authorization header if API key is provided
  if (currentConfig.apiKey && currentConfig.apiKey.trim()) {
    headers['Authorization'] = `Bearer ${currentConfig.apiKey}`;
  }

  try {
    console.log('[TTS] Calling API:', apiEndpoint);
    console.log('[TTS] Is OpenAI API:', isOpenAIAPI);
    console.log('[TTS] Request:', request);

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      mode: 'cors',
      headers,
      body: JSON.stringify(request)
    });

    console.log('[TTS] Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`TTS API error (${response.status}): ${errorData.error?.message || errorData.error || response.statusText}`);
    }

    const blob = await response.blob();
    console.log('[TTS] Received blob, size:', blob.size);
    return blob;
  } catch (error) {
    console.error('[TTS] Fetch error:', error);

    if (error instanceof TypeError && error.message.includes('fetch')) {
      const errorMsg = `Failed to connect to API at ${apiEndpoint}.\n\nPossible issues:\n1. CORS: Your API server needs to allow requests from chrome-extension://\n2. Network: Check if ${currentConfig.apiUrl} is accessible\n3. Firewall: Ensure port ${new URL(apiEndpoint).port || '80'} is open\n\nTip: Check browser console (F12) for CORS errors`;
      throw new Error(errorMsg);
    }
    throw error;
  }
}

/**
 * Read aloud the given text
 */
async function readAloud(text: string): Promise<void> {
  if (!text || text.trim().length === 0) {
    throw new Error('No text provided');
  }

  try {
    isPlaying = true;
    isPaused = false;
    updatePlaybackStatus();

    // Ensure offscreen document exists
    await ensureOffscreenDocument();

    // Call TTS API
    const audioBlob = await callOpenAITTS(text);

    // Convert blob to base64
    const audioBase64 = await blobToBase64(audioBlob);

    // Send to offscreen document for playback (Chrome) or popup (Firefox)
    const messageType = isFirefox ? 'PLAY_AUDIO_IN_POPUP' : 'PLAY_AUDIO';
    await chrome.runtime.sendMessage({
      type: messageType,
      data: {
        audioData: audioBase64,
        volume: currentConfig.volume
      }
    }).catch((err) => {
      console.error('Failed to send audio to player:', err);
      // Fallback: try the other method
      const fallbackType = isFirefox ? 'PLAY_AUDIO' : 'PLAY_AUDIO_IN_POPUP';
      chrome.runtime.sendMessage({
        type: fallbackType,
        data: {
          audioData: audioBase64,
          volume: currentConfig.volume
        }
      }).catch(() => {});
    });

  } catch (error) {
    console.error('Error in readAloud:', error);
    isPlaying = false;
    isPaused = false;
    updatePlaybackStatus();
    throw error;
  }
}

/**
 * Pause playback
 */
async function pausePlayback(): Promise<void> {
  if (isPlaying && !isPaused) {
    await chrome.runtime.sendMessage({ type: 'PAUSE_AUDIO' }).catch(() => {});
    isPaused = true;
    updatePlaybackStatus();
  }
}

/**
 * Resume playback
 */
async function resumePlayback(): Promise<void> {
  if (isPlaying && isPaused) {
    await chrome.runtime.sendMessage({ type: 'RESUME_AUDIO' }).catch(() => {});
    isPaused = false;
    updatePlaybackStatus();
  }
}

/**
 * Stop playback
 */
async function stopPlayback(): Promise<void> {
  await chrome.runtime.sendMessage({ type: 'STOP_AUDIO' }).catch(() => {});
  isPlaying = false;
  isPaused = false;
  updatePlaybackStatus();
}

/**
 * Update playback status to all listeners
 */
function updatePlaybackStatus(): void {
  const status: PlaybackStatus = {
    isPlaying,
    isPaused
  };

  // Notify all extension pages (popup, options, etc.)
  chrome.runtime.sendMessage({
    type: MessageType.PLAYBACK_STATUS,
    data: status
  }).catch(() => {
    // Ignore errors if no listeners
  });
}

/**
 * Get selected text from active tab
 */
async function getSelectedTextFromActiveTab(): Promise<string> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.id) {
    throw new Error('No active tab found');
  }

  // Inject content script if not already injected
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
  } catch (error) {
    // Content script might already be injected
    console.log('Content script injection skipped:', error);
  }

  // Get selected text
  const response = await chrome.tabs.sendMessage(tab.id, {
    type: MessageType.GET_SELECTED_TEXT
  });

  return response.text || '';
}

/**
 * Handle messages from popup/content scripts and offscreen document
 */
chrome.runtime.onMessage.addListener((message: Message | any, sender, sendResponse) => {
  (async () => {
    try {
      // Handle messages from offscreen document
      if (message.type === 'AUDIO_ENDED') {
        isPlaying = false;
        isPaused = false;
        updatePlaybackStatus();
        return;
      }

      if (message.type === 'AUDIO_ERROR') {
        console.error('Audio playback error from offscreen:', message.data?.error);
        isPlaying = false;
        isPaused = false;
        updatePlaybackStatus();
        return;
      }

      // Handle messages from popup/content scripts
      switch (message.type) {
        case MessageType.READ_ALOUD:
          const text = message.data?.text || await getSelectedTextFromActiveTab();
          await readAloud(text);
          sendResponse({ success: true });
          break;

        case MessageType.PAUSE_PLAYBACK:
          await pausePlayback();
          sendResponse({ success: true });
          break;

        case MessageType.RESUME_PLAYBACK:
          await resumePlayback();
          sendResponse({ success: true });
          break;

        case MessageType.STOP_PLAYBACK:
          await stopPlayback();
          sendResponse({ success: true });
          break;

        case MessageType.PLAYBACK_STATUS:
          sendResponse({
            success: true,
            data: { isPlaying, isPaused }
          });
          break;

        case 'SET_VOLUME':
          // Forward volume update to offscreen document
          await chrome.runtime.sendMessage({
            type: 'SET_VOLUME',
            data: { volume: message.data.volume }
          }).catch(() => {});
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })();

  return true; // Keep message channel open for async response
});

/**
 * Create context menu
 */
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'read-aloud',
    title: 'Read Aloud',
    contexts: ['selection']
  });
});

/**
 * Handle context menu clicks
 */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'read-aloud' && info.selectionText) {
    try {
      await readAloud(info.selectionText);
    } catch (error) {
      console.error('Error reading aloud from context menu:', error);
    }
  }
});

// Load configuration on startup
loadConfig();

// Export for testing/debugging
if (typeof globalThis !== 'undefined') {
  (globalThis as any).backgroundAPI = {
    loadConfig,
    saveConfig,
    readAloud,
    pausePlayback,
    resumePlayback,
    stopPlayback,
    getConfig: () => currentConfig
  };
}

console.log('Read Aloud background service worker loaded');
