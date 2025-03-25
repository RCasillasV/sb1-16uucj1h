import React, { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.bubble.css';
import { useTheme } from '../contexts/ThemeContext';

interface ReadOnlyRichTextProps {
  content: string;
  className?: string;
}

export function ReadOnlyRichText({ content, className = '' }: ReadOnlyRichTextProps) {
  const { currentTheme } = useTheme();

  const styles = useMemo(() => `
    .read-only-editor {
      width: 100%;
    }
    
    .read-only-editor .ql-container {
      border: none !important;
      font-family: ${currentTheme.typography.fontFamily};
    }

    .read-only-editor .ql-editor {
      padding: 0;
      color: ${currentTheme.colors.text};
      font-family: ${currentTheme.typography.fontFamily};
    }

    .read-only-editor .ql-editor h1,
    .read-only-editor .ql-editor h2 {
      color: ${currentTheme.colors.text};
      font-family: ${currentTheme.typography.fontFamily};
      margin-bottom: 0.5rem;
    }

    .read-only-editor .ql-editor p {
      margin-bottom: 0.5rem;
    }

    .read-only-editor .ql-editor ul,
    .read-only-editor .ql-editor ol {
      padding-left: 1.5rem;
      margin-bottom: 0.5rem;
    }

    .read-only-editor .ql-editor a {
      color: ${currentTheme.colors.primary};
    }

    .read-only-editor .ql-editor blockquote {
      border-left: 4px solid ${currentTheme.colors.border};
      padding-left: 1rem;
      margin: 1rem 0;
      color: ${currentTheme.colors.textSecondary};
    }

    .read-only-editor .ql-editor img {
      max-width: 100%;
      height: auto;
    }
  `, [currentTheme]);

  return (
    <div className={`read-only-editor ${className}`}>
      <style>{styles}</style>
      <ReactQuill
        value={content}
        readOnly={true}
        theme="bubble"
        modules={{ toolbar: false }}
      />
    </div>
  );
}