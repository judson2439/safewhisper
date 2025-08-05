import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock, AlertTriangle, Eye, EyeOff } from 'lucide-react';

interface PHIPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticate: (password: string) => void;
  messageId: string;
  phiTypes: string[];
  isLoading?: boolean;
  error?: string;
}

export function PHIPasswordModal({
  isOpen,
  onClose,
  onAuthenticate,
  messageId,
  phiTypes,
  isLoading = false,
  error = '',
}: PHIPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = () => {
    if (!password.trim()) {
      return;
    }
    onAuthenticate(password);
  };

  const handleCancel = () => {
    setPassword('');
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit();
    }
  };

  const formatPHITypes = (types: string[]) => {
    return types.map(type => {
      switch (type) {
        case 'insurance_card': return 'Insurance Card';
        case 'patient_name': return 'Patient Name';
        case 'patient_dob': return 'Date of Birth';
        case 'patient_ssn': return 'Social Security Number';
        case 'medical_records': return 'Medical Records';
        case 'diagnosis': return 'Diagnosis';
        case 'other': return 'Other PHI';
        default: return type;
      }
    }).join(', ');
  };

  return (
    <Dialog open={isOpen} onOpenChange={!isLoading ? handleCancel : undefined}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-red-600" />
            <span>PHI Message Authentication</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* PHI Warning */}
          <Alert className="border-red-200 dark:border-red-800">
            <Lock className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              <div className="space-y-2">
                <p><strong>Protected Health Information Detected</strong></p>
                <p>Types: {formatPHITypes(phiTypes)}</p>
                <p className="text-xs">Enter your system password to access this message. Access will be logged for HIPAA compliance.</p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="system-password">System Password</Label>
            <div className="relative">
              <Input
                id="system-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your system password"
                className="pr-10"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
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
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!password.trim() || isLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? 'Authenticating...' : 'Access PHI Message'}
            </Button>
          </div>

          {/* Compliance Notice */}
          <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t">
            <p className="flex items-center space-x-1">
              <Lock className="h-3 w-3" />
              <span>Access logged with user details, timestamp, and workforce information for HIPAA compliance</span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}