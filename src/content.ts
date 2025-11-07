/**
 * Content script - Runs in the context of web pages
 * Handles text selection and communication with background script
 */

import { MessageType, type Message } from './types';

/**
 * Get the currently selected text on the page
 */
function getSelectedText(): string {
  const selection = window.getSelection();
  return selection ? selection.toString().trim() : '';
}

/**
 * Listen for messages from the popup/background script
 */
chrome.runtime.onMessage.addListener(
  (message: Message, sender, sendResponse) => {
    if (message.type === MessageType.GET_SELECTED_TEXT) {
      const selectedText = getSelectedText();
      sendResponse({ text: selectedText });
    }
    return true; // Keep the message channel open for async response
  }
);

// Optional: Add context menu functionality (handled in background.ts)
// This script can be extended to show a floating button near selected text

console.log('Read Aloud content script loaded');
