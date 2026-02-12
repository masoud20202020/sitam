'use client';

import React, { useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminSessionProvider from '@/components/admin/AdminSessionProvider';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <AdminSessionProvider>
      <div className="min-h-screen bg-gray-50 font-sans direction-rtl" dir="rtl">
        {/* Sidebar - Fixed Right */}
        <AdminSidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />
        
        {/* Main Content Area */}
        <div className="lg:mr-64 min-h-screen flex flex-col transition-all duration-300">
          <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} />
          
          <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
            <div className="max-w-7xl mx-auto space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminSessionProvider>
  );
}
