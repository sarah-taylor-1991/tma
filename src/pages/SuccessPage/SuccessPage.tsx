import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Page } from '@/components/Page.tsx';


export const SuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');



  const goBack = () => {
    navigate('/');
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
          width: '100%',
          textAlign: 'center'
        }}>
          
          {/* Success Icon */}
          <div style={{
            marginBottom: '32px',
            fontSize: '80px'
          }}>
            🎉
          </div>

          {/* Success Message */}
          <div style={{
            marginBottom: '24px'
          }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#000',
              marginBottom: '16px'
            }}>
              Login Successful!
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#666',
              lineHeight: '1.5'
            }}>
              You have successfully logged into Telegram. Your session is now active.
            </p>
          </div>

          {/* Session Info */}
          {sessionId && (
            <div style={{
              marginBottom: '32px',
              padding: '16px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#6c757d',
              width: '100%'
            }}>
              <div>Session ID: {sessionId}</div>
            </div>
          )}

          {/* Back Button */}
          <button
            onClick={goBack}
            style={{
              padding: '16px 32px',
              fontSize: '16px',
              fontWeight: '600',
              backgroundColor: '#0088cc',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    </Page>
  );
};
