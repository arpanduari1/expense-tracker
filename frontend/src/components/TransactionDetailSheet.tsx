import React from "react";
import { format } from "date-fns";
import { Calendar, Edit2, Trash2, MessageSquare, TrendingUp, TrendingDown } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LedgerEntryResponse } from "@/types";

interface TransactionDetailSheetProps {
  transaction: LedgerEntryResponse | null;
  contactName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (transaction: LedgerEntryResponse) => void;
  onDelete: (transaction: LedgerEntryResponse) => void;
}

export const TransactionDetailSheet: React.FC<TransactionDetailSheetProps> = ({
  transaction,
  contactName,
  isOpen,
  onOpenChange,
  onEdit,
  onDelete,
}) => {
  if (!transaction) return null;

  const isDebit = transaction.type === 'DEBIT';
  const transactionTypeText = isDebit ? 'You Gave' : 'You Got';
  const transactionIcon = isDebit ? TrendingDown : TrendingUp;
  const amountColor = isDebit 
    ? 'text-red-600 dark:text-red-400' 
    : 'text-green-600 dark:text-green-400';
  const bgColor = isDebit
    ? 'bg-red-50 dark:bg-red-900/20'
    : 'bg-green-50 dark:bg-green-900/20';

  const handleEdit = () => {
    onEdit(transaction);
  };

  const handleDelete = () => {
    onDelete(transaction);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md z-[55]">
        <SheetHeader className="space-y-4">
          <SheetTitle className="text-left">Transaction Details</SheetTitle>
          <SheetDescription className="text-left">
            View and manage your transaction with {contactName}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Transaction Type & Amount */}
          <div className={`rounded-lg p-6 ${bgColor} border border-opacity-20 ${
            isDebit ? 'border-red-200 dark:border-red-800' : 'border-green-200 dark:border-green-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${
                  isDebit 
                    ? 'bg-red-100 dark:bg-red-900/40' 
                    : 'bg-green-100 dark:bg-green-900/40'
                }`}>
                  {React.createElement(transactionIcon, {
                    className: `h-6 w-6 ${amountColor}`,
                  })}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {transactionTypeText}
                  </p>
                  <p className={`text-3xl font-bold ${amountColor}`}>
                    ₹{transaction.amount.toLocaleString()}
                  </p>
                </div>
              </div>
              <Badge 
                variant={isDebit ? "destructive" : "default"}
                className={`px-3 py-1 text-xs font-medium ${
                  isDebit 
                    ? "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900/70" 
                    : "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900/70"
                }`}
              >
                {transactionTypeText}
              </Badge>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Date</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(transaction.createdDate), "PPP")}
                </p>
              </div>
            </div>

            {transaction.description && (
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Description</p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {transaction.description}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="justify-center gap-2 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20 dark:hover:border-blue-800"
                onClick={handleEdit}
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                className="justify-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 dark:hover:border-red-800"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>

          {/* Contact Information */}
          <div className="rounded-lg bg-muted/30 p-4 border border-muted">
            <h4 className="text-sm font-semibold mb-2 text-foreground">Transaction With</h4>
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