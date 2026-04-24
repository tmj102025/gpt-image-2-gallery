import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface GoogleUser {
  name: string;
  email: string;
  picture: string;
}

interface AuthContextType {
  user: GoogleUser | null;
  login: (user: GoogleUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
const STORAGE_KEY = 'gpt2_user';
const PB_URL = 'https://db.aiceo.im';

async function upsertLead(u: GoogleUser) {
  try {
    // Check if lead exists
    const search = await fetch(
      `${PB_URL}/api/collections/gpt_image2_leads/records?filter=${encodeURIComponent(`email="${u.email}"`)}`,
      { headers: { 'Content-Type': 'application/json' } }
    );
    const result = await search.json();

    if (result.items?.length > 0) {
      // Update existing — increment login_count
      const existing = result.items[0];
      await fetch(`${PB_URL}/api/collections/gpt_image2_leads/records/${existing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login_count: (existing.login_count ?? 1) + 1,
          last_login_at: new Date().toISOString(),
          picture: u.picture,
        }),
      });
    } else {
      // New lead
      await fetch(`${PB_URL}/api/collections/gpt_image2_leads/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: u.email,
          name: u.name,
          picture: u.picture,
          login_count: 1,
          last_login_at: new Date().toISOString(),
          source: 'gpt-image-2-prompts',
        }),
      });
    }
  } catch {
    // Silent fail — don't block login if tracking fails
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  function login(u: GoogleUser) {
    setUser(u);
    upsertLead(u);
  }

  function logout() { setUser(null); }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
