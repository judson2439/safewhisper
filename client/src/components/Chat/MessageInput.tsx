import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, Smile, Send, Lock, Clock, EyeOff } from "lucide-react";
// import { FileUploader, type FileAttachment } from "./FileUploader"; // Temporarily disabled
import { type FileAttachment } from "./FileUploader";
import { AttachmentDisplay } from "./AttachmentDisplay";

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: FileAttachment[]) => void;
  onTyping: (isTyping: boolean) => void;
}

export default function MessageInput({ onSendMessage, onTyping }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    // Send typing indicator
    onTyping(true);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    if (message.trim() || attachments.length > 0) {
      onSendMessage(message.trim(), attachments);
      setMessage("");
      setAttachments([]);
      onTyping(false);
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleFileSelect = (files: FileAttachment[]) => {
    setAttachments(files);
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(a => a.id !== attachmentId));
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4">
      {/* Attachment Preview */}
      {attachments.length > 0 && (
        <AttachmentDisplay
          attachments={attachments}
          variant="preview"
          onRemove={handleRemoveAttachment}
        />
      )}
      
      <div className="flex items-end space-x-1 sm:space-x-2 lg:space-x-3">
        <div className="flex-1 relative">
          <div className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
            <Input
              type="text"
              placeholder="Message"
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="border-0 focus:ring-0 py-2 sm:py-3 px-3 sm:px-4 text-sm sm:text-base placeholder-gray-500 dark:placeholder-gray-400 bg-transparent text-gray-900 dark:text-gray-100 min-h-[48px] sm:min-h-[44px]"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* File Upload Button */}
          <input
            type="file"
            multiple
            accept="image/*,application/pdf,.doc,.docx,.txt"
            style={{ display: 'none' }}
            id="file-upload-input"
            onChange={async (e) => {
              const files = e.target.files;
              if (!files || files.length === 0) return;
              
              const uploadedFiles: FileAttachment[] = [];
              
              for (let i = 0; i < files.length; i++) {
                const file = files[i];
                
                try {
                  // Get upload URL from backend
                  const response = await fetch('/api/attachments/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      fileName: file.name,
                      contentType: file.type,
                      size: file.size
                    })
                  });
                  
                  if (!response.ok) continue;
                  
                  const { uploadURL } = await response.json();
                  
                  // Upload file directly to storage
                  const uploadResponse = await fetch(uploadURL, {
                    method: 'PUT',
                    body: file,
                    headers: { 'Content-Type': file.type }
                  });
                  
                  if (uploadResponse.ok) {
                    const attachment: FileAttachment = {
                      id: `file-${Date.now()}-${i}`,
                      name: file.name,
                      size: file.size,
                      type: file.type,
                      url: uploadURL.split('?')[0],
                      uploadedAt: new Date()
                    };
                    uploadedFiles.push(attachment);
                  }
                } catch (error) {
                  console.error('Upload error:', error);
                }
              }
              
              if (uploadedFiles.length > 0) {
                handleFileSelect(uploadedFiles);
              }
              
              e.target.value = '';
            }}
          />
          
          <Button
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 min-h-[48px] min-w-[48px] sm:min-h-[44px] sm:min-w-[44px]"
            title="Upload Files"
            onClick={() => {
              const input = document.getElementById('file-upload-input');
              input?.click();
            }}
          >
            <Paperclip className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </Button>
          
          {/* Hide emoji button on mobile to save space */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="hidden sm:block p-2 hover:bg-gray-100 dark:hover:bg-gray-800 min-h-[44px] min-w-[44px]" 
            title="Emoji"
          >
            <Smile className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </Button>
          
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() && attachments.length === 0}
            className={`p-2 rounded-lg transition-all min-h-[48px] min-w-[48px] sm:min-h-[44px] sm:min-w-[44px] ${
              message.trim() || attachments.length > 0
                ? "bg-blue-600 hover:bg-blue-700 text-white" 
                : "bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed"
            }`}
            title="Send Message"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
      
      {/* Slack-like security status - Responsive layout */}
      <div className="mt-2 md:mt-3 flex flex-col md:flex-row md:items-center md:justify-between text-xs text-gray-400 space-y-1 md:space-y-0">
        <div className="flex items-center space-x-2 md:space-x-4 justify-center md:justify-start">
          <div className="flex items-center space-x-1">
            <Lock className="w-3 h-3 text-green-500" />
            <span className="hidden sm:inline">Encrypted</span>
          </div>
          <div className="flex items-center space-x-1">
            <EyeOff className="w-3 h-3 text-blue-500" />
            <span className="hidden sm:inline">Protected</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-amber-500" />
            <span className="hidden sm:inline">24h delete</span>
          </div>
        </div>
        <div className="text-gray-400 hidden md:block">
          <span>Press Enter to send</span>
        </div>
      </div>
    </div>
  );
}