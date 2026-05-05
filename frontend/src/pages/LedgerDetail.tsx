import { useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/UserAvatar";
import { TransactionDetailSheet } from "@/components/TransactionDetailSheet";
import { EditTransactionSheet } from "@/components/EditTransactionSheet";
import { EditUserSheet } from "@/components/EditUserSheet";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { DeleteContactDialog } from "@/components/DeleteContactDialog";
import { showSuccess, showError } from "@/utils/toast";
import {
  getUserTransactions,
  createLedgerEntry,
  updateLedgerEntry,
  deleteLedgerEntry,
  updateLedgerUser,
  deleteLedgerUser,
  formatBalance,
  getBalanceStatus,
  getBalanceDisplayText,
  calculateBalance,
} from "@/services/ledgerService";
import { LedgerEntryRequest, LedgerUserResponse, LedgerEntryResponse, LedgerContactSummary, LedgerUserRequest } from "@/types";

interface LocationState {
  contact?: LedgerContactSummary;
}

const LedgerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  const locationState = location.state as LocationState;
  
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<LedgerEntryResponse | null>(null);
  const [transactionType, setTransactionType] = useState<'GAVE' | 'GOT'>('GAVE');
  
  // Transaction detail sheet state
  const [isTransactionDetailOpen, setIsTransactionDetailOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<LedgerEntryResponse | null>(null);
  
  // Edit transaction sheet state
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<LedgerEntryResponse | null>(null);
  
  // Delete confirmation dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTransaction, setDeleteTransaction] = useState<LedgerEntryResponse | null>(null);
  
  // Edit contact state
  const [isEditContactOpen, setIsEditContactOpen] = useState(false);
  
  // Delete contact state
  const [isDeleteContactOpen, setIsDeleteContactOpen] = useState(false);
  
  // Form state for new/edit transaction
  const [transactionForm, setTransactionForm] = useState<Omit<LedgerEntryRequest, 'ledgerUserId'>>({
    amount: 0,
    description: '',
    type: 'DEBIT',
    createdDate: new Date().toISOString(),
  });

  // Fetch contact transactions
  const {
    data: contactData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["ledger-contact-detail", id],
    queryFn: () => getUserTransactions(Number(id)),
    enabled: !!id,
  });

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: (data: LedgerEntryRequest) => createLedgerEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ledger-contact-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["ledger-contacts"] });
      setIsAddTransactionOpen(false);
      resetForm();
      showSuccess("Transaction added successfully!");
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || "Failed to add transaction");
    },
  });

  // Update transaction mutation
  const updateTransactionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<LedgerEntryRequest> }) =>
      updateLedgerEntry(id, data),
    onSuccess: (updatedTransaction, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ledger-contact-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["ledger-contacts"] });
      
      // Update selectedTransaction if it matches the updated transaction
      if (selectedTransaction && selectedTransaction.id === variables.id) {
        const newTransactionData = updatedTransaction || {
          ...selectedTransaction,
          ...variables.data,
        };
        setSelectedTransaction(newTransactionData);
      }
      
      setIsEditTransactionOpen(false);
      setEditingTransaction(null);
      resetForm();
      showSuccess("Transaction updated successfully!");
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || "Failed to update transaction");
    },
  });

  // Delete transaction mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: (transactionId: number) => deleteLedgerEntry(transactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ledger-contact-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["ledger-contacts"] });
      showSuccess("Transaction deleted successfully!");
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || "Failed to delete transaction");
    },
  });

  // Update contact mutation
  const updateContactMutation = useMutation({
    mutationFn: (data: Partial<LedgerUserRequest>) => updateLedgerUser(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ledger-contact-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["ledger-contacts"] });
      setIsEditContactOpen(false);
      showSuccess("Contact updated successfully!");
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || "Failed to update contact");
    },
  });

  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: () => deleteLedgerUser(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ledger-contacts"] });
      setIsDeleteContactOpen(false);
      showSuccess("Contact deleted successfully!");
      navigate("/ledger");
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || "Failed to delete contact");
    },
  });

  const resetForm = () => {
    setTransactionForm({
      amount: 0,
      description: '',
      type: 'DEBIT',
      createdDate: new Date().toISOString(),
    });
  };

  const handleAddTransaction = (type: 'GAVE' | 'GOT') => {
    setTransactionType(type);
    // Map user-friendly terms to API terms
    const apiType = type === 'GAVE' ? 'DEBIT' : 'CREDIT';
    setTransactionForm(prev => ({ ...prev, type: apiType }));
    setIsAddTransactionOpen(true);
  };

  const handleEditTransaction = (transaction: LedgerEntryResponse) => {
    setEditingTransaction(transaction);
    // Map API terms back to user-friendly terms for the type selector
    const userType = transaction.type === 'DEBIT' ? 'GAVE' : 'GOT';
    setTransactionType(userType);
    setTransactionForm({
      amount: transaction.amount,
      description: transaction.description || '',
      type: transaction.type,
      createdDate: transaction.createdDate,
    });
    setIsEditTransactionOpen(true);
  };

  const handleSubmitTransaction = () => {
    if (!transactionForm.amount || transactionForm.amount <= 0) {
      showError("Please enter a valid amount");
      return;
    }

    const data: LedgerEntryRequest = {
      ...transactionForm,
      ledgerUserId: Number(id),
    };

    if (isEditTransactionOpen && editingTransaction) {
      updateTransactionMutation.mutate({ id: editingTransaction.id, data });
    } else {
      createTransactionMutation.mutate(data);
    }
  };

  const handleDeleteTransaction = (transactionId: number) => {
    // Find the transaction by ID to show in confirmation dialog
    const transaction = contactData?.entries.find(t => t.id === transactionId);
    if (transaction) {
      setDeleteTransaction(transaction);
      setIsDeleteDialogOpen(true);
    }
  };

  // Transaction detail sheet handlers
  const handleTransactionClick = (transaction: LedgerEntryResponse) => {
    setSelectedTransaction(transaction);
    setIsTransactionDetailOpen(true);
  };

  const handleTransactionDetailEdit = (transaction: LedgerEntryResponse) => {
    setEditTransaction(transaction);
    setIsEditSheetOpen(true);
  };

  const handleTransactionDetailDelete = (transaction: LedgerEntryResponse) => {
    setDeleteTransaction(transaction);
    setIsDeleteDialogOpen(true);
  };

  // Edit sheet handlers
  const handleEditSheetSave = (data: Partial<LedgerEntryRequest>) => {
    if (editTransaction) {
      updateTransactionMutation.mutate(
        { id: editTransaction.id, data },
        {
          onSuccess: (updatedTransaction) => {
            // Update the selected transaction with the new data immediately
            // Use the response data if available, otherwise merge with existing data
            const newTransactionData = updatedTransaction || {
              ...editTransaction,
              ...data,
            };
            setSelectedTransaction(newTransactionData);
            setIsEditSheetOpen(false);
            setEditTransaction(null);
            showSuccess("Transaction updated successfully!");
          }
        }
      );
    }
  };

  // Edit contact handlers
  const handleEditContact = () => {
    setIsEditContactOpen(true);
  };

  const handleContactSave = (data: Partial<LedgerUserRequest>) => {
    updateContactMutation.mutate(data);
  };

  const handleDeleteContact = () => {
    setIsDeleteContactOpen(true);
  };

  const handleDeleteContactConfirm = () => {
    deleteContactMutation.mutate();
  };

  // Delete confirmation handlers
  const handleDeleteConfirm = () => {
    if (deleteTransaction) {
      deleteTransactionMutation.mutate(deleteTransaction.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setDeleteTransaction(null);
          setIsTransactionDetailOpen(false); // Close the detail sheet as well
          showSuccess("Transaction deleted successfully!");
        }
      });
    }
  };

  // Calculate balance and summary
  const summary = useMemo(() => {
    if (!contactData) return null;
    
    const balance = calculateBalance(contactData.youGave, contactData.youGot);
    const balanceStatus = getBalanceStatus(balance);
    const displayText = getBalanceDisplayText(balance);
    
    return {
      balance,
      balanceStatus,
      displayText,
      youGave: contactData.youGave,
      youGot: contactData.youGot,
    };
  }, [contactData]);

  // Sort transactions by date (newest first)
  const sortedTransactions = useMemo(() => {
    if (!contactData?.entries) return [];
    return [...contactData.entries].sort((a, b) => 
      new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
    );
  }, [contactData?.entries]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <p>Failed to load contact details</p>
              <Button 
                variant="outline" 
                onClick={() => navigate('/ledger')}
                className="mt-2"
              >
                Back to Ledger
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const contact = contactData || locationState?.contact;

  return (
    <div className="w-full space-y-6">
      {/* Header with Back Button and Contact Name */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/ledger')}
          className="rounded-full"
          aria-label="Back to ledger"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-4 flex-1">
          {contactData && (
            <>
              <UserAvatar
                username={contactData.name}
                size={56}
                className="border-2 border-border"
              />
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{contactData.name}</h1>
                {contactData.email && (
                  <p className="text-muted-foreground text-sm">{contactData.email}</p>
                )}
              </div>
              <Button
                variant="outline"
                onClick={handleEditContact}
                className="gap-2 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20 dark:hover:border-blue-800"
              >
                <Edit2 className="h-4 w-4" />
                Edit Profile
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Balance Summary */}
      {summary && (
        <Card className="border-2 border-border">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Main Balance Display */}
              <div className="text-center">
                <div className={`text-4xl font-bold mb-2 ${
                  summary.balanceStatus === 'positive' ? 'text-green-500' :
                  summary.balanceStatus === 'negative' ? 'text-red-500' :
                  'text-gray-500'
                }`}>
                  {formatBalance(summary.balance)}
                </div>
                <div className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  {summary.displayText}
                </div>
              </div>
              
              <Separator />
              
              {/* You Gave and You Got */}
              <div className="grid grid-cols-2 gap-6 px-4">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-red-500">
                    ₹{summary.youGave.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">You Gave</div>
                </div>
                <div className="space-y-1 text-right">
                  <div className="text-2xl font-bold text-green-500">
                    ₹{summary.youGot.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">You Got</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={() => handleAddTransaction('GAVE')}
          className="gap-2 bg-red-300 hover:bg-red-400 text-red-800 dark:bg-red-400/80 dark:hover:bg-red-400 dark:text-white"
          size="lg"
        >
          <TrendingDown className="h-4 w-4" />
          You Gave
        </Button>
        <Button
          onClick={() => handleAddTransaction('GOT')}
          className="gap-2 bg-green-300 hover:bg-green-400 text-green-800 dark:bg-green-400/80 dark:hover:bg-green-400 dark:text-white"
          size="lg"
        >
          <TrendingUp className="h-4 w-4" />
          You Got
        </Button>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Transaction History ({sortedTransactions.length})
          </CardTitle>
          {sortedTransactions.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              Click on any transaction to view details, or use the three-dot menu for quick actions
            </p>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-4 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[100px]" />
                  </div>
                  <Skeleton className="h-6 w-[80px]" />
                </div>
              ))}
            </div>
          ) : sortedTransactions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No transactions yet</p>
              <p className="text-sm">Add your first transaction using the buttons above</p>
            </div>
          ) : (
            <div>
              {/* Table Header */}
              <div className="grid grid-cols-[1fr_120px_120px_48px] gap-4 p-4 border-b border-border/60 dark:border-gray-600 bg-muted/50 font-medium text-sm">
                <div>ENTRIES</div>
                <div className="text-center">YOU GAVE</div>
                <div className="text-center">YOU GOT</div>
                <div></div>
              </div>
              
              {/* Table Body */}
              <div>
                {sortedTransactions.map((transaction, index) => (
                  <div
                    key={transaction.id}
                    className="grid grid-cols-[1fr_120px_120px_48px] gap-4 p-4 hover:bg-muted/50 transition-all duration-200 items-center cursor-pointer group relative hover:shadow-sm border-l-2 border-transparent hover:border-primary/20"
                    onClick={() => handleTransactionClick(transaction)}
                  >
                    {/* Left Column - Entry Details */}
                    <div className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        transaction.type === 'CREDIT' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      
                      <div className="min-w-0">
                        {transaction.description && (
                          <p className="text-sm font-medium mb-1 break-words">
                            {transaction.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span>
                            {format(new Date(transaction.createdDate), 'MMM dd, yyyy')}
                          </span>
                          <span>
                            {format(new Date(transaction.createdDate), 'HH:mm')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Middle Left Column - You Gave */}
                    <div className={`text-center ${index < sortedTransactions.length - 1 ? 'border-b border-border/60 dark:border-gray-600 pb-4' : ''}`}>
                      {transaction.type === 'DEBIT' ? (
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          ₹{transaction.amount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                    
                    {/* Middle Right Column - You Got */}
                    <div className={`text-center ${index < sortedTransactions.length - 1 ? 'border-b border-border/60 dark:border-gray-600 pb-4' : ''}`}>
                      {transaction.type === 'CREDIT' ? (
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          ₹{transaction.amount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                    
                    {/* Right Column - Actions */}
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTransaction(transaction);
                            }}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleDeleteTransaction(transaction.id);
                            }}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Transaction Dialog */}
      <Dialog 
        open={isAddTransactionOpen || isEditTransactionOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsAddTransactionOpen(false);
            setIsEditTransactionOpen(false);
            setEditingTransaction(null);
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditTransactionOpen ? 'Edit Transaction' : 
               transactionType === 'GAVE' ? 'You Gave Money' : 'You Got Money'}
            </DialogTitle>
            <DialogDescription>
              {isEditTransactionOpen ? 'Update the transaction details' :
               transactionType === 'GAVE' 
                 ? `Record money you gave to ${contact?.name}` 
                 : `Record money you received from ${contact?.name}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={transactionForm.amount || ''}
                onChange={(e) =>
                  setTransactionForm(prev => ({ 
                    ...prev, 
                    amount: parseFloat(e.target.value) || 0 
                  }))
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add a note about this transaction"
                value={transactionForm.description}
                onChange={(e) =>
                  setTransactionForm(prev => ({ 
                    ...prev, 
                    description: e.target.value 
                  }))
                }
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={transactionForm.createdDate ? format(new Date(transactionForm.createdDate), 'yyyy-MM-dd') : ''}
                onChange={(e) =>
                  setTransactionForm(prev => ({ 
                    ...prev, 
                    createdDate: new Date(e.target.value).toISOString() 
                  }))
                }
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddTransactionOpen(false);
                setIsEditTransactionOpen(false);
                setEditingTransaction(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitTransaction}
              disabled={createTransactionMutation.isPending || updateTransactionMutation.isPending}
              className={transactionType === 'GAVE' 
                ? 'bg-red-300 hover:bg-red-400 text-red-800 dark:bg-red-400/80 dark:hover:bg-red-400 dark:text-white' 
                : 'bg-green-300 hover:bg-green-400 text-green-800 dark:bg-green-400/80 dark:hover:bg-green-400 dark:text-white'
              }
            >
              {createTransactionMutation.isPending || updateTransactionMutation.isPending 
                ? (isEditTransactionOpen ? 'Updating...' : 'Adding...') 
                : (isEditTransactionOpen ? 'Update' : 'Add Transaction')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Detail Sheet */}
      <TransactionDetailSheet
        transaction={selectedTransaction}
        contactName={contact?.name || contactData?.name || 'Unknown Contact'}
        isOpen={isTransactionDetailOpen}
        onOpenChange={setIsTransactionDetailOpen}
        onEdit={handleTransactionDetailEdit}
        onDelete={handleTransactionDetailDelete}
      />

      {/* Edit Transaction Sheet */}
      <EditTransactionSheet
        transaction={editTransaction}
        contactName={contact?.name || contactData?.name || 'Unknown Contact'}
        isOpen={isEditSheetOpen}
        onOpenChange={setIsEditSheetOpen}
        onSave={handleEditSheetSave}
        isLoading={updateTransactionMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        transaction={deleteTransaction}
        contactName={contact?.name || contactData?.name || 'Unknown Contact'}
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteTransactionMutation.isPending}
      />

      {/* Edit Contact Sheet */}
      <EditUserSheet
        contact={contactData}
        isOpen={isEditContactOpen}
        onOpenChange={setIsEditContactOpen}
        onSave={handleContactSave}
        onDelete={handleDeleteContact}
        isLoading={updateContactMutation.isPending}
      />

      {/* Delete Contact Dialog */}
      <DeleteContactDialog
        contact={contactData}
        isOpen={isDeleteContactOpen}
        onOpenChange={setIsDeleteContactOpen}
        onConfirm={handleDeleteContactConfirm}
        isLoading={deleteContactMutation.isPending}
        totalTransactions={contactData?.entries?.length || 0}
        currentBalance={contactData?.balance || 0}
      />
    </div>
  );
};

export default LedgerDetail;