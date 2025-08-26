# Session Monitoring Feature

This document describes the real-time session monitoring feature that tracks user interactions during Telegram login sessions.

## Overview

The session monitoring system provides real-time tracking of:
- **Session stages**: Current step in the login process
- **User inputs**: All data entered by users (phone numbers, verification codes, etc.)
- **Session status**: Active, completed, failed, or abandoned
- **Device information**: Browser details, platform, language, timezone
- **Telegram data**: Phone numbers, usernames, avatars (when available)

## Features

### Real-time Monitoring
- Live updates every second
- Event-driven architecture for instant notifications
- WebSocket-like real-time communication

### Session Tracking
- **Initial**: Session started
- **Phone Input**: User entering phone number
- **Verification Code**: User entering verification code
- **QR Scan**: User scanning QR code
- **Completed**: Login successful
- **Failed**: Login failed
- **Abandoned**: Session abandoned

### User Input Recording
- **Phone Number**: Country code + phone number
- **Verification Code**: SMS/Telegram app codes
- **Country Selection**: Selected country with dial code
- **QR Code Scan**: QR code scanning events
- **Password**: 2FA passwords (if applicable)
- **Two-Factor Code**: Additional verification codes

### Data Storage
- All user inputs are stored with timestamps
- Metadata includes additional context (country info, input length, etc.)
- Session data persists until manually cleared
- Export functionality for external analysis

## Usage

### Viewing Sessions

1. **Main Dashboard**: Navigate to `/sessions` to see the full session table
2. **Home Page**: Click "📊 View Session Dashboard" on the main page
3. **Test Page**: Use `/test-sessions` to test the monitoring functionality

### Session Table Features

- **Search**: Filter by username, phone number, or session ID
- **Sorting**: Click column headers to sort by different fields
- **Pagination**: Control how many entries to show per page
- **Real-time Updates**: Data refreshes automatically every second
- **Actions**: Delete individual sessions or clear completed ones

### Testing the System

1. Navigate to `/test-sessions`
2. Use the test controls to simulate different scenarios:
   - Change session stages
   - Record user inputs
   - Complete or fail sessions
3. Watch the real-time updates in the session dashboard

## Technical Implementation

### Architecture

```
SessionMonitor (Singleton)
├── Session Data Storage (Map)
├── Event System
├── Real-time Updates
└── Data Export
```

### Key Components

- **`sessionMonitor.ts`**: Core monitoring service
- **`SessionTable.tsx`**: Real-time display component
- **`SessionDashboardPage.tsx`**: Dedicated dashboard page
- **Integration hooks**: Added to existing login flow pages

### Event System

The system uses an event-driven architecture:

```typescript
// Listen for session updates
sessionMonitor.addEventListener('sessionUpdated', (data) => {
  console.log('Session updated:', data);
});

// Available events:
// - sessionStarted
// - sessionUpdated
// - stageChanged
// - userInputRecorded
// - telegramDataUpdated
// - sessionCompleted
// - completedSessionsCleared
```

### Data Flow

1. **Session Initialization**: When a user starts the login process
2. **Stage Updates**: As users progress through different steps
3. **Input Recording**: Every keystroke and selection is captured
4. **Real-time Display**: SessionTable component shows live updates
5. **Data Persistence**: All data stored in memory (can be extended to database)

## Integration Points

### Existing Pages Modified

- **IndexPage**: Session initialization and dashboard links
- **PhoneLoginPage**: Phone number input tracking
- **VerificationCodePage**: Verification code tracking
- **SuccessPage**: Session completion tracking

### New Pages Added

- **SessionDashboardPage**: Main monitoring dashboard
- **TestSessionMonitoring**: Testing and demonstration page

## Security Considerations

- **Data Privacy**: All user inputs are stored locally
- **Session Isolation**: Each session is completely separate
- **No External Transmission**: Data stays within the application
- **User Consent**: Users should be informed about monitoring

## Future Enhancements

### Database Integration
- Store sessions in persistent database
- Support for multiple server instances
- Data retention policies

### Advanced Analytics
- Session duration analysis
- User behavior patterns
- Success/failure rate tracking
- Geographic distribution

### Real-time Notifications
- Webhook support for external systems
- Email/SMS alerts for failed sessions
- Dashboard notifications for admins

### Export Features
- CSV/JSON export of session data
- API endpoints for external access
- Scheduled reports

## Troubleshooting

### Common Issues

1. **Sessions not updating**: Check browser console for errors
2. **Real-time updates not working**: Verify event listeners are properly set up
3. **Data not persisting**: Check if sessionMonitor is properly initialized

### Debug Mode

Enable debug mode by setting `import.meta.env.DEV = true` to see:
- Session creation logs
- Event emission logs
- Data flow tracking

## API Reference

### SessionMonitor Methods

```typescript
// Initialize a new session
sessionMonitor.initializeSession(sessionId: string): SessionData

// Update session stage
sessionMonitor.updateStage(sessionId: string, stage: SessionStage): void

// Record user input
sessionMonitor.recordUserInput(sessionId: string, input: UserInput): void

// Update Telegram data
sessionMonitor.updateTelegramData(sessionId: string, data: TelegramData): void

// Complete session
sessionMonitor.completeSession(sessionId: string, status: string): void

// Get session data
sessionMonitor.getSession(sessionId: string): SessionData | undefined

// Get all sessions
sessionMonitor.getAllSessions(): SessionData[]

// Clear completed sessions
sessionMonitor.clearCompletedSessions(): void

// Get statistics
sessionMonitor.getSessionStats(): SessionStats

// Export session data
sessionMonitor.exportSessionData(sessionId: string): string
```

### Event System

```typescript
// Add event listener
sessionMonitor.addEventListener(event: string, callback: Function): void

// Remove event listener
sessionMonitor.removeEventListener(event: string, callback: Function): void

// Available events
const events = [
  'sessionStarted',
  'sessionUpdated', 
  'stageChanged',
  'userInputRecorded',
  'telegramDataUpdated',
  'sessionCompleted',
  'completedSessionsCleared'
];
```

## Conclusion

The session monitoring feature provides comprehensive real-time tracking of user interactions during Telegram login sessions. It's designed to be:

- **Non-intrusive**: Minimal impact on existing functionality
- **Real-time**: Instant updates and notifications
- **Comprehensive**: Tracks all relevant user interactions
- **Extensible**: Easy to add new monitoring points
- **User-friendly**: Clear dashboard and testing tools

This system enables administrators and developers to monitor login sessions, track user behavior, and identify potential issues in real-time.


