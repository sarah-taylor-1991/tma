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

  private constructor() {
    this.deviceHash = getDeviceFingerprintHash();
    this.serverUrl = 'http://localhost:3000';
    this.storageKey = `telegram_session_${this.deviceHash}`;
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
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
  public async getOrCreateSession(parameters?: any): Promise<SessionResponse> {
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
      console.log('🔍 Requesting new session from backend...');
      const response = await fetch(`${this.serverUrl}/api/session/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceHash: this.deviceHash,
          parameters
        } as SessionRequest)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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