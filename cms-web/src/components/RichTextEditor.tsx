"use client";

import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
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
import TypographyExtension from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useMemo, type ReactNode } from "react";

interface RichTextEditorProps {
  label?: string;
  value?: string | null;
  onChange?: (value: string) => void;
  description?: string;
  placeholder?: string;
  minHeight?: number;
}

function normalizeHtml(value: string | null | undefined): string {
  if (!value) return "";
  // More robust normalization: remove comments, script tags, etc if needed.
  // For now, just normalize whitespace and trim.
  return value.replace(/\s+/g, " ").replace(/>\s+</g, "><").trim();
}

function ToolbarButton({
  active,
  icon,
  label,
  onClick,
  disabled = false,
}: {
  active?: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Tooltip title={label}>
      <Button
        icon={icon}
        onClick={onClick}
        type={active ? "primary" : "default"}
        disabled={disabled}
        size="small"
        className={active ? "cms-toolbar-btn-active" : "cms-toolbar-btn"}
      />
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
  const safeValue = value || "";
  const normalizedIncoming = useMemo(() => normalizeHtml(safeValue), [safeValue]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
      }),
      TypographyExtension,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: {
          class: "cms-editor-link",
        },
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
        class: "cms-tiptap-editor prose prose-invert max-w-none focus:outline-none",
        style: `min-height:${minHeight}px`,
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();
      if (onChange) {
        onChange(html === "<p></p>" ? "" : html);
      }
    },
  });

  // Sync incoming value from props to editor state
  useEffect(() => {
    if (!editor) return;

    const currentHtml = normalizeHtml(editor.getHTML());
    if (currentHtml !== normalizedIncoming) {
      // Avoid resetting selection if possible
      const { from, to } = editor.state.selection;
      editor.commands.setContent(safeValue, { emitUpdate: false });
      editor.commands.setTextSelection({ from, to });
    }
  }, [editor, normalizedIncoming, safeValue]);

  const setLink = () => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href || "";
    const url = window.prompt("Enter a URL", previousUrl);

    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="cms-rich-editor-field">
      {label || description ? (
        <div className="cms-rich-header">
          {label && <Typography.Text strong className="cms-field-label">{label}</Typography.Text>}
          {description && <Typography.Paragraph className="cms-field-help">{description}</Typography.Paragraph>}
        </div>
      ) : null}

      <div className="cms-tiptap-shell">
        <div className="cms-tiptap-toolbar">
          <Space size={4} wrap>
            <div className="cms-toolbar-group">
              <ToolbarButton icon={<UndoOutlined />} label="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} />
              <ToolbarButton icon={<RedoOutlined />} label="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} />
            </div>

            <Divider orientation="vertical" />

            <div className="cms-toolbar-group">
              <ToolbarButton
                active={editor.isActive("heading", { level: 2 })}
                icon={<span className="cms-icon-head">H2</span>}
                label="Heading 2"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              />
              <ToolbarButton
                active={editor.isActive("heading", { level: 3 })}
                icon={<span className="cms-icon-head">H3</span>}
                label="Heading 3"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              />
            </div>

            <Divider orientation="vertical" />

            <div className="cms-toolbar-group">
              <ToolbarButton active={editor.isActive("bold")} icon={<BoldOutlined />} label="Bold" onClick={() => editor.chain().focus().toggleBold().run()} />
              <ToolbarButton active={editor.isActive("italic")} icon={<ItalicOutlined />} label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} />
              <ToolbarButton active={editor.isActive("underline")} icon={<UnderlineOutlined />} label="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} />
              <ToolbarButton active={editor.isActive("strike")} icon={<StrikethroughOutlined />} label="Strike" onClick={() => editor.chain().focus().toggleStrike().run()} />
              <ToolbarButton active={editor.isActive("code")} icon={<CodeOutlined />} label="Inline code" onClick={() => editor.chain().focus().toggleCode().run()} />
            </div>

            <Divider orientation="vertical" />

            <div className="cms-toolbar-group">
              <ToolbarButton active={editor.isActive("bulletList")} icon={<UnorderedListOutlined />} label="Bulleted list" onClick={() => editor.chain().focus().toggleBulletList().run()} />
              <ToolbarButton active={editor.isActive("orderedList")} icon={<OrderedListOutlined />} label="Ordered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} />
            </div>

            <Divider orientation="vertical" />

            <div className="cms-toolbar-group">
              <ToolbarButton active={editor.isActive({ textAlign: "left" })} icon={<AlignLeftOutlined />} label="Align left" onClick={() => editor.chain().focus().setTextAlign("left").run()} />
              <ToolbarButton active={editor.isActive({ textAlign: "center" })} icon={<AlignCenterOutlined />} label="Align center" onClick={() => editor.chain().focus().setTextAlign("center").run()} />
              <ToolbarButton active={editor.isActive({ textAlign: "right" })} icon={<AlignRightOutlined />} label="Align right" onClick={() => editor.chain().focus().setTextAlign("right").run()} />
            </div>

            <Divider orientation="vertical" />

            <div className="cms-toolbar-group">
              <ToolbarButton active={editor.isActive("link")} icon={<LinkOutlined />} label="Link" onClick={setLink} />
            </div>
          </Space>
        </div>
        <div className="cms-editor-content-wrapper">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
