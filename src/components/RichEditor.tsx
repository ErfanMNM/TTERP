import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { cn } from '../lib/utils';

interface RichEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export interface RichEditorHandle {
  getHTML: () => string;
  focus: () => void;
}

const RichEditor = forwardRef<RichEditorHandle, RichEditorProps>(({
  value, onChange, placeholder, readOnly = false, className, autoFocus,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Quill | null>(null);
  const isInternalChange = useRef(false);

  useImperativeHandle(ref, () => ({
    getHTML: () => editorRef.current?.root.innerHTML || '',
    focus: () => editorRef.current?.focus(),
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    const quill = new Quill(containerRef.current, {
      theme: 'snow',
      placeholder: placeholder || '',
      readOnly,
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          ['blockquote', 'code-block'],
          ['link', 'image'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ indent: '-1' }, { indent: '+1' }],
          ['clean'],
        ],
      },
    });

    editorRef.current = quill;

    if (value) {
      quill.clipboard.dangerouslyPasteHTML(value);
    }

    quill.on('text-change', () => {
      if (!isInternalChange.current) {
        const html = quill.root.innerHTML;
        if (html === '<p><br></p>' || html === '<p></p>') {
          onChange?.('');
        } else {
          onChange?.(html);
        }
      }
    });

    if (autoFocus) {
      setTimeout(() => quill.focus(), 50);
    }

    return () => {
      quill.off('text-change');
      editorRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes
  useEffect(() => {
    const quill = editorRef.current;
    if (!quill) return;
    const current = quill.root.innerHTML;
    if (value !== undefined && value !== current) {
      isInternalChange.current = true;
      quill.clipboard.dangerouslyPasteHTML(value);
      isInternalChange.current = false;
    }
  }, [value]);

  // Sync readOnly changes
  useEffect(() => {
    const quill = editorRef.current;
    if (quill) quill.enable(!readOnly);
  }, [readOnly]);

  return (
    <div className={cn('rich-editor', className)}>
      <style>{`
        .rich-editor .ql-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          border-color: #e5e7eb;
          background: #f9fafb;
        }
        .rich-editor .ql-container {
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          border-color: #e5e7eb;
          font-size: 0.875rem;
          font-family: inherit;
        }
        .rich-editor .ql-editor {
          min-height: 80px;
          color: #374151;
        }
        .rich-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
        .rich-editor .ql-toolbar:focus,
        .rich-editor .ql-container:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
          border-color: #93c5fd;
        }
        .rich-editor .ql-editor.read-mode {
          pointer-events: none;
        }
      `}</style>
      <div ref={containerRef} />
    </div>
  );
});

RichEditor.displayName = 'RichEditor';

export default RichEditor;
