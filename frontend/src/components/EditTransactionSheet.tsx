import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Save, X, Calendar, MessageSquare, DollarSign } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LedgerEntryResponse, LedgerEntryRequest } from "@/types";

interface EditTransactionSheetProps {
  transaction: LedgerEntryResponse | null;
  contactName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<LedgerEntryRequest>) => void;
  isLoading?: boolean;
}

export const EditTransactionSheet: React.FC<EditTransactionSheetProps> = ({
  transaction,
  contactName,
  isOpen,
  onOpenChange,
  onSave,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Omit<LedgerEntryRequest, 'ledgerUserId'>>({
    amount: 0,
    description: '',
    type: 'DEBIT',
    createdDate: new Date().toISOString(),
  });

  // Update form data when transaction changes
  useEffect(() => {
    if (transaction) {
      setFormData({
        amount: transaction.amount,
        description: transaction.description || '',
        type: transaction.type,
        createdDate: transaction.createdDate,
      });
    }
  }, [transaction]);

  if (!transaction) return null;

  const isDebit = formData.type === 'DEBIT';
  const transactionTypeText = isDebit ? 'You Gave' : 'You Got';
  const amountColor = isDebit 
    ? 'text-red-600 dark:text-red-400' 
    : 'text-green-600 dark:text-green-400';
  const bgColor = isDebit
    ? 'bg-red-50 dark:bg-red-900/20'
    : 'bg-green-50 dark:bg-green-900/20';

  const handleSave = () => {
    if (!formData.amount || formData.amount <= 0) {
      return;
    }
    onSave(formData);
  };

  const handleCancel = () => {
    // Reset form to original transaction data
    setFormData({
      amount: transaction.amount,
      description: transaction.description || '',
      type: transaction.type,
      createdDate: transaction.createdDate,
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md z-[60]">
        <SheetHeader className="space-y-4">
          <SheetTitle className="text-left flex items-center gap-2">
            <Save className="h-5 w-5" />
            Edit Transaction
          </SheetTitle>
          <SheetDescription className="text-left">
            Update your transaction details with {contactName}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Transaction Type Display */}
          <div className={`rounded-lg p-4 ${bgColor} border border-opacity-20 ${
            isDebit ? 'border-red-200 dark:border-red-800' : 'border-green-200 dark:border-green-800'
          }`}>
            <div className="flex items-center justify-center">
              <Badge 
                variant={isDebit ? "destructive" : "default"}
                className={`px-3 py-1 text-sm font-medium ${
                  isDebit 
                    ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300" 
                    : "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                }`}
              >
                {transactionTypeText}
              </Badge>
            </div>
          </div>

          {/* Edit Form */}
          <div className="space-y-5">
            {/* Amount Field */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Amount *
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={formData.amount || ''}
                onChange={(e) =>
                  setFormData(prev => ({ 
                    ...prev, 
                    amount: parseFloat(e.target.value) || 0 
                  }))
                }
                className="text-lg"
              />
              {formData.amount > 0 && (
                <p className={`text-sm font-medium ${amountColor}`}>
                  ₹{formData.amount.toLocaleString()}
                </p>
              )}
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                placeholder="Add a note about this transaction..."
                value={formData.description}
                onChange={(e) =>
                  setFormData(prev => ({ 
                    ...prev, 
                    description: e.target.value 
                  }))
                }
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Date Field */}
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.createdDate ? format(new Date(formData.createdDate), 'yyyy-MM-dd') : ''}
                onChange={(e) =>
                  setFormData(prev => ({ 
                    ...prev, 
                    createdDate: new Date(e.target.value).toISOString() 
                  }))
                }
              />
              {formData.createdDate && (
                <p className="text-sm text-muted-foreground">
                  {format(new Date(formData.createdDate), "PPP")}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || !formData.amount || formData.amount <= 0}
              className={`flex-1 ${
                isDebit 
                  ? 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700'
              }`}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>

          {/* Contact Information */}
          <div className="rounded-lg bg-muted/30 p-4 border border-muted">
            <h4 className="text-sm font-semibold mb-2 text-foreground">Editing Transaction With</h4>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {contactName.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-sm font-medium">{contactName}</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};