import { Download, FileText, Image as ImageIcon, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import type { FileAttachment } from "./FileUploader";

interface AttachmentDisplayProps {
  attachments: FileAttachment[];
  variant?: "message" | "preview";
  onRemove?: (attachmentId: string) => void;
  messageId?: string; // For PHI download logging
  isPhiMessage?: boolean; // To identify PHI messages
}

export function AttachmentDisplay({ 
  attachments, 
  variant = "message",
  onRemove,
  messageId,
  isPhiMessage = false
}: AttachmentDisplayProps) {
  console.log('AttachmentDisplay - attachments:', attachments);
  console.log('AttachmentDisplay - attachments length:', attachments?.length);
  console.log('AttachmentDisplay - variant:', variant);
  
  if (!attachments || attachments.length === 0) {
    console.log('AttachmentDisplay - No attachments, returning null');
    return null;
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return ImageIcon;
    if (type.includes('pdf')) return FileText;
    if (type.includes('word') || type.includes('document')) return FileText;
    if (type.includes('sheet') || type.includes('excel')) return FileText;
    return File;
  };

  const getFileTypeColor = (type: string) => {
    if (type.startsWith('image/')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (type.includes('pdf')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (type.includes('word') || type.includes('document')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (type.includes('sheet') || type.includes('excel')) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const isOldGoogleUrl = (url: string) => {
    // Only consider files from before August 2025 as old/legacy
    // All new files uploaded through our current system should work
    const uploadDate = new Date('2025-08-01T00:00:00Z');
    
    // For now, treat all files as accessible since we have a working attachment serving endpoint
    // The real test is whether the attachment serving endpoint can access the file
    return false;
  };

  const handleDownload = async (attachment: FileAttachment) => {
    try {
      console.log('Download - Starting download for:', attachment.name);
      console.log('Download - Attachment URL:', attachment.url);
      
      // All files should now work through the attachment serving endpoint
      console.log('Download - Processing file:', attachment.name, 'ID:', attachment.id);
      
      let downloadUrl;
      
      // Use the new attachment serving endpoint that looks up by attachment ID
      downloadUrl = `/api/attachments/serve/${encodeURIComponent(attachment.id)}`;
      console.log('Download - Using attachment serve endpoint:', downloadUrl);
      
      console.log('Download - Using URL:', downloadUrl);
      
      const response = await fetch(downloadUrl, {
        credentials: 'include'
      });
      
      console.log('Download - Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Download - Error response:', errorText);
        
        // Handle any authentication or access errors
        console.error('Download error details:', errorText);
        
        throw new Error(`Download failed: ${response.status} - ${errorText}`);
      }

      const blob = await response.blob();
      console.log('Download - Blob size:', blob.size);
      
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      console.log('Download - Successfully downloaded:', attachment.name);
      
      // Log PHI file download if this is a PHI message
      if (isPhiMessage && messageId) {
        try {
          const response = await fetch(`/api/phi-attachments/${messageId}/download-log`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              attachmentName: attachment.name,
              fileSize: attachment.size
            })
          });
          
          if (response.ok) {
            console.log('Download - PHI download activity logged successfully');
          } else {
            console.warn('Download - Failed to log PHI download activity');
          }
        } catch (error) {
          console.error('Download - Error logging PHI download activity:', error);
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to download ${attachment.name}: ${errorMessage}`);
    }
  };

  // Component for authenticated image display
  function AuthenticatedImage({ attachment }: { attachment: FileAttachment }) {
    const [imageSrc, setImageSrc] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
      console.log('AuthenticatedImage - Loading image for attachment:', attachment.name);
      console.log('AuthenticatedImage - Attachment URL:', attachment.url);
      
      async function loadImage() {
        try {
          setLoading(true);
          setError(false);
          
          // All files should now work through the attachment serving endpoint
          console.log('AuthenticatedImage - Processing image:', attachment.name, 'ID:', attachment.id);
          
          // Use the attachment serving endpoint with fetch to get proper authentication
          const imageUrl = `/api/attachments/serve/${encodeURIComponent(attachment.id)}`;
          console.log('AuthenticatedImage - Using image URL:', imageUrl);
          
          try {
            const response = await fetch(imageUrl, {
              method: 'GET',
              credentials: 'include'
            });
            
            console.log('AuthenticatedImage - Response status:', response.status);
            console.log('AuthenticatedImage - Response headers:', Object.fromEntries(response.headers.entries()));
            
            if (response.ok) {
              const blob = await response.blob();
              console.log('AuthenticatedImage - Blob created, size:', blob.size);
              const blobUrl = URL.createObjectURL(blob);
              console.log('AuthenticatedImage - Blob URL created:', blobUrl.substring(0, 50) + '...');
              setImageSrc(blobUrl);
              setLoading(false);
            } else {
              const errorText = await response.text();
              console.error('AuthenticatedImage - HTTP error:', response.status, errorText);
              throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
          } catch (fetchError) {
            console.error('AuthenticatedImage - Fetch error:', fetchError);
            // Fallback: try direct image loading (for old URLs or different auth methods)
            const img = new Image();
            img.onload = () => {
              console.log('AuthenticatedImage - Direct image load successful');
              setImageSrc(imageUrl);
              setLoading(false);
            };
            img.onerror = (imgErr) => {
              console.error('AuthenticatedImage - Both fetch and direct image load failed:', imgErr);
              setError(true);
              setLoading(false);
            };
            img.src = imageUrl;
          }
          
        } catch (error) {
          console.error('AuthenticatedImage - Error in loadImage:', error);
          setError(true);
          setLoading(false);
        }
      }
      
      loadImage();
      
      // Cleanup function to revoke blob URL
      return () => {
        if (imageSrc && imageSrc.startsWith('blob:')) {
          URL.revokeObjectURL(imageSrc);
        }
      };
    }, [attachment.id, attachment.url]);

    if (loading) {
      return (
        <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
          <div className="text-xs text-muted-foreground">Loading...</div>
        </div>
      );
    }

    if (error || !imageSrc) {
      const isOldFile = isOldGoogleUrl(attachment.url);
      return (
        <div className="w-full h-full bg-muted rounded-lg flex flex-col items-center justify-center p-2">
          <div className="text-xs text-muted-foreground text-center">
            {isOldFile ? 'File unavailable' : 'Failed to load image'}
          </div>
          {isOldFile && (
            <div className="text-xs text-muted-foreground text-center mt-1">
              (Legacy file - please re-upload)
            </div>
          )}
        </div>
      );
    }

    return (
      <img
        src={imageSrc}
        alt={attachment.name}
        className="w-full h-full object-cover cursor-pointer"
        loading="lazy"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('Image tag clicked directly:', attachment.name);
        }}
      />
    );
  }

  return (
    <div className={`space-y-2 ${variant === 'preview' ? 'mt-3 p-3 bg-muted/50 rounded-lg' : ''}`}>
      {variant === 'preview' && (
        <div className="text-sm font-medium text-muted-foreground">
          Attachments ({attachments.length})
        </div>
      )}
      
      <div className="grid gap-2">
        {attachments.map((attachment) => {
          const FileIcon = getFileIcon(attachment.type);
          const isImage = attachment.type.startsWith('image/');
          
          return (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-3 bg-background border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-shrink-0">
                <FileIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium truncate">
                    {attachment.name}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getFileTypeColor(attachment.type)}`}
                  >
                    {attachment.type.split('/')[1]?.toUpperCase() || 'FILE'}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatFileSize(attachment.size)}</span>
                  {variant === 'message' && (
                    <span>• {new Date(attachment.uploadedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {variant === 'preview' && onRemove && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(attachment.id)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  >
                    ×
                  </Button>
                )}
                
                {variant === 'message' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Download button clicked for:', attachment.name);
                      handleDownload(attachment);
                    }}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Image gallery for image attachments */}
      {variant === 'message' && attachments.some(a => a.type.startsWith('image/')) && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {attachments
            .filter(a => a.type.startsWith('image/'))
            .map((attachment) => {
              console.log('AttachmentDisplay - Rendering image:', attachment.name, 'ID:', attachment.id);
              return (
                <div 
                  key={attachment.id} 
                  className="relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Image clicked for download:', attachment.name);
                    handleDownload(attachment);
                  }}
                >
                  <AuthenticatedImage attachment={attachment} />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                    <Download className="w-5 h-5 text-white opacity-0 hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}