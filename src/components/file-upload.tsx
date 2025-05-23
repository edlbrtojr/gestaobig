"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  onFileSelected: (file: File, dataUrl: string) => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
  previewUrl?: string;
  label?: string;
}

export function FileUpload({
  onFileSelected,
  accept = "image/*",
  maxSizeMB = 2, // Default max size: 2MB
  className = "",
  previewUrl = "",
  label = "Escolher arquivo"
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>(previewUrl);
  const [isLoading, setIsLoading] = useState(false);

  // Update preview when previewUrl prop changes
  React.useEffect(() => {
    if (previewUrl) {
      setPreview(previewUrl);
    }
  }, [previewUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxSizeMB) {
      toast.error(`Arquivo muito grande (${fileSizeInMB.toFixed(2)}MB). Limite: ${maxSizeMB}MB`);
      return;
    }

    // Preview the file
    setIsLoading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreview(result);
      onFileSelected(file, result);
      setIsLoading(false);
    };

    reader.onerror = () => {
      toast.error("Erro ao ler o arquivo");
      setIsLoading(false);
    };

    reader.readAsDataURL(file);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onFileSelected(new File([], ""), "");
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div 
        onClick={openFileDialog}
        className={`
          border-2 border-dashed rounded-md p-4 cursor-pointer
          ${preview ? 'border-border hover:border-primary' : 'border-muted-foreground hover:border-muted-foreground/80'}
          flex flex-col items-center justify-center transition-all
          ${isLoading ? 'opacity-70' : ''}
        `}
        style={{ minHeight: "8rem" }}
      >
        {isLoading ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">Processando...</p>
          </div>
        ) : preview ? (
          <div className="relative w-full">
            <div className="flex items-center justify-center">
              <img 
                src={preview} 
                alt="Preview" 
                className="max-h-32 object-contain mx-auto"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWFsZXJ0LWNpcmNsZSI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiLz48bGluZSB4MT0iMTIiIHkxPSI4IiB4Mj0iMTIiIHkyPSIxMiIvPjxsaW5lIHgxPSIxMiIgeTE9IjE2IiB4Mj0iMTIuMDEiIHkyPSIxNiIvPjwvc3ZnPg==';
                  toast.error("Erro ao carregar imagem");
                }}
              />
              <Button 
                variant="outline" 
                size="icon"
                className="absolute top-0 right-0 rounded-full h-7 w-7 bg-background"
                onClick={clearFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="p-2 rounded-full bg-muted">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">
              Arraste e solte ou clique para selecionar
            </p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
} 