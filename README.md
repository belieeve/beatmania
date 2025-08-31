# 🎵 BEATMANIA STYLE - Web Music Game

本格的なWeb音楽ゲーム。MP3ファイルをアップロードしてプレイできる、BEATMANIA風のリズムゲームです。

## 🎮 **ライブデモ**

**▶️ [BEATMANIA STYLEをプレイ](https://belieeve.github.io/beatmania/)**

## ✨ **主な機能**

### 🎵 **音楽システム**
- **MP3アップロード対応** - 好きな楽曲でプレイ可能
- **楽曲永続保存** - 一度アップロードした楽曲はブラウザに保存
- **自動BPM検出** - アップロード時に楽曲のテンポを自動認識
- **リアルタイム音楽再生** - 実際の音楽に合わせてプレイ

### 🎯 **ゲームプレイ**
- **6キーレイアウト** - S D F J K L キーでプレイ
- **3段階難易度** - EASY / NORMAL / HARD
- **位置ベース判定** - ノーツが枠にピッタリでPERFECT
- **リアルタイム判定** - PERFECT / GREAT / GOOD / BAD / MISS

### 🎨 **UI/UX**
- **モダンデザイン** - 光るエフェクトとアニメーション
- **レスポンシブ対応** - PC・タブレット・モバイル対応
- **マルチスクリーン** - トップ画面 → 楽曲選択 → ゲームプレイ
- **視覚的フィードバック** - キー押下時の光るエフェクト

## 🚀 **プレイ方法**

1. **[デモページ](https://belieeve.github.io/beatmania/)** にアクセス
2. **GAME START** を押す
3. **UPLOAD MUSIC** で MP3 ファイルをアップロード
4. **楽曲選択画面** で楽曲と難易度を選択
5. **S D F J K L** キーでプレイ開始！

## 💻 **ローカル環境での実行**

```bash
# リポジトリをクローン
git clone https://github.com/belieeve/beatmania.git

# ディレクトリに移動
cd beatmania

# index.html をブラウザで開く
open index.html
```

## 📁 **ファイル構成**

```
beatmania/
├── index.html         # メインHTML
├── game_new.js        # ゲームエンジン
├── songs.js           # 楽曲データベース
├── style.css          # スタイルシート
├── index_new.html     # 開発版HTML
├── game.js            # 旧版JavaScript
└── style_new.css      # 開発版CSS
```

## 🛠️ **技術スタック**

- **HTML5** - セマンティックマークアップ
- **CSS3** - アニメーション・グラデーション・レスポンシブ
- **Vanilla JavaScript** - フレームワーク不使用
- **Web Audio API** - 音楽再生・解析
- **Canvas API** - ゲーム描画
- **LocalStorage** - 楽曲データ永続化

## 🎵 **対応音楽形式**

- **MP3** - 推奨形式
- **MPEG Audio** - 対応

## ⚙️ **動作環境**

- **モダンブラウザ** - Chrome, Firefox, Safari, Edge
- **Web Audio API対応** - 必須
- **JavaScript有効** - 必須

## 🎮 **キー操作**

| キー | レーン |
|------|--------|
| S    | レーン1 |
| D    | レーン2 |
| F    | レーン3 |
| J    | レーン4 |
| K    | レーン5 |
| L    | レーン6 |

## 🏆 **判定システム**

| 判定 | 条件 | スコア |
|------|------|--------|
| PERFECT | 枠の中心±15px | 100点 |
| GREAT | ±16-30px | 80点 |
| GOOD | ±31-50px | 50点 |
| BAD | ±51-100px | 20点 |
| MISS | 範囲外 | 0点 |

## 🔧 **開発者向け**

### 楽曲追加（JavaScript）
```javascript
// コンソールで楽曲を追加
addCustomSong({
    id: 'custom_song_1',
    title: 'My Song',
    artist: 'My Artist',
    bpm: 140,
    duration: 180
});
```

### 設定カスタマイズ
- **判定タイミング調整** - OPTIONS画面で±100ms調整可能
- **ノーツスピード** - 100-500の範囲で調整可能

## 📜 **ライセンス**

MIT License - 自由にご利用ください

## 🤝 **コントリビューション**

プルリクエスト・Issue報告歓迎！

---

**🎵 Let's Play BEATMANIA STYLE! 🎮**