# 🎵 楽曲追加例

## 📁 ファイル追加方法

### 1. 基本的な追加
```bash
# MP3ファイルをpublic/audioに配置
cp my-awesome-song.mp3 public/audio/
```

### 2. 自動検出される場合
以下のファイル名パターンは自動検出されます：

```
public/audio/
├── cyber-beats.mp3        ✅ 既存
├── neon-rush.mp3         ✅ 既存  
├── digital-storm.mp3     ✅ 既存
├── matrix-dance.mp3      ✅ 既存
├── pixel-perfect.mp3     ✅ 既存
├── song-001.mp3          🆕 自動検出
├── song-002.mp3          🆕 自動検出
├── custom-track-01.mp3   🆕 自動検出
├── my-song.mp3           🆕 自動検出
├── awesome-beat.mp3      🆕 自動検出
└── electronic-dance.mp3  🆕 自動検出
```

### 3. 自動処理の内容

**🎼 譜面自動生成**
- ファイルを音声解析してBPMを検出
- 楽曲の長さを取得
- 3つの難易度の譜面を自動生成
- ノーツ数をBPMと長さから計算

**🎨 メタデータ自動生成**
- ファイル名から楽曲タイトルを推測
- ジャンル自動判定（ファイル名のキーワードから）
- ランダムカラーテーマ適用

## 🔧 完全手動制御

自動検出を無効にして完全手動で管理したい場合：

### shared-songs.json に直接追加
```json
{
  "id": "custom_song_001",
  "title": "My Custom Song",
  "artist": "My Artist Name", 
  "genre": "Electronic",
  "bpm": 128,
  "duration": 200,
  "audioFile": "my-custom-song.mp3",
  "difficulty": {
    "easy": { "level": 3, "notes": 150 },
    "normal": { "level": 6, "notes": 300 },
    "hard": { "level": 9, "notes": 450 }
  },
  "description": "手動で追加したカスタム楽曲",
  "colorTheme": {
    "primary": "#ff00aa", 
    "secondary": "#cc0077",
    "accent": "#ff44bb"
  },
  "uploadedAt": "2025-01-01T12:00:00.000Z"
}
```

## 🎯 推奨ワークフロー

### 簡単追加 (推奨)
1. MP3ファイルを`public/audio/`に配置
2. ブラウザでゲームをリロード
3. 自動で楽曲が追加される ✨

### 高度なカスタマイズ
1. MP3ファイルを配置
2. `shared-songs.json`を手動編集
3. カスタム譜面・メタデータを設定
4. デプロイ

## 💡 ファイル命名のコツ

**良い例**
```
electronic-dance-mix.mp3    → "Electronic Dance Mix"
hardcore-techno-beat.mp3    → "Hardcore Techno Beat"  
ambient-chill-wave.mp3      → "Ambient Chill Wave"
```

**避けるべき例**
```
song1.mp3                   → "Song1" (味気ない)
音楽ファイル.mp3            → 日本語ファイル名は避ける
my song with spaces.mp3     → スペースよりハイフンを推奨
```

## 🚀 デプロイ後の確認

1. ゲームにアクセス
2. 楽曲選択画面で新しい楽曲を確認
3. コンソールログで自動検出の動作確認：
   ```
   🔍 新しい楽曲を検索中...
   📀 新しい楽曲を処理中: my-song.mp3
   🎼 音声解析完了: 180秒, BPM 128
   ✅ 楽曲追加完了: My Song
   🎵 1曲の新しい楽曲を追加しました！
   ```

**これで「ディレクトリに放り込むだけ」での楽曲追加が完成です！** 🎉