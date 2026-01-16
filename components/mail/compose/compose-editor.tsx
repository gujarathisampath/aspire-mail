"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useFormContext } from "react-hook-form";
import { useEffect } from "react";

interface Props {
  onEditorCreated?: (editor: Editor) => void;
}

const ComposeEditor = ({ onEditorCreated }: Props) => {
  const { setValue, watch } = useFormContext();
  const content = watch("content");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      Placeholder.configure({
        placeholder: "Compose your email...",
      }),
    ],
    content: content || "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setValue("content", editor.getHTML(), { shouldValidate: true });
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-[400px] focus:outline-none px-4 py-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
      },
    },
  });

  useEffect(() => {
    if (editor && onEditorCreated) {
      onEditorCreated(editor);
    }
  }, [editor, onEditorCreated]);

  return (
    <div className="flex-1 min-h-0 bg-background">
      <EditorContent editor={editor} className="h-full overflow-y-auto" />
    </div>
  );
};

export default ComposeEditor;
