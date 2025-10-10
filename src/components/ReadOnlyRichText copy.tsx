import { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'quill/dist/quill.bubble.css';
import { useTheme } from '../contexts/ThemeContext';

interface ReadOnlyRichTextProps {
  content: string;
  className?: string;
}

export function ReadOnlyRichText({ content, className = '' }: ReadOnlyRichTextProps) {
  const { currentTheme } = useTheme();
  
  // Protección contra valores undefined
  if (!content) {
    return <div className={className}></div>;
  }

  const styles = useMemo(() => `
    .read-only-editor {
      inline-size: 100%;
    }
    
    .read-only-editor .ql-container {
      border: none !important;
      font-family: ${currentTheme.typography?.fonts?.body || 'Inter, system-ui, sans-serif'};
    }

    .read-only-editor .ql-editor {
      padding: 0;
      color: ${currentTheme.colors.text};
      font-family: ${currentTheme.typography?.fonts?.body || 'Inter, system-ui, sans-serif'};
    }

    .read-only-editor .ql-editor h1,
    .read-only-editor .ql-editor h2 {
      color: ${currentTheme.colors.text};
      font-family: ${currentTheme.typography?.fonts?.body || 'Inter, system-ui, sans-serif'};
      margin-block-end: 0.5rem;
    }

    .read-only-editor .ql-editor p {
      margin-block-end: 0.5rem;
    }

    .read-only-editor .ql-editor ul,
    .read-only-editor .ql-editor ol {
      padding-inline-start: 1.5rem;
      margin-block-end: 0.5rem;
    }

    .read-only-editor .ql-editor a {
      color: ${currentTheme.colors.primary};
    }

    .read-only-editor .ql-editor blockquote {
      border-inline-start: 4px solid ${currentTheme.colors.border};
      padding-inline-start: 1rem;
      margin: 1rem 0;
      color: ${currentTheme.colors.textSecondary};
    }

    .read-only-editor .ql-editor img {
      max-inline-size: 100%;
      block-size: auto;
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