# SKRAM Mobile App Migration Guide

## Overview
Converting SKRAM to a native mobile app requires careful consideration of healthcare compliance, real-time messaging, secure file handling, and cross-platform compatibility while maintaining all existing PHI audit capabilities.

## Mobile Architecture Options

### 1. React Native (Recommended)
**Advantages:**
- Reuse existing TypeScript codebase and business logic
- Maintain React component patterns
- Cross-platform (iOS + Android) with single codebase
- Strong ecosystem for healthcare apps
- WebSocket support for real-time messaging

**Required Changes:**
```typescript
// Current Web Components → React Native Components
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview'; // For Swagger docs
import AsyncStorage from '@react-native-async-storage/async-storage'; // Replace localStorage
```

### 2. Native Development
**iOS (Swift) + Android (Kotlin)**
- Maximum performance and platform integration
- Full access to device capabilities
- Requires complete rewrite of frontend
- Separate development teams needed

### 3. Flutter (Alternative)
**Dart Language**
- Cross-platform with native performance
- Requires complete frontend rewrite
- Good healthcare app ecosystem

## Core Mobile Requirements

### 1. Authentication & Security
```typescript
// Mobile-specific authentication considerations
import { Keychain } from 'react-native-keychain'; // Secure credential storage
import TouchID from 'react-native-touch-id'; // Biometric authentication
import { Alert } from 'react-native'; // Replace browser alerts

// Secure token storage
const storeAuthToken = async (token: string) => {
  await Keychain.setInternetCredentials('skram-auth', 'user', token);
};

// Biometric PHI access
const authenticatePHI = async () => {
  const biometryType = await TouchID.isSupported();
  if (biometryType) {
    return await TouchID.authenticate('Access PHI Content');
  }
  // Fallback to password
};
```

### 2. Real-time Messaging
```typescript
// WebSocket implementation for mobile
import { WebSocket } from 'react-native';

class MobileWebSocketService {
  private ws: WebSocket | null = null;
  
  connect() {
    this.ws = new WebSocket('wss://your-server.com/ws');
    
    // Handle app state changes
    AppState.addEventListener('change', this.handleAppStateChange);
  }
  
  handleAppStateChange = (nextAppState: string) => {
    if (nextAppState === 'background') {
      // Maintain connection or implement push notifications
    } else if (nextAppState === 'active') {
      // Reconnect if needed
    }
  };
}
```

### 3. File Handling & PHI Documents
```typescript
// Mobile file handling
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import { PermissionsAndroid } from 'react-native';

// File upload with PHI logging
const uploadPHIDocument = async () => {
  // Request permissions
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
  );
  
  if (granted === PermissionsAndroid.RESULTS.GRANTED) {
    const result = await DocumentPicker.pick({
      type: [DocumentPicker.types.images, DocumentPicker.types.pdf]
    });
    
    // Upload to Google Cloud Storage via signed URL
    const uploadUrl = await getSignedUploadUrl();
    await uploadFileToGCS(result, uploadUrl);
  }
};
```

## Backend Modifications Required

### 1. Mobile-Specific API Endpoints
```typescript
// Add mobile-specific routes in server/routes.ts

// Device registration for push notifications
app.post('/api/mobile/register-device', async (req, res) => {
  const { deviceToken, platform, userId } = req.body;
  // Store device token for push notifications
});

// Mobile session management
app.post('/api/mobile/refresh-session', async (req, res) => {
  // Handle mobile app background/foreground transitions
});

// Offline message sync
app.get('/api/mobile/sync-messages', async (req, res) => {
  const { lastSyncTime, userId } = req.query;
  // Return messages since last sync
});
```

### 2. Push Notifications for PHI
```typescript
import { messaging } from 'firebase-admin';

// PHI-compliant push notifications
const sendPHINotification = async (deviceToken: string, messageType: string) => {
  const message = {
    token: deviceToken,
    notification: {
      title: 'SKRAM - Secure Message',
      body: 'New secure message requires authentication', // No PHI in notification
    },
    data: {
      type: 'phi_message',
      requiresAuth: 'true'
    }
  };
  
  await messaging().send(message);
};
```

## Mobile-Specific Features

### 1. Offline Capability
```typescript
// Offline message storage
import SQLite from 'react-native-sqlite-storage';

class OfflineStorage {
  private db: SQLite.SQLiteDatabase;
  
  async storeMessageOffline(message: Message) {
    await this.db.executeSql(
      'INSERT INTO offline_messages (id, content, encrypted, synced) VALUES (?, ?, ?, ?)',
      [message.id, message.content, message.encrypted, false]
    );
  }
  
  async syncWhenOnline() {
    const unsynced = await this.getUnsyncedMessages();
    for (const message of unsynced) {
      await this.sendToServer(message);
    }
  }
}
```

### 2. Biometric Authentication
```typescript
// Enhanced security for PHI access
const configureBiometricAuth = async () => {
  const biometryType = await TouchID.isSupported();
  
  const biometricOptions = {
    title: 'Authenticate for PHI Access',
    subTitle: 'HIPAA-compliant access required',
    description: 'Use your biometric credential to access protected health information',
    fallbackLabel: 'Use Password',
    cancelLabel: 'Cancel'
  };
  
  return biometryType;
};
```

### 3. Camera Integration for Document Capture
```typescript
// PHI document capture
import { RNCamera } from 'react-native-camera';

const PHIDocumentScanner = () => {
  const takePicture = async () => {
    const options = {
      quality: 0.8,
      base64: false,
      exif: false // Remove metadata for privacy
    };
    
    const data = await camera.takePictureAsync(options);
    
    // Immediate PHI processing and secure upload
    await processPHIDocument(data.uri);
  };
};
```

