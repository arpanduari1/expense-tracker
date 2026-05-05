import React, { useState, useEffect } from "react";
import { Save, X, User, Mail, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LedgerUserResponse, LedgerUserRequest } from "@/types";

interface EditUserSheetProps {
  contact: LedgerUserResponse | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<LedgerUserRequest>) => void;
  onDelete?: () => void;
  isLoading?: boolean;
}

export const EditUserSheet: React.FC<EditUserSheetProps> = ({
  contact,
  isOpen,
  onOpenChange,
  onSave,
  onDelete,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Partial<LedgerUserRequest>>({
    name: '',
    email: '',
  });

  // Update form data when contact changes
  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name,
        email: contact.email,
      });
    }
  }, [contact]);

  if (!contact) return null;

  const handleSave = () => {
    if (!formData.name || !formData.email) {
      return;
    }
    onSave(formData);
  };

  const handleCancel = () => {
    // Reset form to original contact data
    setFormData({
      name: contact.name,
      email: contact.email,
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md z-[60]">
        <SheetHeader className="space-y-4">
          <SheetTitle className="text-left flex items-center gap-2">
            <Save className="h-5 w-5" />
            Edit Contact
          </SheetTitle>
          <SheetDescription className="text-left">
            Update contact information
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* User Profile Display */}
          <div className={`rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 border border-opacity-20 border-blue-200 dark:border-blue-800`}>
            <div className="flex items-center justify-center">
              <Badge 
                variant="default"
                className={`px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300`}
              >
                Contact Details
              </Badge>
            </div>
          </div>

          {/* Edit Form */}
          <div className="space-y-5">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Name *
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter contact name"
                value={formData.name || ''}
                onChange={(e) =>
                  setFormData(prev => ({ 
                    ...prev, 
                    name: e.target.value 
                  }))
                }
                className="text-lg"
              />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email || ''}
                onChange={(e) =>
                  setFormData(prev => ({ 
                    ...prev, 
                    email: e.target.value 
                  }))
                }
                className="text-lg"
              />
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
              disabled={isLoading || !formData.name || !formData.email}
              className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>

          {/* Contact Information */}
          <div className="rounded-lg bg-muted/30 p-4 border border-muted">
            <h4 className="text-sm font-semibold mb-2 text-foreground">Current Contact</h4>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {contact.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">{contact.name}</p>
                <p className="text-xs text-muted-foreground">{contact.email}</p>
              </div>
            </div>
          </div>

          {/* Delete Contact Section */}
          {onDelete && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="rounded-lg bg-red-50/50 dark:bg-red-900/5 p-4 border border-red-200/60 dark:border-red-800/40">
                  <h4 className="text-sm font-semibold mb-1 text-red-700/90 dark:text-red-400/90">
                    Danger Zone
                  </h4>
                  <p className="text-xs text-red-600/80 dark:text-red-400/80 mb-3">
                    This will permanently delete the contact and all associated transactions. This action cannot be undone.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={onDelete}
                    disabled={isLoading}
                    size="sm"
                    className="w-full bg-red-500/90 hover:bg-red-600/90 dark:bg-red-500/80 dark:hover:bg-red-600/80"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Contact
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};