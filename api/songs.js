// Vercel Serverless Function for song data sharing
// /api/songs.js

// 永続化のためにVercel KVストレージを使用
// または外部データベースと連携

let sharedSongs = [];

export default function handler(req, res) {
    // CORS設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'POST') {
        const { action, songData, timestamp } = req.body;

        if (action === 'add_song' && songData) {
            // 楽曲データを追加
            const newSong = {
                ...songData,
                uploadedAt: timestamp || new Date().toISOString(),
                id: songData.id || `shared_${Date.now()}`
            };

            sharedSongs.push(newSong);

            console.log(`New song added: ${newSong.title} by ${newSong.artist}`);

            return res.status(200).json({
                success: true,
                message: 'Song added successfully',
                songId: newSong.id,
                totalSongs: sharedSongs.length
            });
        }

        return res.status(400).json({ error: 'Invalid request' });
    }

    if (req.method === 'GET') {
        // 楽曲データを取得
        const { since } = req.query;
        let songsToReturn = sharedSongs;

        if (since) {
            const sinceDate = new Date(since);
            songsToReturn = sharedSongs.filter(song => 
                new Date(song.uploadedAt) > sinceDate
            );
        }

        return res.status(200).json({
            songs: songsToReturn,
            total: songsToReturn.length,
            lastUpdated: new Date().toISOString()
        });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}