
import React from 'react';
import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getSiteSettings } from '@/app/actions/settings';
import AboutClient from './AboutClient';
import { getBannersAction } from '@/actions/banners';

export default async function AboutPage() {
  const settings = await getSiteSettings();
  const bannersRes = await getBannersAction();
  const banners = bannersRes.success && bannersRes.data ? bannersRes.data : [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />
      <AboutClient settings={settings} initialBanners={banners} />
      <Footer />
    </div>
  );
}

export const metadata: Metadata = {
  title: 'درباره ما',
  description: 'آشنایی با فروشگاه آنلاین شیک و اهداف ما',
};
