# 札跡（ふだあと）

札跡（ふだあと）は、かるたの試合後（感想戦）に取った札・取られた札を陣形と決まり字付きで整理するための Web アプリです。PWA として配信でき、オフラインでも利用可能です。

## 主な機能

- ウィザード形式の取札追加・編集
- むすめふさほせ順の一括入力（ステップ自動進行）
- 盤面タップで編集・削除
- 試合ごとの履歴保存（localStorage、件数上限なし）
- 配置図の PNG 画像出力
- PWA インストール案内（初回のみ）
- PWA 自動更新通知

## 開発

```bash
npm install
npm run dev
```

## ビルド

```bash
npm run build
npm run preview
```

ビルド成果物は `dist/` に出力されます。GitHub Pages では `main` ブランチへの push 時に GitHub Actions が自動デプロイします。

## 技術スタック

- Vite + React + TypeScript
- Tailwind CSS
- vite-plugin-pwa

## データの扱い

- 試合データはブラウザの `localStorage` に保存されます
- サーバーへの送信は行いません
- 旧バージョン（`kansousen-state-v1`）からのデータ移行は行いません

詳細な改修仕様は [SPEC.md](./SPEC.md) を参照してください。
