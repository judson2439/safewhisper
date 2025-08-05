import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock, Eye, EyeOff, AlertTriangle, CheckCircle, FileText, Image, Paperclip } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { AttachmentDisplay } from './AttachmentDisplay';

interface SecureMessagePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string;
  messageContent: string;
  securityLevel: string;
  phiTypes?: string[];
  phiDescription?: string;
  attachments?: any[];
  senderName: string;
  timestamp: string;
  onAuthenticationSuccess?: (messageData: any) => void;
}

const SECURITY_LEVELS = {
  confidential: {
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    label: 'CONFIDENTIAL',
  },
  restricted: {
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    label: 'RESTRICTED',
  },
  classified: {
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    label: 'CLASSIFIED',
  },
};

const PHI_TYPE_LABELS = {
  'insurance_card': 'Insurance Card Information',
  'patient_name': 'Patient Name',
  'patient_dob': 'Patient Date of Birth',
  'patient_ssn': 'Patient SSN',
  'medical_records': 'Medical Records',
  'diagnosis': 'Diagnosis Information',
  'other': 'Other PHI',
};

export function SecureMessagePasswordModal({
  isOpen,
  onClose,
  messageId,
  messageContent,
  securityLevel,
  phiTypes = [],
  phiDescription,
  attachments = [],
  senderName,
  timestamp,
  onAuthenticationSuccess
}: SecureMessagePasswordModalProps) {
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [authenticationAttempts, setAuthenticationAttempts] = useState(0);
  const [messageData, setMessageData] = useState<any>(null);

  const securityInfo = SECURITY_LEVELS[securityLevel as keyof typeof SECURITY_LEVELS] || SECURITY_LEVELS.confidential;

  const handleAuthentication = async () => {
    if (!password.trim()) {
      setError('Please enter your system password');
      return;
    }

    setIsAuthenticating(true);
    setError('');

    try {
      console.log('Authenticating secure message:', { messageId, passwordLength: password.trim().length });
      
      const response = await apiRequest('POST', '/api/messages/authenticate-secure', {
        messageId,
        password: password.trim(),
      });

      const data = await response.json();
      console.log('Authentication response data:', data);
      console.log('Response success property:', data?.success);

      if (data && data.success === true) {
        console.log('Authentication successful, setting authenticated to true');
        console.log('Message data received:', data.messageData);
        console.log('Attachments in message data:', data.messageData?.attachments);
        console.log('Attachments type:', typeof data.messageData?.attachments);
        console.log('Attachments array check:', Array.isArray(data.messageData?.attachments));
        if (data.messageData?.attachments) {
          data.messageData.attachments.forEach((att: any, idx: number) => {
            console.log(`Attachment ${idx}:`, att);
            console.log(`- ID: ${att.id}`);
            console.log(`- Name: ${att.name}`);  
            console.log(`- Type: ${att.type}`);
            console.log(`- URL: ${att.url}`);
            console.log(`- Size: ${att.size}`);
          });
        }
        setMessageData(data.messageData);
        setIsAuthenticated(true);
        setError('');
        // Call parent's success handler if provided
        if (onAuthenticationSuccess) {
          onAuthenticationSuccess(data.messageData);
        }
        // Password is correct, user can now view the message
      } else {
        console.log('Authentication failed, data was:', data);
        setAuthenticationAttempts(prev => prev + 1);
        setError(data?.message || 'Invalid password. Please try again.');
        setPassword('');
      }
    } catch (error: any) {
      console.error('Authentication error (caught):', error);
      setAuthenticationAttempts(prev => prev + 1);
      setError(error.message || 'Authentication failed. Please try again.');
      setPassword('');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isAuthenticating) {
      handleAuthentication();
    }
  };

  const handleClose = () => {
    setPassword('');
    setShowPassword(false);
    setIsAuthenticated(false);
    setError('');
    setAuthenticationAttempts(0);
    onClose();
  };

  const renderAttachment = (attachment: any, index: number) => {
    const isImage = attachment.type?.startsWith('image/');
    const isDocument = attachment.type?.includes('pdf') || attachment.type?.includes('document');
    
    return (
      <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
        {isImage ? (
          <Image className="h-4 w-4 text-blue-600" />
        ) : isDocument ? (
          <FileText className="h-4 w-4 text-red-600" />
        ) : (
          <Paperclip className="h-4 w-4 text-gray-600" />
        )}
        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
          {attachment.name || `Attachment ${index + 1}`}
        </span>
        {attachment.size && (
          <span className="text-xs text-gray-500">
            ({Math.round(attachment.size / 1024)}KB)
          </span>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span>
              {isAuthenticated ? 'Secure Message Authenticated' : 'Secure Message Authentication Required'}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Security Level Badge */}
          <div className={`p-3 rounded-lg border ${securityInfo.bgColor} ${securityInfo.borderColor}`}>
            <div className="flex items-center space-x-2 mb-2">
              <Lock className={`h-4 w-4 ${securityInfo.color}`} />
              <Badge variant="outline" className={`${securityInfo.color} ${securityInfo.borderColor}`}>
                {securityInfo.label}
              </Badge>
            </div>
            <div className="text-sm">
              <strong>From:</strong> {senderName} <br />
              <strong>Time:</strong> {timestamp ? new Date(timestamp).toLocaleString() : 'Invalid date'} <br />
              {phiTypes.length > 0 && (
                <>
                  <strong>PHI Types:</strong> {phiTypes.map(type => PHI_TYPE_LABELS[type as keyof typeof PHI_TYPE_LABELS] || type).join(', ')}
                </>
              )}
            </div>
          </div>

          {!isAuthenticated ? (
            <>
              {/* Authentication Form */}
              <div className="space-y-4">
                <Alert className="border-blue-200 dark:border-blue-800">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    HIPAA NOTICE: This message contains protected health information and requires authentication to view. All access attempts will be logged for compliance purposes.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="system-password" className="text-sm font-medium">
                    Enter Your System Password:
                  </Label>
                  <div className="relative">
                    <Input
                      id="system-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Your system password"
                      className="pr-10"
                      disabled={isAuthenticating}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isAuthenticating}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                {error && (
                  <Alert className="border-red-200 dark:border-red-800">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 dark:text-red-200">
                      {error}
                      {authenticationAttempts > 0 && (
                        <div className="mt-1 text-sm">
                          Failed attempts: {authenticationAttempts}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Authenticated - Show Message Content */}
              <Alert className="border-green-200 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Authentication successful. Message content decrypted and access logged.
                </AlertDescription>
              </Alert>

              {/* Message Content */}
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Message Content:
                  </Label>
                  <div className="text-gray-900 dark:text-slate-100 whitespace-pre-wrap">
                    {messageData?.content || messageContent}
                  </div>
                </div>

                {/* PHI Description */}
                {(messageData?.phiDescription || phiDescription) && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <Label className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2 block">
                      PHI Description:
                    </Label>
                    <div className="text-yellow-700 dark:text-yellow-300 text-sm">
                      {messageData?.phiDescription || phiDescription}
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {((messageData?.attachments && messageData.attachments.length > 0) || attachments.length > 0) && (
                  <AttachmentDisplay 
                    attachments={messageData?.attachments || attachments} 
                    variant="message" 
                  />
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            {isAuthenticated ? 'Close' : 'Cancel'}
          </Button>
          {!isAuthenticated && (
            <Button 
              onClick={handleAuthentication} 
              disabled={isAuthenticating || !password.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isAuthenticating ? (
                <>
                  <Lock className="h-4 w-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Authenticate
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}