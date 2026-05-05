import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, X, Move, ImageIcon, Camera } from "lucide-react";
import imageCompression from "browser-image-compression";

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropperProps {
  isOpen: boolean;
  onClose: () => void;
  onImageReady: (file: File) => void;
  isUploading?: boolean;
}

export const ImageCropper = ({ isOpen, onClose, onImageReady, isUploading = false }: ImageCropperProps) => {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [crop, setCrop] = useState<CropArea>({ x: 0, y: 0, width: 200, height: 200 });
  const [error, setError] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
  const [imageDisplaySize, setImageDisplaySize] = useState({ width: 0, height: 0 });
  const [isDragOver, setIsDragOver] = useState(false);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cropRef = useRef<HTMLDivElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setImageSrc("");
      setCrop({ x: 0, y: 0, width: 200, height: 200 });
      setError("");
      setImageLoaded(false);
      setIsDragging(false);
      setIsResizing(false);
      setIsDragOver(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isOpen]);

  const validateFile = (file: File): string | null => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      return "Please select a valid image file (JPG, PNG, GIF, WebP)";
    }

    // Validate file size (20MB limit)
    if (file.size > 20 * 1024 * 1024) {
      return "Image must be smaller than 20MB";
    }

    return null;
  };

  const processFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setImageLoaded(false);
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
    };
    reader.onerror = () => {
      setError("Failed to load the image. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set dragOver to false if we're leaving the drop zone entirely
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith("image/"));
    
    if (imageFile) {
      processFile(imageFile);
    } else {
      setError("Please drop a valid image file");
    }
  }, []);

  // File input handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    processFile(file);
  };

  // Handle click to open file dialog
  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    
    // Calculate the actual displayed size while maintaining aspect ratio
    const containerMaxWidth = 800; // Max container width
    const containerMaxHeight = 500; // Max container height
    
    const imageAspectRatio = naturalWidth / naturalHeight;
    const containerAspectRatio = containerMaxWidth / containerMaxHeight;
    
    let displayWidth, displayHeight;
    
    if (imageAspectRatio > containerAspectRatio) {
      // Image is wider - constrain by width
      displayWidth = Math.min(naturalWidth, containerMaxWidth);
      displayHeight = displayWidth / imageAspectRatio;
    } else {
      // Image is taller - constrain by height
      displayHeight = Math.min(naturalHeight, containerMaxHeight);
      displayWidth = displayHeight * imageAspectRatio;
    }

    setImageNaturalSize({ width: naturalWidth, height: naturalHeight });
    setImageDisplaySize({ width: displayWidth, height: displayHeight });
    setImageLoaded(true);

    // Initialize crop to center square with better sizing
    const minDimension = Math.min(displayWidth, displayHeight);
    const cropSize = Math.min(minDimension * 0.6, 250); // 60% of smaller dimension, max 250px
    
    setCrop({
      x: (displayWidth - cropSize) / 2,
      y: (displayHeight - cropSize) / 2,
      width: cropSize,
      height: cropSize,
    });
  }, []);

  // Mouse event handlers for crop area
  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'move' | 'resize') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (type === 'move') {
      setIsDragging(true);
    } else {
      setIsResizing(true);
    }
    
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging && !isResizing) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    setCrop(prevCrop => {
      if (isDragging) {
        // Move the crop area - ensure it stays within image bounds
        const newX = Math.max(0, Math.min(imageDisplaySize.width - prevCrop.width, prevCrop.x + deltaX));
        const newY = Math.max(0, Math.min(imageDisplaySize.height - prevCrop.height, prevCrop.y + deltaY));
        return { ...prevCrop, x: newX, y: newY };
      } else if (isResizing) {
        // Resize the crop area (maintain square aspect ratio)
        const delta = Math.max(deltaX, deltaY);
        const maxWidth = imageDisplaySize.width - prevCrop.x;
        const maxHeight = imageDisplaySize.height - prevCrop.y;
        const maxSize = Math.min(maxWidth, maxHeight);
        const newSize = Math.max(50, Math.min(maxSize, prevCrop.width + delta));
        return { ...prevCrop, width: newSize, height: newSize };
      }
      return prevCrop;
    });
    
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, isResizing, dragStart, imageDisplaySize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const getCroppedCanvas = useCallback((): HTMLCanvasElement | null => {
    if (!imgRef.current || !imageLoaded) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Calculate scale factors between displayed image and natural image
    const scaleX = imageNaturalSize.width / imageDisplaySize.width;
    const scaleY = imageNaturalSize.height / imageDisplaySize.height;

    // Calculate source coordinates in the original image
    const sourceX = crop.x * scaleX;
    const sourceY = crop.y * scaleY;
    const sourceWidth = crop.width * scaleX;
    const sourceHeight = crop.height * scaleY;

    // Set output size (maintain square aspect ratio, max 1024px)
    const outputSize = Math.min(1024, Math.max(sourceWidth, sourceHeight));
    canvas.width = outputSize;
    canvas.height = outputSize;

    // Configure high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outputSize, outputSize);

    // Draw the cropped image exactly as selected
    ctx.drawImage(
      imgRef.current,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      outputSize,
      outputSize
    );

    return canvas;
  }, [crop, imageNaturalSize, imageDisplaySize, imageLoaded]);

  const handleCropComplete = async () => {
    if (!imageLoaded || crop.width === 0 || crop.height === 0) {
      setError("Please select a crop area");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const canvas = getCroppedCanvas();
      if (!canvas) {
        throw new Error("Failed to create canvas");
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        }, "image/jpeg", 0.92);
      });

      let file = new File([blob], "profile-picture.jpg", { type: "image/jpeg" });

      // Compress if larger than 5MB
      if (file.size > 5 * 1024 * 1024) {
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 5,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
          initialQuality: 0.8,
        });
        file = compressedFile;
      }

      onImageReady(file);
    } catch (err) {
      setError("Failed to process image. Please try again.");
      console.error("Error processing image:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Profile Picture</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!imageSrc ? (
            <div className="space-y-4">
              <Label htmlFor="image-upload" className="text-lg font-semibold">
                Select Profile Picture
              </Label>
              
              {/* Hidden file input */}
              <Input
                id="image-upload"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {/* Drag and Drop Zone */}
              <div
                ref={dropZoneRef}
                onClick={handleDropZoneClick}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`
                  relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ease-in-out
                  ${isDragOver 
                    ? 'border-primary bg-primary/5 scale-105' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }
                `}
              >
                <div className="flex flex-col items-center space-y-6">
                  {/* Icon */}
                  <div className={`
                    p-6 rounded-full transition-all duration-300
                    ${isDragOver 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                    }
                  `}>
                    {isDragOver ? (
                      <Upload className="w-12 h-12" />
                    ) : (
                      <ImageIcon className="w-12 h-12" />
                    )}
                  </div>
                  
                  {/* Main text */}
                  <div className="space-y-2">
                    <h3 className={`text-xl font-semibold transition-colors ${
                      isDragOver ? 'text-primary' : 'text-foreground'
                    }`}>
                      {isDragOver ? 'Drop your image here' : 'Upload Profile Picture'}
                    </h3>
                    
                    <p className="text-muted-foreground">
                      {isDragOver 
                        ? 'Release to upload your image' 
                        : 'Drag and drop an image here, or click to browse'
                      }
                    </p>
                  </div>
                  
                  {/* Upload button */}
                  {!isDragOver && (
                    <Button variant="outline" className="mt-4" type="button">
                      <Camera className="w-4 h-4 mr-2" />
                      Choose Image
                    </Button>
                  )}
                  
                  {/* File requirements */}
                  <div className="text-xs text-muted-foreground space-y-1 max-w-md">
                    <p>Supported formats: JPG, PNG, GIF, WebP</p>
                    <p>Maximum file size: 20MB</p>
                    <p>Recommended: Square images for best results</p>
                  </div>
                </div>
                
                {/* Overlay for drag state */}
                {isDragOver && (
                  <div className="absolute inset-0 bg-primary/5 rounded-xl border-2 border-primary animate-pulse" />
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Crop Image to Square</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setImageSrc("");
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Choose Different Image
                </Button>
              </div>
              
              <div className="w-full max-w-4xl mx-auto">
                <div 
                  ref={containerRef}
                  className="relative bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center"
                  style={{ 
                    minHeight: '300px',
                    maxHeight: '600px'
                  }}
                >
                  <div className="relative" style={{ 
                    width: imageLoaded ? `${imageDisplaySize.width}px` : 'auto',
                    height: imageLoaded ? `${imageDisplaySize.height}px` : 'auto'
                  }}>
                    <img
                      ref={imgRef}
                      src={imageSrc}
                      alt="Crop preview"
                      onLoad={onImageLoad}
                      style={{
                        width: imageLoaded ? `${imageDisplaySize.width}px` : 'auto',
                        height: imageLoaded ? `${imageDisplaySize.height}px` : 'auto',
                        maxWidth: '800px',
                        maxHeight: '500px',
                        objectFit: 'contain',
                        display: 'block',
                        pointerEvents: 'none'
                      }}
                    />
                    
                    {imageLoaded && (
                      <div
                        ref={cropRef}
                        className="absolute border-2 border-blue-500 bg-black bg-opacity-20 cursor-move"
                        style={{
                          left: crop.x,
                          top: crop.y,
                          width: crop.width,
                          height: crop.height,
                        }}
                        onMouseDown={(e) => handleMouseDown(e, 'move')}
                      >
                        {/* Corner resize handle */}
                        <div
                          className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize border border-white"
                          style={{ transform: 'translate(50%, 50%)' }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleMouseDown(e, 'resize');
                          }}
                        />
                        
                        {/* Circular preview overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div 
                            className="border-2 border-white rounded-full bg-transparent"
                            style={{
                              width: crop.width,
                              height: crop.height,
                              boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.3)',
                            }}
                          />
                        </div>
                        
                        {/* Move icon in center */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <Move className="w-4 h-4 text-white drop-shadow-lg" />
                        </div>
                        
                        {/* Crop guides */}
                        <div className="absolute inset-0 border border-white opacity-20">
                          <div className="absolute top-1/3 left-0 right-0 border-t border-white"></div>
                          <div className="absolute top-2/3 left-0 right-0 border-t border-white"></div>
                          <div className="absolute left-1/3 top-0 bottom-0 border-l border-white"></div>
                          <div className="absolute left-2/3 top-0 bottom-0 border-l border-white"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Drag to move the crop area. Drag the bottom-right corner to resize. The selected area will be cropped to a perfect square.
                </p>
                <p className="text-xs text-muted-foreground">
                  Selected area: {Math.round(crop.width)} × {Math.round(crop.height)} pixels
                </p>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isUploading || isProcessing}>
            Cancel
          </Button>
          {imageSrc && (
            <Button 
              onClick={handleCropComplete} 
              disabled={!imageLoaded || crop.width === 0 || crop.height === 0 || isUploading || isProcessing}
              className="min-w-[140px]"
            >
              {isUploading || isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isProcessing ? "Processing..." : "Uploading..."}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Picture
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
