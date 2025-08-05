import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle } from "lucide-react";

interface PHICheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onYes: () => void;
  onNo: () => void;
  messageContent: string;
}

export function PHICheckModal({ 
  isOpen, 
  onClose, 
  onYes, 
  onNo, 
  messageContent 
}: PHICheckModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span>PHI Content Check</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Message Preview */}
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message to Send:
            </p>
            <div className="text-sm text-gray-900 dark:text-slate-100 max-h-20 overflow-y-auto">
              {messageContent}
            </div>
          </div>

          {/* PHI Question */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  Does this message contain PHI?
                </h3>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  PHI includes patient names, dates of birth, SSN, medical records, insurance information, or any other protected health information.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={onNo}
              className="flex-1"
            >
              No - Send Normally
            </Button>
            <Button
              onClick={onYes}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Yes - Contains PHI
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}