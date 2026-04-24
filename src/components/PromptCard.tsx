import { useState } from 'react';
import type { Prompt } from '../types';

interface PromptCardProps {
  prompt: Prompt;
  onClick: () => void;
  priority?: boolean;
  isLoggedIn: boolean;
  onNeedLogin: () => void;
}

const GRADIENTS = [
  'from-indigo-900/60 to-zinc-900',
  'from-violet-900/60 to-zinc-900',
  'from-sky-900/60 to-zinc-900',
  'from-emerald-900/50 to-zinc-900',
  'from-rose-900/50 to-zinc-900',
  'from-amber-900/50 to-zinc-900',
];

function gradientFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

export function PromptCard({ prompt, onClick, priority = false, isLoggedIn, onNeedLogin }: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  function copyPrompt(e: React.MouseEvent) {
    e.stopPropagation();
    if (!isLoggedIn) { onNeedLogin(); return; }
    navigator.clipboard.writeText(prompt.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const coverImage = prompt.images[0];
  const hasImage = coverImage && !imgError;

  return (
    <div
      onClick={onClick}
      className="group relative bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-600 cursor-pointer transition-all duration-200 hover:shadow-xl hover:shadow-black/40 hover:-translate-y-0.5"
    >
      {hasImage ? (
        <img
          src={coverImage}
          alt={prompt.title}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setImgError(true)}
          className="w-full object-cover block"
        />
      ) : (
        <div className={`w-full bg-gradient-to-b ${gradientFor(prompt.id)} p-4 min-h-[120px] flex flex-col justify-between`}>
          <p className="text-xs text-zinc-300 leading-relaxed line-clamp-5 font-mono">
            {prompt.content}
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 opacity-70" />
            <span className="text-xs text-zinc-500">Prompt</span>
          </div>
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
        {hasImage && (
          <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
            {prompt.content}
          </p>
        )}
      </div>

      <div className="px-3 pb-3 flex items-center justify-between gap-2">
        <span className="text-xs text-zinc-600 truncate">{prompt.author.name}</span>
        <button
          onClick={copyPrompt}
          title={isLoggedIn ? 'คัดลอก prompt' : 'เข้าสู่ระบบเพื่อคัดลอก'}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
            copied
              ? 'bg-green-600/20 text-green-400 border border-green-600/40'
              : isLoggedIn
                ? 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200 opacity-0 group-hover:opacity-100'
                : 'bg-zinc-800/80 text-zinc-500 border border-zinc-700 opacity-0 group-hover:opacity-100'
          }`}
        >
          {copied ? 'คัดลอกแล้ว ✓' : isLoggedIn ? 'คัดลอก' : '🔒 คัดลอก'}
        </button>
      </div>
    </div>
  );
}
