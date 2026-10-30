'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Camera, Upload, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onUpload: (url: string) => void;
  type: 'logo' | 'cover';
  tenantId: string;
}

export function ImageUpload({ currentImageUrl, onUpload, type, tenantId }: ImageUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    // Mostrar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error('Selecione uma imagem primeiro');
      return;
    }

    setUploading(true);

    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${tenantId}/${type}-${Date.now()}.${fileExt}`;
      const filePath = `tenant-images/${fileName}`;

      // Upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('diagnostics')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Erro ao fazer upload da imagem');
        return;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('diagnostics')
        .getPublicUrl(filePath);

      // Atualizar tenant no banco
      const updateField = type === 'logo' ? 'logo_url' : 'cover_url';
      const { error: updateError } = await supabase
        .from('tenants')
        .update({ [updateField]: publicUrl })
        .eq('id', tenantId);

      if (updateError) {
        console.error('Update error:', updateError);
        toast.error('Erro ao salvar imagem');
        return;
      }

      toast.success(type === 'logo' ? 'Logo atualizado!' : 'Capa atualizada!');
      onUpload(publicUrl);
      setIsOpen(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao processar imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    try {
      const updateField = type === 'logo' ? 'logo_url' : 'cover_url';
      const { error } = await supabase
        .from('tenants')
        .update({ [updateField]: null })
        .eq('id', tenantId);

      if (error) {
        toast.error('Erro ao remover imagem');
        return;
      }

      toast.success('Imagem removida!');
      setPreview(null);
      onUpload('');
      setIsOpen(false);
    } catch (error) {
      toast.error('Erro ao remover imagem');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-all group rounded-full overflow-hidden"
      >
        <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {type === 'logo' ? 'Alterar Logo' : 'Alterar Imagem de Capa'}
            </DialogTitle>
            <DialogDescription>
              {type === 'logo' 
                ? 'Faça upload de uma imagem para o logo da sua empresa'
                : 'Faça upload de uma imagem para a capa do seu painel'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preview */}
            <div className={`relative border-2 border-dashed rounded-lg overflow-hidden ${
              type === 'logo' ? 'aspect-square max-w-[200px] mx-auto' : 'aspect-[3/1]'
            }`}>
              {preview ? (
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-background">
                  <Upload className="h-8 w-8 mb-2" />
                  <span className="text-sm">Clique para selecionar</span>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Formatos aceitos: JPG, PNG, GIF. Máximo 5MB.
            </p>

            {/* Ações */}
            <div className="flex gap-2 justify-end">
              {currentImageUrl && (
                <Button
                  variant="outline"
                  onClick={handleRemove}
                  disabled={uploading}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              )}
              <Button
                onClick={handleUpload}
                disabled={uploading || !preview}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
