# 🚀 静的音声ファイル配信システム

## 📁 ファイル構成

```
project/
├── public/audio/          # MP3ファイル配置ディレクトリ
│   ├── cyber-beats.mp3
│   ├── neon-rush.mp3
│   ├── digital-storm.mp3
│   ├── matrix-dance.mp3
│   └── pixel-perfect.mp3
├── shared-songs.json      # 楽曲メタデータ
├── vercel.json           # Vercel設定
└── package.json          # プロジェクト設定
```

## 🎵 楽曲追加手順

### 1. MP3ファイル配置
```bash
# public/audioディレクトリにMP3ファイルを追加
cp your-song.mp3 public/audio/
```

### 2. メタデータ追加
`shared-songs.json`に楽曲情報を追加：

```json
{
  "id": "your_song_id",
  "title": "Your Song Title",
  "artist": "Artist Name",
  "genre": "Electronic",
  "bpm": 128,
  "duration": 180,
  "audioFile": "your-song.mp3",  // 👈 重要: ファイル名を指定
  "difficulty": {
    "easy": { "level": 2, "notes": 120 },
    "normal": { "level": 5, "notes": 240 },
    "hard": { "level": 8, "notes": 360 }
  },
  "description": "楽曲の説明",
  "colorTheme": {
    "primary": "#00ffff",
    "secondary": "#0088cc",
    "accent": "#44aaff"
  },
  "uploadedAt": "2025-01-01T00:00:00.000Z"
}
```

## 🌐 デプロイ方法

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

### GitHub Pages
```bash
git add .
git commit -m "Add new songs"
git push origin main
```

## 🔧 技術詳細

### 音声読み込みフロー
1. 楽曲選択時 → `loadStaticAudioFile(song)` 呼び出し
2. `fetch('./audio/${song.audioFile}')` でMP3取得
3. `audioContext.decodeAudioData()` でデコード
4. `song.audioBuffer` に保存

### URL構成
- **ゲーム**: `https://your-site.vercel.app/`
- **音声**: `https://your-site.vercel.app/audio/song.mp3`
- **API**: `https://your-site.vercel.app/api/songs`

### キャッシュ設定
- 音声ファイル: 1年間キャッシュ (`max-age=31536000`)
- CORS対応: すべてのオリジンから音声アクセス可能

## 🎮 動作確認

1. ローカルテスト:
```bash
python3 -m http.server 8080
# http://localhost:8080 でアクセス
```

2. 楽曲が読み込まれない場合:
   - ブラウザ開発者ツール → Network タブで404エラー確認
   - `shared-songs.json`の`audioFile`パスをチェック
   - `public/audio/`ディレクトリにファイルが存在するか確認

## 🎯 メリット

✅ **どこからでもアクセス可能** - URLが同じなら全デバイスで同じ楽曲  
✅ **高速配信** - CDN経由で音声ファイル配信  
✅ **永続化** - サーバー再起動でも楽曲が消えない  
✅ **スケーラブル** - 音声ファイル数に制限なし  
✅ **SEO対応** - 静的ファイルなので検索エンジンに優しい  

## 🚨 注意点

⚠️ **著作権**: 使用する楽曲の著作権を確認  
⚠️ **ファイルサイズ**: 大きすぎるファイルは読み込みが遅い  
⚠️ **ブラウザ対応**: 古いブラウザではMP3対応が限定的  

完了！これで楽曲が全デバイスで共有されます 🎉