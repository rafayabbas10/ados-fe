// Client Access Management Service
// Handles password-protected workflow sharing for clients

export interface ClientAccess {
  accountId: string;
  accountName: string;
  password: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  expiresAt?: string;
}

const CLIENT_ACCESS_KEY = 'clientAccessCredentials';

// Generate a random password
export function generateClientPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Get all client access credentials (Admin/Strategist only)
export function getAllClientAccess(): ClientAccess[] {
  try {
    const stored = localStorage.getItem(CLIENT_ACCESS_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading client access:', error);
    return [];
  }
}

// Get client access for specific account
export function getClientAccessByAccount(accountId: string): ClientAccess | null {
  const all = getAllClientAccess();
  return all.find(access => access.accountId === accountId) || null;
}

// Create or update client access for an account
export function createClientAccess(
  accountId: string,
  accountName: string,
  createdBy: string,
  createdByName: string,
  expiresAt?: string
): ClientAccess {
  const all = getAllClientAccess();
  
  // Check if access already exists for this account
  const existingIndex = all.findIndex(access => access.accountId === accountId);
  
  const newAccess: ClientAccess = {
    accountId,
    accountName,
    password: generateClientPassword(),
    createdBy,
    createdByName,
    createdAt: new Date().toISOString(),
    expiresAt,
  };
  
  if (existingIndex >= 0) {
    // Update existing
    all[existingIndex] = newAccess;
  } else {
    // Add new
    all.push(newAccess);
  }
  
  localStorage.setItem(CLIENT_ACCESS_KEY, JSON.stringify(all));
  return newAccess;
}

// Verify client password for account
export function verifyClientAccess(accountId: string, password: string): boolean {
  const access = getClientAccessByAccount(accountId);
  
  if (!access) return false;
  
  // Check if expired
  if (access.expiresAt) {
    const expiryDate = new Date(access.expiresAt);
    if (expiryDate < new Date()) {
      return false; // Expired
    }
  }
  
  return access.password === password;
}

// Delete client access for an account
export function deleteClientAccess(accountId: string): void {
  const all = getAllClientAccess();
  const filtered = all.filter(access => access.accountId !== accountId);
  localStorage.setItem(CLIENT_ACCESS_KEY, JSON.stringify(filtered));
}

// Regenerate password for existing access
export function regenerateClientPassword(accountId: string): ClientAccess | null {
  const all = getAllClientAccess();
  const index = all.findIndex(access => access.accountId === accountId);
  
  if (index < 0) return null;
  
  all[index].password = generateClientPassword();
  all[index].createdAt = new Date().toISOString();
  
  localStorage.setItem(CLIENT_ACCESS_KEY, JSON.stringify(all));
  return all[index];
}

// Get shareable link for account
export function getShareableLink(accountId: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}/workflow/client?account=${encodeURIComponent(accountId)}`;
}

