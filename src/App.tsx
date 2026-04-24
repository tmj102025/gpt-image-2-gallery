import { useState, useCallback, useMemo } from 'react';
import { usePrompts } from './hooks/usePrompts';
import { PromptCard } from './components/PromptCard';
import { SearchBar } from './components/SearchBar';
import { CategoryFilter } from './components/CategoryFilter';
import { PromptModal } from './components/PromptModal';
import type { Prompt } from './types';

export default function App() {
  const { data, loading } = usePrompts();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [visibleCount, setVisibleCount] = useState(24);

  const toggleCategory = useCallback((cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
    setVisibleCount(24);
  }, []);

  const shuffled = useMemo(() => {
    const arr = [...(data?.prompts ?? [])];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [data]);

  const displayPrompts = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return shuffled.filter(p =>
      (selectedCategories.length === 0 || selectedCategories.some(cat => p.categories.includes(cat))) &&
      (!q || p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
    );
  }, [shuffled, searchQuery, selectedCategories]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur border-b border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <h1 className="text-xl font-bold text-zinc-100 leading-none">
                🖼️ GPT Image 2 Prompts
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">Community Image Prompt Gallery</p>
            </div>
            <div className="flex-1">
              <SearchBar
                value={searchQuery}
                onChange={v => { setSearchQuery(v); setVisibleCount(24); }}
              />
            </div>
          </div>
          <CategoryFilter
            categories={data?.categories ?? []}
            selected={selectedCategories}
            onToggle={toggleCategory}
          />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-500 text-sm">Loading prompts...</p>
          </div>
        ) : displayPrompts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-2">
            <span className="text-4xl">🔍</span>
            <p className="text-zinc-400 font-medium">No prompts found</p>
            <p className="text-zinc-600 text-sm">Try a different search or remove filters</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-zinc-600 mb-4">{data?.total ?? 0} prompts total</p>
            <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3">
              {displayPrompts.slice(0, visibleCount).map((p, i) => (
                <div key={p.id} className="break-inside-avoid mb-3">
                  <PromptCard prompt={p} onClick={() => setSelectedPrompt(p)} priority={i < 6} />
                </div>
              ))}
            </div>
            {visibleCount < displayPrompts.length && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setVisibleCount(v => v + 24)}
                  className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-sm font-medium rounded-xl transition-all"
                >
                  Load More ({displayPrompts.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal */}
      <PromptModal prompt={selectedPrompt} onClose={() => setSelectedPrompt(null)} />
    </div>
  );
}
