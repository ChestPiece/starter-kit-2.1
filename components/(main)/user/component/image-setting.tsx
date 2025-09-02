import { useFileUpload } from "@/hooks/use-file-upload";
import { useState, useRef } from "react";
import { User } from "lucide-react";
import Image from "next/image";
import { XIcon, ImagePlusIcon } from "lucide-react";
import { saveFile } from "@/supabase/actions/save-file";

export function ProfileBg({ initialBgImage }: { initialBgImage: any }) {
  const [{ files }, { removeFile, openFileDialog, getInputProps }] =
    useFileUpload({
      accept: "image/*",
      initialFiles: initialBgImage ? initialBgImage : [],
      maxFiles: 1,
    });

  const currentImage = files[0]?.preview || initialBgImage[0].url;

  return (
    <div className="h-32 relative">
      <div className="bg-muted relative flex size-full items-center justify-center overflow-hidden">
        <Image
          className="size-full object-cover"
          src={currentImage || "/images/profile.jpg"}
          alt={
            currentImage ? "Profile background" : "Default profile background"
          }
          width={512}
          height={96}
        />

        <div className="absolute inset-0 flex items-center justify-center gap-2">
          {currentImage && currentImage !== initialBgImage[0].url && (
            <button
              type="button"
              className="focus-visible:border-ring focus-visible:ring-ring/50 z-50 flex size-10 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:ring-[3px]"
              onClick={() => removeFile(files[0]?.id)}
              aria-label="Remove image"
            >
              <XIcon size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      <input
        {...getInputProps()}
        className="sr-only"
        aria-label="Upload image file"
      />
    </div>
  );
}

export function Avatar({
  avatar,
  setAvatar,
  isFileLoading,
  setIsFileLoading,
  profile,
  setProfile,
  initialAvatarImage,
}: {
  avatar: string;
  setAvatar: (value: string) => void;
  isFileLoading: boolean;
  setIsFileLoading: (value: boolean) => void;
  profile: string;
  setProfile: (value: string) => void;
  initialAvatarImage: any;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [
    { files },
    { removeFile, openFileDialog: radixOpenFileDialog, getInputProps },
  ] = useFileUpload({
    accept: "image/*",
    initialFiles: initialAvatarImage,
    maxFiles: 1,
  });

  const currentImage = files[0]?.preview || initialAvatarImage[0].url;

  const handleChange = async (file: File) => {
    setIsUploading(true);
    if (file) {
      const fileUrl = await saveFile(file);
      if (fileUrl) {
        setAvatar(fileUrl);
        setProfile(fileUrl);
      } else {
        setAvatar("");
        setProfile("");
      }
    }
    setIsUploading(false);
  };

  return (
    <div className="mt-3 ">
      <div className="border-background bg-muted relative flex size-20 items-center justify-center overflow-hidden rounded-full border-4 shadow-xs shadow-black/10">
        {profile ? (
          <Image
            src={profile || "/images/profile.jpg"}
            className="size-full object-cover"
            width={80}
            height={80}
            alt="Profile image"
          />
        ) : (
          <User className="size-full object-cover" />
        )}
        <button
          type="button"
          className="focus-visible:border-ring focus-visible:ring-ring/50 absolute flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:ring-[3px]"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Change profile picture"
        >
          <ImagePlusIcon size={16} aria-hidden="true" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleChange(file);
              setIsFileLoading(true);
            }
          }}
          hidden
        />
      </div>
      <span className="text-left block text-sm text-muted-foreground mt-1">
        {isUploading ? "Uploading..." : ""}
      </span>
    </div>
  );
}
