// app/database/[sanctioning]/emails/EmailEditor.tsx
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered
} from 'lucide-react';

interface EmailEditorProps {
  onChange: (html: string) => void;
  value: string;
}

const EmailEditor = ({ onChange, value }: EmailEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const addImage = () => {
    const url = window.prompt('Enter the URL of the image:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    const url = window.prompt('Enter the URL:');
    if (url) {
      editor.chain().focus().toggleLink({ href: url }).run();
    }
  };

  const addButton = () => {
    const url = window.prompt('Enter the button URL:');
    if (url) {
      editor.chain().focus().insertContent(`
        <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;line-height:100%;">
          <tr>
            <td align="center" bgcolor="#e11d48" role="presentation" style="border:none;border-radius:5px;cursor:pointer;padding:10px 25px;" valign="middle">
              <a href="${url}" style="background:#e11d48;color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;line-height:120%;text-decoration:none;text-transform:none;" target="_blank">
                Click Here
              </a>
            </td>
          </tr>
        </table>
      `).run();
    }
  };

  const toolbar = [
    {
      icon: <Bold size={16} />,
      title: 'Bold',
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: () => editor.isActive('bold'),
    },
    {
      icon: <Italic size={16} />,
      title: 'Italic',
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: () => editor.isActive('italic'),
    },
    {
      icon: <AlignLeft size={16} />,
      title: 'Align Left',
      action: () => editor.chain().focus().setTextAlign('left').run(),
      isActive: () => editor.isActive({ textAlign: 'left' }),
    },
    {
      icon: <AlignCenter size={16} />,
      title: 'Center',
      action: () => editor.chain().focus().setTextAlign('center').run(),
      isActive: () => editor.isActive({ textAlign: 'center' }),
    },
    {
      icon: <AlignRight size={16} />,
      title: 'Align Right',
      action: () => editor.chain().focus().setTextAlign('right').run(),
      isActive: () => editor.isActive({ textAlign: 'right' }),
    },
    {
      icon: <List size={16} />,
      title: 'Bullet List',
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: () => editor.isActive('bulletList'),
    },
    {
      icon: <ListOrdered size={16} />,
      title: 'Numbered List',
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: () => editor.isActive('orderedList'),
    },
    {
      icon: <LinkIcon size={16} />,
      title: 'Add Link',
      action: addLink,
      isActive: () => editor.isActive('link'),
    },
    {
      icon: <ImageIcon size={16} />,
      title: 'Add Image',
      action: addImage,
      isActive: () => false,
    },
  ];

  return (
    <div className="border rounded-md">
      <div className="border-b p-2 flex flex-wrap gap-2 bg-gray-50">
        {toolbar.map((item, index) => (
          <Button
            key={index}
            onClick={item.action}
            variant={item.isActive() ? "default" : "outline"}
            size="icon"
            type="button"
          >
            {item.icon}
          </Button>
        ))}
        <Button
          onClick={addButton}
          variant="outline"
          size="sm"
          type="button"
        >
          Add Button
        </Button>
      </div>
      <EditorContent editor={editor} className="p-4 min-h-[200px]" />
    </div>
  );
};

export default EmailEditor;