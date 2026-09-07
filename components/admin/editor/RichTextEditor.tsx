"use client";

import { useCallback, useEffect, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
  Unlink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MediaPickerDialog } from "../MediaPickerDialog";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  id?: string;
}

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          aria-pressed={active}
          disabled={disabled}
          onMouseDown={(e) => e.preventDefault()}
          onClick={onClick}
          className={cn(active && "bg-accent text-accent-foreground")}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function LinkPopover({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [href, setHref] = useState("");
  useEffect(() => {
    if (open) setHref((editor.getAttributes("link").href as string) ?? "");
  }, [open, editor]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Link"
              aria-pressed={editor.isActive("link")}
              className={cn(editor.isActive("link") && "bg-accent")}
              onMouseDown={(e) => e.preventDefault()}
            >
              <LinkIcon />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Link</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-80">
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            const url = href.trim();
            if (!url) editor.chain().focus().extendMarkRange("link").unsetLink().run();
            else
              editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .setLink({
                  href:
                    /^https?:\/\//i.test(url) || url.startsWith("mailto:") ? url : `https://${url}`,
                })
                .run();
            setOpen(false);
          }}
        >
          <label htmlFor="link-href" className="text-xs font-medium">
            URL
          </label>
          <Input
            id="link-href"
            value={href}
            onChange={(e) => setHref(e.target.value)}
            placeholder="https://"
            autoFocus
          />
          <div className="flex justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                editor.chain().focus().extendMarkRange("link").unsetLink().run();
                setOpen(false);
              }}
            >
              <Unlink /> Remove
            </Button>
            <Button type="submit" size="sm">
              Apply
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing…",
  id,
}: RichTextEditorProps) {
  const [picker, setPicker] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: {},
        codeBlock: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: { rel: "noopener noreferrer" },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "prose prose-news dark:prose-invert max-w-none px-4 py-3 text-base",
        id: id ?? "body",
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": "Article body",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  // Reset content when the external value changes materially (e.g. revision restore)
  useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? "" : editor.getHTML();
    if (value !== current && !editor.isFocused) editor.commands.setContent(value || "", false);
  }, [value, editor]);

  const insertImage = useCallback(
    (m: { url: string; alt: string; width: number; height: number }) => {
      editor?.chain().focus().setImage({ src: m.url, alt: m.alt }).run();
      setPicker(false);
    },
    [editor]
  );

  if (!editor) {
    return (
      <div
        className="min-h-[50vh] animate-pulse rounded-md border bg-muted-ui/40"
        aria-hidden="true"
      />
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring">
        <div
          className="sticky top-14 z-10 flex flex-wrap items-center gap-0.5 border-b bg-background/95 p-1 backdrop-blur"
          role="toolbar"
          aria-label="Formatting"
        >
          <ToolbarButton
            label="Heading"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 />
          </ToolbarButton>
          <ToolbarButton
            label="Subheading"
            active={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 />
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
          <ToolbarButton
            label="Bold"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold />
          </ToolbarButton>
          <ToolbarButton
            label="Italic"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic />
          </ToolbarButton>
          <ToolbarButton
            label="Strikethrough"
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough />
          </ToolbarButton>
          <ToolbarButton
            label="Inline code"
            active={editor.isActive("code")}
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            <Code />
          </ToolbarButton>
          <LinkPopover editor={editor} />
          <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
          <ToolbarButton
            label="Quote"
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote />
          </ToolbarButton>
          <ToolbarButton
            label="Bullet list"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List />
          </ToolbarButton>
          <ToolbarButton
            label="Numbered list"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered />
          </ToolbarButton>
          <ToolbarButton
            label="Divider"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            <Minus />
          </ToolbarButton>
          <ToolbarButton label="Insert image" onClick={() => setPicker(true)}>
            <ImageIcon />
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
          <ToolbarButton
            label="Undo"
            disabled={!editor.can().undo()}
            onClick={() => editor.chain().focus().undo().run()}
          >
            <Undo2 />
          </ToolbarButton>
          <ToolbarButton
            label="Redo"
            disabled={!editor.can().redo()}
            onClick={() => editor.chain().focus().redo().run()}
          >
            <Redo2 />
          </ToolbarButton>
          <span className="ml-auto pr-2 text-[11px] tabular-nums text-muted-ui-foreground">
            {editor.storage.characterCount?.words?.() ??
              editor.getText().split(/\s+/).filter(Boolean).length}{" "}
            words
          </span>
        </div>
        <EditorContent editor={editor} />
      </div>
      {picker ? (
        <MediaPickerDialog
          title="Insert an image"
          onClose={() => setPicker(false)}
          onSelect={insertImage}
        />
      ) : null}
    </TooltipProvider>
  );
}
