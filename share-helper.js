// 楽曲共有ヘルパー関数
class SongShareHelper {
    // 楽曲データをURL化
    static createShareUrl(songs) {
        const compressedData = this.compressData(songs);
        const encodedData = btoa(compressedData);
        return `${window.location.origin}?shared=${encodedData}`;
    }

    // URLから楽曲データを復元
    static loadFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedData = urlParams.get('shared');
        
        if (sharedData) {
            try {
                const decodedData = atob(sharedData);
                return this.decompressData(decodedData);
            } catch (error) {
                console.error('Failed to load shared songs:', error);
            }
        }
        return null;
    }

    // データ圧縮（簡易版）
    static compressData(songs) {
        return JSON.stringify(songs.map(song => ({
            i: song.id,
            t: song.title,
            a: song.artist,
            g: song.genre,
            b: song.bpm,
            d: song.duration,
            // audioDataは容量大きすぎるので除外
        })));
    }

    // データ展開
    static decompressData(compressed) {
        const data = JSON.parse(compressed);
        return data.map(song => ({
            id: song.i,
            title: song.t,
            artist: song.a,
            genre: song.g,
            bpm: song.b,
            duration: song.d,
            difficulty: {
                easy: { level: 2, notes: Math.floor(song.d * song.b / 60 * 0.4) },
                normal: { level: 5, notes: Math.floor(song.d * song.b / 60 * 0.6) },
                hard: { level: 8, notes: Math.floor(song.d * song.b / 60 * 0.8) }
            },
            description: `共有楽曲: ${song.t}`,
            colorTheme: {
                primary: '#00ffff',
                secondary: '#0088cc',
                accent: '#44aaff'
            },
            isShared: true
        }));
    }

    // QRコード生成（外部ライブラリ使用）
    static async generateQRCode(shareUrl) {
        // QRCodeライブラリを使用
        if (typeof QRCode !== 'undefined') {
            const canvas = document.createElement('canvas');
            await QRCode.toCanvas(canvas, shareUrl);
            return canvas.toDataURL();
        }
        return null;
    }
}

// 使用例
// const shareUrl = SongShareHelper.createShareUrl(uploadedSongs);
// const sharedSongs = SongShareHelper.loadFromUrl();