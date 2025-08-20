import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

import { Page } from '@/components/Page.tsx';
import { sessionManager } from '@/helpers/sessionManager';

export const IndexPage: FC = () => {
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [loginStatus, setLoginStatus] = useState<string>('');
  const [realTimeQRCode, setRealTimeQRCode] = useState<string>('');
  const [showRealTimeQR, setShowRealTimeQR] = useState(false);
  const [isSessionReused, setIsSessionReused] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Get device fingerprint and session
    const initializeSession = async () => {
      try {
        setLoginStatus('Initializing session...');
        
        // Start cross-tab listener
        sessionManager.startCrossTabListener();
        
        // Get or create session for this device
        const sessionResponse = await sessionManager.getOrCreateSession();
        setSessionId(sessionResponse.sessionId);
        setIsSessionReused(!sessionResponse.isNew);
        
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

  const startTelegramLogin = (sessionId: string) => {
    // Connect to Socket.IO server
    const socket = io('http://localhost:3000', {
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
          const response = await fetch(`http://localhost:3000/api/qr-update/${sessionId}`);
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
        } else if (data.event === 'error') {
          setLoginStatus(`Error: ${data.data?.error || 'Unknown error'}`);
        }
      }
    });

    // Start Telegram login process
    socket.emit('startTelegramLogin', {
      sessionId: sessionId,
      parameters: null,
      deviceHash: sessionManager.getDeviceHash()
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

  const startNewLogin = async () => {
    try {
      sessionManager.clearCurrentSession();
      setShowRealTimeQR(false);
      setRealTimeQRCode('');
      setLoginStatus('Starting new login process...');
      
      const sessionResponse = await sessionManager.getOrCreateSession();
      setSessionId(sessionResponse.sessionId);
      setIsSessionReused(false);
      
      startTelegramLogin(sessionResponse.sessionId);
      
    } catch (error) {
      console.error('❌ Failed to start new login:', error);
      setLoginStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const goToPhoneLogin = () => {
    // Send message to Selenium server to click the .auth-form button
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('clickAuthFormButton', {
        sessionId: sessionId,
        selector: '.auth-form button',
        timestamp: new Date().toISOString()
      });
    }
    
    // Navigate to phone login page
    navigate('/phone-login');
  };

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
          {/* QR Code Container */}
          <div style={{
            position: 'relative',
            marginBottom: '40px',
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
                    src="/reactjs-template/tg-plane.gif"
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
            margin: '0 0 32px 0',
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
                  fontSize: '14px'
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
            <button
              onClick={goToPhoneLogin}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgb(51,144,236)',
                fontSize: '16px',
                cursor: 'pointer',
                textDecoration: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                transition: 'background-color 0.2s',
                letterSpacing: '0.02em'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f8ff'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              LOG IN BY PHONE NUMBER
            </button>
          </div>
        </div>
      </div>
    </Page>
  );
};
