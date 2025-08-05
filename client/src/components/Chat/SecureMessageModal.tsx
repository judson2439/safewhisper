import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface SecureMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string;
  securityLevel: string;
  onMessageDecrypted: (content: string) => void;
}

export function SecureMessageModal({ 
  isOpen, 
  onClose, 
  messageId, 
  securityLevel, 
  onMessageDecrypted 
}: SecureMessageModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const getSecurityLevelInfo = (level: string) => {
    switch (level) {
      case 'confidential':
        return { 
          color: 'text-yellow-600 dark:text-yellow-400', 
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          icon: Shield,
          description: 'Confidential information requiring authentication'
        };
      case 'restricted':
        return { 
          color: 'text-orange-600 dark:text-orange-400', 
          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
          icon: Lock,
          description: 'Restricted access - authorized personnel only'
        };
      case 'classified':
        return { 
          color: 'text-red-600 dark:text-red-400', 
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          icon: AlertTriangle,
          description: 'Classified information - highest security clearance required'
        };
      default:
        return { 
          color: 'text-blue-600 dark:text-blue-400', 
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          icon: Shield,
          description: 'Secure message requiring authentication'
        };
    }
  };

  const securityInfo = getSecurityLevelInfo(securityLevel);
  const SecurityIcon = securityInfo.icon;

  const handleAuthenticate = async () => {
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setIsAuthenticating(true);
    setError('');

    try {
      const response = await apiRequest('POST', `/api/messages/${messageId}/authenticate`, {
        password
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Authentication Successful",
          description: "Access granted to secure message",
        });
        onMessageDecrypted(data.content || data.messageContent);
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Invalid password. Access denied.');
        toast({
          title: "Authentication Failed", 
          description: errorData.message || "Invalid password provided",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      setError('Authentication failed. Please try again.');
      toast({
        title: "Authentication Error",
        description: "Failed to authenticate message",
        variant: "destructive",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isAuthenticating) {
      handleAuthenticate();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <SecurityIcon className={`h-5 w-5 ${securityInfo.color}`} />
            <span>Secure Message Authentication</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${securityInfo.bgColor}`}>
            <div className="flex items-center space-x-2 mb-2">
              <SecurityIcon className={`h-4 w-4 ${securityInfo.color}`} />
              <span className={`text-sm font-medium ${securityInfo.color}`}>
                {securityLevel.toUpperCase()} MESSAGE
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {securityInfo.description}
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Enter Access Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter password to decrypt message"
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

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isAuthenticating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAuthenticate}
              disabled={isAuthenticating || !password.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isAuthenticating ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Authenticate
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t">
            <p className="flex items-center space-x-1">
              <Lock className="h-3 w-3" />
              <span>All access attempts are logged for security purposes</span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}