/**
 * Audio player module for playing TTS audio
 */

export class AudioPlayer {
  private audio: HTMLAudioElement | null = null;
  private currentBlobUrl: string | null = null;
  private _volume: number = 1.0;

  /**
   * Play audio from a Blob
   */
  async play(audioBlob: Blob, volume: number = 1.0): Promise<void> {
    // Stop any currently playing audio
    this.stop();

    // Create a new Audio element
    this.currentBlobUrl = URL.createObjectURL(audioBlob);
    this.audio = new Audio(this.currentBlobUrl);
    this.audio.volume = volume;
    this._volume = volume;

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
   * Pause playback
   */
  pause(): void {
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
    }
  }

  /**
   * Resume playback
   */
  resume(): void {
    if (this.audio && this.audio.paused) {
      this.audio.play().catch((error) => {
        console.error('Failed to resume playback:', error);
      });
    }
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
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    this._volume = Math.max(0, Math.min(1, volume));
    if (this.audio) {
      this.audio.volume = this._volume;
    }
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this._volume;
  }

  /**
   * Check if audio is currently playing
   */
  isPlaying(): boolean {
    return this.audio !== null && !this.audio.paused;
  }

  /**
   * Check if audio is paused
   */
  isPaused(): boolean {
    return this.audio !== null && this.audio.paused && this.audio.currentTime > 0;
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
