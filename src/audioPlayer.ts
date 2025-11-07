/**
 * Audio player module for playing TTS audio
 */

export class AudioPlayer {
  private audio: HTMLAudioElement | null = null;
  private currentBlobUrl: string | null = null;

  /**
   * Play audio from a Blob
   */
  async play(audioBlob: Blob): Promise<void> {
    // Stop any currently playing audio
    this.stop();

    // Create a new Audio element
    this.currentBlobUrl = URL.createObjectURL(audioBlob);
    this.audio = new Audio(this.currentBlobUrl);

    // Return a promise that resolves when playback ends
    return new Promise((resolve, reject) => {
      if (!this.audio) {
        reject(new Error('Audio element not initialized'));
        return;
      }

      this.audio.onended = () => {
        this.cleanup();
        resolve();
      };

      this.audio.onerror = (error) => {
        this.cleanup();
        reject(error);
      };

      this.audio.play().catch(reject);
    });
  }

  /**
   * Stop playback and cleanup resources
   */
  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.cleanup();
  }

  /**
   * Check if audio is currently playing
   */
  isPlaying(): boolean {
    return this.audio !== null && !this.audio.paused;
  }

  /**
   * Cleanup audio resources
   */
  private cleanup(): void {
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }
    this.audio = null;
  }
}

// Export a singleton instance
export const audioPlayer = new AudioPlayer();
