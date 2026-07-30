"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  content: string;
  editMode: boolean;
  onChange: (content: string) => void;
}

export default function MarkdownContent({ content, editMode, onChange }: Props) {
  if (editMode) {
    return (
      <div>
        <label className="block text-xs font-medium text-brand-blue mb-2">
          Edición de contenido (Markdown)
        </label>
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          rows={16}
          spellCheck={false}
          className="w-full rounded-xl border border-brand-blue/20 bg-white p-4 text-sm text-brand-ink outline-none focus:ring-2 focus:ring-brand-cyan"
        />
      </div>
    );
  }

  return (
    <div className="md-content max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
