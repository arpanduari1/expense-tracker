import type { ErrorResponse, ValidationErrorResponse } from "@/types";

// Utility function to extract validation errors from API response
export const extractValidationErrors = (error: any): ValidationErrorResponse[] => {
  const validationErrors: ValidationErrorResponse[] = [];

  // Debug logging
  console.log('Extracting validation errors from:', {
    status: error.response?.status,
    data: error.response?.data,
    message: error.message
  });

  if (error.response?.data) {
    const data = error.response.data;
    
    // Check for Spring Boot style validation errors
    if (data.errors && Array.isArray(data.errors)) {
      return data.errors.map((err: any) => ({
        field: err.field || err.property || 'unknown',
        message: err.message || err.defaultMessage || 'Validation error'
      }));
    }
    
    // Check for field validation errors in various formats
    if (data.fieldErrors && Array.isArray(data.fieldErrors)) {
      return data.fieldErrors.map((err: any) => ({
        field: err.field,
        message: err.message
      }));
    }
    
    // Check for validation messages object (field: message format)
    if (data.validationErrors && typeof data.validationErrors === 'object') {
      Object.entries(data.validationErrors).forEach(([field, message]) => {
        validationErrors.push({
          field,
          message: String(message)
        });
      });
    }

    // Parse common password validation error messages
    if (data.errorMessage || data.message) {
      const errorMsg = data.errorMessage || data.message;
      
      // Common validation patterns
      if (typeof errorMsg === 'string') {
        const lowerMsg = errorMsg.toLowerCase();
        
        // Password validation errors
        if (lowerMsg.includes('password')) {
          if (lowerMsg.includes('length') || lowerMsg.includes('8 characters') || lowerMsg.includes('at least 8')) {
            validationErrors.push({
              field: 'password',
              message: 'Password must be at least 8 characters long'
            });
          } else if (lowerMsg.includes('weak') || lowerMsg.includes('strength')) {
            validationErrors.push({
              field: 'password', 
              message: 'Password is too weak. Please use a stronger password'
            });
          } else if (lowerMsg.includes('invalid') || lowerMsg.includes('incorrect') || lowerMsg.includes('wrong')) {
            validationErrors.push({
              field: 'oldPassword',
              message: 'Current password is incorrect'
            });
          } else if (lowerMsg.includes('match') || lowerMsg.includes('confirm')) {
            validationErrors.push({
              field: 'confirmPassword',
              message: 'Passwords do not match'
            });
          } else if (lowerMsg.includes('same') || lowerMsg.includes('different')) {
            validationErrors.push({
              field: 'newPassword',
              message: 'New password must be different from current password'
            });
          }
        }
        
        // Username validation errors
        else if (lowerMsg.includes('username')) {
          if (lowerMsg.includes('exist') || lowerMsg.includes('taken') || lowerMsg.includes('already')) {
            validationErrors.push({
              field: 'username',
              message: 'Username already exists'
            });
          } else if (lowerMsg.includes('length') || lowerMsg.includes('characters')) {
            validationErrors.push({
              field: 'username',
              message: 'Username must be at least 2 characters long'
            });
          }
        }
        
        // Email validation errors
        else if (lowerMsg.includes('email')) {
          if (lowerMsg.includes('exist') || lowerMsg.includes('taken') || lowerMsg.includes('already')) {
            validationErrors.push({
              field: 'email',
              message: 'Email already exists'
            });
          } else if (lowerMsg.includes('invalid') || lowerMsg.includes('format')) {
            validationErrors.push({
              field: 'email',
              message: 'Please enter a valid email address'
            });
          }
        }
        
        // Currency validation errors
        else if (lowerMsg.includes('currency')) {
          validationErrors.push({
            field: 'currency',
            message: 'Please select a valid currency'
          });
        }
      }
    }
  }

  console.log('Extracted validation errors:', validationErrors);
  return validationErrors;
};

// Utility to determine if error should show field-level validation
export const shouldShowFieldErrors = (error: any): boolean => {
  return error.response?.status === 400 || 
         error.response?.status === 422 || 
         (error.response?.data && (
           error.response.data.errors || 
           error.response.data.fieldErrors ||
           error.response.data.validationErrors
         ));
};

// Utility to get general error message for toast
export const getGeneralErrorMessage = (error: any, defaultMessage: string): string => {
  if (error.response?.data?.errorMessage) {
    return error.response.data.errorMessage;
  }
  
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.response?.status === 409) {
    return "Username or email already exists. Please try different credentials.";
  }
  
  if (error.response?.status === 401) {
    return "Invalid credentials. Please check and try again.";
  }
  
  if (error.response?.status === 500) {
    return "Server error. Please try again later.";
  }
  
  if (error.message === 'Network Error') {
    return "Network error. Please check your internet connection.";
  }
  
  return defaultMessage;
};