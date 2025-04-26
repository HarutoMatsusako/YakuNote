'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default function Home() {
  // トップページから/summaryにリダイレクト
  redirect('/summary');
}
