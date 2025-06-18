import React, { useState } from "react";
import { ModelSelector } from "./ModelSelector";
import { fileToBase64 } from "../lib/utils";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export interface FileAttachment {
  type: "image" | "pdf";
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  base64?: string;
  storageId?: string;
}

interface InputAreaProps {
  input: string;
  setInput: (value: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  isLoading: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onSubmit: (attachments?: FileAttachment[]) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export function InputArea({ 
  input, 
  setInput, 
  selectedModel, 
  setSelectedModel, 
  isLoading, 
  textareaRef, 
  onSubmit, 
  onKeyDown 
}: InputAreaProps) {
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.chat.messages.generateUploadUrl);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const newAttachments: FileAttachment[] = [];
      
      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
          toast.error(`${file.name}: Only images and PDFs are supported`);
          continue;
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name}: File size must be less than 10MB`);
          continue;
        }

        try {
          // Get upload URL from Convex
          const uploadUrl = await generateUploadUrl();
          
          // Upload file to Convex storage
          const result = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
          });

          if (!result.ok) {
            throw new Error(`Upload failed: ${result.status}`);
          }

          const { storageId } = await result.json();
          
          // Convert to base64 for AI processing
          const base64 = await fileToBase64(file);
          
          const attachment: FileAttachment = {
            type: file.type.startsWith('image/') ? 'image' : 'pdf',
            url: URL.createObjectURL(file), // Temporary URL for preview
            filename: file.name,
            size: file.size,
            mimeType: file.type,
            base64,
            storageId,
          };
          
          newAttachments.push(attachment);
        } catch (uploadError) {
          console.error(`Failed to upload ${file.name}:`, uploadError);
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      if (newAttachments.length > 0) {
        setAttachments(prev => [...prev, ...newAttachments]);
        toast.success(`${newAttachments.length} file(s) uploaded successfully`);
      }
    } catch (error) {
      toast.error('Failed to process files');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const newAttachments = [...prev];
      // Revoke object URL to prevent memory leaks
      URL.revokeObjectURL(newAttachments[index].url);
      newAttachments.splice(index, 1);
      return newAttachments;
    });
  };

  const handleSubmit = () => {
    onSubmit(attachments.length > 0 ? attachments : undefined);
    // Clear attachments after sending
    attachments.forEach(att => URL.revokeObjectURL(att.url));
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else {
      onKeyDown(e);
    }
  };

  return (
    <div className="border-t border-gray-100 bg-gray-50/50 p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Model Selector */}
        <ModelSelector
          selectedModel={selectedModel}
          onModelSelect={setSelectedModel}
          className="w-full"
        />

        {/* File Attachments Display */}
        {attachments.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Attachments ({attachments.length})</h4>
            <div className="flex flex-wrap gap-3">
              {attachments.map((attachment, index) => (
                <div key={index} className="relative group">
                  <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
                    {attachment.type === 'image' ? (
                      <div className="flex items-center gap-3">
                        <img 
                          src={attachment.url} 
                          alt={attachment.filename}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate max-w-32">
                            {attachment.filename}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(attachment.size / 1024 / 1024).toFixed(1)} MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate max-w-32">
                            {attachment.filename}
                          </p>
                          <p className="text-xs text-gray-500">
                            PDF • {(attachment.size / 1024 / 1024).toFixed(1)} MB
                          </p>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => removeAttachment(index)}
                      className="ml-2 p-1 rounded-full bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors"
                      title="Remove attachment"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
            className="input-modern resize-none min-h-[60px] pr-24"
            disabled={isLoading || uploading}
            rows={1}
          />
          
          {/* File Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || uploading}
            className="absolute bottom-4 right-16 p-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            title="Attach files"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-600 rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            )}
          </button>

          {/* Send Button */}
          <button
            onClick={handleSubmit}
            disabled={(!input.trim() && attachments.length === 0) || isLoading || uploading}
            className="absolute bottom-4 right-4 p-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>
            KieraChat can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
    </div>
  );
}
