<template>
  <div class="popup-container">
    <header>
      <h1>🔊 Read Aloud</h1>
    </header>

    <main>
      <!-- Status Display -->
      <div v-if="isPlaying" class="status playing">
        <div class="spinner"></div>
        <span>Playing...</span>
      </div>
      <div v-else-if="error" class="status error">
        <span>{{ error }}</span>
      </div>
      <div v-else class="status ready">
        <span>Ready</span>
      </div>

      <!-- Action Buttons -->
      <div class="actions">
        <button
          @click="readAloud"
          :disabled="isPlaying || !config.apiUrl"
          class="btn btn-primary"
        >
          <span class="icon">▶️</span>
          Read Selected Text
        </button>

        <div class="button-row">
          <button
            v-if="!isPaused"
            @click="pausePlayback"
            :disabled="!isPlaying"
            class="btn btn-secondary"
          >
            <span class="icon">⏸️</span>
            Pause
          </button>

          <button
            v-else
            @click="resumePlayback"
            class="btn btn-secondary"
          >
            <span class="icon">▶️</span>
            Resume
          </button>

          <button
            @click="stopPlayback"
            :disabled="!isPlaying"
            class="btn btn-secondary"
          >
            <span class="icon">⏹️</span>
            Stop
          </button>
        </div>
      </div>

      <!-- Configuration -->
      <div class="config">
        <h2>Settings</h2>

        <div class="form-group">
          <label for="apiUrl">API URL</label>
          <input
            id="apiUrl"
            v-model="config.apiUrl"
            type="text"
            placeholder="http://localhost:8880/v1"
            @change="saveConfig"
          />
          <small>Local or remote OpenAI-compatible API endpoint</small>
        </div>

        <div class="form-group">
          <label for="apiKey">API Key (Optional)</label>
          <input
            id="apiKey"
            v-model="config.apiKey"
            type="password"
            placeholder="Leave empty if not required"
            @change="saveConfig"
          />
          <small>Your API key is stored locally</small>
        </div>

        <div class="form-group">
          <label for="model">Model</label>
          <select id="model" v-model="config.model" @change="saveConfig">
            <option value="tts-1">tts-1 (Standard)</option>
            <option value="tts-1-hd">tts-1-hd (High Quality)</option>
          </select>
        </div>

        <div class="form-group">
          <label for="voice">Voice</label>
          <select id="voice" v-model="config.voice" @change="saveConfig">
            <option value="alloy">Alloy</option>
            <option value="echo">Echo</option>
            <option value="fable">Fable</option>
            <option value="onyx">Onyx</option>
            <option value="nova">Nova</option>
            <option value="shimmer">Shimmer</option>
          </select>
        </div>

        <div class="form-group">
          <label for="speed">
            Speed: {{ config.speed.toFixed(1) }}x
          </label>
          <input
            id="speed"
            v-model.number="config.speed"
            type="range"
            min="0.25"
            max="4.0"
            step="0.25"
            @change="saveConfig"
          />
        </div>

        <div class="form-group">
          <label for="volume">
            Volume: {{ (config.volume * 100).toFixed(0) }}%
          </label>
          <input
            id="volume"
            v-model.number="config.volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            @change="saveConfig"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { MessageType, type TTSConfig } from './types';

const DEFAULT_CONFIG: TTSConfig = {
  apiUrl: 'http://localhost:8880/v1',
  apiKey: '',
  model: 'tts-1',
  voice: 'alloy',
  speed: 1.0,
  volume: 1.0
};

const config = ref<TTSConfig>({ ...DEFAULT_CONFIG });
const isPlaying = ref(false);
const isPaused = ref(false);
const error = ref('');

/**
 * Load configuration from storage
 */
async function loadConfig() {
  try {
    const result = await chrome.storage.local.get('config');
    if (result.config) {
      config.value = { ...DEFAULT_CONFIG, ...result.config };
    }
  } catch (err) {
    console.error('Failed to load config:', err);
  }
}

/**
 * Save configuration to storage
 */
async function saveConfig() {
  try {
    await chrome.storage.local.set({ config: config.value });
  } catch (err) {
    console.error('Failed to save config:', err);
    error.value = 'Failed to save settings';
  }
}

/**
 * Read aloud selected text
 */
async function readAloud() {
  error.value = '';
  isPlaying.value = true;

  try {
    const response = await chrome.runtime.sendMessage({
      type: MessageType.READ_ALOUD
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to read aloud');
    }
  } catch (err) {
    console.error('Error reading aloud:', err);
    error.value = err instanceof Error ? err.message : 'Failed to read aloud';
  } finally {
    isPlaying.value = false;
  }
}

/**
 * Pause playback
 */
async function pausePlayback() {
  try {
    await chrome.runtime.sendMessage({
      type: MessageType.PAUSE_PLAYBACK
    });
    isPaused.value = true;
  } catch (err) {
    console.error('Error pausing playback:', err);
  }
}

/**
 * Resume playback
 */
async function resumePlayback() {
  try {
    await chrome.runtime.sendMessage({
      type: MessageType.RESUME_PLAYBACK
    });
    isPaused.value = false;
  } catch (err) {
    console.error('Error resuming playback:', err);
  }
}

/**
 * Stop playback
 */
async function stopPlayback() {
  try {
    await chrome.runtime.sendMessage({
      type: MessageType.STOP_PLAYBACK
    });
    isPlaying.value = false;
    isPaused.value = false;
  } catch (err) {
    console.error('Error stopping playback:', err);
  }
}

/**
 * Listen for playback status updates
 */
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === MessageType.PLAYBACK_STATUS) {
    isPlaying.value = message.data.isPlaying;
    isPaused.value = message.data.isPaused;
  }
});

// Load config on mount
onMounted(() => {
  loadConfig();
});
</script>

<style scoped>
.popup-container {
  width: 400px;
  min-height: 500px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
}

header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  text-align: center;
}

header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

main {
  padding: 20px;
}

.status {
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
  font-weight: 500;
}

.status.ready {
  background: #e3f2fd;
  color: #1976d2;
}

.status.playing {
  background: #fff3e0;
  color: #f57c00;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.status.error {
  background: #ffebee;
  color: #c62828;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #f57c00;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.button-row {
  display: flex;
  gap: 10px;
}

.button-row .btn {
  flex: 1;
}

.btn {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #e0e0e0;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  background: #d0d0d0;
}

.config {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.config h2 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #555;
  font-size: 14px;
}

.form-group input[type="password"],
.form-group input[type="text"],
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input[type="range"] {
  width: 100%;
}

.form-group small {
  display: block;
  margin-top: 4px;
  color: #888;
  font-size: 12px;
}

.icon {
  font-size: 18px;
}
</style>
