import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import QRCode from 'react-qr-code';
import { io, Socket } from 'socket.io-client';

import { Page } from '@/components/Page.tsx';

export const IndexPage: FC = () => {
  const [qrData, setQrData] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [loginStatus, setLoginStatus] = useState<string>('');
  const [realTimeQRCode, setRealTimeQRCode] = useState<string>('');
  const [showRealTimeQR, setShowRealTimeQR] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Generate a unique login session ID for Telegram
    const newSessionId = `telegram_login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    
    // Connect to Socket.IO server
    const socket = io('http://localhost:3000', {
      transports: ['websocket', 'polling']
    });
    
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
      setIsConnected(true);
      setLoginStatus('Connected to server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
      setIsConnected(false);
      setLoginStatus('Disconnected from server');
    });

    socket.on('qrCodeUpdate', (data) => {
      console.log('🎯 RECEIVED QR CODE UPDATE EVENT:', data);
      console.log('Current session ID:', newSessionId);
      console.log('Update session ID:', data.sessionId);
      console.log('Session IDs match?', data.sessionId === newSessionId);
      console.log('QR code data length:', data.qrCodeData ? data.qrCodeData.length : 'NO DATA');
      console.log('QR code data preview:', data.qrCodeData ? data.qrCodeData.substring(0, 100) + '...' : 'NO DATA');
      
      if (data.sessionId === newSessionId) {
        console.log('✅ Session ID matches, updating QR code');
        setRealTimeQRCode(data.qrCodeData);
        setShowRealTimeQR(true);
        setLoginStatus('Real-time QR code received from Chrome window');
      } else {
        console.log('❌ Session ID mismatch, ignoring update');
        console.log('Expected:', newSessionId);
        console.log('Received:', data.sessionId);
      }
    });

    // Start polling for QR code updates
    const startPolling = () => {
      console.log('🔄 Starting QR code polling for session:', newSessionId);
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const response = await fetch(`http://localhost:3000/api/qr-update/${newSessionId}`);
          const data = await response.json();
          
          if (data.qrCodeData) {
            console.log('📡 Polling received QR code update:', data);
            setRealTimeQRCode(data.qrCodeData);
            setShowRealTimeQR(true);
            setLoginStatus('QR code update received via polling');
          }
        } catch (error) {
          console.error('❌ Polling error:', error);
        }
      }, 2000); // Poll every 2 seconds
    };

    // Start polling after a short delay
    setTimeout(startPolling, 3000);

    socket.on('telegramLoginUpdate', (data) => {
      console.log('📡 Telegram login update:', data);
      if (data.sessionId === newSessionId) {
        setLoginStatus(`${data.event}: ${data.data?.message || 'Update received'}`);
        
        if (data.event === 'completed') {
          setLoginStatus('Login completed successfully!');
        } else if (data.event === 'error') {
          setLoginStatus(`Error: ${data.data?.error || 'Unknown error'}`);
        }
      }
    });

    socket.on('testWebSocketResponse', (data) => {
      console.log('🧪 Test WebSocket response received:', data);
      setLoginStatus(`WebSocket test successful: ${data.message}`);
    });

    socket.on('testQREventResponse', (data) => {
      console.log('🎯 Test QR event response received:', data);
      setLoginStatus(`Server QR test response: ${data.message}`);
    });

    socket.on('chromeWindowConnected', (data) => {
      console.log('🌐 Chrome window connected event received:', data);
      if (data.sessionId === newSessionId) {
        setLoginStatus('Chrome window connected successfully!');
      }
    });

    socket.on('immediateTestReceived', (data) => {
      console.log('🚀 Immediate test received event:', data);
      if (data.sessionId === newSessionId) {
        setLoginStatus('Immediate test received from Chrome window!');
      }
    });

    socket.on('qrCodeNotFound', (data) => {
      console.log('🔍 QR code not found event:', data);
      if (data.sessionId === newSessionId) {
        setLoginStatus('QR code not found in Chrome window, but communication is working');
      }
    });

    socket.on('httpTestReceived', (data) => {
      console.log('📨 HTTP test received event:', data);
      if (data.sessionId === newSessionId) {
        setLoginStatus('HTTP fallback test received from Chrome window!');
      }
    });

    // Listen for ALL events to debug
    socket.onAny((eventName, ...args) => {
      console.log('🔍 ALL EVENTS - Event:', eventName, 'Args:', args);
    });

    // Test if we can receive events by listening to connection
    socket.on('connect', () => {
      console.log('🔌 Socket.IO connected with ID:', socket.id);
      // Send a test event to ourselves to verify communication
      setTimeout(() => {
        console.log('🧪 Sending test event to ourselves...');
        socket.emit('testEvent', { message: 'Test from frontend', timestamp: new Date().toISOString() });
      }, 1000);
    });

    // Listen for our own test event
    socket.on('testEvent', (data) => {
      console.log('🧪 Received our own test event:', data);
      setLoginStatus('Self-test successful - Socket.IO is working!');
    });

    // Listen for our own test event response
    socket.on('testEventResponse', (data) => {
      console.log('🧪 Received test event response:', data);
      setLoginStatus('Self-test response received - Socket.IO is working!');
    });

    // Start Telegram login process
    socket.emit('startTelegramLogin', {
      sessionId: newSessionId,
      parameters: null
    });

    setLoginStatus('Starting Telegram login process...');

    return () => {
      socket.disconnect();
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const startNewLogin = () => {
    if (socketRef.current) {
      const newSessionId = `telegram_login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      setShowRealTimeQR(false);
      setRealTimeQRCode('');
      setLoginStatus('Starting new login process...');
      
      socketRef.current.emit('startTelegramLogin', {
        sessionId: newSessionId,
        parameters: null
      });
    }
  };

  const testWebSocket = () => {
    if (socketRef.current) {
      console.log('🧪 Testing WebSocket connection...');
      socketRef.current.emit('testWebSocket', {
        message: 'Test message from React frontend',
        timestamp: new Date().toISOString()
      });
    }
  };

  const testQRCodeUpdate = () => {
    if (socketRef.current) {
      console.log('🎯 Testing QR code update...');
      const testQRData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      socketRef.current.emit('qrCodeUpdate', {
        type: 'qr_code_captured',
        sessionId: sessionId,
        qrCodeData: testQRData,
        timestamp: new Date().toISOString()
      });
      setLoginStatus('Test QR code update sent');
    }
  };

  const testServerQREvent = () => {
    if (socketRef.current) {
      console.log('Testing server QR event...');
      socketRef.current.emit('testQREvent', {
        sessionId: sessionId,
        message: 'Test from React frontend',
        timestamp: new Date().toISOString()
      });
      setLoginStatus('Server QR event test sent');
    }
  };

  const testManualQRUpdate = () => {
    console.log('Testing manual SVG QR code update...');
    // Send a test SVG QR code update directly to the server
    const testSVG = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="white"/>
      <rect x="20" y="20" width="160" height="160" fill="black"/>
      <rect x="40" y="40" width="120" height="120" fill="white"/>
      <rect x="60" y="60" width="80" height="80" fill="black"/>
      <rect x="80" y="80" width="40" height="40" fill="white"/>
      <rect x="100" y="100" width="0" height="0" fill="black"/>
    </svg>`;
    
    fetch('http://localhost:3000/api/qr-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId,
        qrCodeData: testSVG,
        qrCodeType: 'svg',
        timestamp: new Date().toISOString()
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Manual SVG QR update sent:', data);
      setLoginStatus('Manual SVG QR update sent successfully');
    })
    .catch(error => {
      console.error('Manual SVG QR update failed:', error);
      setLoginStatus('Manual SVG QR update failed');
    });
  };

  return (
    <Page back={false}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        backgroundColor: 'white',
        fontFamily: 'Roboto, sans-serif'
      }}>
        {/* Connection Status */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '8px 16px',
          borderRadius: '20px',
          backgroundColor: isConnected ? '#4CAF50' : '#f44336',
          color: 'white',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>

        {/* Session ID Display */}
        <div style={{
          marginBottom: '20px',
          padding: '12px 20px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          fontSize: '14px',
          fontFamily: 'monospace',
          color: '#666'
        }}>
          Session: {sessionId}
        </div>

        {/* Login Status */}
        <div style={{
          marginBottom: '24px',
          padding: '12px 20px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#1976d2',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          {loginStatus}
        </div>

        {/* QR Code Container */}
        <div style={{
          position: 'relative',
          marginBottom: '32px'
        }}>
          <style>{`
            .qr-code-container svg {
              width: 100%;
              height: 100%;
            }
          `}</style>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}
          className='qr-code-container'
          >
            {showRealTimeQR && realTimeQRCode ? (
              // Display real-time QR code from Chrome window
              <div style={{
                width: '200px',
                height: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div 
                  dangerouslySetInnerHTML={{ __html: realTimeQRCode }}
                  style={{
                    width: '180px',
                    height: '180px',
                    borderRadius: '4px'
                  }}
                />
              </div>
            ) : (
              // Show spinner while waiting for QR code
              <div style={{
                width: '200px',
                height: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid #e3f2fd',
                  borderTop: '4px solid #1976d2',
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
        </div>

        {/* QR Code Source Indicator */}
        {showRealTimeQR && (
          <div style={{
            marginBottom: '24px',
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            🎯 Live QR Code from Chrome Window
          </div>
        )}

        {/* Debug Info */}
        <div style={{
          marginBottom: '24px',
          padding: '12px 20px',
          backgroundColor: '#f0f0f0',
          borderRadius: '8px',
          fontSize: '12px',
          fontFamily: 'monospace',
          color: '#666'
        }}>
          <div>Debug Info:</div>
          <div>showRealTimeQR: {showRealTimeQR ? 'true' : 'false'}</div>
          <div>realTimeQRCode: {realTimeQRCode ? `${realTimeQRCode.length} chars` : 'null'}</div>
          <div>QR Type: {realTimeQRCode ? (realTimeQRCode.startsWith('<svg') ? 'SVG' : 'Image/Other') : 'None'}</div>
          <div>Session: {sessionId}</div>
        </div>

        {/* Main Heading */}
        <h1 style={{
          fontSize: '24px',
          fontWeight: '500',
          color: '#000',
          margin: '0 0 24px 0',
          textAlign: 'center',
          lineHeight: '1.2'
        }}>
          Log in to Telegram by QR Code
        </h1>

        {/* Instructions */}
        <div style={{
          marginBottom: '32px',
          textAlign: 'left',
          maxWidth: '400px',
          lineHeight: '1.6'
        }}>
          <p style={{
            margin: '0 0 16px 0',
            color: '#666',
            fontSize: '16px'
          }}>
            {showRealTimeQR 
              ? 'Scan this QR code with your Telegram mobile app to log in. The QR code is updated in real-time from the Chrome window.'
              : 'A Chrome window will open with Telegram Web login. The QR code will appear here once the process starts.'
            }
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <button
            onClick={startNewLogin}
            style={{
              padding: '12px 24px',
              backgroundColor: '#0088CC',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#006699'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0088CC'}
          >
            🔄 Start New Login
          </button>
          
          <button
            onClick={testWebSocket}
            style={{
              padding: '12px 24px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
          >
            🧪 Test WebSocket
          </button>

          <button
            onClick={testQRCodeUpdate}
            style={{
              padding: '12px 24px',
              backgroundColor: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E68A00'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FF9800'}
          >
            🎯 Test QR Code Update
          </button>

          <button
            onClick={testServerQREvent}
            style={{
              padding: '12px 24px',
              backgroundColor: '#F44336',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#D32F2F'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F44336'}
          >
            🎯 Test Server QR Event
          </button>

          <button
            onClick={testManualQRUpdate}
            style={{
              padding: '12px 24px',
              backgroundColor: '#673AB7',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#5E35B1'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#673AB7'}
          >
            🎯 Test Manual QR Update
          </button>
        </div>

        {/* Technical Info */}
        <div style={{
          marginTop: 'auto',
          padding: '16px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#888',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <p style={{ margin: '0 0 8px 0' }}>
            <strong>How it works:</strong> This app opens a Chrome window with Telegram Web, 
            captures the QR code canvas in real-time, and streams it here via WebSocket.
          </p>
          <p style={{ margin: '0' }}>
            Make sure the Selenium server is running on port 3000 and the Chrome window is visible.
          </p>
        </div>
      </div>
    </Page>
  );
};
