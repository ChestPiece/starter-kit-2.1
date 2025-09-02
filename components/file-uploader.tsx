"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, X, FileText } from "lucide-react"
import { saveFile } from "@/supabase/actions/save-file"

export function FileUploader({ 
  value, 
  onChange, 
  accept = "*", 
  bucket = "files",
  isLoading = false,
  setIsLoading
}: { 
  value: any; 
  onChange: (fileOrUrl: File | string | null) => void; 
  accept?: string;
  bucket?: string;
  isLoading?: boolean;
  setIsLoading?: (isLoading: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState(value ? (typeof value === "string" ? value : value.name) : "")
  const [isUploading, setIsUploading] = useState(false)

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Set both local and parent component loading states
      setIsUploading(true)
      setIsLoading?.(true)

      setFileName(file.name)
      const fileUrl = await saveFile(file)
      
      // Reset loading states after upload
      setIsUploading(false)
      setIsLoading?.(false)

      if (fileUrl) {
        onChange(fileUrl)
      } else {
        onChange(null)
        setFileName("")
      }
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFileName("")
    onChange(null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  return (
    <div>
      <Input 
        ref={inputRef} 
        type="file" 
        accept={accept} 
        onChange={handleChange} 
        className="hidden" 
        disabled={isUploading}
      />

      {!fileName ? (
        <div
          onClick={handleClick}
          className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors dark:border-muted"
        >
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium">
            {isUploading ? "Uploading..." : "Click to upload or drag and drop"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {accept === ".pdf,.jpg,.jpeg,.png"
              ? "PDF, JPG, or PNG"
              : accept === ".pdf"
                ? "PDF files only"
                : "Accepted file types: " + accept.replace(/\./g, "").toUpperCase()}
          </p>
        </div>
      ) : (
        <div
          onClick={handleClick}
          className="border rounded-md p-4 flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors dark:border-muted"
        >
          <div className="flex items-center">
            <FileText className="h-5 w-5 text-muted-foreground mr-2" />
            <span className="text-sm truncate max-w-[200px]">
              {isUploading ? "Uploading..." : fileName}
            </span>
          </div>
          {!isUploading && (
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              onClick={handleRemove} 
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove file</span>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
