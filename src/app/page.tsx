'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ヘッダー */}
      {/* <header className="w-full flex items-center justify-between px-6 py-4 shadow-sm">
        <h1 className="text-2xl font-bold text-indigo-600">YakuNote</h1>
        <Link
          href="/"
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm font-medium"
        >
          ホームに戻る
        </Link>
      </header> */}

      {/* メインコンテンツ */}
      <main className="flex-1 flex flex-col items-center text-center px-6 mt-25">
        <h2 className="text-4xl font-bold mb-6 text-gray-800">
          要約をもっと簡単に。
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mb-8">
          YakuNoteなら、サイトURLを入力するだけで、瞬時に要約ができる。あなたの時間をもっと有効に使いましょう！
        </p>
        <Link
          href="/summarize"
          className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium text-lg mb-16"
        >
          さっそく使ってみる
        </Link>

        {/* ここから四角い箱のセクション */}
        <section className="w-full py-20 bg-indigo-50">
          <div className="max-w-6xl mx-auto px-4">
            {/* 大きい見出し */}
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-indigo-900 mb-16">
              あなたの課題を解決します
            </h2>

            {/* 四角のカード４つ並び */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* カード1 */}
              <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center text-center">
                <img src="/images/example1.png" alt="課題画像1" className="w-24 h-24 mb-4" />
                <h3 className="text-lg font-semibold mb-2">課題タイトル1</h3>
                <p className="text-gray-600 text-sm">
                  ここに課題の説明を書きます。簡潔に2〜3行でまとめます。
                </p>
              </div>

              {/* カード2 */}
              <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center text-center">
                <img src="/images/example2.png" alt="課題画像2" className="w-24 h-24 mb-4" />
                <h3 className="text-lg font-semibold mb-2">課題タイトル2</h3>
                <p className="text-gray-600 text-sm">
                  ここに課題の説明を書きます。簡潔に2〜3行でまとめます。
                </p>
              </div>

              {/* カード3 */}
              <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center text-center">
                <img src="/images/example3.png" alt="課題画像3" className="w-24 h-24 mb-4" />
                <h3 className="text-lg font-semibold mb-2">課題タイトル3</h3>
                <p className="text-gray-600 text-sm">
                  ここに課題の説明を書きます。簡潔に2〜3行でまとめます。
                </p>
              </div>

              {/* カード4 */}
              <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center text-center">
                <img src="/images/example4.png" alt="課題画像4" className="w-24 h-24 mb-4" />
                <h3 className="text-lg font-semibold mb-2">課題タイトル4</h3>
                <p className="text-gray-600 text-sm">
                  ここに課題の説明を書きます。簡潔に2〜3行でまとめます。
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* ここまで箱セクション */}
      </main>

      {/* フッター */}
      <footer className="text-center text-gray-400 text-sm py-4">
        &copy; {new Date().getFullYear()} YakuNote. All rights reserved.
      </footer>
    </div>
  );
}
