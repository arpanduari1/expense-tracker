import api from "./api";
import type { UserDto, ProfilePictureUploadResponse, ProfilePictureDeleteResponse } from "@/types";

// Get user details
export const getUser = async (): Promise<UserDto> => {
  const response = await api.get("/user");
  return response.data;
};

// Update user profile
export const updateUser = async (userData: Partial<UserDto>): Promise<UserDto> => {
  const response = await api.put("/user", userData);
  return response.data;
};

/**
 * Upload profile picture
 */
export const uploadProfilePicture = async (file: File): Promise<ProfilePictureUploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/profile/profile-picture", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

/**
 * Delete profile picture
 */
export const deleteProfilePicture = async (): Promise<ProfilePictureDeleteResponse> => {
  const response = await api.delete("/profile/profile-picture");
  return response.data;
};
