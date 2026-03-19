/**
 * Session Management Service
 * Handles session reuse and management for Selenium instances
 */

import { getDeviceFingerprintHash } from './deviceFingerprint';

export interface SessionInfo {
  sessionId: string;
  deviceHash: string;
  status: string;
  startTime: string;
  endTime?: string;
  error?: string;
  localStorageCode?: string;
  username?: string;
  avatarSrc?: string;
}

export interface SessionRequest {
  deviceHash: string;
  uid?: string; // User ID from frontend query parameter
  parameters?: any;
}

export interface SessionResponse {
  sessionId: string;
  isNew: boolean;
  existingSession?: SessionInfo;
}

/**
 * Session Manager Class
 */
export class SessionManager {
  private static instance: SessionManager;
  private deviceHash: string;
  private serverUrl: string;
  private storageKey: string;
  private uid: string | null;

  private constructor() {
    this.deviceHash = getDeviceFingerprintHash();
    // Use environment variable if available, otherwise detect based on environment
    this.serverUrl = this.getServerUrl();
    this.uid = this.extractUidFromUrl();
    this.storageKey = `telegram_session_${this.deviceHash}_${this.uid || 'no_uid'}`;
  }

  /**
   * Determines the server URL based on environment variables or current context
   */
  private getServerUrl(): string {
    // Check for explicit API URL in environment variables
    const envApiUrl = import.meta.env.VITE_API_URL;
    if (envApiUrl) {
      // Validate that it's a complete URL
      try {
        const url = new URL(envApiUrl);
        console.log('🔍 Using API URL from VITE_API_URL:', url.toString());
        return url.toString().replace(/\/$/, ''); // Remove trailing slash
      } catch (error) {
        console.error('❌ Invalid VITE_API_URL format:', envApiUrl, error);
        // Fall through to default behavior
      }
    }

    // In development, use localhost
    if (import.meta.env.DEV) {
      const devUrl = 'http://localhost:3000';
      console.log('🔍 Development mode: Using', devUrl);
      return devUrl;
    }

    // In production/Telegram mini app, try to use the same origin or a relative path
    // This assumes the backend is served from the same domain or a configured domain
    const origin = window.location.origin;
    
    // If we're on localhost in production mode (unlikely but possible), use localhost
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      const localhostUrl = 'http://localhost:3000';
      console.log('🔍 Localhost detected: Using', localhostUrl);
      return localhostUrl;
    }

