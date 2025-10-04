"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdAccount } from '@/types';
import { fetchAdAccounts } from '@/services/accountsService';

interface AccountContextType {
  selectedAccountId: string;
  setSelectedAccountId: (accountId: string) => void;
  accounts: AdAccount[];
  loading: boolean;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        console.log("📊 Loading accounts in context...");
        const accountsData = await fetchAdAccounts();
        console.log("✅ Accounts loaded in context:", accountsData);
        setAccounts(accountsData);
        
        // Check for saved account in localStorage first
        const savedAccountId = localStorage.getItem("selectedAccountId");
        
        if (savedAccountId && accountsData.find(acc => acc.id === savedAccountId)) {
          console.log("🔄 Restoring saved account:", savedAccountId);
          setSelectedAccountId(savedAccountId);
        } else if (accountsData.length > 0) {
          console.log("🔄 Auto-selecting first account in context:", accountsData[0].id);
          setSelectedAccountId(accountsData[0].id);
          localStorage.setItem("selectedAccountId", accountsData[0].id);
        }
      } catch (error) {
        console.error("❌ Failed to load accounts in context:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAccounts();
  }, []); // Remove selectedAccountId dependency to prevent infinite loop

  const handleSetSelectedAccountId = (accountId: string) => {
    setSelectedAccountId(accountId);
    localStorage.setItem("selectedAccountId", accountId);
    console.log("💾 Saved selected account to localStorage:", accountId);
  };

  return (
    <AccountContext.Provider value={{
      selectedAccountId,
      setSelectedAccountId: handleSetSelectedAccountId,
      accounts,
      loading
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
