"use client";

import {
  BoldOutlined,
  CodeOutlined,
  ItalicOutlined,
  LinkOutlined,
  OrderedListOutlined,
  RedoOutlined,
  StrikethroughOutlined,
  UnderlineOutlined,
  UndoOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { Button, Divider, Space, Tooltip, Typography } from "antd";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useMemo, type ReactNode } from "react";

interface RichTextEditorProps {
  label: string;
  value?: string | null;
  onChange: (value: string) => void;
  description?: string;
  placeholder?: string;
  minHeight?: number;
}

function normalizeHtml(value: string | null | undefined): string {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function ToolbarButton({
  active,
  icon,
  label,
  onClick,
}: {
  active?: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Tooltip title={label}>
      <Button icon={icon} onClick={onClick} type={active ? "primary" : "default"} />
    </Tooltip>
  );
}

export default function RichTextEditor({
  label,
  value,
  onChange,
  description,
  placeholder = "Start writing…",
  minHeight = 260,
}: RichTextEditorProps) {
  const safeValue = String(value || "");
  const normalizedValue = useMemo(() => normalizeHtml(safeValue), [safeValue]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    immediatelyRender: false,
    content: safeValue,
    editorProps: {
      attributes: {
        class: "cms-tiptap-editor",
        style: `min-height:${minHeight}px`,
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const currentHtml = normalizeHtml(editor.getHTML());
    if (currentHtml !== normalizedValue) {
      editor.commands.setContent(safeValue || "<p></p>", { emitUpdate: false });
    }
  }, [editor, normalizedValue, safeValue]);

  function setLink() {
    if (!editor) {
      return;
    }

    const previousUrl = editor.getAttributes("link").href || "";
    const url = window.prompt("Enter a URL", previousUrl);

    if (url === null) {
      return;
    }

    if (!url.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  return (
    <div className="cms-rich-editor-field">
      <div className="cms-rich-header">
        <div>
          <Typography.Text strong>{label}</Typography.Text>
          {description ? <Typography.Paragraph className="cms-field-help">{description}</Typography.Paragraph> : null}
        </div>
      </div>

      <div className="cms-tiptap-shell">
        <div className="cms-tiptap-toolbar">
          <Space size={8} wrap>
            <ToolbarButton icon={<UndoOutlined />} label="Undo" onClick={() => editor?.chain().focus().undo().run()} />
            <ToolbarButton icon={<RedoOutlined />} label="Redo" onClick={() => editor?.chain().focus().redo().run()} />
            <Divider orientation="vertical" />
            <Button onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} type={editor?.isActive("heading", { level: 2 }) ? "primary" : "default"}>
              H2
            </Button>
            <Button onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} type={editor?.isActive("heading", { level: 3 }) ? "primary" : "default"}>
              H3
            </Button>
            <Divider orientation="vertical" />
            <ToolbarButton active={editor?.isActive("bold")} icon={<BoldOutlined />} label="Bold" onClick={() => editor?.chain().focus().toggleBold().run()} />
            <ToolbarButton active={editor?.isActive("italic")} icon={<ItalicOutlined />} label="Italic" onClick={() => editor?.chain().focus().toggleItalic().run()} />
            <ToolbarButton active={editor?.isActive("underline")} icon={<UnderlineOutlined />} label="Underline" onClick={() => editor?.chain().focus().toggleUnderline().run()} />
            <ToolbarButton active={editor?.isActive("strike")} icon={<StrikethroughOutlined />} label="Strike" onClick={() => editor?.chain().focus().toggleStrike().run()} />
            <ToolbarButton active={editor?.isActive("code")} icon={<CodeOutlined />} label="Inline code" onClick={() => editor?.chain().focus().toggleCode().run()} />
            <Divider orientation="vertical" />
            <ToolbarButton active={editor?.isActive("bulletList")} icon={<UnorderedListOutlined />} label="Bulleted list" onClick={() => editor?.chain().focus().toggleBulletList().run()} />
            <ToolbarButton active={editor?.isActive("orderedList")} icon={<OrderedListOutlined />} label="Ordered list" onClick={() => editor?.chain().focus().toggleOrderedList().run()} />
            <Button onClick={() => editor?.chain().focus().toggleBlockquote().run()} type={editor?.isActive("blockquote") ? "primary" : "default"}>
              Quote
            </Button>
            <Divider orientation="vertical" />
            <ToolbarButton active={editor?.isActive("link")} icon={<LinkOutlined />} label="Link" onClick={setLink} />
            <Button onClick={() => editor?.chain().focus().setTextAlign("left").run()} type={editor?.isActive({ textAlign: "left" }) ? "primary" : "default"}>
              Left
            </Button>
            <Button onClick={() => editor?.chain().focus().setTextAlign("center").run()} type={editor?.isActive({ textAlign: "center" }) ? "primary" : "default"}>
              Center
            </Button>
            <Button onClick={() => editor?.chain().focus().setTextAlign("right").run()} type={editor?.isActive({ textAlign: "right" }) ? "primary" : "default"}>
              Right
            </Button>
          </Space>
        </div>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
