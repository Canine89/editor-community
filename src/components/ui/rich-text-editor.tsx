'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import { 
  Bold, 
  Italic, 
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3
} from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'
import { useState, useCallback } from 'react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  error?: boolean
  disabled?: boolean
}

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  title?: string
  children: React.ReactNode
}

const ToolbarButton = ({ onClick, isActive, disabled, title, children }: ToolbarButtonProps) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      "h-8 w-8 p-0 hover-lift-editorial transition-all duration-200",
      isActive && "bg-primary text-primary-foreground shadow-sm"
    )}
  >
    {children}
  </Button>
)

interface LinkDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (url: string) => void
  initialUrl?: string
}

const LinkDialog = ({ isOpen, onClose, onSubmit, initialUrl = '' }: LinkDialogProps) => {
  const [url, setUrl] = useState(initialUrl)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      onSubmit(url.trim())
      setUrl('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="card-editorial p-6 w-96 mx-4">
        <h3 className="font-semibold text-foreground mb-4">링크 추가</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" size="sm" disabled={!url.trim()}>
              확인
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = "내용을 입력하세요...",
  className,
  error,
  disabled 
}: RichTextEditorProps) {
  const [showLinkDialog, setShowLinkDialog] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc list-outside my-2 ml-6',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal list-outside my-2 ml-6',
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-4 border-primary pl-4 my-4 text-muted-foreground italic',
          },
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'bg-muted p-4 rounded-lg font-mono text-sm my-4 overflow-x-auto',
          },
        },
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: {
            class: 'font-bold my-4',
          },
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline hover:text-primary/80 transition-colors cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Typography,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none focus:outline-none',
          'min-h-[200px] p-4 bg-background',
          'prose-headings:text-foreground',
          'prose-p:text-foreground prose-p:leading-relaxed',
          'prose-strong:text-foreground prose-strong:font-semibold',
          'prose-em:text-foreground',
          'prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:rounded',
          'prose-pre:bg-muted prose-pre:text-foreground',
          'prose-blockquote:text-muted-foreground prose-blockquote:border-primary',
          'prose-ul:text-foreground prose-ol:text-foreground',
          'prose-li:text-foreground',
          'prose-a:text-primary prose-a:no-underline hover:prose-a:underline'
        )
      }
    }
  })

  const handleAddLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href
    setShowLinkDialog(true)
  }, [editor])

  const handleLinkSubmit = useCallback((url: string) => {
    editor?.chain().focus().setLink({ href: url }).run()
  }, [editor])

  const toggleHeading = useCallback((level: 1 | 2 | 3) => {
    if (editor?.isActive('heading', { level })) {
      editor.chain().focus().setParagraph().run()
    } else {
      editor?.chain().focus().toggleHeading({ level }).run()
    }
  }, [editor])

  if (!editor) {
    return (
      <div className={cn(
        "card-editorial min-h-[200px] animate-pulse",
        className
      )}>
        <div className="h-12 bg-muted/50 rounded-t-2xl border-b"></div>
        <div className="p-4 space-y-3">
          <div className="h-4 bg-muted/50 rounded w-3/4"></div>
          <div className="h-4 bg-muted/50 rounded w-1/2"></div>
          <div className="h-4 bg-muted/50 rounded w-5/6"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "card-editorial overflow-hidden",
      error && "border-destructive",
      disabled && "opacity-60",
      className
    )}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-3 border-b border-border bg-muted/20">
        {/* Text Formatting */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-border">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            disabled={disabled}
            title="굵게 (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            disabled={disabled}
            title="기울임 (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            disabled={disabled}
            title="취소선"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-border">
          <ToolbarButton
            onClick={() => toggleHeading(1)}
            isActive={editor.isActive('heading', { level: 1 })}
            disabled={disabled}
            title="제목 1 (큰 제목)"
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => toggleHeading(2)}
            isActive={editor.isActive('heading', { level: 2 })}
            disabled={disabled}
            title="제목 2 (중간 제목)"
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => toggleHeading(3)}
            isActive={editor.isActive('heading', { level: 3 })}
            disabled={disabled}
            title="제목 3 (작은 제목)"
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-border">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            disabled={disabled}
            title="글머리 기호 목록"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            disabled={disabled}
            title="번호 목록"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Additional Formatting */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-border">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            disabled={disabled}
            title="인용문"
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            disabled={disabled}
            title="코드 블록"
          >
            <Code className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={handleAddLink}
            isActive={editor.isActive('link')}
            disabled={disabled}
            title="링크 (Ctrl+K)"
          >
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5 ml-auto">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo() || disabled}
            title="실행 취소 (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo() || disabled}
            title="다시 실행 (Ctrl+Y)"
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>
      </div>

      {/* Editor Content */}
      <EditorContent 
        editor={editor} 
        className="rich-text-editor-content"
      />

      {/* Link Dialog */}
      <LinkDialog
        isOpen={showLinkDialog}
        onClose={() => setShowLinkDialog(false)}
        onSubmit={handleLinkSubmit}
        initialUrl={editor.getAttributes('link').href}
      />
    </div>
  )
}

export default RichTextEditor