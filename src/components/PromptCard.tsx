import { useState } from 'react';
import type { Prompt } from '../types';

interface PromptCardProps {
  prompt: Prompt;
  onClick: () => void;
  priority?: boolean;
}

export function PromptCard({ prompt, onClick, priority = false }: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  function copyPrompt(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(prompt.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const coverImage = prompt.images[0];

  return (
    <div
      onClick={onClick}
      className="group relative bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-600 cursor-pointer transition-all duration-200 hover:shadow-xl hover:shadow-black/40 hover:-translate-y-0.5"
    >
      {coverImage && !imgError ? (
        <img
          src={coverImage}
          alt={prompt.title}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setImgError(true)}
          className="w-full object-cover block"
        />
      ) : (
        <div className="w-full h-40 bg-zinc-800 flex items-center justify-center">
          <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      {prompt.categories[0] && (
        <div className="absolute top-2 left-2">
          <span className="px-2 py-0.5 bg-black/60 text-zinc-300 text-xs rounded-full backdrop-blur-sm border border-white/10">
            {prompt.categories[0]}
          </span>
        </div>
      )}

      <div className="p-3">
        <h3 className="text-sm font-semibold text-zinc-100 line-clamp-2 leading-snug mb-1">
          {prompt.title}
        </h3>
        <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
          {prompt.content}
        </p>
      </div>

      <div className="px-3 pb-3 flex items-center justify-between gap-2">
        <span className="text-xs text-zinc-600 truncate">{prompt.author.name}</span>
        <button
          onClick={copyPrompt}
          title="Copy prompt"
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
            copied
              ? 'bg-green-600/20 text-green-400 border border-green-600/40'
              : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200 opacity-0 group-hover:opacity-100'
          }`}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
