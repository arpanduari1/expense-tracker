import React from "react";
import { AlertTriangle, Trash2, X, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LedgerUserResponse } from "@/types";

interface DeleteContactDialogProps {
  contact: LedgerUserResponse | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
  totalTransactions?: number;
  currentBalance?: number;
}

export const DeleteContactDialog: React.FC<DeleteContactDialogProps> = ({
  contact,
  isOpen,
  onOpenChange,
  onConfirm,
  isLoading = false,
  totalTransactions = 0,
  currentBalance = 0,
}) => {
  if (!contact) return null;

  const hasBalance = currentBalance !== 0;
  const balanceText = currentBalance > 0 
    ? `You'll get ₹${Math.abs(currentBalance).toLocaleString()}`
    : currentBalance < 0 
    ? `You'll give ₹${Math.abs(currentBalance).toLocaleString()}`
    : "Settled";

  const balanceColor = currentBalance > 0 
    ? 'text-green-600 dark:text-green-400' 
    : currentBalance < 0 
    ? 'text-red-600 dark:text-red-400'
    : 'text-gray-600 dark:text-gray-400';

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
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100/60 dark:bg-red-900/15">
              <AlertTriangle className="h-6 w-6 text-red-500/80 dark:text-red-400/80" />
            </div>
            <div>
              <DialogTitle className="text-left">Delete Contact</DialogTitle>
              <DialogDescription className="text-left mt-1">
                This action cannot be undone
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Contact Details */}
          <div className="rounded-lg border border-red-200/50 dark:border-red-800/30 bg-red-50/30 dark:bg-red-900/5 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100/60 dark:bg-red-900/20 flex items-center justify-center">
                <User className="h-5 w-5 text-red-500/80 dark:text-red-400/80" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-red-800/90 dark:text-red-200/90">
                  {contact.name}
                </h3>
                <p className="text-sm text-red-600/80 dark:text-red-400/80">
                  {contact.email}
                </p>
              </div>
            </div>

            {/* Transaction Summary */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-red-700/80 dark:text-red-300/80">Total Transactions:</span>
                <Badge variant="destructive" className="bg-red-100/70 text-red-700/90 dark:bg-red-900/30 dark:text-red-300/90">
                  {totalTransactions}
                </Badge>
              </div>
              
              {hasBalance && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-700/80 dark:text-red-300/80">Current Balance:</span>
                  <span className={`font-medium ${balanceColor}`}>
                    {balanceText}
                  </span>
                </div>
              )}
            </div>
            
            {/* Inline Warning Text */}
            <div className="mt-3 pt-3 border-t border-red-200/40 dark:border-red-800/20">
              <p className="text-xs text-red-600/70 dark:text-red-400/70">
                This will permanently remove all {totalTransactions} transactions
                {hasBalance && " and settle any outstanding balance"}. This action cannot be reversed.
              </p>
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
              className="flex-1 bg-red-500/90 hover:bg-red-600/90 dark:bg-red-500/80 dark:hover:bg-red-600/80"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isLoading ? 'Deleting...' : 'Delete Contact'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};