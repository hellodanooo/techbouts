'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from '@/components/ui/button';
import { Resend } from 'resend';
import CustomEmail from './CustomEmail';
import { render } from '@react-email/render';
import { useState, useEffect } from 'react';

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

export default function EmailEditor() {
  // Editable email fields
  const [subject, setSubject] = useState("Welcome to Our Platform!");
  const [message, setMessage] = useState("Thank you for signing up. We're excited to have you!");
  const [buttonText, setButtonText] = useState("Get Started");
  const [buttonUrl, setButtonUrl] = useState("https://your-website.com");
  const [imageUrl, setImageUrl] = useState("https://your-image-url.com/banner.png");
  const [preview, setPreview] = useState("");

  const editor = useEditor({
    extensions: [StarterKit],
    content: message,
    onUpdate: ({ editor }) => {
      setMessage(editor.getHTML());
    },
  });

  // Update email preview when fields change
  useEffect(() => {
    const updatePreview = async () => {
      const emailHtml = await render(
        <CustomEmail
          subject={subject}
          message={message}
          buttonText={buttonText}
          buttonUrl={buttonUrl}
          imageUrl={imageUrl}
        />
      );

      setPreview(emailHtml);
    };

    updatePreview();
  }, [subject, message, buttonText, buttonUrl, imageUrl]);

  // Send email using the updated template
  const sendEmail = async () => {
    try {
      const htmlContent = await render(
        <CustomEmail subject={subject} message={message} buttonText={buttonText} buttonUrl={buttonUrl} imageUrl={imageUrl} />
      );

      await resend.emails.send({
        from: 'your-email@example.com',
        to: ['your-email@example.com'], // Replace with actual recipient list
        subject: subject,
        html: htmlContent,
      });

      alert('Email sent successfully!');
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  if (!editor) return null;

  return (
    <div className="space-y-4">
      {/* Editable Input Fields */}
      <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email Subject" className="w-full p-2 border rounded" />
      <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL" className="w-full p-2 border rounded" />
      <EditorContent editor={editor} className="p-4 min-h-[200px] border rounded" />
      <input type="text" value={buttonText} onChange={(e) => setButtonText(e.target.value)} placeholder="Button Text" className="w-full p-2 border rounded" />
      <input type="text" value={buttonUrl} onChange={(e) => setButtonUrl(e.target.value)} placeholder="Button URL" className="w-full p-2 border rounded" />

      {/* Live Email Preview */}
      <div className="border rounded-md p-4 mt-4 bg-gray-100">
        <h3 className="text-lg font-semibold">Live Email Preview</h3>
        <div dangerouslySetInnerHTML={{ __html: preview }} className="p-4 bg-white rounded-md shadow-md" />
      </div>

      <Button onClick={sendEmail} className="mt-4">Send Email</Button>
    </div>
  );
}
