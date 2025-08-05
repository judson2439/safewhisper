import React, { useState } from 'react';
import { Shield, Lock, Eye, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SecureMessagePasswordModal } from './SecureMessagePasswordModal';
import { AttachmentDisplay } from './AttachmentDisplay';

interface SecureMessageProps {
  messageId: string;
  content: string;
  securityLevel: string;
  requiresAuthentication: boolean;
  phiTypes?: string[];
  phiDescription?: string;
  attachments?: any[];
  senderName?: string;
  timestamp?: string;
  isAuthenticated?: boolean;
  className?: string;
}

export function SecureMessage({
  messageId,
  content,
  securityLevel,
  requiresAuthentication,
  phiTypes = [],
  phiDescription,
  attachments = [],
  senderName = 'Unknown User',
  timestamp = new Date().toISOString(),
  isAuthenticated = false,
  className = '',
}: SecureMessageProps) {
  console.log('SecureMessage props:', { messageId, content, securityLevel, phiTypes, phiDescription, attachments, senderName, timestamp });
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isDecrypted, setIsDecrypted] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState('');
  const [authenticatedAttachments, setAuthenticatedAttachments] = useState<any[]>([]);

  const getSecurityLevelInfo = (level: string) => {
    switch (level) {
      case 'confidential':
        return { 
          color: 'text-yellow-600 dark:text-yellow-400', 
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          icon: Shield,
          label: 'CONFIDENTIAL',
          description: 'Confidential Message'
        };
      case 'restricted':
        return { 
          color: 'text-orange-600 dark:text-orange-400', 
          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
          borderColor: 'border-orange-200 dark:border-orange-800',
          icon: Lock,
          label: 'RESTRICTED',
          description: 'Restricted Access Message'
        };
      case 'classified':
        return { 
          color: 'text-red-600 dark:text-red-400', 
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          icon: AlertTriangle,
          label: 'CLASSIFIED',
          description: 'Classified Message'
        };
      default:
        return { 
          color: 'text-blue-600 dark:text-blue-400', 
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          icon: Shield,
          label: 'SECURE',
          description: 'Secure Message'
        };
    }
  };

  // If the message doesn't require authentication, show it normally
  if (!requiresAuthentication) {
    return <div className={className}>{content}</div>;
  }

  const securityInfo = getSecurityLevelInfo(securityLevel);
  const SecurityIcon = securityInfo.icon;

  const handleAuthenticate = () => {
    setShowPasswordModal(true);
  };

  const handleClose = () => {
    setShowPasswordModal(false);
  };

  const handleAuthenticationSuccess = (messageData: any) => {
    console.log('Authentication success - messageData:', messageData);
    console.log('Authentication success - attachments:', messageData.attachments);
    setDecryptedContent(messageData.content);
    
    // Update attachments state with authenticated data
    if (messageData.attachments && messageData.attachments.length > 0) {
      console.log('Setting authenticated attachments:', messageData.attachments);
      // We need to update the parent component's attachments, but for now let's use a state
      setAuthenticatedAttachments(messageData.attachments);
    }
    
    setIsDecrypted(true);
    setShowPasswordModal(false);
  };

  return (
    <div className={`${className} space-y-2`}>
      {/* Show decrypted content if authenticated */}
      {isDecrypted ? (
        <div className={`p-3 rounded-lg border ${securityInfo.bgColor} ${securityInfo.borderColor}`}>
          <div className="flex items-center space-x-2 mb-2">
            <SecurityIcon className={`h-4 w-4 ${securityInfo.color}`} />
            <span className={`text-xs font-bold ${securityInfo.color}`}>
              {securityInfo.label} MESSAGE - AUTHENTICATED
            </span>
            <Eye className={`h-3 w-3 ${securityInfo.color}`} />
          </div>
          
          {/* PHI Types Display */}
          {phiTypes.length > 0 && (
            <div className="mb-2 text-xs">
              <span className={`font-medium ${securityInfo.color}`}>PHI Types:</span>
              <span className="ml-1 text-gray-600 dark:text-gray-400">
                {phiTypes.join(', ')}
              </span>
            </div>
          )}
          
          {/* PHI Description */}
          {phiDescription && (
            <div className="mb-2 text-xs">
              <span className={`font-medium ${securityInfo.color}`}>PHI Description:</span>
              <span className="ml-1 text-gray-600 dark:text-gray-400">
                {phiDescription}
              </span>
            </div>
          )}
          
          {/* HIPAA Notice for authenticated PHI messages */}
          {phiTypes.length > 0 && (
            <div className="mb-3 p-2 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded text-xs text-yellow-800 dark:text-yellow-200">
              <strong>HIPAA NOTICE:</strong> This message contains protected health information and requires authentication to view. All access attempts will be logged for compliance purposes.
            </div>
          )}

          {/* Message Content */}
          <div className="text-sm text-gray-900 dark:text-slate-100 whitespace-pre-wrap">
            {decryptedContent}
          </div>
          
          {/* Attachments */}
          {(() => {
            const displayAttachments = authenticatedAttachments.length > 0 ? authenticatedAttachments : attachments;
            console.log('SecureMessage - About to render attachments section');
            console.log('SecureMessage - original attachments:', attachments);
            console.log('SecureMessage - authenticated attachments:', authenticatedAttachments);
            console.log('SecureMessage - display attachments:', displayAttachments);
            console.log('SecureMessage - display attachments length:', displayAttachments?.length);
            return null;
          })()}
          {(() => {
            const displayAttachments = authenticatedAttachments.length > 0 ? authenticatedAttachments : attachments;
            return displayAttachments && displayAttachments.length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-gray-500 mb-1">Attachments ({displayAttachments.length}):</div>
                <AttachmentDisplay 
                  attachments={displayAttachments} 
                  variant="message"
                  messageId={messageId}
                  isPhiMessage={true}
                />
              </div>
            );
          })()}
        </div>
      ) : (
        /* Yellow security box for PHI/secure messages */
        <div className="p-4 rounded-lg border bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <SecurityIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                {securityInfo.label} MESSAGE
              </span>
              {phiTypes.length > 0 && (
                <span className="text-xs bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                  PHI
                </span>
              )}
            </div>
            <Lock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </div>
          
          <div className="space-y-3">
            {phiTypes.length > 0 && (
              <div className="text-xs text-yellow-700 dark:text-yellow-300">
                <strong>Contains Protected Health Information (PHI)</strong>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-gray-400 to-gray-600 animate-pulse"></div>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">ENCRYPTED</span>
            </div>
            
            <Button
              onClick={handleAuthenticate}
              size="sm"
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              <Shield className="h-4 w-4 mr-2" />
              Authenticate to View Message
            </Button>
            
            {phiTypes.length > 0 && (
              <div className="text-xs text-yellow-700 dark:text-yellow-300 text-center">
                Access will be logged for HIPAA compliance.
              </div>
            )}

          </div>
        </div>
      )}

      {/* Password Authentication Modal */}
      <SecureMessagePasswordModal
        isOpen={showPasswordModal}
        onClose={handleClose}
        messageId={messageId}
        messageContent={content}
        securityLevel={securityLevel}
        phiTypes={phiTypes}
        phiDescription={phiDescription}
        attachments={attachments}
        senderName={senderName}
        timestamp={timestamp}
        onAuthenticationSuccess={handleAuthenticationSuccess}
      />
    </div>
  );
}