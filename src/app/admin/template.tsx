'use client';

import React from 'react';

export default function AdminTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-in-out">
      {children}
    </div>
  );
}
