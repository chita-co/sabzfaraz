"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExt from "@tiptap/extension-image";
import LinkExt from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import {
  Bold, Italic, UnderlineIcon, List, ListOrdered, Quote, Heading2, Heading3,
  ImageIcon, LinkIcon, Undo, Redo,
} from "lucide-react";
import { useEffect } from "react";

export default function BlogEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      ImageExt.configure({ HTMLAttributes: { class: "blog-editor-image" } }),
      LinkExt.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer" } }),
      Placeholder.configure({ placeholder: "متن مقاله را اینجا بنویسید..." }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: { attributes: { class: "blog-editor-content" } },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) editor.commands.setContent(value, { emitUpdate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value === "" ? "__reset__" : null]);

  if (!editor) return null;

  function addImage() {
    const url = window.prompt("آدرس تصویر:");
    if (url) editor!.chain().focus().setImage({ src: url }).run();
  }
  function addLink() {
    const url = window.prompt("آدرس لینک:");
    if (url) editor!.chain().focus().setLink({ href: url }).run();
  }

  return (
    <div className="blog-editor-wrap">
      <div className="blog-editor-toolbar">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive("bold") ? "active" : ""}><Bold size={16} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive("italic") ? "active" : ""}><Italic size={16} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive("underline") ? "active" : ""}><UnderlineIcon size={16} /></button>
        <span className="blog-editor-sep" />
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive("heading", { level: 2 }) ? "active" : ""}><Heading2 size={16} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive("heading", { level: 3 }) ? "active" : ""}><Heading3 size={16} /></button>
        <span className="blog-editor-sep" />
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive("bulletList") ? "active" : ""}><List size={16} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive("orderedList") ? "active" : ""}><ListOrdered size={16} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive("blockquote") ? "active" : ""}><Quote size={16} /></button>
        <span className="blog-editor-sep" />
        <button type="button" onClick={addImage}><ImageIcon size={16} /></button>
        <button type="button" onClick={addLink}><LinkIcon size={16} /></button>
        <span className="blog-editor-sep" />
        <button type="button" onClick={() => editor.chain().focus().undo().run()}><Undo size={16} /></button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()}><Redo size={16} /></button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}