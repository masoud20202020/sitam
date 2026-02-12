'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { getMegaMenu, updateMegaMenuServer, MegaMenuItem, MegaMenuSubCategory } from '@/actions/megaMenu';
import { Plus, Trash2, Save, Edit2, GripVertical, X, Upload } from 'lucide-react';

export default function MegaMenuAdminPage() {
  const [items, setItems] = useState<MegaMenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<MegaMenuItem | null>(null);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [draggedSubIndex, setDraggedSubIndex] = useState<number | null>(null);
  const [draggedLink, setDraggedLink] = useState<{ subId: string, index: number } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const data = await getMegaMenu();
      setItems(data);
    };
    loadData();
  }, []);

  // Main Item Drag Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIndex(index);
    // Firefox requires dataTransfer to be set
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (targetIndex: number) => {
    if (draggedItemIndex === null) return;
    if (draggedItemIndex === targetIndex) return;

    const newItems = [...items];
    const [draggedItem] = newItems.splice(draggedItemIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);
    
    newItems.forEach((item, idx) => item.order = idx + 1);
    
    setDraggedItemIndex(targetIndex);
    setItems(newItems);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedItemIndex(null);
  };

  // SubCategory Drag Handlers
  const handleSubDragStart = (e: React.DragEvent, index: number) => {
    e.stopPropagation(); 
    setDraggedSubIndex(index);
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSubDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleSubDragEnter = (targetIndex: number) => {
      if (draggedSubIndex === null || !editingItem) return;
      if (draggedSubIndex === targetIndex) return;

      const newSubs = [...editingItem.subCategories];
      const [draggedSub] = newSubs.splice(draggedSubIndex, 1);
      newSubs.splice(targetIndex, 0, draggedSub);

      setDraggedSubIndex(targetIndex);
      handleUpdateItem(editingItem.id, { subCategories: newSubs });
  };

  const handleSubDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedSubIndex(null);
  };

  // Link Drag Handlers
  const handleLinkDragStart = (e: React.DragEvent, subId: string, index: number) => {
    e.stopPropagation();
    setDraggedLink({ subId, index });
    // Firefox requires dataTransfer to be set
    e.dataTransfer.effectAllowed = 'move';
    // Set a transparent image or custom drag image if needed, but default is usually fine
    // e.dataTransfer.setDragImage(e.currentTarget, 0, 0); 
  };

  const handleLinkDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleLinkDragEnter = (targetSubId: string, targetIndex: number) => {
      if (!draggedLink || !editingItem || draggedLink.subId !== targetSubId) return;
      if (draggedLink.index === targetIndex) return;

      const subCategory = editingItem.subCategories.find(s => s.id === targetSubId);
      if (!subCategory) return;

      const newLinks = [...subCategory.links];
      const [movedLink] = newLinks.splice(draggedLink.index, 1);
      newLinks.splice(targetIndex, 0, movedLink);

      const newSubs = editingItem.subCategories.map(s => 
          s.id === targetSubId ? { ...s, links: newLinks } : s
      );

      // Update state immediately for smooth reordering
      setDraggedLink({ ...draggedLink, index: targetIndex });
      handleUpdateItem(editingItem.id, { subCategories: newSubs });
  };

  const handleLinkDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDraggedLink(null);
  };

  const handleSave = async () => {
    const result = await updateMegaMenuServer(items);
    if (result.success) {
      alert('تنظیمات مگا منو ذخیره شد');
    } else {
      alert('خطا در ذخیره مگا منو');
    }
  };

  const handleAddItem = () => {
    const newItem: MegaMenuItem = {
      id: Date.now().toString(),
      title: 'منوی جدید',
      href: '#',
      active: true,
      order: items.length + 1,
      subCategories: []
    };
    setItems([...items, newItem]);
    setEditingItem(newItem);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('آیا از حذف این منو اطمینان دارید؟')) {
      const newItems = items.filter(i => i.id !== id);
      setItems(newItems);
      if (editingItem?.id === id) setEditingItem(null);
    }
  };

  const handleUpdateItem = (id: string, patch: Partial<MegaMenuItem>) => {
    setItems(items.map(i => i.id === id ? { ...i, ...patch } : i));
    if (editingItem?.id === id) {
        setEditingItem(prev => prev ? { ...prev, ...patch } : null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingItem) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleUpdateItem(editingItem.id, { icon: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Subcategory Management
  const addSubCategory = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    const newSub: MegaMenuSubCategory = {
      id: String(item.subCategories.length + 1),
      title: 'زیرمجموعه جدید',
      links: []
    };
    
    handleUpdateItem(itemId, { subCategories: [...item.subCategories, newSub] });
  };

  const removeSubCategory = (itemId: string, subId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    handleUpdateItem(itemId, { 
        subCategories: item.subCategories.filter(s => s.id !== subId) 
    });
  };

  const updateSubCategory = (itemId: string, subId: string, title: string) => {
      const item = items.find(i => i.id === itemId);
      if (!item) return;
      const newSubs = item.subCategories.map(s => s.id === subId ? { ...s, title } : s);
      handleUpdateItem(itemId, { subCategories: newSubs });
  };

  // Link Management
  const addLink = (itemId: string, subId: string) => {
      const item = items.find(i => i.id === itemId);
      if (!item) return;
      
      const newSubs = item.subCategories.map(s => {
          if (s.id === subId) {
              return {
                  ...s,
                  links: [...s.links, { id: String(s.links.length + 1), title: 'لینک جدید', href: '#' }]
              };
          }
          return s;
      });
      handleUpdateItem(itemId, { subCategories: newSubs });
  };

  const updateLink = (itemId: string, subId: string, linkId: string, field: 'title' | 'href', value: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const newSubs = item.subCategories.map(s => {
        if (s.id === subId) {
            return {
                ...s,
                links: s.links.map(l => l.id === linkId ? { ...l, [field]: value } : l)
            };
        }
        return s;
    });
    handleUpdateItem(itemId, { subCategories: newSubs });
  };

  const removeLink = (itemId: string, subId: string, linkId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const newSubs = item.subCategories.map(s => {
        if (s.id === subId) {
            return {
                ...s,
                links: s.links.filter(l => l.id !== linkId)
            };
        }
        return s;
    });
    handleUpdateItem(itemId, { subCategories: newSubs });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">مدیریت مگا منو</h1>
        <button onClick={handleSave} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          <Save className="w-4 h-4" />
          ذخیره تغییرات
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar: List of Main Items */}
        <div className="bg-white p-4 rounded-lg shadow border md:col-span-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-700">منوهای اصلی</h2>
            <button onClick={handleAddItem} className="text-[#83b735] hover:bg-green-50 p-1 rounded">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2">
            {items.map((item, index) => (
              <div 
                key={item.id} 
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDragEnter={() => handleDragEnter(index)}
                onDrop={handleDrop}
                className={`flex items-center justify-between p-3 rounded cursor-pointer border transition-all duration-200 ${
                  editingItem?.id === item.id ? 'border-[#83b735] bg-green-50' : 'border-gray-100 hover:bg-gray-50'
                } ${draggedItemIndex === index ? 'opacity-50 dashed border-2 border-gray-300 scale-95 shadow-inner' : 'hover:shadow-sm'}`}
                onClick={() => setEditingItem(item)}
              >
                <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{item.title}</span>
                </div>
                <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                    className="text-red-500 hover:text-red-700"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Editor Area */}
        <div className="bg-white p-6 rounded-lg shadow border md:col-span-2">
          {editingItem ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="font-bold text-lg">ویرایش: {editingItem.title}</h3>
              </div>

              {/* Main Item Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">عنوان</label>
                  <input 
                    type="text" 
                    value={editingItem.title} 
                    onChange={(e) => handleUpdateItem(editingItem.id, { title: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">لینک (URL)</label>
                  <input 
                    type="text" 
                    value={editingItem.href} 
                    onChange={(e) => handleUpdateItem(editingItem.id, { href: e.target.value })}
                    className="w-full border rounded px-3 py-2 dir-ltr"
                  />
                </div>

                {/* Icon Upload */}
                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">آیکون / تصویر کوچک</label>
                  <div className="flex items-start gap-4">
                    {editingItem.icon && (
                      <div className="relative group/icon">
                        <div className="w-16 h-16 border rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
                          <Image src={editingItem.icon} alt="Icon" width={128} height={128} className="max-w-full max-h-full object-contain" />
                        </div>
                        <button 
                          onClick={() => handleUpdateItem(editingItem.id, { icon: undefined })}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-sm opacity-0 group-hover/icon:opacity-100 transition-opacity"
                          title="حذف آیکون"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    
                    <div className="flex-1">
                        <label className="flex items-center justify-center gap-2 cursor-pointer bg-white border border-dashed border-gray-300 rounded-lg px-4 py-4 hover:bg-gray-50 hover:border-[#83b735] transition-all group">
                        <Upload className="w-5 h-5 text-gray-400 group-hover:text-[#83b735]" />
                        <div className="text-center">
                            <span className="text-sm text-gray-600 font-medium block">انتخاب تصویر یا آیکون</span>
                            <span className="text-xs text-gray-400 block mt-1">SVG, PNG, JPG (Max 50KB)</span>
                        </div>
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleImageUpload}
                        />
                        </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subcategories */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-gray-800">زیرمجموعه‌ها</h4>
                  <button 
                    onClick={() => addSubCategory(editingItem.id)}
                    className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    افزودن گروه جدید
                  </button>
                </div>

                <div className="space-y-4">
                  {editingItem.subCategories.map((sub, index) => (
                    <div 
                        key={sub.id} 
                        draggable
                        onDragStart={(e) => handleSubDragStart(e, index)}
                        onDragOver={handleSubDragOver}
                        onDragEnter={() => handleSubDragEnter(index)}
                        onDrop={handleSubDrop}
                        className={`border rounded-lg p-4 bg-gray-50 transition-all duration-200 ${draggedSubIndex === index ? 'opacity-50 border-dashed border-2 border-gray-400 scale-95' : 'hover:shadow-md'}`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                             <GripVertical className="w-4 h-4" />
                        </div>
                        <input 
                            type="text" 
                            value={sub.title}
                            onChange={(e) => updateSubCategory(editingItem.id, sub.id, e.target.value)}
                            className="flex-1 border rounded px-2 py-1 font-bold text-sm"
                            placeholder="عنوان گروه"
                        />
                        <button onClick={() => removeSubCategory(editingItem.id, sub.id)} className="text-red-500 p-1">
                            <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Links in Subcategory */}
                      <div className="space-y-2 pl-4 border-r-2 border-gray-200 mr-2 pr-2">
                          {sub.links.map((link, linkIndex) => (
                              <div 
                                key={link.id} 
                                draggable
                                onDragStart={(e) => handleLinkDragStart(e, sub.id, linkIndex)}
                                onDragOver={handleLinkDragOver}
                                onDragEnter={() => handleLinkDragEnter(sub.id, linkIndex)}
                                onDrop={handleLinkDrop}
                                className={`flex items-center gap-2 p-1 rounded transition-all duration-200 ${
                                    draggedLink?.subId === sub.id && draggedLink?.index === linkIndex 
                                    ? 'opacity-40 bg-gray-200 border border-dashed border-gray-400 scale-105 shadow-lg' 
                                    : 'bg-white hover:bg-gray-50 border border-transparent hover:border-gray-200 hover:shadow-sm'
                                }`}
                              >
                                  <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                                      <GripVertical className="w-3 h-3" />
                                  </div>
                                  <input 
                                    type="text" 
                                    value={link.title}
                                    onChange={(e) => updateLink(editingItem.id, sub.id, link.id, 'title', e.target.value)}
                                    className="w-1/3 border rounded px-2 py-1 text-xs"
                                    placeholder="عنوان لینک"
                                  />
                                  <input 
                                    type="text" 
                                    value={link.href}
                                    onChange={(e) => updateLink(editingItem.id, sub.id, link.id, 'href', e.target.value)}
                                    className="flex-1 border rounded px-2 py-1 text-xs dir-ltr"
                                    placeholder="/link..."
                                  />
                                  <button onClick={() => removeLink(editingItem.id, sub.id, link.id)} className="text-gray-400 hover:text-red-500">
                                    <X className="w-3 h-3" />
                                  </button>
                              </div>
                          ))}
                          <button 
                            onClick={() => addLink(editingItem.id, sub.id)}
                            className="text-xs text-[#83b735] hover:underline flex items-center gap-1 mt-2"
                          >
                            <Plus className="w-3 h-3" />
                            افزودن لینک
                          </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Edit2 className="w-12 h-12 mb-2 opacity-20" />
              <p>یک آیتم را برای ویرایش انتخاب کنید یا آیتم جدید بسازید</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
