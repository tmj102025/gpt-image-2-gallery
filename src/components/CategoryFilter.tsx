interface CategoryFilterProps {
  categories: string[];
  selected: string[];
  onToggle: (cat: string) => void;
}

export function CategoryFilter({ categories, selected, onToggle }: CategoryFilterProps) {
  if (categories.length === 0) return null;
  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
      {selected.length > 0 && (
        <button
          onClick={() => selected.forEach(c => onToggle(c))}
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-700 text-zinc-300 border border-zinc-600 hover:bg-zinc-600 transition-all"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
          ล้าง ({selected.length})
        </button>
      )}
      {categories.map(cat => {
        const active = selected.includes(cat);
        return (
          <button
            key={cat}
            onClick={() => onToggle(cat)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              active
                ? 'bg-emerald-600 text-white border border-emerald-500'
                : 'bg-zinc-800/80 text-zinc-400 border border-zinc-700 hover:border-zinc-500 hover:text-zinc-200'
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
