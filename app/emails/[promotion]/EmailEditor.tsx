// app/emails/[promotion]/EmailEditor.tsx
// EmailEditor.tsx
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CustomEmail_1 from '../../../components/emails/templates/CustomEmail_1';
import { render } from '@react-email/render';
import { useState, useEffect } from 'react';

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

  const editor = useEditor({
    extensions: [StarterKit],
    content: editorContent,
    onUpdate: ({ editor }) => {
      setEditorContent(editor.getHTML());
    },
  });

  useEffect(() => {
    const updatePreview = async () => {
      const emailHtml = await render(
        <CustomEmail_1
          subject={subject}
          message={editorContent} // Use local editor content
          buttonText={buttonText}
          buttonUrl={buttonUrl}
          promotion={promotion}
        />
      );

      setPreview(emailHtml);
      onRenderedHtmlChange(emailHtml);
    };

    updatePreview();
  }, [subject, editorContent, buttonText, buttonUrl, promotion, onRenderedHtmlChange]);


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
    </div>
  );
}