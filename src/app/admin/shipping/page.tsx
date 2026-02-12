'use client';

import React, { useState } from 'react';
import { ShippingMethod, getShippingMethods, addShippingMethod, updateShippingMethod, deleteShippingMethod } from '@/data/shipping';
import { Pencil, Trash2, Plus } from 'lucide-react';

export default function AdminShippingPage() {
  const [methods, setMethods] = useState<ShippingMethod[]>(() => getShippingMethods());
  const [editing, setEditing] = useState<ShippingMethod | null>(null);
  const [createForm, setCreateForm] = useState<Omit<ShippingMethod, 'id'>>({
    name: '',
    code: '',
    active: true,
    basePrice: 0,
    perKgPrice: 0,
    maxWeightKg: 30,
    deliveryDaysMin: 2,
    deliveryDaysMax: 5,
    codAvailable: false,
    isPostPaid: false,
    regions: [],
    notes: '',
  });
  const [editForm, setEditForm] = useState<Omit<ShippingMethod, 'id'>>({
    name: '',
    code: '',
    active: true,
    basePrice: 0,
    perKgPrice: 0,
    maxWeightKg: 30,
    deliveryDaysMin: 2,
    deliveryDaysMax: 5,
    codAvailable: false,
    isPostPaid: false,
    regions: [],
    notes: '',
  });

  const resetEdit = () => {
    setEditForm({
      name: '',
      code: '',
      active: true,
      basePrice: 0,
      perKgPrice: 0,
      maxWeightKg: 30,
      deliveryDaysMin: 2,
      deliveryDaysMax: 5,
      codAvailable: false,
      regions: [],
      notes: '',
    });
    setEditing(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...createForm, regions: (createForm.regions ?? []).filter(Boolean) };
    addShippingMethod(payload);
    setMethods(getShippingMethods());
    setCreateForm({
      name: '',
      code: '',
      active: true,
      basePrice: 0,
      perKgPrice: 0,
      maxWeightKg: 30,
      deliveryDaysMin: 2,
      deliveryDaysMax: 5,
      codAvailable: false,
      isPostPaid: false,
      regions: [],
      notes: '',
    });
  };

  const onEdit = (m: ShippingMethod) => {
    setEditing(m);
    setEditForm({
      name: m.name,
      code: m.code,
      active: m.active,
      basePrice: m.basePrice,
      perKgPrice: m.perKgPrice ?? 0,
      maxWeightKg: m.maxWeightKg ?? 30,
      deliveryDaysMin: m.deliveryDaysMin ?? 2,
      deliveryDaysMax: m.deliveryDaysMax ?? 5,
      codAvailable: m.codAvailable,
      isPostPaid: m.isPostPaid ?? false,
      regions: m.regions ?? [],
      notes: m.notes ?? '',
    });
  };

  const onDelete = (id: number) => {
    deleteShippingMethod(id);
    setMethods(getShippingMethods());
    if (editing && editing.id === id) resetEdit();
  };

  const regionsString = (arr?: string[]) => (arr && arr.length ? arr.join('، ') : '-');

  return (
    <div className="bg-white border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">پست و روش‌های ارسال</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {!editing && (
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">افزودن روش ارسال</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-700">عنوان روش</label>
                <input
                  className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#83b735]"
                  value={createForm.name}
                  onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">کد روش</label>
                <input
                  className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#83b735]"
                  value={createForm.code}
                  onChange={e => setCreateForm({ ...createForm, code: e.target.value })}
                  placeholder="مثال: standard، express"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-700">هزینه پایه (تومان)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#83b735]"
                    value={createForm.basePrice}
                    onChange={e => setCreateForm({ ...createForm, basePrice: Math.max(0, Number(e.target.value) || 0) })}
                    min={0}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-700">هزینه هر کیلو (تومان)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#83b735]"
                    value={createForm.perKgPrice ?? 0}
                    onChange={e => setCreateForm({ ...createForm, perKgPrice: Math.max(0, Number(e.target.value) || 0) })}
                    min={0}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-700">حداکثر وزن (کیلوگرم)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#83b735]"
                    value={createForm.maxWeightKg ?? 30}
                    onChange={e => setCreateForm({ ...createForm, maxWeightKg: Math.max(1, Number(e.target.value) || 1) })}
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-700">تحویل (روز، حداقل/حداکثر)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#83b735]"
                      value={createForm.deliveryDaysMin ?? 2}
                      onChange={e => setCreateForm({ ...createForm, deliveryDaysMin: Math.max(0, Number(e.target.value) || 0) })}
                      min={0}
                    />
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#83b735]"
                      value={createForm.deliveryDaysMax ?? 5}
                      onChange={e => setCreateForm({ ...createForm, deliveryDaysMax: Math.max(0, Number(e.target.value) || 0) })}
                      min={0}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 border rounded-md p-3">
                <div className="flex items-center h-5">
                  <input
                    id="create-active"
                    type="checkbox"
                    checked={createForm.active}
                    onChange={e => setCreateForm({ ...createForm, active: e.target.checked })}
                    className="w-4 h-4 text-[#83b735] border-gray-300 rounded focus:ring-[#83b735]"
                  />
                </div>
                <label htmlFor="create-active" className="font-medium text-gray-700 text-sm">
                  سرویس فعال است
                </label>
              </div>

              <div className="flex items-center gap-4 border rounded-md p-3">
                <div className="flex items-center h-5">
                  <input
                    id="create-cod"
                    type="checkbox"
                    checked={createForm.codAvailable}
                    onChange={e => setCreateForm({ ...createForm, codAvailable: e.target.checked })}
                    className="w-4 h-4 text-[#83b735] border-gray-300 rounded focus:ring-[#83b735]"
                  />
                </div>
                <label htmlFor="create-cod" className="font-medium text-gray-700 text-sm">
                  امکان پرداخت در محل (COD) دارد
                </label>
              </div>

              <div className="flex items-center gap-4 border rounded-md p-3">
                <div className="flex items-center h-5">
                  <input
                    id="create-postpaid"
                    type="checkbox"
                    checked={createForm.isPostPaid}
                    onChange={e => setCreateForm({ ...createForm, isPostPaid: e.target.checked })}
                    className="w-4 h-4 text-[#83b735] border-gray-300 rounded focus:ring-[#83b735]"
                  />
                </div>
                <label htmlFor="create-postpaid" className="font-medium text-gray-700 text-sm">
                  پس‌کرایه (هزینه ارسال به عهده مشتری در مقصد)
                </label>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">استان‌ها/شهرها (با ویرگول جدا کنید)</label>
                <input
                  className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#83b735]"
                  value={(createForm.regions ?? []).join(',')}
                  onChange={e => setCreateForm({ ...createForm, regions: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="مثال: تهران, مشهد, اصفهان"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">توضیحات</label>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#83b735] resize-none"
                  rows={3}
                  value={createForm.notes ?? ''}
                  onChange={e => setCreateForm({ ...createForm, notes: e.target.value })}
                  placeholder="شرایط خاص، محدودیت‌ها و نکات"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-[#83b735] text-white font-bold py-2 rounded-md hover:bg-[#6da025] transition-colors flex items-center justify-center gap-2"
                >
                  افزودن روش
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {editing && (
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">ویرایش روش ارسال</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const payload = { ...editForm, regions: (editForm.regions ?? []).filter(Boolean) };
                if (editing) updateShippingMethod(editing.id, payload);
                setMethods(getShippingMethods());
                resetEdit();
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-sm text-gray-700">عنوان روش</label>
                <input
                  className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#83b735]"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">کد روش</label>
                <input
                  className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#83b735]"
                  value={editForm.code}
                  onChange={e => setEditForm({ ...editForm, code: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-700">هزینه پایه (تومان)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#83b735]"
                    value={editForm.basePrice}
                    onChange={e => setEditForm({ ...editForm, basePrice: Math.max(0, Number(e.target.value) || 0) })}
                    min={0}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-700">هزینه هر کیلو (تومان)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#83b735]"
                    value={editForm.perKgPrice ?? 0}
                    onChange={e => setEditForm({ ...editForm, perKgPrice: Math.max(0, Number(e.target.value) || 0) })}
                    min={0}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-700">حداکثر وزن (کیلوگرم)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#83b735]"
                    value={editForm.maxWeightKg ?? 30}
                    onChange={e => setEditForm({ ...editForm, maxWeightKg: Math.max(1, Number(e.target.value) || 1) })}
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-700">تحویل (روز، حداقل/حداکثر)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#83b735]"
                      value={editForm.deliveryDaysMin ?? 2}
                      onChange={e => setEditForm({ ...editForm, deliveryDaysMin: Math.max(0, Number(e.target.value) || 0) })}
                      min={0}
                    />
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#83b735]"
                      value={editForm.deliveryDaysMax ?? 5}
                      onChange={e => setEditForm({ ...editForm, deliveryDaysMax: Math.max(0, Number(e.target.value) || 0) })}
                      min={0}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 border rounded-md p-3">
                <div className="flex items-center h-5">
                  <input
                    id="edit-active"
                    type="checkbox"
                    checked={editForm.active}
                    onChange={e => setEditForm({ ...editForm, active: e.target.checked })}
                    className="w-4 h-4 text-[#83b735] border-gray-300 rounded focus:ring-[#83b735]"
                  />
                </div>
                <label htmlFor="edit-active" className="font-medium text-gray-700 text-sm">
                  سرویس فعال است
                </label>
              </div>

              <div className="flex items-center gap-4 border rounded-md p-3">
                <div className="flex items-center h-5">
                  <input
                    id="edit-cod"
                    type="checkbox"
                    checked={editForm.codAvailable}
                    onChange={e => setEditForm({ ...editForm, codAvailable: e.target.checked })}
                    className="w-4 h-4 text-[#83b735] border-gray-300 rounded focus:ring-[#83b735]"
                  />
                </div>
                <label htmlFor="edit-cod" className="font-medium text-gray-700 text-sm">
                  امکان پرداخت در محل (COD) دارد
                </label>
              </div>

              <div className="flex items-center gap-4 border rounded-md p-3">
                <div className="flex items-center h-5">
                  <input
                    id="edit-postpaid"
                    type="checkbox"
                    checked={editForm.isPostPaid}
                    onChange={e => setEditForm({ ...editForm, isPostPaid: e.target.checked })}
                    className="w-4 h-4 text-[#83b735] border-gray-300 rounded focus:ring-[#83b735]"
                  />
                </div>
                <label htmlFor="edit-postpaid" className="font-medium text-gray-700 text-sm">
                  پس‌کرایه (هزینه ارسال به عهده مشتری در مقصد)
                </label>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">استان‌ها/شهرها (با ویرگول جدا کنید)</label>
                <input
                  className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#83b735]"
                  value={(editForm.regions ?? []).join(',')}
                  onChange={e => setEditForm({ ...editForm, regions: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">توضیحات</label>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#83b735] resize-none"
                  rows={3}
                  value={editForm.notes ?? ''}
                  onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-[#83b735] text-white font-bold py-2 rounded-md hover:bg-[#6da025] transition-colors"
                >
                  ثبت تغییرات
                </button>
                <button
                  type="button"
                  className="flex-1 border text-gray-700 font-bold py-2 rounded-md hover:bg-gray-50"
                  onClick={resetEdit}
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="lg:col-span-2 bg-white rounded-xl border overflow-x-auto p-6">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-right p-3">عنوان</th>
                <th className="text-right p-3">کد</th>
                <th className="text-right p-3">فعال</th>
                <th className="text-right p-3">هزینه پایه</th>
                <th className="text-right p-3">هر کیلو</th>
                <th className="text-right p-3">تحویل</th>
                <th className="text-right p-3">COD</th>
                <th className="text-right p-3">مناطق</th>
                <th className="text-right p-3">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {methods.map(m => (
                <tr key={m.id} className={`border-t ${editing && editing.id === m.id ? 'bg-green-50' : ''}`}>
                  <td className="p-3 font-medium text-gray-900">{m.name}</td>
                  <td className="p-3 text-gray-600">{m.code}</td>
                  <td className="p-3">{m.active ? 'فعال' : 'غیرفعال'}</td>
                  <td className="p-3 text-[#83b735] font-bold">{m.basePrice.toLocaleString('fa-IR')}</td>
                  <td className="p-3">{(m.perKgPrice ?? 0).toLocaleString('fa-IR')}</td>
                  <td className="p-3">
                    {m.deliveryDaysMin ?? '-'} تا {m.deliveryDaysMax ?? '-'} روز
                  </td>
                  <td className="p-3">{m.codAvailable ? 'دارد' : 'ندارد'}</td>
                  <td className="p-3 text-gray-600 truncate max-w-xs">{regionsString(m.regions)}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        className={`p-2 border rounded-md ${editing && editing.id === m.id ? 'bg-[#83b735] text-white hover:bg-[#6da025] border-[#83b735]' : 'hover:bg-gray-50'}`}
                        onClick={() => onEdit(m)}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 border rounded-md hover:bg-red-50 text-red-600"
                        onClick={() => onDelete(m.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {methods.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-gray-500" colSpan={9}>
                    هیچ روش ارسالی ثبت نشده است.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
