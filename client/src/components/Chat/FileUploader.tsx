import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import { Paperclip, Image, FileText } from "lucide-react";

interface FileUploaderProps {
  onFileSelect: (files: FileAttachment[]) => void;
  acceptedTypes?: string[];
  maxFiles?: number;
  children?: ReactNode;
  variant?: "image" | "document" | "all";
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
}

const FILE_TYPE_CONFIGS = {
  image: {
    accept: ['.jpg', '.jpeg', '.png', '.heic', '.webp', '.gif', '.bmp', '.tiff'],
    mimeTypes: ['image/*'],
    icon: Image,
    label: "Add Image"
  },
  document: {
    accept: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.rtf', '.zip', '.json', '.xml'],
    mimeTypes: [
      'application/pdf', 
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'text/csv', 'text/rtf',
      'application/zip', 'application/x-zip-compressed',
      'application/json', 'application/xml'
    ],
    icon: FileText,
    label: "Add Document"
  },
  all: {
    accept: ['.jpg', '.jpeg', '.png', '.heic', '.webp', '.gif', '.bmp', '.tiff', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.rtf', '.zip', '.json', '.xml'],
    mimeTypes: [
      'image/*', 
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'text/csv', 'text/rtf',
      'application/zip', 'application/x-zip-compressed',
      'application/json', 'application/xml'
    ],
    icon: Paperclip,
    label: "Add File"
  }
};

export function FileUploader({
  onFileSelect,
  acceptedTypes,
  maxFiles = 5,
  children,
  variant = "all"
}: FileUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileAttachment[]>([]);

  const config = FILE_TYPE_CONFIGS[variant];
  const Icon = config.icon;
  
  console.log('FileUploader rendering with variant:', variant, 'children:', !!children);

  const [uppy] = useState(() => {
    const restrictions: any = {
      maxNumberOfFiles: maxFiles,
      maxFileSize: 50 * 1024 * 1024, // 50MB max
    };

    if (acceptedTypes) {
      restrictions.allowedFileTypes = acceptedTypes;
    } else {
      restrictions.allowedFileTypes = config.accept;
    }

    console.log('Initializing Uppy with restrictions:', restrictions);

    return new Uppy({
      restrictions,
      autoProceed: false,
      debug: true,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: async (file) => {
          console.log('Getting upload parameters for file:', file.name, 'Type:', file.type, 'Size:', file.size);
          
          // Check authentication status
          const authCheck = await fetch('/api/auth/user', {
            credentials: 'include'
          });
          console.log('Auth check status:', authCheck.status);
          if (!authCheck.ok) {
            console.error('User not authenticated for file upload');
            alert('Please log in to upload files');
            throw new Error('Authentication required for file upload');
          }
          
          // Get upload URL from backend
          const response = await fetch('/api/attachments/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              fileName: file.name,
              contentType: file.type,
              size: file.size
            }),
          });

          console.log('Upload URL response status:', response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Upload URL request failed:', response.status, errorText);
            throw new Error(`Failed to get upload URL: ${response.status} ${errorText}`);
          }

          const { uploadURL } = await response.json();
          console.log('Received upload URL:', uploadURL);
          
          return {
            method: 'PUT',
            url: uploadURL,
          };
        },
      })
      .on("complete", (result) => {
        console.log('Upload complete event triggered', result);
        if (result.successful) {
          console.log('Successful uploads:', result.successful.length);
          const newFiles: FileAttachment[] = result.successful.map((file) => {
            // Extract the proper storage path from the signed URL to create a Replit-accessible URL
            const uploadUrl = file.uploadURL || '';
            console.log('Processing uploaded file:', {
              fileName: file.name,
              uploadURL: file.uploadURL,
              fileType: file.type,
              responseData: file
            });
            
            // For Replit object storage, we need to store the actual storage path, not the signed URL
            // The signed URL expires, but we need to store permanent reference
            let storageUrl = uploadUrl;
            let actualFileName = file.name;
            
            try {
              if (uploadUrl.includes('storage.googleapis.com')) {
                // Parse the Google Cloud Storage URL to extract the actual file path
                const url = new URL(uploadUrl);
                const pathParts = url.pathname.split('/');
                
                if (pathParts.length >= 5 && pathParts[2] === '.private' && pathParts[3] === 'attachments') {
                  const bucketName = pathParts[1];
                  const fileName = pathParts[4];
                  actualFileName = fileName;
                  
                  // Store the full storage path so our serving endpoint can find it
                  storageUrl = `https://storage.googleapis.com/${bucketName}/.private/attachments/${fileName}`;
                  
                  console.log('Processed Replit storage file:', {
                    originalUploadURL: uploadUrl,
                    extractedBucket: bucketName,
                    extractedFileName: fileName,
                    storageURL: storageUrl,
                    fileId: file.id
                  });
                }
              }
            } catch (error) {
              console.warn('Failed to parse upload URL, using original:', error);
            }
            
            return {
              id: file.id,
              name: actualFileName || 'unknown',
              size: file.size || 0,
              type: file.type || 'application/octet-stream',
              url: storageUrl, // Store the permanent storage URL
              uploadedAt: new Date(),
            };
          });

          console.log('Created attachment objects:', newFiles);
          console.log('Current uploadedFiles before update:', uploadedFiles);
          setUploadedFiles(prev => {
            const updated = [...prev, ...newFiles];
            console.log('Updated uploadedFiles:', updated);
            return updated;
          });
          onFileSelect([...uploadedFiles, ...newFiles]);
          setShowModal(false);
        } else {
          console.log('No successful uploads in result');
        }
        if (result.failed && result.failed.length > 0) {
          console.log('Failed uploads:', result.failed);
        }
      })
      .on("upload-error", (file, error) => {
        console.error("Upload error for file:", file?.name, "Error:", error);
        console.error("Full error details:", JSON.stringify(error, null, 2));
      })
      .on("upload-success", (file, response) => {
        console.log("Upload success for file:", file?.name, "Response:", response);
      })
      .on("upload", (data) => {
        console.log("Upload event:", data);
      })
      .on("file-added", (file) => {
        console.log("File added to Uppy:", file.name, file.type, file.size);
      })
      .on("restriction-failed", (file, error) => {
        console.error("File restriction failed:", file?.name, error);
      });
  });

  return (
    <div>
      {children ? (
        <div onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('FileUploader wrapper clicked, opening modal');
          setShowModal(true);
        }} className="cursor-pointer">
          {children}
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('FileUploader button clicked, opening modal');
            setShowModal(true);
          }}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <Icon className="w-4 h-4" />
          {config.label}
        </Button>
      )}

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => {
          console.log('FileUploader modal closing');
          setShowModal(false);
        }}
        proudlyDisplayPoweredByUppy={false}
        note={`Upload ${variant === 'image' ? 'images' : variant === 'document' ? 'documents' : 'files'} (max ${maxFiles} files, 50MB each)`}
      />
    </div>
  );
}