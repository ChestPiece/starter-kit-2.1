"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  CircleUserRoundIcon,
  XIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import Image from "next/image";

import { useFileUpload } from "@/hooks/use-file-upload";
import { Button } from "@/components/ui/button";
import {
  Cropper,
  CropperCropArea,
  CropperDescription,
  CropperImage,
} from "@/components/ui/cropper";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Area, getCroppedImg } from "@/utils/image-crop";

export interface AvatarCropperProps {
  profileImage?: string;
  onImageChange: (file: File | null) => Promise<void>;
  isUploading?: boolean;
  size?: "sm" | "md" | "lg";
  shape?: "circle" | "square" | "horizontal";
  aspectRatio?: number;
}

export function AvatarCropper({
  profileImage,
  onImageChange,
  isUploading = false,
  size = "md",
  shape = "circle",
  aspectRatio,
}: AvatarCropperProps) {
  const [
    { files, isDragging },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
    },
  ] = useFileUpload({
    accept: "image/*",
  });

  const previewUrl = files[0]?.preview || null;
  const fileId = files[0]?.id;

  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(
    profileImage || null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [cropData, setCropData] = useState<Area | null>(null);
  const [zoom, setZoom] = useState(1);

  // Ref to track the previous file ID to detect new uploads
  const previousFileIdRef = useRef<string | undefined | null>(null);

  // Set size class based on size prop
  const sizeClass =
    shape === "horizontal"
      ? size === "sm"
        ? "w-20 h-12"
        : size === "lg"
          ? "w-32 h-20"
          : "w-24 h-16"
      : size === "sm"
        ? "size-12"
        : size === "lg"
          ? "size-24"
          : "size-20";
  const iconSize =
    size === "sm" ? "size-4" : size === "lg" ? "size-8" : "size-6";
  const removeButtonSize =
    size === "sm" ? "size-5" : size === "lg" ? "size-7" : "size-6";
  const removeIconSize =
    size === "sm" ? "size-3" : size === "lg" ? "size-4" : "size-3.5";
  const shapeClass =
    shape === "square"
      ? "rounded-lg"
      : shape === "horizontal"
        ? "rounded-lg"
        : "rounded-full";

  // Calculate aspect ratio based on shape if not provided
  const cropAspectRatio = aspectRatio || (shape === "horizontal" ? 4 / 1 : 1); // 4:1 for horizontal, 1:1 for square and circle

  const handleApply = async () => {
    if (!previewUrl || !fileId || !cropData) {
      return;
    }

    try {
      // Get the original file type from the preview URL
      const originalFile = files[0]?.file;
      const isPngFormat =
        originalFile?.type === "image/png" ||
        previewUrl.toLowerCase().includes(".png") ||
        previewUrl.toLowerCase().includes("image/png");

      // Get the cropped image blob
      const croppedBlob = await getCroppedImg(previewUrl, cropData);

      if (!croppedBlob) {
        throw new Error("Failed to generate cropped image blob.");
      }

      // Use PNG format for all images to preserve transparency
      const fileName = `avatar-image.png`;
      const fileType = "image/png";

      // Convert blob to file with proper extension
      const file = new File([croppedBlob], fileName, {
        type: fileType,
      });

      // Update the local preview immediately
      const objectUrl = URL.createObjectURL(croppedBlob);
      setFinalImageUrl(objectUrl);

      // Send the file to the parent component
      await onImageChange(file);

      // Close the dialog and reset
      setIsDialogOpen(false);
      setCropData(null);
      setZoom(1);
    } catch (error) {
      console.error("Error during apply:", error);
    }
  };

  const handleRemoveFinalImage = async () => {
    if (finalImageUrl) {
      // Cleanup any local blob URLs
      if (finalImageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(finalImageUrl);
      }
      setFinalImageUrl(null);
      await onImageChange(null);
    }
  };

  // Effect to open dialog when a new file is ready
  useEffect(() => {
    // Check if fileId exists and is different from the previous one
    if (fileId && fileId !== previousFileIdRef.current) {
      setIsDialogOpen(true); // Open dialog for the new file
      setCropData(null); // Reset crop area for the new file
      setZoom(1); // Reset zoom for the new file
    }
    // Update the ref to the current fileId for the next render
    previousFileIdRef.current = fileId;
  }, [fileId]);

  // Set initial image if profile is provided
  useEffect(() => {
    if (profileImage && !finalImageUrl) {
      setFinalImageUrl(profileImage);
    }
  }, [profileImage, finalImageUrl]);

  // Cleanup effect for blob URLs
  useEffect(() => {
    return () => {
      if (finalImageUrl && finalImageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(finalImageUrl);
      }
    };
  }, [finalImageUrl]);

  return (
    <div className="relative inline-flex">
      {/* Drop area - uses finalImageUrl */}
      <button
        className={`relative flex ${sizeClass} items-center justify-center overflow-hidden ${shapeClass} border border-input bg-background hover:bg-accent/50 data-[dragging=true]:bg-accent/50`}
        onClick={openFileDialog}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        data-dragging={isDragging || undefined}
        aria-label={finalImageUrl ? "Change image" : "Upload image"}
        type="button"
      >
        {finalImageUrl ? (
          <Image
            className={`size-full ${shape === "horizontal" ? "object-contain" : "object-cover"}`}
            src={finalImageUrl}
            alt="Avatar"
            width={80}
            height={80}
          />
        ) : (
          <div aria-hidden="true">
            <CircleUserRoundIcon className={`${iconSize} opacity-60`} />
          </div>
        )}
      </button>
      {/* Remove button - depends on finalImageUrl */}
      {finalImageUrl && (
        <Button
          onClick={handleRemoveFinalImage}
          size="icon"
          className={`absolute -top-1 -right-1 ${removeButtonSize} rounded-full border-2 border-background shadow-none focus-visible:border-background`}
          aria-label="Remove image"
          type="button"
        >
          <XIcon className={removeIconSize} />
        </Button>
      )}
      <input
        {...getInputProps()}
        className="sr-only"
        aria-label="Upload image file"
        tabIndex={-1}
      />

      {/* Cropper Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="gap-0 p-0 sm:max-w-lg overflow-hidden">
          <DialogDescription className="sr-only">
            Crop image dialog
          </DialogDescription>
          <DialogHeader className="contents space-y-0 text-left">
            <DialogTitle className="flex items-center border-b p-4 text-base">
              <span>Crop image</span>
            </DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <Cropper
              className="h-96"
              image={previewUrl}
              aspectRatio={cropAspectRatio}
              zoom={zoom}
              onCropChange={setCropData}
              onZoomChange={setZoom}
            >
              <CropperDescription />
              <CropperImage />
              <CropperCropArea />
            </Cropper>
          )}
          <DialogFooter className="border-t px-4 py-6">
            <div className="flex flex-col gap-4 w-full">
              {/* Zoom Controls */}
              <div className="mx-auto flex w-full max-w-80 items-center gap-4">
                <ZoomOutIcon
                  className="shrink-0 opacity-60"
                  size={16}
                  aria-hidden="true"
                />
                <Slider
                  defaultValue={[1]}
                  value={[zoom]}
                  min={0.1}
                  max={3}
                  step={0.1}
                  onValueChange={(value) => setZoom(value[0])}
                  aria-label="Zoom slider"
                />
                <ZoomInIcon
                  className="shrink-0 opacity-60"
                  size={16}
                  aria-hidden="true"
                />
              </div>
              {/* Apply Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleApply}
                  disabled={!previewUrl || isUploading}
                  className="min-w-24"
                >
                  {isUploading ? "Processing..." : "Apply"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
