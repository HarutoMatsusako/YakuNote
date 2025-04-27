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
        要約から学びへ。あなたの知識を広げよう。
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mb-8">
        YakuNoteは、気になる記事をすばやく要約。さらに英語翻訳にも対応し、情報収集と英語学習を同時に叶える新しいスタイルの学習型ツールです。
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
            興味のある記事を要約・翻訳、学びを広げる。
            </h2>

            {/* 四角のカード４つ並び */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* カード1 */}
              <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col items-center text-center">
                <img src="/images/computer.png" alt="課題画像1" className="w-24 h-24 mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-indigo-700">知りたい記事のURLを入力</h3>
                <p className="text-gray-600 text-sm">
                気になるサイトURLを入力するだけで内容をAIにて自動で要約します。
                </p>
              </div>

              {/* カード2 */}
              <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col items-center text-center">
                <img src="/images/analysis.png" alt="課題画像2" className="w-24 h-24 mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-indigo-700">要約された内容を保存</h3>
                <p className="text-gray-600 text-sm">
                必要に応じて、要約結果をワンクリックで保存できます。
                </p>
              </div>

              {/* カード3 */}
              <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col items-center text-center">
                <img src="/images/translate.png" alt="課題画像3" className="w-24 h-24 mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-indigo-700">英語翻訳で学習もできる</h3>
                <p className="text-gray-600 text-sm">
                要約結果をボタン一つで英語に翻訳。英語学習にも活用できます。
                </p>
              </div>

              {/* カード4 */}
              <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col items-center text-center">
                <img src="/images/sticky-notes.png" alt="課題画像4" className="w-24 h-24 mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-indigo-700">保存一覧をNote化</h3>
                <p className="text-gray-600 text-sm">
                保存した要約をいつでも一覧で見返し、あなた専用の学習ノートにできます。
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* ここまで箱セクション */}
      </main>

 
    <div className="text-center mt-8">
      <Link
        href="/summarize"
        className="text-indigo-600 font-bold text-lg hover:underline inline-flex items-center gap-2"
      >
        要約をはじめる →
      </Link>
    </div>
  );
}

      {/* フッター */}
      <footer className="text-center text-gray-400 text-sm py-4">
        &copy; {new Date().getFullYear()} YakuNote. All rights reserved.
      </footer>
    </div>
  );
}
