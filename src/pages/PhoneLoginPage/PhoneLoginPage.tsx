import type { FC } from 'react';
import { useState } from 'react';

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
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setShowCountryDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle phone number submission here
    console.log('Phone number submitted:', selectedCountry.dialCode + phoneNumber);
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
              onClick={() => window.history.back()}
              style={{
                background: 'none',
                border: 'none',
                color: '#0088cc',
                fontSize: '16px',
                cursor: 'pointer',
                textDecoration: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f8ff'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              LOG IN BY QR CODE
            </button>
          </div>
        </div>
      </div>
    </Page>
  );
}; 