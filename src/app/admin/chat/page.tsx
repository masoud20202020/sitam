'use client';

import React from 'react';
import AdminChatInterface from '@/components/chat/AdminChatInterface';

export default function AdminChatPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">چت آنلاین با مشتریان</h1>
      </div>

      <AdminChatInterface />
    </div>
  );
}
