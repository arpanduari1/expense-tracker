import api from "./api";
import { 
  LedgerUserRequest, 
  LedgerUserResponse, 
  LedgerEntryRequest, 
  LedgerEntryResponse,
  LedgerUserEntryResponse,
  LedgerContactSummary,
  PageLedgerUserResponse,
  PageLedgerEntryResponse 
} from "@/types";

// Get all ledger contacts
export const getAllContacts = async (): Promise<LedgerContactSummary[]> => {
  const response = await api.get("/ledger/contacts");
  console.log("Ledger API Response:", response.data);
  return response.data;
};

// Create a new ledger contact
export const createLedgerUser = async (userData: LedgerUserRequest): Promise<LedgerUserResponse> => {
  const response = await api.post("/ledger/contact", userData);
  return response.data;
};

// Update an existing ledger contact
export const updateLedgerUser = async (id: number, userData: Partial<LedgerUserRequest>): Promise<LedgerUserResponse> => {
  const response = await api.patch(`/ledger/contact/${id}`, userData);
  return response.data;
};

// Delete a ledger contact
export const deleteLedgerUser = async (id: number): Promise<void> => {
  await api.delete(`/ledger/contact/${id}`);
};

// Create a new ledger entry (transaction)
export const createLedgerEntry = async (entryData: LedgerEntryRequest): Promise<LedgerEntryResponse> => {
  const response = await api.post("/ledger/entry", entryData);
  return response.data;
};

// Update an existing ledger entry
export const updateLedgerEntry = async (id: number, entryData: Partial<LedgerEntryRequest>): Promise<LedgerEntryResponse> => {
  const response = await api.patch(`/ledger/entry/${id}`, entryData);
  return response.data;
};

// Delete a ledger entry
export const deleteLedgerEntry = async (id: number): Promise<void> => {
  await api.delete(`/ledger/entry/${id}`);
};

// Get a specific ledger entry by ID
export const getLedgerEntry = async (id: number): Promise<LedgerEntryResponse> => {
  const response = await api.get(`/ledger/entry/${id}`);
  return response.data;
};

// Get all transactions for a specific contact
export const getUserTransactions = async (ledgerUserId: number): Promise<LedgerUserEntryResponse> => {
  // Fetch both entries and all contacts to get the contact name
  const [entriesResponse, contactsResponse] = await Promise.all([
    api.get(`/ledger/contacts/${ledgerUserId}/entries`),
    api.get('/ledger/contacts')
  ]);
  
  const entries: LedgerEntryResponse[] = entriesResponse.data;
  const contacts: LedgerContactSummary[] = contactsResponse.data;
  
  // Find the contact with the matching ID
  const contact = contacts.find(c => c.id === ledgerUserId);
  
  // Calculate youGave and youGot from the entries
  let youGave = 0;
  let youGot = 0;
  
  entries.forEach(entry => {
    if (entry.type === 'DEBIT') {
      youGave += entry.amount;
    } else if (entry.type === 'CREDIT') {
      youGot += entry.amount;
    }
  });
  
  // Transform the response to match the expected interface
  return {
    id: ledgerUserId,
    name: contact?.name || '',
    email: contact?.email || '',
    balance: youGot - youGave,
    youGave,
    youGot,
    entries
  };
};

// Helper function to calculate net balance
export const calculateBalance = (youGave: number, youGot: number): number => {
  return youGot - youGave;
};

// Helper function to format balance display
export const formatBalance = (balance: number, currency: string = "₹"): string => {
  const absBalance = Math.abs(balance);
  if (balance > 0) {
    return `${currency}${absBalance}`;
  } else if (balance < 0) {
    return `${currency}${absBalance}`;
  }
  return `${currency}0`;
};

// Helper function to get balance status
export const getBalanceStatus = (balance: number): 'positive' | 'negative' | 'zero' => {
  if (balance > 0) return 'positive';
  if (balance < 0) return 'negative';
  return 'zero';
};

// Helper function to get balance display text
export const getBalanceDisplayText = (balance: number): string => {
  if (balance > 0) return "YOU'LL GET";
  if (balance < 0) return "YOU'LL GIVE";
  return "SETTLED";
};