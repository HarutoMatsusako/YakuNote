'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SummaryPage from './summary/page';

export default function Home() {
  // トップページに要約一覧へのリンクを追加
  return (
    <div>
      <div className="fixed top-4 right-4 z-10">
        <Link
          href="/summaries"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          保存した要約一覧
        </Link>
      </div>
      <SummaryPage />
    </div>
  );
}
