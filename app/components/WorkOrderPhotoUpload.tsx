// app/components/WorkOrderPhotoUpload.tsx

'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useWorkOrderPhotos, useUploadWorkOrderPhoto, useDeleteWorkOrderPhoto } from '@/hooks/useWorkOrders';
import { Upload, Trash2, Loader2 } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { toast } from '@/lib/toast';

interface WorkOrderPhotoUploadProps {
 workOrderId: string;
}

export function WorkOrderPhotoUpload({ workOrderId }: WorkOrderPhotoUploadProps) {
 const { data: photos, isLoading: isLoadingPhotos } = useWorkOrderPhotos(workOrderId);
 const uploadPhoto = useUploadWorkOrderPhoto(workOrderId);
 const deletePhoto = useDeleteWorkOrderPhoto(workOrderId);
 const { isAdmin } = useAdmin();
 const [uploading, setUploading] = useState(false);

 const onDrop = useCallback(async (acceptedFiles: File[]) => {
  setUploading(true);
  try {
   for (const file of acceptedFiles) {
    await uploadPhoto.mutateAsync(file);
   }
  } catch (error) {
   // Error handling is done in the hook via toast
  } finally {
   setUploading(false);
  }
 }, [uploadPhoto]);

 const { getRootProps, getInputProps, isDragActive } = useDropzone({
  onDrop,
  accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
  maxSize: 50 * 1024 * 1024, // 50MB
 });

 const handleDelete = async (photoId: string) => {
  if (window.confirm('Är du säker på att du vill ta bort fotot?')) {
   try {
    await deletePhoto.mutateAsync(photoId);
   } catch (error) {
    // Error handling is done in the hook
   }
  }
 };
 
 return (
  <div className="space-y-4">
   <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Foton</h3>
   
   {/* Dropzone (Desktop) + Click-to-upload (Mobile) */}
   <div 
    {...getRootProps()} 
    className={`relative p-6 border-2 border-dashed rounded-lg text-center cursor-pointer
          ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'}
         `}
   >
    <input {...getInputProps()} />
    <div className="flex flex-col items-center justify-center min-h-[44px]">
     {uploading ? (
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
     ) : (
      <>
       <Upload className="w-8 h-8 text-gray-400" />
       <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        <span className="font-semibold text-blue-600 dark:text-blue-400">Dra och släpp</span> bilder här, eller klicka för att välja
       </p>
       <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">PNG, JPG, WEBP upp till 50MB</p>
      </>
     )}
    </div>
   </div>
   
   {/* Foto-galleri */}
   {isLoadingPhotos && <p className="dark:text-gray-300">Laddar foton...</p>}
   {photos && photos.length > 0 && (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
     {photos.map((photo) => (
      <div key={photo.id} className="relative group">
       <img 
        src={photo.thumbnail_url || photo.url || ''} 
        alt="Arbetsorderfoto"
        className="w-full h-32 object-cover rounded-lg shadow-md"
       />
       {(isAdmin || photo.uploaded_by) && (
        <button
         onClick={() => handleDelete(photo.id)}
         disabled={deletePhoto.isPending}
         className="absolute top-1 right-1 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
         aria-label="Ta bort foto"
        >
         <Trash2 className="w-4 h-4" />
        </button>
       )}
      </div>
     ))}
    </div>
   )}
   {!isLoadingPhotos && (!photos || photos.length === 0) && (
    <p className="text-gray-500 dark:text-gray-400 text-center py-4">Inga foton ännu</p>
   )}
  </div>
 );
}
