import { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'quill/dist/quill.snow.css';
import { useTheme } from '../contexts/ThemeContext';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const { currentTheme } = useTheme();

  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['clean']
    ],
  }), []);

  const formats = useMemo(() => [
    'header',
    'bold', 'italic', 'underline',
    'list', 'bullet'
  ], []);

  const styles = useMemo(() => `
    .rich-text-editor {
      inline-size: 100%;
    }
    
    .rich-text-editor .ql-container {
      min-block-size: 200px;
      border-end-start-radius: 0.5rem;
      border-end-end-radius: 0.5rem;
      background: ${currentTheme.colors.surface};
      color: ${currentTheme.colors.text};
      border-color: ${currentTheme.colors.border};
      font-family: ${currentTheme.typography?.fonts?.body || 'Inter, system-ui, sans-serif'};
      font-size: 1rem;
    }
    
    .rich-text-editor .ql-toolbar {
      border-start-start-radius: 0.5rem;
      border-start-end-radius: 0.5rem;
      background: ${currentTheme.colors.background};
      border-color: ${currentTheme.colors.border};
    }

    .rich-text-editor .ql-stroke {
      stroke: ${currentTheme.colors.text};
    }

    .rich-text-editor .ql-fill {
      fill: ${currentTheme.colors.text};
    }

    .rich-text-editor .ql-picker {
      color: ${currentTheme.colors.text};
    }

    .rich-text-editor .ql-picker-options {
      background: ${currentTheme.colors.surface};
      border-color: ${currentTheme.colors.border};
    }

    .rich-text-editor .ql-toolbar button:hover,
    .rich-text-editor .ql-toolbar button:focus {
      color: ${currentTheme.colors.primary};
    }

    .rich-text-editor .ql-toolbar button:hover .ql-stroke,
    .rich-text-editor .ql-toolbar button:focus .ql-stroke {
      stroke: ${currentTheme.colors.primary};
    }

    .rich-text-editor .ql-toolbar button:hover .ql-fill,
    .rich-text-editor .ql-toolbar button:focus .ql-fill {
      fill: ${currentTheme.colors.primary};
    }

    .rich-text-editor .ql-editor {
      font-family: ${currentTheme.typography?.fonts?.body || 'Inter, system-ui, sans-serif'};
    }

    .rich-text-editor .ql-editor img {
      max-inline-size: 100%;
      block-size: auto;
    }
  `, [currentTheme]);

  return (
    <div className="rich-text-editor">
      <style>{styles}</style>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
}