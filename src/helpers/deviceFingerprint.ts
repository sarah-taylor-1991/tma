/**
 * Device Fingerprinting Utility
 * Generates a unique identifier for the current device/browser to enable session reuse
 */

export interface DeviceFingerprint {
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  cookieEnabled: boolean;
  localStorageEnabled: boolean;
  sessionStorageEnabled: boolean;
  hash: string;
}

/**
 * Generates a unique device fingerprint based on browser characteristics
 */
export function generateDeviceFingerprint(): DeviceFingerprint {
  const fingerprint: DeviceFingerprint = {
    userAgent: navigator.userAgent,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    localStorageEnabled: (() => {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
      } catch {
        return false;
      }
    })(),
    sessionStorageEnabled: (() => {
      try {
        sessionStorage.setItem('test', 'test');
        sessionStorage.removeItem('test');
        return true;
      } catch {
        return false;
      }
    })(),
    hash: ''
  };

  // Generate a hash from the fingerprint data
  fingerprint.hash = generateHash(JSON.stringify(fingerprint));
  
  return fingerprint;
}

/**
 * Generates a more stable device fingerprint that focuses on unchanging characteristics
 */
export function generateStableDeviceFingerprint(): DeviceFingerprint {
  const fingerprint: DeviceFingerprint = {
    userAgent: navigator.userAgent,
    // Use screen properties that are less likely to change
    screenResolution: `${screen.availWidth}x${screen.availHeight}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    // Handle deprecated navigator.platform gracefully
    platform: (navigator as any).platform || 'unknown',
    cookieEnabled: navigator.cookieEnabled,
    localStorageEnabled: (() => {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
      } catch {
        return false;
      }
    })(),
    sessionStorageEnabled: (() => {
      try {
        sessionStorage.setItem('test', 'test');
        sessionStorage.removeItem('test');
        return true;
      } catch {
        return false;
      }
    })(),
    hash: ''
  };

  // Generate a hash from the fingerprint data
  fingerprint.hash = generateHash(JSON.stringify(fingerprint));
  
  return fingerprint;
}

/**
 * Generates a minimal but stable device fingerprint
 */
export function generateMinimalDeviceFingerprint(): DeviceFingerprint {
  const fingerprint: DeviceFingerprint = {
    userAgent: navigator.userAgent,
    // Only use the most stable screen properties
    screenResolution: `${screen.availWidth}x${screen.availHeight}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: (navigator as any).platform || 'unknown',
    cookieEnabled: navigator.cookieEnabled,
    localStorageEnabled: true, // Assume true for modern browsers
    sessionStorageEnabled: true, // Assume true for modern browsers
    hash: ''
  };

  // Generate a hash from the fingerprint data
  fingerprint.hash = generateHash(JSON.stringify(fingerprint));
  
  return fingerprint;
}

/**
 * Generates a simple hash from a string
 */
function generateHash(str: string): string {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Gets the stored device fingerprint or generates a new one
 */
export function getOrCreateDeviceFingerprint(): DeviceFingerprint {
  const storageKey = 'telegram_manager_device_fingerprint';
  
  // Try to get existing fingerprint from localStorage
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const fingerprint: DeviceFingerprint = JSON.parse(stored);
      // Validate the fingerprint has all required properties
      if (fingerprint.hash && fingerprint.userAgent) {
        return fingerprint;
      }
    }
  } catch (error) {
    console.warn('Failed to retrieve stored device fingerprint:', error);
  }
  
  // Generate new fingerprint if none exists or is invalid
  const newFingerprint = generateMinimalDeviceFingerprint();
  
  // Store the new fingerprint
  try {
    localStorage.setItem(storageKey, JSON.stringify(newFingerprint));
  } catch (error) {
    console.warn('Failed to store device fingerprint:', error);
  }
  
  return newFingerprint;
}

/**
 * Gets the device fingerprint hash (short identifier)
 */
export function getDeviceFingerprintHash(): string {
  return getOrCreateDeviceFingerprint().hash;
} 