
import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getSiteSettings } from '@/app/actions/settings';
import ContactClient from './ContactClient';

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />
      <ContactClient settings={settings} />
      <Footer />
    </div>
  );
}
