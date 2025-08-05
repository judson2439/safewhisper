# SKRAM Mobile Frontend - API Integration Guide

## Overview
Keep all existing backend APIs unchanged and build React Native frontend components that connect to the same endpoints. This approach minimizes development time and maintains consistency.

## Architecture Approach
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Frontend  │    │  Mobile Frontend│    │   Same Backend  │
│   (React)       │    │  (React Native) │    │   APIs          │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Chat UI       │    │ • Native Chat   │    │ • /api/messages │
│ • Admin Panel   │    │ • Native Admin  │    │ • /api/auth/*   │
│ • PHI Modals    │    │ • Native PHI    │────┤ • /api/phi-*    │
│ • File Upload   │    │ • Native Files  │    │ • /api/admin/*  │
└─────────────────┘    └─────────────────┘    │ • WebSocket /ws │
                                              └─────────────────┘
```

## Direct API Integration Examples

### 1. Authentication (No Backend Changes)
```typescript
// Mobile: Same API calls, different UI components
import AsyncStorage from '@react-native-async-storage/async-storage';

const MobileLoginScreen = () => {
  const login = async (username: string, password: string) => {
    // Same API endpoint as web
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    await AsyncStorage.setItem('auth-session', JSON.stringify(data));
  };
  
  return (
    <View style={styles.container}>
      <TextInput placeholder="Username" onChangeText={setUsername} />
      <TextInput placeholder="Password" secureTextEntry onChangeText={setPassword} />
      <TouchableOpacity onPress={() => login(username, password)}>
        <Text>Sign In</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### 2. Messaging (Same WebSocket, Different UI)
```typescript
// Mobile: Connect to existing WebSocket
import { WebSocket } from 'react-native';

const MobileChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const ws = useRef<WebSocket>();
  
  useEffect(() => {
    // Same WebSocket endpoint as web
    ws.current = new WebSocket('wss://your-domain.com/ws');
    
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_message') {
        setMessages(prev => [...prev, data.message]);
      }
    };
  }, []);
  
  const sendMessage = (content: string) => {
    // Same message format as web
    ws.current?.send(JSON.stringify({
      type: 'send_message',
      conversationId: currentConversation.id,
      content,
      messageType: 'text'
    }));
  };
  
  return (
    <View style={styles.chatContainer}>
      <FlatList
        data={messages}
        renderItem={({ item }) => <MessageBubble message={item} />}
      />
      <TextInput onSubmitEditing={(e) => sendMessage(e.nativeEvent.text)} />
    </View>
  );
};
```

### 3. PHI Messages (Same Security, Native UI)
```typescript
// Mobile: Same PHI endpoints, biometric authentication
import TouchID from 'react-native-touch-id';

const MobilePHIModal = ({ messageId }: { messageId: string }) => {
  const authenticatePHI = async () => {
    try {
      // Use biometrics instead of password input
      await TouchID.authenticate('Access PHI Content');
      
      // Same API endpoint as web
      const response = await fetch('/api/messages/authenticate-secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messageId, 
          password: await getStoredPassword() // From secure storage
        })
      });
      
      const data = await response.json();
      setPhiContent(data.message);
    } catch (error) {
      Alert.alert('Authentication failed');
    }
  };
  
  return (
    <Modal visible={showPHI}>
      <View style={styles.phiContainer}>
        <Text>PHI Content Requires Authentication</Text>
        <TouchableOpacity onPress={authenticatePHI}>
          <Text>Authenticate with Touch ID</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};
```

### 4. File Upload (Same Storage, Native File Picker)
```typescript
// Mobile: Same upload flow, native file selection
import DocumentPicker from 'react-native-document-picker';

const MobileFileUpload = () => {
  const uploadFile = async () => {
    // Native file picker instead of web input
    const file = await DocumentPicker.pick({
      type: [DocumentPicker.types.images, DocumentPicker.types.pdf]
    });
    
    // Same upload URL endpoint as web
    const urlResponse = await fetch('/api/attachments/upload-url', {
      method: 'POST'
    });
    const { uploadURL } = await urlResponse.json();
    
    // Upload directly to Google Cloud Storage (same as web)
    const formData = new FormData();
    formData.append('file', {
      uri: file[0].uri,
      type: file[0].type,
      name: file[0].name
    } as any);
    
    await fetch(uploadURL, {
      method: 'PUT',
      body: formData
    });
  };
  
  return (
    <TouchableOpacity onPress={uploadFile}>
      <Text>Upload File</Text>
    </TouchableOpacity>
  );
};
```

### 5. Admin Dashboard (Same Data, Native Tables)
```typescript
// Mobile: Same admin APIs, responsive native layout
const MobileAdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [phiLogs, setPHILogs] = useState([]);
  
  useEffect(() => {
    // Same API endpoints as web
    Promise.all([
      fetch('/api/admin/analytics').then(r => r.json()),
      fetch('/api/phi-access-logs').then(r => r.json())
    ]).then(([analyticsData, logsData]) => {
      setAnalytics(analyticsData);
      setPHILogs(logsData.logs);
    });
  }, []);
  
  return (
    <ScrollView style={styles.dashboard}>
      <View style={styles.analyticsCards}>
        <Text>Total Users: {analytics?.totalMembers}</Text>
        <Text>Workforces: {analytics?.totalWorkforces}</Text>
      </View>
      
      <FlatList
        data={phiLogs}
        renderItem={({ item }) => (
          <View style={styles.logEntry}>
            <Text>{item.userEmail}</Text>
            <Text>{item.activityType}</Text>
            <Text>{new Date(item.accessTime).toLocaleDateString()}</Text>
          </View>
        )}
      />
    </ScrollView>
  );
};
```

## Mobile-Specific Enhancements (Optional)

### 1. Push Notifications
```typescript
// Add only if you want notifications
import messaging from '@react-native-firebase/messaging';

const setupPushNotifications = async () => {
  const token = await messaging().getToken();
  
  // Send token to existing backend (add new endpoint if needed)
  await fetch('/api/mobile/register-device', {
    method: 'POST',
    body: JSON.stringify({ deviceToken: token })
  });
};
```

### 2. Offline Storage
```typescript
// Store messages locally when offline
import AsyncStorage from '@react-native-async-storage/async-storage';

const cacheMessages = async (messages: Message[]) => {
  await AsyncStorage.setItem('cached_messages', JSON.stringify(messages));
};

const loadCachedMessages = async () => {
  const cached = await AsyncStorage.getItem('cached_messages');
  return cached ? JSON.parse(cached) : [];
};
```

## Minimal Backend Additions (Optional)

Only add these if you want mobile-specific features:

```typescript
// server/routes.ts - Add only these new endpoints

// Device registration for push notifications
app.post('/api/mobile/register-device', async (req, res) => {
  const { deviceToken, userId } = req.body;
  // Store device token in database for notifications
  res.json({ success: true });
});

// Mobile session check
app.get('/api/mobile/session-check', async (req, res) => {
  // Return session status for mobile app lifecycle
  res.json({ valid: !!req.session.user });
});
```

## Component Mapping Strategy

### Web Component → Mobile Component
```typescript
// Direct translations
<div>           → <View>
<span>/<p>      → <Text>
<button>        → <TouchableOpacity>
<input>         → <TextInput>
<img>           → <Image>
<a href="#">    → <TouchableOpacity onPress={openLink}>

// Keep same props/logic, change wrapper
const WebButton = ({ onClick, children }) => (
  <button onClick={onClick}>{children}</button>
);

const MobileButton = ({ onPress, children }) => (
  <TouchableOpacity onPress={onPress}>
    <Text>{children}</Text>
  </TouchableOpacity>
);
```

## Development Timeline (Simplified)

### Week 1-2: Setup & Basic Navigation
- Initialize React Native project
- Set up navigation between screens
- Test API connectivity

### Week 3-4: Core Features
- Login/authentication screens
- Chat interface and messaging
- Real-time WebSocket connection

### Week 5-6: PHI & Security
- PHI message modals
- Biometric authentication
- File upload/download

### Week 7-8: Admin & Polish
- Admin dashboard screens
- Testing and refinement
- App store preparation

**Total: 8 weeks** (vs 17-23 weeks for full backend changes)

## Advantages of This Approach

### Development Benefits
- **Faster development**: Reuse all existing API endpoints
- **Lower risk**: Backend remains stable and tested
- **Shared logic**: Same business rules and validation
- **Easier maintenance**: One backend serves both platforms

### Technical Benefits
- **Same security model**: Existing PHI compliance works unchanged
- **Same database**: No data migration or synchronization
- **Same authentication**: Sessions work across platforms
- **Same file storage**: Google Cloud Storage integration unchanged

This approach lets you build a native mobile app in 8 weeks instead of 17-23 weeks by leveraging your existing, well-tested backend infrastructure.