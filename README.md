# 📱 ナンプレ解析アプリ

スマートフォン対応のナンプレ（数独）自動解析・検証Webアプリです。

## 🚀 機能

- 📸 **画像アップロード**: ナンプレの写真をドラッグ&ドロップまたはタップで簡単アップロード
- 🤖 **自動数字認識**: Tesseract.jsを使用したOCR処理で画像から数字を自動認識
- 🧮 **自動解答**: バックトラッキング法によるナンプレソルバー
- ✅ **検証機能**: 現在の解答状態をリアルタイムで検証
- 📱 **スマホ対応**: タッチフレンドリーなレスポンシブデザイン
- ⚡ **高速処理**: ブラウザ内で完結する高速な処理

## 🛠️ 技術スタック

- **フロントエンド**: React 18 + TypeScript
- **スタイリング**: Tailwind CSS
- **ビルドツール**: Vite
- **OCR**: Tesseract.js
- **デプロイ**: GitHub Pages
- **CI/CD**: GitHub Actions

## 🏗️ プロジェクト構成

```
NamPure/
├── public/
│   ├── manifest.json         # PWA設定
│   └── index.html
├── src/
│   ├── components/
│   │   ├── ImageUploader.tsx # 画像アップロード
│   │   ├── SudokuGrid.tsx    # ナンプレグリッド表示
│   │   └── ResultDisplay.tsx # 結果表示
│   ├── utils/
│   │   ├── imageProcessor.ts # OCR処理
│   │   ├── sudokuSolver.ts   # ソルバー
│   │   └── sudokuValidator.ts # 検証
│   ├── types/
│   │   └── sudoku.ts         # 型定義
│   ├── App.tsx
│   └── main.tsx
├── .github/workflows/
│   └── deploy.yml           # GitHub Pages自動デプロイ
└── package.json
```

## 🚀 開発環境のセットアップ

### 必要な環境
- Node.js 18以上
- npm または yarn

### インストール手順

```bash
# リポジトリをクローン
git clone https://github.com/[username]/NamPure.git
cd NamPure

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

### 利用可能なスクリプト

```bash
npm run dev      # 開発サーバーを起動 (http://localhost:5173)
npm run build    # プロダクションビルド
npm run preview  # ビルド結果をプレビュー
npm run deploy   # GitHub Pagesにデプロイ
```

## 📱 使い方

1. **画像アップロード**: ナンプレの画像をアップロードまたは「デモ用ナンプレで試す」をクリック
2. **自動解析**: アプリが画像から数字を認識し、問題を自動で解きます
3. **結果確認**: 現在の解答状態と正解・エラー箇所を確認
4. **検証**: 完成度と正確性をリアルタイムで確認

## 🌐 デプロイ

GitHub Pagesでの自動デプロイが設定されています：

1. `main`ブランチにプッシュ
2. GitHub Actionsが自動でビルド＆デプロイ
3. `https://[username].github.io/NamPure/`でアクセス可能

## 🔧 カスタマイズ

### ベースURLの変更
`vite.config.ts`の`base`オプションを変更：
```typescript
export default defineConfig({
  base: '/your-repo-name/',
  // ...
})
```

### PWA設定
`public/manifest.json`でアプリ名やテーマカラーをカスタマイズ可能

## 🤝 コントリビューション

1. フォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. コミット (`git commit -m 'Add amazing feature'`)
4. プッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

MIT License - 詳細は[LICENSE](LICENSE)ファイルを参照

## 🙏 謝辞

- [Tesseract.js](https://tesseract.projectnaptha.com/) - OCR機能
- [Tailwind CSS](https://tailwindcss.com/) - スタイリング
- [React](https://reactjs.org/) - UIフレームワーク

---

Made with ❤️ for sudoku lovers