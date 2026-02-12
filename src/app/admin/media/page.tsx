
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  getMediaLibrary, 
  addMediaItem, 
  updateMediaItem, 
  deleteMediaItem, 
  deleteMediaItems,
  MediaItem 
} from '@/data/media';
import { compressImage } from '@/utils/imageCompression';
import { 
  Upload, 
  Trash2, 
  Edit, 
  Link as LinkIcon, 
  Search, 
  X, 
  Check, 
  Image as ImageIcon,
  Loader2,
  CheckSquare,
  Square
} from 'lucide-react';
import Image from 'next/image';

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Edit Modal State
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [editForm, setEditForm] = useState({ alt: '', title: '' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      setMedia(getMediaLibrary());
      setLoading(false);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    
    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // 1. Compress
        const compressedFile = await compressImage(file, {
            maxWidthOrHeight: 1200,
            quality: 0.8,
            maxSizeMB: 0.5
        });

        // 2. Upload to API
        const formData = new FormData();
        formData.append('file', compressedFile);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        
        if (data.success) {
           // 3. Get image dimensions (for metadata)
           const img = document.createElement('img');
           img.src = URL.createObjectURL(compressedFile);
           await new Promise((resolve) => {
               img.onload = () => {
                   // 4. Add to local storage library
                   const newItem: MediaItem = {
                       id: Date.now().toString() + Math.random().toString().slice(2, 6),
                       url: data.url,
                       filename: data.filename,
                       alt: file.name.split('.')[0], // Default alt
                       title: file.name.split('.')[0], // Default title
                       size: compressedFile.size,
                       width: img.width,
                       height: img.height,
                       createdAt: Date.now()
                   };
                   addMediaItem(newItem);
                   resolve(null);
               };
           });
        } else {
            alert(`خطا در آپلود فایل ${file.name}: ${data.message}`);
        }

      } catch (error) {
        console.error('Upload failed', error);
        alert(`خطا در آپلود فایل ${file.name}`);
      }
    }

    setMedia(getMediaLibrary());
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (id: string, filename: string) => {
    if (!confirm('آیا از حذف این تصویر مطمئن هستید؟ این عملیات غیرقابل بازگشت است.')) return;

    try {
      const res = await fetch('/api/media/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename })
      });
      
      const data = await res.json();
      if (data.success) {
          deleteMediaItem(id);
          setMedia(getMediaLibrary());
          // Remove from selection if it was selected
          if (selectedIds.has(id)) {
            const newSelected = new Set(selectedIds);
            newSelected.delete(id);
            setSelectedIds(newSelected);
          }
      } else {
          alert('خطا در حذف فایل: ' + data.message);
      }
    } catch {
        alert('خطا در ارتباط با سرور');
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
        newSelected.delete(id);
    } else {
        newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const filteredMedia = media.filter(item => 
    item.alt.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectedIds.size === filteredMedia.length && filteredMedia.length > 0) {
        setSelectedIds(new Set());
    } else {
        setSelectedIds(new Set(filteredMedia.map(m => m.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`آیا از حذف ${selectedIds.size} تصویر انتخاب شده مطمئن هستید؟ این عملیات غیرقابل بازگشت است.`)) return;

    setLoading(true); // Show generic loading state or specific deleting state
    const itemsToDelete = media.filter(m => selectedIds.has(m.id));
    
    let successCount = 0;
    const errors = [];

    // Process deletions sequentially to avoid overwhelming server/network
    // Could use Promise.all for parallel if server handles it well
    for (const item of itemsToDelete) {
        try {
            const res = await fetch('/api/media/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: item.filename })
            });
            const data = await res.json();
            if (data.success) {
                successCount++;
            } else {
                errors.push(`${item.filename}: ${data.message}`);
            }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Unknown error';
            errors.push(`${item.filename}: ${msg}`);
        }
    }

    // Update local storage for all successfully deleted (or all selected if we assume force delete from DB)
    // Here we only remove those that were likely deleted or if we want to be safe, we remove all selected from UI 
    // assuming if file delete fails we might still want to remove record or keep it?
    // Let's remove only selected ones.
    
    deleteMediaItems(Array.from(selectedIds));
    setMedia(getMediaLibrary());
    setSelectedIds(new Set());
    setLoading(false);

    if (errors.length > 0) {
        alert(`${successCount} تصویر حذف شد. خطا در حذف ${errors.length} تصویر:\n${errors.join('\n')}`);
    } else {
        // alert(`${successCount} تصویر با موفقیت حذف شدند.`);
    }
  };

  const openEditModal = (item: MediaItem) => {
      setEditingItem(item);
      setEditForm({ alt: item.alt || '', title: item.title || '' });
  };

  const saveEdit = () => {
      if (!editingItem) return;
      updateMediaItem(editingItem.id, editForm);
      setMedia(getMediaLibrary());
      setEditingItem(null);
  };

  const copyLink = (url: string) => {
      const fullUrl = window.location.origin + url;
      navigator.clipboard.writeText(fullUrl);
      alert('لینک تصویر کپی شد');
  };

  const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <ImageIcon className="w-8 h-8 text-[#83b735]" />
              کتابخانه رسانه
            </h1>
            <p className="text-gray-500 mt-1">مدیریت تصاویر و فایل‌های آپلود شده</p>
          </div>
          
          <div className="flex gap-3 items-center">
             {selectedIds.size > 0 && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 mr-2">
                    <span className="text-sm text-gray-600 ml-2">
                        {selectedIds.size} مورد انتخاب شده
                    </span>
                    <button 
                        onClick={handleBulkDelete}
                        className="bg-red-50 text-red-600 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-100 flex items-center gap-2 transition-colors text-sm"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>حذف گروهی</span>
                    </button>
                    <button 
                        onClick={() => setSelectedIds(new Set())}
                        className="text-gray-500 hover:text-gray-700 p-2"
                        title="لغو انتخاب"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
             )}

             <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                    className="pl-4 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#83b735] w-full md:w-64"
                    placeholder="جستجو..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
             <button 
                onClick={handleUploadClick}
                disabled={uploading}
                className="bg-[#83b735] text-white px-4 py-2 rounded-lg hover:bg-[#6ea025] flex items-center gap-2 transition-colors disabled:opacity-50"
             >
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                <span>آپلود تصویر</span>
             </button>
             <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                multiple 
                onChange={handleFileChange}
             />
          </div>
        </div>

        {/* Toolbar / Select All */}
        {media.length > 0 && (
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleSelectAll}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#83b735]"
                    >
                        {selectedIds.size === filteredMedia.length && filteredMedia.length > 0 ? (
                            <CheckSquare className="w-5 h-5 text-[#83b735]" />
                        ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                        )}
                        انتخاب همه
                    </button>
                </div>
                <div className="text-sm text-gray-500">
                    نمایش {filteredMedia.length} فایل
                </div>
            </div>
        )}

        {/* Gallery Grid */}
        {media.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">هنوز تصویری آپلود نکرده‌اید</h3>
                <p className="text-gray-500 mb-6">اولین تصویر خود را آپلود کنید تا در اینجا نمایش داده شود.</p>
                <button 
                    onClick={handleUploadClick}
                    className="text-[#83b735] font-medium hover:underline"
                >
                    آپلود تصویر جدید
                </button>
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-20">
                {filteredMedia.map(item => {
                    const isSelected = selectedIds.has(item.id);
                    return (
                        <div 
                            key={item.id} 
                            className={`group bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col relative ${isSelected ? 'ring-2 ring-[#83b735] shadow-md' : ''}`}
                        >
                            <div className="relative aspect-square bg-gray-100 overflow-hidden cursor-pointer" onClick={() => openEditModal(item)}>
                                <Image 
                                    src={item.url} 
                                    alt={item.alt} 
                                    fill 
                                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                                    className={`object-cover transition-transform duration-500 group-hover:scale-105 ${isSelected ? 'opacity-90' : ''}`} 
                                />
                                
                                {/* Selection Checkbox */}
                                <div 
                                    className={`absolute top-2 right-2 z-10 transition-opacity ${isSelected || selectedIds.size > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                    onClick={(e) => { e.stopPropagation(); toggleSelection(item.id); }}
                                >
                                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-[#83b735] border-[#83b735]' : 'bg-white/80 border-gray-400 hover:border-[#83b735]'}`}>
                                        {isSelected && <Check className="w-4 h-4 text-white" />}
                                    </div>
                                </div>

                                <div className={`absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 ${isSelected ? 'hidden' : ''}`}>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); copyLink(item.url); }}
                                        className="p-2 bg-white rounded-full hover:bg-gray-100 text-gray-700"
                                        title="کپی لینک"
                                    >
                                        <LinkIcon className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); openEditModal(item); }}
                                        className="p-2 bg-white rounded-full hover:bg-gray-100 text-blue-600"
                                        title="ویرایش"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id, item.filename); }}
                                        className="p-2 bg-white rounded-full hover:bg-gray-100 text-red-600"
                                        title="حذف"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-3" onClick={() => toggleSelection(item.id)}>
                                <h3 className="font-medium text-gray-800 text-sm truncate" title={item.title || item.filename}>{item.title || item.filename}</h3>
                                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                                    <span>{formatBytes(item.size)}</span>
                                    <span>{item.width}x{item.height}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}

        {/* Edit Modal */}
        {editingItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setEditingItem(null)}>
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-gray-800">جزئیات تصویر</h3>
                        <button onClick={() => setEditingItem(null)} className="text-gray-500 hover:text-gray-700">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="p-6 flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-1/2">
                            <div className="relative aspect-square rounded-lg overflow-hidden border bg-gray-50">
                                <Image 
                                    src={editingItem.url} 
                                    alt={editingItem.alt} 
                                    fill 
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    className="object-contain" 
                                />
                            </div>
                            <div className="mt-4 space-y-2 text-sm text-gray-600">
                                <div className="flex justify-between border-b pb-2">
                                    <span>نام فایل:</span>
                                    <span className="font-mono text-xs" title={editingItem.filename}>{editingItem.filename.length > 20 ? editingItem.filename.substring(0, 20) + '...' : editingItem.filename}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span>نوع:</span>
                                    <span>{editingItem.filename.split('.').pop()?.toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span>ابعاد:</span>
                                    <span dir="ltr">{editingItem.width} x {editingItem.height}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span>حجم:</span>
                                    <span dir="ltr">{formatBytes(editingItem.size)}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span>تاریخ آپلود:</span>
                                    <span>{new Date(editingItem.createdAt).toLocaleDateString('fa-IR')}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="w-full md:w-1/2 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">عنوان (Title)</label>
                                <input 
                                    value={editForm.title}
                                    onChange={e => setEditForm({...editForm, title: e.target.value})}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#83b735] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">متن جایگزین (Alt Text)</label>
                                <input 
                                    value={editForm.alt}
                                    onChange={e => setEditForm({...editForm, alt: e.target.value})}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#83b735] focus:outline-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">متن جایگزین برای سئو و دسترس‌پذیری مهم است.</p>
                            </div>

                            <div className="pt-4 flex flex-col gap-3">
                                <button 
                                    onClick={saveEdit}
                                    className="w-full bg-[#83b735] text-white py-2 rounded-lg hover:bg-[#6ea025] transition-colors"
                                >
                                    ذخیره تغییرات
                                </button>
                                <button 
                                    onClick={() => copyLink(editingItem.url)}
                                    className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <LinkIcon className="w-4 h-4" />
                                    کپی لینک تصویر
                                </button>
                                <button 
                                    onClick={() => { handleDelete(editingItem.id, editingItem.filename); setEditingItem(null); }}
                                    className="w-full border border-red-200 text-red-600 py-2 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    حذف تصویر
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
