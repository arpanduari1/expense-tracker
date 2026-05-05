import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, Trash2, User, Mail, DollarSign, Loader2 } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { ImageCropper } from "@/components/ImageCropper";
import { getUser, uploadProfilePicture, deleteProfilePicture } from "@/services/userService";
import { showSuccess, showError } from "@/utils/toast";
import { avatarRefreshManager } from "@/utils/avatarRefresh";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Profile = () => {
  const [isImageCropperOpen, setIsImageCropperOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch user profile
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user-profile"],
    queryFn: getUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once on failure
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch on mount
  });

  // Upload profile picture mutation
  const uploadMutation = useMutation({
    mutationFn: uploadProfilePicture,
    onSuccess: (data) => {
      // Immediately update the cache with the new avatar URL
      queryClient.setQueryData(["user-profile"], (oldData: any) => {
        if (oldData) {
          return {
            ...oldData,
            avatarUrl: data.profilePictureUrl
          };
        }
        return oldData;
      });
      
      // Trigger global avatar refresh to force all UserAvatar components to update
      avatarRefreshManager.triggerRefresh();
      
      showSuccess(data.message || "Profile picture updated successfully!");
      setIsImageCropperOpen(false);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Failed to upload profile picture";
      showError(message);
    },
  });

  // Delete profile picture mutation
  const deleteMutation = useMutation({
    mutationFn: deleteProfilePicture,
    onSuccess: async (data) => {
      if (!data) {
        showError("Profile picture delete failed - no response from server");
        return;
      }

      if (data.deleted === false) {
        showError(data.message || "Profile picture could not be deleted");
        return;
      }

      if (data.deleted === true) {
        // Wait for the backend to finish updating the database
        // Backend needs time to: delete old image, generate new Jdenticon, upload it, update DB
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Refetch the user profile from server to get the updated avatarUrl
        await queryClient.refetchQueries({ queryKey: ["user-profile"] });
        
        // Trigger avatar refresh to ensure all avatars update
        avatarRefreshManager.triggerRefresh();
        
        showSuccess(data.message || "Profile picture removed successfully!");
        setIsDeleteDialogOpen(false);
      } else {
        showError("Profile picture delete status unclear - please refresh and try again");
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Failed to remove profile picture";
      showError(message);
    },
  });

  const handleImageUpload = (file: File) => {
    uploadMutation.mutate(file);
  };

  const handleDeletePicture = () => {
    deleteMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load profile data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!user) {
    return (
      <Alert>
        <AlertDescription>No profile data found.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Header Section */}
      <div className="relative">
        <Card className="bg-gradient-to-br from-background to-muted/20 border-2">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8">
              <div className="relative flex-shrink-0">
                <UserAvatar 
                  key={`profile-avatar-${user.avatarUrl || 'no-avatar'}`}
                  src={user.avatarUrl} 
                  username={user.username} 
                  size={140}
                  className="border-4 border-background shadow-xl ring-4 ring-primary/10"
                />
                <div className="absolute -bottom-2 -right-2 flex space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setIsImageCropperOpen(true)}
                    className="h-10 w-10 rounded-full p-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={uploadMutation.isPending}
                  >
                    {uploadMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                  {user.avatarUrl && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="h-10 w-10 rounded-full p-0 shadow-lg hover:shadow-xl transition-all duration-300"
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="space-y-4 flex-1">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {user.username}
                  </h1>
                  <div className="flex items-center space-x-2 text-lg text-muted-foreground">
                    <Mail className="h-5 w-5" />
                    <span>{user.email}</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                    <DollarSign className="mr-2 h-4 w-4" />
                    {user.currency}
                  </Badge>
                  <Badge variant="outline" className="px-4 py-2 text-sm font-medium">
                    <User className="mr-2 h-4 w-4" />
                    Active Member
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Details Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Personal Information Card */}
        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="h-5 w-5 text-primary" />
              </div>
              <span>Personal Information</span>
            </CardTitle>
            <CardDescription>Your basic account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Username</label>
              <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                <User className="h-4 w-4 text-muted-foreground" />
                <p className="text-lg font-medium">{user.username}</p>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Email Address</label>
              <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <p className="text-lg font-medium break-all">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings Card */}
        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-secondary">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-secondary-foreground" />
              </div>
              <span>Account Settings</span>
            </CardTitle>
            <CardDescription>Your preferences and settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Default Currency</label>
              <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <p className="text-lg font-semibold">{user.currency}</p>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Profile Picture</label>
              <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                <Camera className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {user.avatarUrl ? "Custom profile picture uploaded" : "Using default generated avatar"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Status Card */}
        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-accent">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Badge className="h-5 w-5" />
              </div>
              <span>Account Status</span>
            </CardTitle>
            <CardDescription>Your account verification and status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Verification Status</label>
              <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-lg font-medium text-green-600 dark:text-green-400">Verified</p>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Member Since</label>
              <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                <User className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Image Cropper Dialog */}
      <ImageCropper
        isOpen={isImageCropperOpen}
        onClose={() => setIsImageCropperOpen(false)}
        onImageReady={handleImageUpload}
        isUploading={uploadMutation.isPending}
      />

      {/* Delete Picture Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Profile Picture</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove your profile picture? You'll go back to using a default generated avatar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePicture}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Picture
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Profile;
