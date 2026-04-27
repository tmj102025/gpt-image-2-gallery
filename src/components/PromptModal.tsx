import { useEffect, useState } from 'react';
import type { Prompt } from '../types';

interface PromptModalProps {
  prompt: Prompt | null;
  onClose: () => void;
  isLoggedIn: boolean;
  onNeedLogin: () => void;
}

export function PromptModal({ prompt, onClose, isLoggedIn, onNeedLogin }: PromptModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => { setActiveImg(0); setCopied(false); }, [prompt]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (prompt) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [prompt]);

  if (!prompt) return null;

  function copyPrompt() {
    if (!isLoggedIn) { onNeedLogin(); return; }
    navigator.clipboard.writeText(prompt!.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="ปิด"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {prompt.images.length > 0 && (
          <div className="bg-zinc-950 rounded-t-2xl overflow-hidden">
            <img
              src={prompt.images[activeImg]}
              alt={prompt.title}
              className="w-full max-h-96 object-contain"
            />
            {prompt.images.length > 1 && (
              <div className="flex gap-1.5 p-2 overflow-x-auto">
                {prompt.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      activeImg === i ? 'border-emerald-500' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="p-5 space-y-4">
          <div className="flex items-start gap-2 pr-6">
            <div className="flex-1">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {prompt.categories.map(cat => (
                  <span key={cat} className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full border border-emerald-500/30">
                    {cat}
                  </span>
                ))}
                <span className="px-2 py-0.5 bg-zinc-800 text-zinc-500 text-xs rounded-full uppercase">
                  {prompt.language}
                </span>
                {prompt.size && (
                  <span className="px-2 py-0.5 bg-zinc-800 text-zinc-500 text-xs rounded-full">
                    {prompt.size}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-semibold text-zinc-100 leading-snug">{prompt.title}</h2>
            </div>
          </div>

          {prompt.description && (
            <p className="text-sm text-zinc-400 leading-relaxed">{prompt.description}</p>
          )}

          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Prompt Text</span>
              <button
                onClick={copyPrompt}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  copied
                    ? 'bg-green-600/20 text-green-400 border border-green-600/40'
                    : isLoggedIn
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300 border border-zinc-600'
                }`}
              >
                {copied ? 'คัดลอกแล้ว ✓' : isLoggedIn ? '📋 คัดลอก Prompt' : '🔒 เข้าสู่ระบบเพื่อคัดลอก'}
              </button>
            </div>

            {/* Blur prompt if not logged in */}
            <div className="relative">
              <pre className={`bg-zinc-950 rounded-xl p-4 text-xs text-zinc-300 leading-relaxed overflow-x-auto whitespace-pre-wrap border border-zinc-800 font-mono transition-all ${!isLoggedIn ? 'blur-sm select-none' : ''}`}>
                {prompt.content}
              </pre>
              {!isLoggedIn && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-950/40 rounded-xl">
                  <span className="text-2xl">🔒</span>
                  <p className="text-sm font-medium text-zinc-200">เข้าสู่ระบบเพื่อดู Prompt เต็ม</p>
                  <button
                    onClick={onNeedLogin}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-all"
                  >
                    เข้าสู่ระบบด้วย Google
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="pt-1 border-t border-zinc-800">
            <p className="text-xs text-zinc-500">
              โดย{' '}
              {prompt.author.link ? (
                <a
                  href={prompt.author.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-300 hover:text-emerald-400 transition-colors"
                >
                  {prompt.author.name}
                </a>
              ) : (
                <span className="text-zinc-300">{prompt.author.name}</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
