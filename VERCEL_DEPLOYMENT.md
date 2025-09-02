# 🚀 Vercel デプロイガイド

## 📋 デプロイ前チェックリスト

- ✅ `vercel.json` 設定完了
- ✅ `package.json` 更新完了  
- ✅ `public/audio/` ディレクトリ作成済み
- ✅ 自動楽曲検出システム実装済み

## 🔧 1. Vercel CLI インストール

```bash
# Vercel CLI をグローバルインストール
npm install -g vercel

# または yarn
yarn global add vercel
```

## 🌐 2. Vercelアカウント設定

```bash
# Vercelにログイン
vercel login

# GitHubアカウントでログインを選択
```

## 📁 3. プロジェクト初期化

```bash
# プロジェクトディレクトリに移動
cd /Users/shin/Documents/1_開發/002_beatmania

# Vercelプロジェクトとして初期化
vercel

# 質問に答える:
# ? Set up and deploy "~/002_beatmania"? [Y/n] y
# ? Which scope do you want to deploy to? [your-username]
# ? Link to existing project? [y/N] N
# ? What's your project's name? beatmania-style-game
# ? In which directory is your code located? ./
```

## 🎵 4. 楽曲ファイル準備

### サンプルMP3ファイルを追加
```bash
# public/audioディレクトリにMP3ファイルを配置
# (著作権フリーの楽曲を使用してください)

ls public/audio/
# cyber-beats.mp3
# neon-rush.mp3  
# digital-storm.mp3
# matrix-dance.mp3
# pixel-perfect.mp3
```

## 🚀 5. デプロイ実行

### 初回デプロイ
```bash
# プロダクションデプロイ
vercel --prod

# デプロイ完了後、URLが表示される
# ✅  Production: https://beatmania-style-game.vercel.app
```

### 再デプロイ（更新時）
```bash
# ファイル変更後
git add .
git commit -m "Update songs and features"

# 再デプロイ
vercel --prod
```

## 🎮 6. デプロイ後の確認

### 基本動作チェック
1. **メインページ**: `https://your-app.vercel.app`
2. **楽曲選択**: 5曲のデモ楽曲が表示されるか
3. **音声再生**: 楽曲を選択してゲーム開始できるか
4. **アップロードサイト**: `https://your-app.vercel.app/upload-site.html`

### 音声ファイルアクセス確認
```bash
# 音声ファイルURLに直接アクセスできるかテスト
curl -I https://your-app.vercel.app/audio/cyber-beats.mp3

# 期待される応答:
# HTTP/2 200 
# content-type: audio/mpeg
# cache-control: public, max-age=31536000
```

## 🔄 7. 自動楽曲検出のテスト

### 新しい楽曲を追加
```bash
# 1. 新しいMP3ファイルを追加
cp new-song.mp3 public/audio/awesome-track.mp3

# 2. デプロイ
vercel --prod

# 3. ブラウザで確認
# - 楽曲選択画面で「Awesome Track」が自動追加されているか
# - コンソールログに自動検出のメッセージが出るか
```

## 🌍 8. 環境変数設定（オプション）

### GitHub連携用（楽曲共有API）
```bash
# Vercelダッシュボードで設定
# Settings > Environment Variables

GITHUB_TOKEN=your_github_personal_access_token
REPO_OWNER=your-username  
REPO_NAME=beatmania-songs
```

## 📊 9. パフォーマンス最適化

### 音声ファイルサイズ確認
```bash
# 音声ファイルサイズをチェック
ls -lh public/audio/
# 推奨: 各ファイル5MB以下

# ファイルサイズが大きい場合は圧縮
ffmpeg -i large-file.mp3 -ab 128k compressed-file.mp3
```

### CDN キャッシュ設定
- 音声ファイル: 1年間キャッシュ (`max-age=31536000`)
- 静的アセット: 1年間キャッシュ
- HTML: キャッシュなし（動的コンテンツ用）

## 🐛 10. トラブルシューティング

### よくある問題と解決策

#### 音声ファイルが404エラー
```bash
# vercel.jsonのルーティング設定を確認
# routes: "/audio/(.*)" → "/public/audio/$1"

# ファイルパスを確認
ls -la public/audio/
```

#### 楽曲が自動検出されない  
```javascript
// ブラウザコンソールで確認
console.log('Auto song detection:', typeof startAutoSongDiscovery);

// 手動で楽曲検出実行
manualSongScan();
```

#### CORS エラー
```json
// vercel.json の headers 設定を確認
"Access-Control-Allow-Origin": "*"
```

## 🎯 11. 本番運用のベストプラクティス

### セキュリティ
- 著作権フリーの楽曲のみ使用
- 大容量ファイルの制限設定
- 適切なCORS設定

### 監視
```bash
# Vercelダッシュボードで監視
# - Functions実行時間
# - 帯域幅使用量  
# - エラー率
```

### バックアップ
```bash
# 定期的にプロジェクトをGitHubにプッシュ
git add .
git commit -m "Backup: $(date)"
git push origin main
```

## 🎉 完了！

デプロイURL: `https://beatmania-style-game.vercel.app`

### 主な機能
✅ **音楽ゲーム**: 5曲のデモ楽曲でプレイ可能  
✅ **楽曲アップロード**: upload-site.html で楽曲追加  
✅ **自動検出**: public/audio/ に MP3 を追加するだけで自動登録  
✅ **クロスデバイス**: どのPCからも同じURLでアクセス  
✅ **高速配信**: Vercel CDN で世界中から高速アクセス  

**楽曲を追加したい場合:**
1. `public/audio/new-song.mp3` にファイル追加
2. `vercel --prod` でデプロイ  
3. 自動で楽曲リストに追加される！

これで完全にクラウド化されたBEATMANIA風ゲームの完成です 🎵