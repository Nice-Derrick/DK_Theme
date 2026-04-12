import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { SubscribeInfo, UserInfo } from '@/lib/api/types';
import { login as loginRequest, logout as logoutRequest, type LoginInput } from '@/lib/api/services/auth';
import { getSubscribeInfo, getUserInfo } from '@/lib/api/services/user';
import { tokenStorage } from '@/lib/storage';

type AuthContextValue = {
  token: string | null;
  user: UserInfo | null;
  subscribe: SubscribeInfo | null;
  hydrated: boolean;
  login: (values: LoginInput) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(tokenStorage.get());
  const [user, setUser] = useState<UserInfo | null>(null);
  const [subscribe, setSubscribe] = useState<SubscribeInfo | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    async function hydrate() {
      const currentToken = tokenStorage.get();
      if (!currentToken) {
        setHydrated(true);
        return;
      }
      try {
        const [nextUser, nextSubscribe] = await Promise.all([getUserInfo(), getSubscribeInfo()]);
        setUser(nextUser);
        setSubscribe(nextSubscribe);
        setToken(currentToken);
      } finally {
        setHydrated(true);
      }
    }

    void hydrate();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    token,
    user,
    subscribe,
    hydrated,
    async login(values) {
      const response = await loginRequest(values);
      const nextToken = 'auth_data' in response ? response.auth_data : tokenStorage.get();
      setToken(nextToken ?? tokenStorage.get());
      const [nextUser, nextSubscribe] = await Promise.all([getUserInfo(), getSubscribeInfo()]);
      setUser(nextUser);
      setSubscribe(nextSubscribe);
    },
    logout() {
      void logoutRequest();
      setToken(null);
      setUser(null);
      setSubscribe(null);
      setHydrated(true);
      toast.success('已退出登录');
    },
  }), [hydrated, subscribe, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
