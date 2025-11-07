/**
 * Type definitions for the Read Aloud browser extension
 */

export interface TTSConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  voice: string;
  speed: number;
  volume: number;
}

export interface TTSRequest {
  model: string;
  voice: string;
  input: string;
  speed?: number;
  response_format?: 'mp3' | 'opus' | 'aac' | 'flac';
}

export interface TTSResponse {
  audio: Blob;
}

export enum MessageType {
  GET_SELECTED_TEXT = 'GET_SELECTED_TEXT',
  TEXT_SELECTED = 'TEXT_SELECTED',
  READ_ALOUD = 'READ_ALOUD',
  PAUSE_PLAYBACK = 'PAUSE_PLAYBACK',
  RESUME_PLAYBACK = 'RESUME_PLAYBACK',
  STOP_PLAYBACK = 'STOP_PLAYBACK',
  PLAYBACK_STATUS = 'PLAYBACK_STATUS',
  ERROR = 'ERROR'
}

export interface Message {
  type: MessageType;
  data?: any;
}

export interface PlaybackStatus {
  isPlaying: boolean;
  isPaused: boolean;
  currentText?: string;
}

export interface StorageData {
  config: TTSConfig;
}

export interface ErrorResponse {
  error: string;
  details?: any;
}
