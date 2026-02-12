'use client';

import React, { useState, useEffect } from 'react';
import { getMediaLibrary, MediaItem } from '@/data/media';
import { X, Search, Image as ImageIcon, Check } from 'lucide-react';
import Image from 'next/image';

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export default function MediaPickerModal({ isOpen, onClose, onSelect }: MediaPickerModalProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setMedia(getMediaLibrary());
        setSelectedUrl(null);
        setSearchTerm('');
      }, 0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredMedia = media.filter(item => 
    item.alt.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = () => {
    if (selectedUrl) {
      onSelect(selectedUrl);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-[#83b735]" />
            انتخاب تصویر از کتابخانه
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b bg-gray-50">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              className="w-full pl-4 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#83b735]"
              placeholder="جستجو در تصاویر..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredMedia.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>هیچ تصویری یافت نشد.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredMedia.map(item => (
                <div 
                  key={item.id}
                  onClick={() => setSelectedUrl(item.url)}
                  className={`
                    relative group cursor-pointer border-2 rounded-lg overflow-hidden aspect-square transition-all
                    ${selectedUrl === item.url ? 'border-[#83b735] ring-2 ring-[#83b735] ring-opacity-50' : 'border-transparent hover:border-gray-300'}
                  `}
                >
                  <Image 
                    src={item.url} 
                    alt={item.alt} 
                    fill 
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 20vw"
                  />
                  {selectedUrl === item.url && (
                    <div className="absolute inset-0 bg-[#83b735] bg-opacity-20 flex items-center justify-center">
                      <div className="bg-[#83b735] text-white rounded-full p-1">
                        <Check className="w-6 h-6" />
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.filename}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            انصراف
          </button>
          <button 
            onClick={handleSelect}
            disabled={!selectedUrl}
            className="bg-[#83b735] text-white px-6 py-2 rounded-lg hover:bg-[#6ea025] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            انتخاب تصویر
          </button>
        </div>

      </div>
    </div>
  );
}
