"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdAccount } from '@/types';
import { fetchAdAccounts } from '@/services/accountsService';
import { useAuth } from './AuthContext';

interface AccountContextType {
  selectedAccountId: string;
  setSelectedAccountId: (accountId: string) => void;
  accounts: AdAccount[];
  loading: boolean;
  refreshAccounts: () => Promise<void>;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  
  // Track if we've loaded to prevent duplicate loads
  const hasLoadedRef = React.useRef(false);

  useEffect(() => {
    const loadAccounts = async () => {
      // Don't load if not authenticated
      if (!isAuthenticated || !user) {
        console.log('⚠️ Not authenticated, clearing accounts');
        setLoading(false);
        setAccounts([]);
        hasLoadedRef.current = false;
        return;
      }

      // Only load once per session
      if (hasLoadedRef.current) {
        console.log('✅ Accounts already loaded, skipping');
        return;
      }

      setLoading(true);
      console.log("📊 Loading accounts for:", user.email, "ID:", user.id);

      try {
        // Pass user_id to webhook - backend will filter accounts
        const accountsData = await fetchAdAccounts(user.id);
        
        console.log(`✅ Received ${accountsData.length} accounts from webhook`);
        
        setAccounts(accountsData);
        
        // Restore saved account or select first
        const savedAccountId = localStorage.getItem("selectedAccountId");
        if (savedAccountId && accountsData.find(acc => acc.id === savedAccountId)) {
          setSelectedAccountId(savedAccountId);
          console.log("✅ Restored account:", savedAccountId);
        } else if (accountsData.length > 0) {
          setSelectedAccountId(accountsData[0].id);
          localStorage.setItem("selectedAccountId", accountsData[0].id);
          console.log("✅ Selected first account:", accountsData[0].id);
        }
        
        hasLoadedRef.current = true;
      } catch (error) {
        console.error("❌ Failed to load accounts:", error);
        setAccounts([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadAccounts();
  }, [isAuthenticated, user?.id]); // Only reload if auth state or user ID changes

  const handleSetSelectedAccountId = (accountId: string) => {
    setSelectedAccountId(accountId);
    localStorage.setItem("selectedAccountId", accountId);
    console.log("💾 Saved selected account to localStorage:", accountId);
  };

  const refreshAccounts = async () => {
    if (!isAuthenticated || !user) {
      return;
    }

    setLoading(true);
    try {
      console.log("🔄 Refreshing accounts for user:", user.id);
      // Pass user_id to webhook - backend will filter accounts
      const accountsData = await fetchAdAccounts(user.id);
      console.log("✅ Accounts refreshed:", accountsData.length);
      
      setAccounts(accountsData);
      
      // Check if selected account still exists
      if (selectedAccountId && !accountsData.find(acc => acc.id === selectedAccountId)) {
        // If current account no longer exists, select first account
        if (accountsData.length > 0) {
          handleSetSelectedAccountId(accountsData[0].id);
        } else {
          setSelectedAccountId("");
        }
      }
    } catch (error) {
      console.error("❌ Failed to refresh accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccountContext.Provider value={{
      selectedAccountId,
      setSelectedAccountId: handleSetSelectedAccountId,
      accounts,
      loading,
      refreshAccounts
    }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
}
