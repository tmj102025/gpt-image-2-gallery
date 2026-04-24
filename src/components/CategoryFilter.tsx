interface CategoryFilterProps {
  categories: string[];
  selected: string[];
  onToggle: (cat: string) => void;
}

export function CategoryFilter({ categories, selected, onToggle }: CategoryFilterProps) {
  if (categories.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map(cat => {
        const active = selected.includes(cat);
        return (
          <button
            key={cat}
            onClick={() => onToggle(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              active
                ? 'bg-indigo-600 text-white border border-indigo-500'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-500 hover:text-zinc-200'
            }`}
          >
            {cat}
          </button>
        );
      })}
      {selected.length > 0 && (
        <button
          onClick={() => selected.forEach(c => onToggle(c))}
          className="px-3 py-1.5 rounded-full text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
