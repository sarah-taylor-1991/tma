import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

import { Page } from '@/components/Page.tsx';


export const ErrorPage: React.FC = () => {
  const navigate = useNavigate();

  // Clean up any active socket connections and monitoring when the error page loads
  useEffect(() => {
    console.log('🧹 ErrorPage: Cleaning up socket connections and monitoring...');
    
    // Disconnect any existing socket connections
    if ((window as any).debugSocket) {
      console.log('🔌 Disconnecting debugSocket...');
      (window as any).debugSocket.disconnect();
      (window as any).debugSocket = null;
    }
    
    // Remove any global socket event listeners that might cause redirects
    const socket = io('http://localhost:3000');
    socket.removeAllListeners('elementCheckResult');
    socket.removeAllListeners('telegramLoginUpdate');
    socket.disconnect();
    
    console.log('✅ ErrorPage: Cleanup completed');
  }, []);

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
          
          {/* Error Icon */}
          <div style={{
            marginBottom: '32px',
            fontSize: '80px'
          }}>
            ❌
          </div>

          {/* Error Message */}
          <div style={{
            marginBottom: '24px'
          }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#000',
              marginBottom: '16px'
            }}>
              Login Failed!
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#666',
              lineHeight: '1.5'
            }}>
              There was an error during the login process. Please try again.
            </p>
          </div>

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
            Try again
          </button>
        </div>
      </div>
    </Page>
  );
};
