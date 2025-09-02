// 楽曲データベース - アップロードした曲のみを管理
let SONG_DATABASE = [];

// ローカルストレージから楽曲データを読み込み
function loadSongsFromStorage() {
    try {
        const savedSongs = localStorage.getItem('uploadedSongs');
        if (savedSongs) {
            const songList = JSON.parse(savedSongs);
            console.log('保存された楽曲を読み込みました:', songList.length, '曲');
            
            // audioFileとaudioBufferは保存できないので除外し、メタデータのみ復元
            SONG_DATABASE = songList.map(song => ({
                ...song,
                audioFile: null,
                audioBuffer: null,
                audioData: song.audioData || null // Base64データがあれば保持
            }));
            
            return SONG_DATABASE;
        }
    } catch (error) {
        console.error('楽曲データ読み込みエラー:', error);
    }
    return [];
}

// ローカルストレージに楽曲データを保存
function saveSongsToStorage() {
    try {
        // audioFileとaudioBufferは保存できないので、メタデータのみ保存
        const songsToSave = SONG_DATABASE.map(song => ({
            id: song.id,
            title: song.title,
            artist: song.artist,
            genre: song.genre,
            bpm: song.bpm,
            duration: song.duration,
            difficulty: song.difficulty,
            description: song.description,
            colorTheme: song.colorTheme,
            audioData: song.audioData || null // Base64データを保存
        }));
        
        localStorage.setItem('uploadedSongs', JSON.stringify(songsToSave));
        console.log('楽曲データを保存しました:', songsToSave.length, '曲');
        return true;
    } catch (error) {
        console.error('楽曲データ保存エラー:', error);
        return false;
    }
}

// 楽曲を追加するヘルパー関数（永続化対応）
function addSong(songData) {
    // 必須フィールドの検証
    const requiredFields = ['id', 'title', 'artist', 'bpm', 'duration'];
    for (const field of requiredFields) {
        if (!songData[field]) {
            console.error(`Missing required field: ${field}`);
            return false;
        }
    }
    
    // デフォルト値の設定
    const defaultSong = {
        genre: 'Original',
        difficulty: {
            easy: { level: 1, notes: 100 },
            normal: { level: 5, notes: 200 },
            hard: { level: 9, notes: 350 }
        },
        audioFile: null,
        audioBuffer: null,
        chartData: null,
        isUploaded: true,
        description: '',
        colorTheme: {
            primary: '#00ffff',
            secondary: '#0088cc', 
            accent: '#44aaff'
        }
    };
    
    // データをマージして追加
    const finalSongData = { ...defaultSong, ...songData };
    SONG_DATABASE.push(finalSongData);
    
    // ローカルストレージに保存
    saveSongsToStorage();
    
    console.log(`Added song: ${finalSongData.title} by ${finalSongData.artist}`);
    return true;
}

// 楽曲データを取得する関数
function getSongById(id) {
    return SONG_DATABASE.find(song => song.id === id);
}

function getAllSongs() {
    return SONG_DATABASE;
}

function getSongsByGenre(genre) {
    return SONG_DATABASE.filter(song => song.genre === genre);
}

// 開発者用の簡単な楽曲追加例
/*
addSong({
    id: 'my_custom_song',
    title: 'My Custom Song',
    artist: 'Custom Artist',
    bpm: 120,
    duration: 180,
    audioFile: 'assets/audio/my_song.mp3', // MP3ファイルのパス
    description: 'カスタム楽曲の説明'
});
*/