    // Otherwise, try to construct URL from current origin
    // This assumes backend is on the same domain but different port
    // You should set VITE_API_URL in production instead
    const constructedUrl = origin.replace(/:\d+$/, ':3000'); // Replace port with 3000
    console.warn('⚠️ No VITE_API_URL set. Constructed URL:', constructedUrl);
    console.warn('⚠️ For production, set VITE_API_URL environment variable to your backend URL (e.g., https://your-backend.com)');
    return constructedUrl;
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Extracts UID from URL query parameters
   */
  private extractUidFromUrl(): string | null {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const uid = urlParams.get('uid');
      console.log('🔍 Extracted UID from URL:', uid);
      return uid;
    } catch (error) {
      console.warn('Failed to extract UID from URL:', error);
      return null;
    }
  }

  /**
   * Gets the current UID
   */
  public getUid(): string | null {
    return this.uid;
  }

  /**
   * Gets the current session ID from localStorage (shared across tabs)
   */
  private getCurrentSessionIdFromStorage(): string | null {
    try {
      const sessionId = localStorage.getItem(this.storageKey);
      console.log('🔍 getCurrentSessionIdFromStorage:', this.storageKey, '=', sessionId);
      return sessionId;
    } catch (error) {
      console.warn('Failed to read session from localStorage:', error);
      return null;
    }
  }

  /**
   * Sets the current session ID in localStorage (shared across tabs)
   */
  private setCurrentSessionIdInStorage(sessionId: string): void {
    try {
      console.log('🔍 setCurrentSessionIdInStorage:', this.storageKey, '=', sessionId);
      localStorage.setItem(this.storageKey, sessionId);
    } catch (error) {
      console.warn('Failed to save session to localStorage:', error);
    }
  }

  /**
   * Clears the current session ID from localStorage (shared across tabs)
   */
  private clearCurrentSessionIdFromStorage(): void {
    try {
      console.log('🔍 clearCurrentSessionIdFromStorage:', this.storageKey);
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn('Failed to clear session from localStorage:', error);
    }
  }

  /**
   * Gets or creates a session for the current device
   */
  public async getOrCreateSession(parameters?: any, _retryCount = 0): Promise<SessionResponse> {
    try {
      console.log('🔍 SessionManager.getOrCreateSession called');
      console.log('🔍 Device Hash:', this.deviceHash);
      console.log('🔍 Storage Key:', this.storageKey);
      
      // Check if we already have a current session in localStorage (shared across tabs)
      const existingSessionId = this.getCurrentSessionIdFromStorage();
      console.log('🔍 Existing session ID from storage:', existingSessionId);
      
      if (existingSessionId) {
        console.log('🔄 Found existing session in storage:', existingSessionId);
        
        // Verify the session is still valid on the backend
        try {
          console.log('🔍 Checking if existing session is still valid...');
          const sessionInfo = await this.checkExistingSession();
          console.log('🔍 Session info from backend:', sessionInfo);
          
          if (sessionInfo && sessionInfo.status !== 'completed' && sessionInfo.status !== 'error') {
            console.log('✅ Existing session is still valid, reusing:', existingSessionId);
            return {
              sessionId: existingSessionId,
              isNew: false,
              existingSession: sessionInfo
            };
          } else {
            console.log('⚠️ Existing session is no longer valid, clearing...');
            this.clearCurrentSessionIdFromStorage();
          }
        } catch (error) {
          console.log('⚠️ Error checking existing session, clearing...');
          this.clearCurrentSessionIdFromStorage();
        }
      } else {
        console.log('❌ No existing session found in storage');
      }

      // Request session from backend
      const requestUrl = `${this.serverUrl}/api/session/request`;
      console.log('🔍 Requesting new session from backend...');
      console.log('🔍 Server URL:', this.serverUrl);
      console.log('🔍 Request URL:', requestUrl);
      
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceHash: this.deviceHash,
          uid: this.uid,
          parameters
        } as SessionRequest)
      });

      if (!response.ok) {
        // 429 means another session creation for this device is already in progress.
        // The server releases the lock within 30 s; retry up to 10 times (every 3 s).
        if (response.status === 429 && _retryCount < 10) {
          const retryDelay = 3000;
          console.warn(`⏳ Session creation lock active (attempt ${_retryCount + 1}/10), retrying in ${retryDelay / 1000}s…`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return this.getOrCreateSession(parameters, _retryCount + 1);
        }
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const sessionResponse: SessionResponse = await response.json();
      console.log('🔍 Backend response:', sessionResponse);
      
      // Store the session ID in localStorage (shared across tabs)
      this.setCurrentSessionIdInStorage(sessionResponse.sessionId);
      console.log('🔍 Stored session ID in localStorage:', sessionResponse.sessionId);
      
      console.log(`✅ Session ${sessionResponse.isNew ? 'created' : 'reused'}:`, sessionResponse.sessionId);
      
      return sessionResponse;
    } catch (error) {
      console.error('❌ Error getting/creating session:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('❌ Connection failed. Please check:');
        console.error('   1. Is the backend server running?');
        console.error('   2. Is the server URL correct?', this.serverUrl);
        console.error('   3. For Telegram mini apps, set VITE_API_URL to your public backend URL');
        console.error('   4. Check CORS settings on the backend server');
        throw new Error(`Failed to connect to backend at ${this.serverUrl}. Make sure the server is running and accessible.`);
      }
      throw error;
    }
  }

  /**
   * Gets the current session ID from localStorage
   */
  public getCurrentSessionId(): string | null {
    return this.getCurrentSessionIdFromStorage();
  }

  /**
   * Gets the device hash
   */
  public getDeviceHash(): string {
    return this.deviceHash;
  }

  /**
   * Clears the current session from localStorage
   */
  public clearCurrentSession(): void {
    this.clearCurrentSessionIdFromStorage();
  }

  /**
   * Checks if a session exists for the current device
   */
  public async checkExistingSession(): Promise<SessionInfo | null> {
    try {
      const response = await fetch(`${this.serverUrl}/api/session/check/${this.deviceHash}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No existing session
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const session: SessionInfo = await response.json();
      return session;
    } catch (error) {
      console.error('❌ Error checking existing session:', error);
      return null;
    }
  }

  /**
   * Closes the current session
   */
  public async closeCurrentSession(): Promise<boolean> {
    const sessionId = this.getCurrentSessionId();
    if (!sessionId) {
      return false;
    }

    try {
      const response = await fetch(`${this.serverUrl}/api/session/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        this.clearCurrentSession();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error closing session:', error);
      return false;
    }
  }

  /**
   * Listens for session changes from other tabs
   */
  public startCrossTabListener(): void {
    window.addEventListener('storage', (event) => {
      if (event.key === this.storageKey) {
        console.log('🔄 Session changed in another tab:', event.newValue);
        // You can emit a custom event here if needed
        window.dispatchEvent(new CustomEvent('sessionChanged', {
          detail: { sessionId: event.newValue }
        }));
      }
    });
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance(); 