'use client';

import { useEffect } from 'react';
import { redirect } from 'next/navigation';

export default function SummaryPage() {
  // トップページにリダイレクト
  useEffect(() => {
    redirect('/');
  }, []);
  
  return null;
}
