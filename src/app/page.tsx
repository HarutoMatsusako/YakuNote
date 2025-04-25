'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SummaryPage from './summary/page';

export default function Home() {
  // テスト用に直接SummaryPageを表示
  return <SummaryPage />;
}
