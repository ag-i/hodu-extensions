/**
 * Background service worker - Handles TTS API calls and audio playback
 */

import { MessageType, type Message, type TTSConfig, type TTSRequest, type PlaybackStatus } from './types';
import { audioPlayer } from './audioPlayer';

// Default configuration
const DEFAULT_CONFIG: TTSConfig = {
  apiKey: '',
  model: 'tts-1',
  voice: 'alloy',
  speed: 1.0
};

let currentConfig: TTSConfig = { ...DEFAULT_CONFIG };
let isPlaying = false;

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
 * Call OpenAI TTS API
 */
async function callOpenAITTS(text: string): Promise<Blob> {
  if (!currentConfig.apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const request: TTSRequest = {
    model: currentConfig.model,
    voice: currentConfig.voice,
    input: text,
    speed: currentConfig.speed,
    response_format: 'mp3'
  };

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${currentConfig.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`OpenAI API error: ${errorData.error?.message || errorData.error || response.statusText}`);
  }

  return await response.blob();
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
    updatePlaybackStatus();

    // Call OpenAI TTS API
    const audioBlob = await callOpenAITTS(text);

    // Play the audio
    await audioPlayer.play(audioBlob);

  } catch (error) {
    console.error('Error in readAloud:', error);
    throw error;
  } finally {
    isPlaying = false;
    updatePlaybackStatus();
  }
}

/**
 * Stop playback
 */
function stopPlayback(): void {
  audioPlayer.stop();
  isPlaying = false;
  updatePlaybackStatus();
}

/**
 * Update playback status to all listeners
 */
function updatePlaybackStatus(): void {
  const status: PlaybackStatus = {
    isPlaying
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
 * Handle messages from popup/content scripts
 */
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case MessageType.READ_ALOUD:
          const text = message.data?.text || await getSelectedTextFromActiveTab();
          await readAloud(text);
          sendResponse({ success: true });
          break;

        case MessageType.STOP_PLAYBACK:
          stopPlayback();
          sendResponse({ success: true });
          break;

        case MessageType.PLAYBACK_STATUS:
          sendResponse({
            success: true,
            data: { isPlaying }
          });
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
    stopPlayback,
    getConfig: () => currentConfig
  };
}

console.log('Read Aloud background service worker loaded');
