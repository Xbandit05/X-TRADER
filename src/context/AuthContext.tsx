/**
 * BANDITRADES — Auth Context
 * Multi-user private workspace state & selected account management
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, TradingAccount } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  user: UserProfile | null;
  accounts: TradingAccount[];
  selectedAccount: TradingAccount | null;
  setSelectedAccount: (acc: TradingAccount | null) => void;
  login: (email: string, password?: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  register: (email: string, fullName: string, username?: string) => Promise<void>;
  logout: () => void;
  refreshAccounts: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<TradingAccount | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    try {
      const accs = await api.getAccounts();
      setAccounts(accs);
      if (accs.length > 0 && !selectedAccount) {
        setSelectedAccount(accs[0]);
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('bandit_auth_token');
        if (token) {
          const res = await api.getMe();
          setUser(res.user);
          await fetchAccounts();
        } else {
          // Auto login demo for quick exploration
          const demo = await api.loginDemo();
          localStorage.setItem('bandit_auth_token', demo.token);
          setUser(demo.user);
          await fetchAccounts();
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password?: string) => {
    setLoading(true);
    try {
      const res = await api.login(email, password);
      localStorage.setItem('bandit_auth_token', res.token);
      setUser(res.user);
      const accs = await api.getAccounts();
      setAccounts(accs);
      setSelectedAccount(accs[0] || null);
    } finally {
      setLoading(false);
    }
  };

  const loginDemo = async () => {
    setLoading(true);
    try {
      const res = await api.loginDemo();
      localStorage.setItem('bandit_auth_token', res.token);
      setUser(res.user);
      const accs = await api.getAccounts();
      setAccounts(accs);
      setSelectedAccount(accs[0] || null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, fullName: string, username?: string) => {
    setLoading(true);
    try {
      const res = await api.register(email, fullName, username);
      localStorage.setItem('bandit_auth_token', res.token);
      setUser(res.user);
      const accs = await api.getAccounts();
      setAccounts(accs);
      setSelectedAccount(accs[0] || null);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('bandit_auth_token');
    setUser(null);
    setAccounts([]);
    setSelectedAccount(null);
  };

  const refreshAccounts = async () => {
    await fetchAccounts();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accounts,
        selectedAccount,
        setSelectedAccount,
        login,
        loginDemo,
        register,
        logout,
        refreshAccounts,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
