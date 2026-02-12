'use client';

import React from 'react';
import AdminChatInterface from '@/components/chat/AdminChatInterface';

export default function PopupChatPage() {
  return (
    <div className="h-screen bg-gray-100 flex flex-col">
       <AdminChatInterface isPopup={true} />
    </div>
  );
}
