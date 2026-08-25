'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

const NavVisibilityContext = createContext<{ hidden: boolean; setHidden: (v: boolean) => void } | null>(null);

export function NavVisibilityProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false);
  return <NavVisibilityContext.Provider value={{ hidden, setHidden }}>{children}</NavVisibilityContext.Provider>;
}

export function useNavVisibility() {
  const ctx = useContext(NavVisibilityContext);
  if (!ctx) throw new Error('useNavVisibility must be used within NavVisibilityProvider');
  return ctx;
}
