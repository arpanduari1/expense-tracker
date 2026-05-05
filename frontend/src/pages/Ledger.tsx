import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/UserAvatar";
import { showSuccess, showError } from "@/utils/toast";
import {
  getAllContacts,
  createLedgerUser,
  formatBalance,
  getBalanceStatus,
  getBalanceDisplayText,
  calculateBalance,
} from "@/services/ledgerService";
import { LedgerUserRequest, LedgerUserResponse, LedgerContactSummary } from "@/types";

const Ledger = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState<"all" | "positive" | "negative" | "zero">("all");
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  
  // Form state for new contact
  const [newContact, setNewContact] = useState<LedgerUserRequest>({
    name: "",
    email: "",
  });

  // Fetch all contacts
  const {
    data: contacts = [],
    isLoading,
    error,
  } = useQuery<LedgerContactSummary[]>({
    queryKey: ["ledger-contacts"],
    queryFn: getAllContacts,
  });

  // Create contact mutation
  const createContactMutation = useMutation({
    mutationFn: createLedgerUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ledger-contacts"] });
      setIsAddContactOpen(false);
      setNewContact({ name: "", email: "" });
      showSuccess("Contact added successfully!");
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || "Failed to add contact");
    },
  });

  // Calculate totals
  const totals = useMemo(() => {
    const youWillGive = contacts.reduce((sum, contact) => {
      return contact.totalAmount < 0 ? sum + Math.abs(contact.totalAmount) : sum;
    }, 0);
    
    const youWillGet = contacts.reduce((sum, contact) => {
      return contact.totalAmount > 0 ? sum + contact.totalAmount : sum;
    }, 0);
    
    const netBalance = youWillGet - youWillGive;
    
    return { youWillGive, youWillGet, netBalance };
  }, [contacts]);

  // Filter and search contacts
  const filteredContacts = useMemo(() => {
    return contacts
      .filter((contact) => {
        // Search filter
        const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (!matchesSearch) return false;
        
        // Balance filter
        const balance = contact.totalAmount;
        const balanceStatus = getBalanceStatus(balance);
        
        switch (filterBy) {
          case "positive":
            return balanceStatus === "positive";
          case "negative":
            return balanceStatus === "negative";
          case "zero":
            return balanceStatus === "zero";
          default:
            return true;
        }
      })
      .sort((a, b) => {
        // Sort by balance amount (highest absolute value first)
        const balanceA = Math.abs(a.totalAmount);
        const balanceB = Math.abs(b.totalAmount);
        return balanceB - balanceA;
      });
  }, [contacts, searchTerm, filterBy]);

  const handleAddContact = () => {
    if (!newContact.name.trim()) {
      showError("Please enter a contact name");
      return;
    }
    if (!newContact.email?.trim()) {
      showError("Please enter an email address");
      return;
    }
    createContactMutation.mutate(newContact);
  };

  const handleContactClick = (contact: LedgerContactSummary) => {
    navigate(`/ledger/${contact.id}`, { state: { contact } });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <p>Failed to load contacts</p>
              <Button 
                variant="outline" 
                onClick={() => queryClient.invalidateQueries({ queryKey: ["ledger-contacts"] })}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ledger</h1>
          <p className="text-muted-foreground">
            Track money lent and borrowed with your contacts
          </p>
        </div>
        
        <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
              <DialogDescription>
                Add a new contact to track transactions with them.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter contact name"
                  value={newContact.name}
                  onChange={(e) =>
                    setNewContact((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={newContact.email}
                  onChange={(e) =>
                    setNewContact((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddContactOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddContact}
                disabled={createContactMutation.isPending}
              >
                {createContactMutation.isPending ? "Adding..." : "Add Contact"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              You&apos;ll Give
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              ₹{totals.youWillGive.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              You&apos;ll Get
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              ₹{totals.youWillGet.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Balance
            </CardTitle>
            {totals.netBalance > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : totals.netBalance < 0 ? (
              <TrendingDown className="h-4 w-4 text-red-500" />
            ) : (
              <Minus className="h-4 w-4 text-gray-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              totals.netBalance > 0 ? 'text-green-500' :
              totals.netBalance < 0 ? 'text-red-500' :
              'text-gray-500'
            }`}>
              ₹{Math.abs(totals.netBalance).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
              {filterBy !== "all" && (
                <Badge variant="secondary" className="ml-1">
                  {filterBy === "positive" ? "You'll Get" : 
                   filterBy === "negative" ? "You'll Give" : "Settled"}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setFilterBy("all")}>
              All Contacts
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterBy("positive")}>
              You&apos;ll Get
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterBy("negative")}>
              You&apos;ll Give
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterBy("zero")}>
              Settled
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Contacts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Contacts ({filteredContacts.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[100px]" />
                  </div>
                  <Skeleton className="h-6 w-[80px]" />
                </div>
              ))}
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {contacts.length === 0 ? (
                <div>
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No contacts yet</p>
                  <p className="text-sm">Add your first contact to start tracking transactions</p>
                </div>
              ) : (
                <div>
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No contacts found</p>
                  <p className="text-sm">Try adjusting your search or filter criteria</p>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredContacts.map((contact, index) => {
                const balance = contact.totalAmount;
                const balanceStatus = getBalanceStatus(balance);
                const displayText = getBalanceDisplayText(balance);
                
                return (
                  <div
                    key={contact.id}
                    onClick={() => handleContactClick(contact)}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <UserAvatar
                        username={contact.name}
                        size={48}
                        className="flex-shrink-0 border-[3px] border-border/70 dark:border-gray-500"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{contact.name}</h3>
                          {index < 3 && (
                            <Badge variant="outline" className="text-xs">
                              {index === 0 ? "1st" : index === 1 ? "2nd" : "3rd"}
                            </Badge>
                          )}
                        </div>

                        <p className={`text-xs font-medium ${
                          balanceStatus === 'positive' ? 'text-green-600 dark:text-green-400' :
                          balanceStatus === 'negative' ? 'text-red-600 dark:text-red-400' :
                          'text-gray-600 dark:text-gray-400'
                        }`}>
                          {displayText}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        balanceStatus === 'positive' ? 'text-green-600 dark:text-green-400' :
                        balanceStatus === 'negative' ? 'text-red-600 dark:text-red-400' :
                        'text-gray-600 dark:text-gray-400'
                      }`}>
                        {formatBalance(balance)}
                      </div>
                      {contact.lastUpdated && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Last updated: {new Date(contact.lastUpdated).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Ledger;