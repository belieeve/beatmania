# Audio Files Directory

## ファイル配置方法

MP3ファイルをこのディレクトリに配置してください：

```
public/audio/
├── cyber-beats.mp3
├── neon-rush.mp3
├── digital-storm.mp3
├── matrix-dance.mp3
├── pixel-perfect.mp3
└── custom-song-001.mp3
```

## ファイル命名規則

- 小文字とハイフンを使用
- 日本語や特殊文字は避ける
- 例: `super-eurobeat.mp3`, `hardcore-techno.mp3`

## デプロイ後のURL

```
https://your-site.vercel.app/audio/cyber-beats.mp3
https://your-site.netlify.app/audio/neon-rush.mp3
https://your-username.github.io/repo-name/audio/digital-storm.mp3
```

## 楽曲追加手順

1. MP3ファイルをこのフォルダに追加
2. `shared-songs.json`に楽曲メタデータを追加
3. `audioFile` フィールドにファイル名を指定
4. デプロイして完了

## 推奨設定

- **ビットレート**: 128kbps (ファイルサイズ節約)
- **ファイルサイズ**: 5MB以下推奨
- **長さ**: 2-4分程度