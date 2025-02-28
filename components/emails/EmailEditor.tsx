// app/emails/[promotion]/EmailEditor.tsx
// EmailEditor.tsx
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CustomEmail_1 from './templates/CustomEmail_1';
import { render } from '@react-email/render';
import { useState, useEffect } from 'react';
import { uploadEmailImage } from '@/utils/images/uploadEmailImage';
import ImageBankModal from './EmailImageBank';
import { Button } from '@/components/ui/button';

interface EmailEditorProps {
  promotion: string;
  subject: string;
  message: string;
  buttonText: string;
  buttonUrl: string;
  onSubjectChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onButtonTextChange: (value: string) => void;
  onButtonUrlChange: (value: string) => void;
  onRenderedHtmlChange: (value: string) => void; // New prop for rendered HTML
}

export default function EmailEditor({
  promotion,
  subject,
  buttonText,
  buttonUrl,
  onSubjectChange,
  onButtonTextChange,
  onButtonUrlChange,
  onRenderedHtmlChange
}: Omit<EmailEditorProps, 'message' | 'onMessageChange'>) {
  const [editorContent, setEditorContent] = useState("Enter Message Content Here");
  const [preview, setPreview] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isImageBankOpen, setIsImageBankOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: editorContent,
    onUpdate: ({ editor }) => {
      setEditorContent(editor.getHTML());
    },
  });

  const cleanHtmlContent = (html: string) => {
    // Remove p tags but keep their content
    return html.replace(/<p>/g, '').replace(/<\/p>/g, '');
  };

  useEffect(() => {
    const updatePreview = async () => {
      const cleanedContent = cleanHtmlContent(editorContent);
      const emailHtml = await render(
        <CustomEmail_1
          subject={subject}
          message={cleanedContent}
          buttonText={buttonText}
          buttonUrl={buttonUrl}
          promotion={promotion}
          image={imageUrl}
        />
      );

      setPreview(emailHtml);
      onRenderedHtmlChange(emailHtml);
    };

    updatePreview();
  }, [subject, editorContent, buttonText, buttonUrl, promotion, imageUrl, onRenderedHtmlChange]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const imageName = `email_${Date.now()}`;
      const url = await uploadEmailImage(file, imageName);
      setImageUrl(url);
    } catch (error) {
      console.error('Error uploading image:', error);
      // You might want to add error handling UI here
    } finally {
      setUploading(false);
    }
  };

  if (!editor) return null;

  return (
    <div className="space-y-4 max-w-4xl mx-auto p-6">
      <div className="grid gap-4">
        <input
          type="text"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          placeholder="Email Subject"
          className="w-full p-2 border rounded-md"
        />
        
        <EditorContent
          editor={editor}
          className="min-h-[200px] border rounded-md p-4"
        />
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Email Image</label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsImageBankOpen(true)}
            >
              Open Image Bank
            </Button>
            <div className="relative">
              <input
                type="file"
                onChange={handleImageUpload}
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload New Image'}
              </Button>
            </div>
          </div>
          {imageUrl && (
            <div className="relative mt-2">
              <img
                src={imageUrl}
                alt="Selected email image"
                className="max-h-40 rounded-md"
              />
              <button
                onClick={() => setImageUrl('')}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
              >
                ×
              </button>
            </div>
          )}
        </div>
        
        <input
          type="text"
          value={buttonText}
          onChange={(e) => onButtonTextChange(e.target.value)}
          placeholder="Button Text"
          className="w-full p-2 border rounded-md"
        />
        
        <input
          type="text"
          value={buttonUrl}
          onChange={(e) => onButtonUrlChange(e.target.value)}
          placeholder="Button URL"
          className="w-full p-2 border rounded-md"
        />
      </div>

      <div className="border rounded-md p-4 bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Live Email Preview</h3>
        <div
          dangerouslySetInnerHTML={{ __html: preview }}
          className="bg-white rounded-md shadow-sm p-4"
        />
      </div>

{isImageBankOpen && (
  <ImageBankModal
  isOpen={isImageBankOpen}
  onClose={() => setIsImageBankOpen(false)}
  onImageSelect={(url) => setImageUrl(url)}
/>
)}

   </div>   
  );
}