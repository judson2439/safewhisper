import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock, AlertTriangle, FileText, User, Calendar, CreditCard, Hash, CheckCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

// TypeScript declaration for window property
declare global {
  interface Window {
    lastPHITypes?: string[];
  }
}

interface PHIMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (phiData: PHIMessageData) => void;
  messageContent: string;
}

export interface PHIMessageData {
  containsPHI: boolean;
  phiTypes: string[];
  description?: string;
  patientFirstName: string;
  patientLastName: string;
}

const PHI_TYPES = [
  { id: 'insurance_card', label: 'Insurance Card Information', icon: CreditCard },
  { id: 'patient_name', label: 'Patient Name', icon: User },
  { id: 'patient_dob', label: 'Patient Date of Birth', icon: Calendar },
  { id: 'patient_ssn', label: 'Patient SSN', icon: Hash },
  { id: 'medical_records', label: 'Medical Records', icon: FileText },
  { id: 'diagnosis', label: 'Diagnosis Information', icon: FileText },
  { id: 'other', label: 'Other PHI', icon: Shield },
];

export function PHIMessageModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  messageContent 
}: PHIMessageModalProps) {
  const [selectedPHITypes, setSelectedPHITypes] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [patientFirstName, setPatientFirstName] = useState('');
  const [patientLastName, setPatientLastName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      console.log('🚪 PHI Modal - Opening, resetting state');
      setSelectedPHITypes([]);
      setDescription('');
      setPatientFirstName('');
      setPatientLastName('');
      setError('');
      setIsSubmitting(false);
      setIsSuccess(false);
      if (typeof window !== 'undefined') {
        window.lastPHITypes = [];
      }
      console.log('✅ PHI Modal - State reset complete');
    }
  }, [isOpen]);

  const handlePHITypeChange = (phiType: string, checked: boolean | 'indeterminate') => {
    console.log('✅ PHI Checkbox clicked:', phiType, 'checked:', checked);
    
    const isChecked = checked === true;
    
    if (isChecked) {
      if (!selectedPHITypes.includes(phiType)) {
        const newTypes = [...selectedPHITypes, phiType];
        console.log('✅ Added PHI type:', phiType, 'New list:', newTypes);
        setSelectedPHITypes(newTypes);
        if (typeof window !== 'undefined') {
          window.lastPHITypes = newTypes;
        }
      }
    } else {
      if (selectedPHITypes.includes(phiType)) {
        const newTypes = selectedPHITypes.filter(type => type !== phiType);
        console.log('❌ Removed PHI type:', phiType, 'New list:', newTypes);
        setSelectedPHITypes(newTypes);
        if (typeof window !== 'undefined') {
          window.lastPHITypes = newTypes;
        }
      }
    }
  };

  const handleConfirm = async () => {
    console.log('🚀 PHI Modal - BUTTON CLICKED - handleConfirm starting');
    console.log('🚀 PHI Modal - Current state values:', {
      patientFirstName: patientFirstName,
      patientLastName: patientLastName,
      selectedPHITypes: selectedPHITypes,
      description: description
    });
    
    setError('');
    setIsSubmitting(true);

    // Validate required fields
    if (!patientFirstName.trim() || !patientLastName.trim()) {
      setError('Patient first name and last name are required for PHI messages.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Use current state - React state should be reliable now
      const currentTypes = typeof window !== 'undefined' && window.lastPHITypes 
        ? window.lastPHITypes 
        : selectedPHITypes;

      console.log('📋 Final PHI types to send:', currentTypes);
      console.log('👤 Patient name:', patientFirstName.trim(), patientLastName.trim());

      const phiData = {
        containsPHI: true, // Always true since user confirmed PHI
        phiTypes: ['testing'], // Hardcoded for testing patient names
        description: description.trim() || undefined,
        patientFirstName: patientFirstName.trim(),
        patientLastName: patientLastName.trim(),
      };
      
      console.log('🎯 PHI Modal - Final data being sent:', JSON.stringify(phiData, null, 2));
      
      // Extra validation logging
      if (!phiData.patientFirstName || !phiData.patientLastName) {
        console.error('❌ PHI Modal - ERROR: Patient names are empty!', {
          patientFirstName: phiData.patientFirstName,
          patientLastName: phiData.patientLastName,
          originalInputs: {
            patientFirstName: patientFirstName,
            patientLastName: patientLastName
          }
        });
      } else {
        console.log('✅ PHI Modal - Patient names validated successfully');
      }

      // Send the message
      await onConfirm(phiData);

      // Show success state
      setIsSuccess(true);
      setIsSubmitting(false);

      // Auto-dismiss after showing success for 1.5 seconds
      setTimeout(() => {
        setIsSuccess(false);
        setIsSubmitting(false);
        
        // Reset state
        setSelectedPHITypes([]);
        setDescription('');
        setPatientFirstName('');
        setPatientLastName('');
        setError('');
        if (typeof window !== 'undefined') {
          window.lastPHITypes = [];
        }
        
        // Close modal
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Error sending PHI message:', error);
      setError('Failed to send secure message. Please try again.');
      setIsSubmitting(false);
      setIsSuccess(false);
    }
  };

  const handleCancel = () => {
    console.log('PHI Modal - Cancel clicked');
    setError('');
    setSelectedPHITypes([]);
    setDescription('');
    setPatientFirstName('');
    setPatientLastName('');
    onClose();
  };



  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" key={isOpen ? 'phi-modal-open' : 'phi-modal-closed'}>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {isSuccess ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Message Sent Successfully</span>
              </>
            ) : (
              <>
                <Shield className="h-5 w-5 text-blue-600" />
                <span>PHI Content Categorization</span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          <div className="space-y-4 text-center py-6">
            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <p className="text-green-800 dark:text-green-200 font-medium">
                Secure PHI message sent successfully
              </p>
              <p className="text-green-700 dark:text-green-300 text-sm mt-1">
                Recipients must authenticate to view this message
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Message Preview */}
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Message:
              </Label>
              <div className="text-sm text-gray-900 dark:text-slate-100 max-h-16 overflow-y-auto">
                {messageContent}
              </div>
            </div>

            {/* PHI Alert */}
            <Alert className="border-orange-200 dark:border-orange-800 py-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 dark:text-orange-200 text-sm">
                This message contains PHI and will be password-protected. Recipients must authenticate to view.
              </AlertDescription>
            </Alert>

            {/* Patient Identification Section */}
            <div className="space-y-3 border rounded-lg p-3 bg-orange-50 dark:bg-orange-950/20">
              <Label className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                Patient Identification (Required)
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="patientFirstName" className="text-xs">First Name *</Label>
                  <Input
                    id="patientFirstName"
                    value={patientFirstName}
                    onChange={(e) => setPatientFirstName(e.target.value)}
                    placeholder="First name"
                    className="mt-1 text-sm"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="patientLastName" className="text-xs">Last Name *</Label>
                  <Input
                    id="patientLastName"
                    value={patientLastName}
                    onChange={(e) => setPatientLastName(e.target.value)}
                    placeholder="Last name"
                    className="mt-1 text-sm"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="phi-description" className="text-sm font-medium">
                Additional Description (optional):
              </Label>
              <Input
                id="phi-description"
                placeholder="Brief description of PHI content..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-sm"
                disabled={isSubmitting}
              />
            </div>

            {/* Error Display */}
            {error && (
              <Alert className="border-red-200 dark:border-red-800 py-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 dark:text-red-200 text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {!isSuccess && (
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="px-4"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              className="px-4 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Send Secure Message
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}