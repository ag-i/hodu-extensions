/**
 * Offscreen document for audio playback
 * Service workers can't play audio, so we use an offscreen document
 */

let audio: HTMLAudioElement | null = null;
let currentBlobUrl: string | null = null;

/**
 * Play audio from base64 encoded blob
 */
function playAudio(audioData: string, volume: number = 1.0): void {
  // Stop any currently playing audio
  stopAudio();

  // Convert base64 to blob
  const byteCharacters = atob(audioData);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'audio/mpeg' });

  // Create audio element
  currentBlobUrl = URL.createObjectURL(blob);
  audio = new Audio(currentBlobUrl);
  audio.volume = volume;

  audio.onended = () => {
    cleanup();
    chrome.runtime.sendMessage({
      type: 'AUDIO_ENDED'
    }).catch(() => {});
  };

  audio.onerror = (error) => {
    cleanup();
    chrome.runtime.sendMessage({
      type: 'AUDIO_ERROR',
      data: { error: 'Audio playback error' }
    }).catch(() => {});
  };

  audio.play().catch((error) => {
    cleanup();
    chrome.runtime.sendMessage({
      type: 'AUDIO_ERROR',
      data: { error: error.message }
    }).catch(() => {});
  });
}

/**
 * Pause audio playback
 */
function pauseAudio(): void {
  if (audio && !audio.paused) {
    audio.pause();
  }
}

/**
 * Resume audio playback
 */
function resumeAudio(): void {
  if (audio && audio.paused) {
    audio.play().catch((error) => {
      console.error('Failed to resume playback:', error);
    });
  }
}

/**
 * Stop audio playback
 */
function stopAudio(): void {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
  cleanup();
}

/**
 * Set audio volume
 */
function setVolume(volume: number): void {
  if (audio) {
    audio.volume = Math.max(0, Math.min(1, volume));
  }
}

/**
 * Cleanup audio resources
 */
function cleanup(): void {
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl);
    currentBlobUrl = null;
  }
  audio = null;
}

/**
 * Handle messages from background script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    switch (message.type) {
      case 'PLAY_AUDIO':
        playAudio(message.data.audioData, message.data.volume);
        sendResponse({ success: true });
        break;

      case 'PAUSE_AUDIO':
        pauseAudio();
        sendResponse({ success: true });
        break;

      case 'RESUME_AUDIO':
        resumeAudio();
        sendResponse({ success: true });
        break;

      case 'STOP_AUDIO':
        stopAudio();
        sendResponse({ success: true });
        break;

      case 'SET_VOLUME':
        setVolume(message.data.volume);
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('Error handling offscreen message:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  return true;
});

console.log('Audio offscreen document loaded');
