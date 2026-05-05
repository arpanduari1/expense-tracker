import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LedgerEntryResponse } from "@/types";

interface DeleteConfirmationDialogProps {
  transaction: LedgerEntryResponse | null;
  contactName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  transaction,
  contactName,
  isOpen,
  onOpenChange,
  onConfirm,
  isLoading = false,
}) => {
  if (!transaction) return null;

  const isDebit = transaction.type === 'DEBIT';
  const transactionTypeText = isDebit ? 'You Gave' : 'You Got';
  const amountColor = isDebit 
    ? 'text-red-600 dark:text-red-400' 
    : 'text-green-600 dark:text-green-400';

  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-left">Delete Transaction</DialogTitle>
              <DialogDescription className="text-left mt-1">
                This action cannot be undone
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transaction Details */}
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <Badge 
                variant="destructive"
                className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
              >
                {transactionTypeText}
              </Badge>
              <span className={`text-lg font-bold ${amountColor}`}>
                ₹{transaction.amount.toLocaleString()}
              </span>
            </div>
            
            {transaction.description && (
              <p className="text-sm text-muted-foreground mb-2">
                "{transaction.description}"
              </p>
            )}
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>With {contactName}</span>
              <span>
                {new Date(transaction.createdDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
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
              variant="destructive"
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isLoading ? 'Deleting...' : 'Delete Transaction'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};