## HIPAA Compliance Considerations

### 1. Mobile-Specific Security Requirements
```typescript
// App-level security measures
import { AppRegistry, Alert } from 'react-native';
import JailMonkey from 'jail-monkey';

// Security checks on app startup
const performSecurityChecks = () => {
  if (JailMonkey.isJailBroken()) {
    Alert.alert('Security Warning', 'PHI access not allowed on modified devices');
    return false;
  }
  
  if (JailMonkey.isOnExternalStorage()) {
    Alert.alert('Security Warning', 'App must be installed on internal storage');
    return false;
  }
  
  return true;
};
```

### 2. Screen Recording Protection
```typescript
// Prevent screenshots of PHI content
import { Alert, DeviceEventEmitter } from 'react-native';
import { preventScreenCapture, allowScreenCapture } from 'react-native-screen-capture';

const PHIContentView = () => {
  useEffect(() => {
    preventScreenCapture(); // Block screenshots
    
    return () => {
      allowScreenCapture(); // Re-enable when leaving PHI view
    };
  }, []);
};
```

### 3. Secure Storage for PHI Data
```typescript
// Encrypted local storage
import EncryptedStorage from 'react-native-encrypted-storage';

const storePHIDataSecurely = async (phiData: any) => {
  try {
    await EncryptedStorage.setItem('phi_cache', JSON.stringify(phiData));
  } catch (error) {
    // Handle encryption error
  }
};
```

## Development Environment Setup

### 1. React Native Development
```bash
# Install React Native CLI
npm install -g react-native-cli

# Initialize React Native project
npx react-native init SKRAMMobile --template react-native-template-typescript

# Required dependencies
npm install @react-native-async-storage/async-storage
npm install react-native-keychain
npm install react-native-touch-id
npm install react-native-document-picker
npm install react-native-fs
npm install react-native-sqlite-storage
npm install react-native-webview
npm install @react-native-firebase/app @react-native-firebase/messaging
```

### 2. Platform-Specific Configuration
```json
// package.json additions
{
  "dependencies": {
    "react-native-vector-icons": "^9.2.0",
    "react-native-safe-area-context": "^4.7.0",
    "react-native-screens": "^3.22.0",
    "react-navigation": "^6.0.0"
  }
}
```

## Code Migration Strategy

### 1. Shared Business Logic
```
shared/
├── api/           # API client (works for both web and mobile)
├── types/         # TypeScript interfaces
├── utils/         # Utility functions
├── validation/    # Zod schemas
└── constants/     # App constants
```

### 2. Platform-Specific UI
```
mobile/
├── components/    # React Native components
├── screens/       # Mobile screens
├── navigation/    # React Navigation setup
└── services/      # Mobile-specific services

web/
├── components/    # React web components (existing)
├── pages/         # Web pages (existing)
└── lib/          # Web-specific utilities (existing)
```

### 3. Component Mapping
```typescript
// Web Component → Mobile Component
Button           → TouchableOpacity
div              → View
span/p           → Text
input            → TextInput
ScrollView       → ScrollView (same)
Modal            → Modal (same)
```

## Deployment Considerations

### 1. App Store Requirements
**iOS App Store:**
- Medical Device regulations may apply
- Privacy policy for PHI handling required
- Security review for healthcare apps

**Google Play Store:**
- Health app policy compliance
- Permissions justification for camera, storage
- Security assessment for sensitive data

### 2. Backend Adjustments
```typescript
// Update CORS for mobile app
app.use(cors({
  origin: ['https://your-web-app.com', 'http://localhost:3000'], // Add mobile app schemes
  credentials: true
}));

// Mobile-specific rate limiting
const mobileRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased for mobile usage patterns
  message: 'Too many requests from mobile app'
});
```

## Testing Strategy

### 1. Mobile-Specific Testing
```typescript
// Jest + React Native Testing Library
import { render, fireEvent } from '@testing-library/react-native';

describe('PHI Message Component', () => {
  it('should require biometric authentication', async () => {
    const { getByText } = render(<PHIMessageView />);
    fireEvent.press(getByText('View PHI Content'));
    
    // Mock biometric authentication
    expect(TouchID.authenticate).toHaveBeenCalled();
  });
});
```

### 2. Security Testing
- Penetration testing for mobile app
- HIPAA compliance validation
- Device security assessment
- Network security testing

## Timeline Estimate

### Phase 1: Core Migration (6-8 weeks)
- Set up React Native environment
- Migrate authentication and basic messaging
- Implement WebSocket connectivity

### Phase 2: PHI Compliance (4-6 weeks)
- Implement biometric authentication
- Add mobile PHI handling
- Security features and testing

### Phase 3: Advanced Features (4-5 weeks)
- Offline capability
- Push notifications
- File handling and camera integration

### Phase 4: Testing & Deployment (3-4 weeks)
- Comprehensive testing
- App store submission
- Security audit

**Total Timeline: 17-23 weeks**

## Cost Considerations

### Development Costs
- React Native developers: 2-3 full-time developers
- Mobile UI/UX designer: 1 designer
- Security consultant: HIPAA compliance review
- Testing: Device testing, security audit

### Ongoing Costs
- App store fees: $99/year (iOS) + $25 (Android)
- Push notification service: Firebase or AWS SNS
- Mobile device testing: Physical devices or cloud testing
- Security audits: Annual HIPAA compliance reviews

This migration would leverage your existing TypeScript codebase while adding mobile-specific capabilities for secure healthcare communication.