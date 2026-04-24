import { useState, useCallback, useMemo } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { usePrompts } from './hooks/usePrompts';
import { useAuth } from './auth/AuthContext';
import { PromptCard } from './components/PromptCard';
import { SearchBar } from './components/SearchBar';
import { CategoryFilter } from './components/CategoryFilter';
import { PromptModal } from './components/PromptModal';
import { LoginPromptModal } from './components/LoginPromptModal';
import type { Prompt } from './types';

export default function App() {
  const { data, loading } = usePrompts();
  const { user, login, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [visibleCount, setVisibleCount] = useState(24);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      const info = await res.json();
      login({ name: info.name, email: info.email, picture: info.picture });
    },
  });

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
      <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur border-b border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Top row: brand + search + auth */}
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">🖼️</span>
                <div>
                  <h1 className="text-base font-bold text-zinc-100 leading-none">GPT Image 2 Prompts</h1>
                  <p className="text-[10px] text-indigo-400 font-medium leading-none mt-0.5">AiCEO.im by Tim Janepat</p>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <SearchBar
                value={searchQuery}
                onChange={v => { setSearchQuery(v); setVisibleCount(24); }}
              />
            </div>

            {/* Auth area */}
            {user ? (
              <div className="shrink-0 flex items-center gap-2">
                <img
                  src={user.picture}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full border border-zinc-700"
                />
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-medium text-zinc-200 leading-none">{user.name}</p>
                  <p className="text-[10px] text-zinc-500 leading-none mt-0.5">เข้าสู่ระบบแล้ว ✓</p>
                </div>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-500 rounded-lg transition-all"
                >
                  ออกจากระบบ
                </button>
              </div>
            ) : (
              <div className="shrink-0 flex items-center gap-2">
                <div className="hidden sm:block text-right">
                  <p className="text-[10px] text-zinc-500 leading-none">คัดลอก prompt</p>
                  <p className="text-[10px] text-zinc-600 leading-none mt-0.5">ต้องเข้าสู่ระบบ</p>
                </div>
                <button
                  onClick={() => googleLogin()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-zinc-100 text-zinc-900 text-xs font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  เข้าสู่ระบบ
                </button>
              </div>
            )}
          </div>

          {/* Category filter row */}
          <div className="mt-2.5">
            <CategoryFilter
              categories={data?.categories ?? []}
              selected={selectedCategories}
              onToggle={toggleCategory}
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Status bar */}
        {!loading && (
          <div className="flex items-center gap-3 mb-4">
            <p className="text-xs text-zinc-600">{data?.total ?? 0} prompts ทั้งหมด</p>
            {!user && (
              <p className="text-xs text-indigo-400/80">
                🔒 เข้าสู่ระบบเพื่อคัดลอก prompt
              </p>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-500 text-sm">กำลังโหลด prompt...</p>
          </div>
        ) : displayPrompts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-2">
            <span className="text-4xl">🔍</span>
            <p className="text-zinc-400 font-medium">ไม่พบ prompt ที่ค้นหา</p>
            <p className="text-zinc-600 text-sm">ลองค้นหาคำอื่น หรือยกเลิกตัวกรอง</p>
          </div>
        ) : (
          <>
            <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3">
              {displayPrompts.slice(0, visibleCount).map((p, i) => (
                <div key={p.id} className="break-inside-avoid mb-3">
                  <PromptCard
                    prompt={p}
                    onClick={() => setSelectedPrompt(p)}
                    priority={i < 6}
                    isLoggedIn={!!user}
                    onNeedLogin={() => setShowLoginModal(true)}
                  />
                </div>
              ))}
            </div>
            {visibleCount < displayPrompts.length && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setVisibleCount(v => v + 24)}
                  className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-sm font-medium rounded-xl transition-all"
                >
                  โหลดเพิ่ม ({displayPrompts.length - visibleCount} prompt เหลืออยู่)
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <PromptModal
        prompt={selectedPrompt}
        onClose={() => setSelectedPrompt(null)}
        isLoggedIn={!!user}
        onNeedLogin={() => setShowLoginModal(true)}
      />
      <LoginPromptModal open={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
}
