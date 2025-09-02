// ゲーム状態管理
let currentScreen = 'topPage';
let selectedSong = null;
let selectedDifficulty = 'easy';
let gameInstance = null;

// 画面遷移関数
function showScreen(screenId) {
    // 全ての画面を非表示にする
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // 指定された画面を表示
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        currentScreen = screenId;
    }
}

// トップページから楽曲選択画面へ
async function showSongSelect() {
    // クラウドから最新楽曲を取得
    await fetchSharedSongsFromAPI();
    
    // 楽曲があるかチェック
    const songs = getAllSongs();
    if (songs.length > 0) {
        // 楽曲選択画面を表示
        showScreen('songSelectPage');
        loadSongList();
    } else {
        // 楽曲がない場合、アップロードサイトへの誘導
        showScreen('uploadPage');
        
        // より親切なメッセージと誘導
        const uploadMessage = `
🎵 楽曲が見つかりませんでした

以下の方法で楽曲を追加できます：

1. 専用アップロードサイトを使用:
   https://uploud-site.vercel.app/

2. このページの「UPLOAD MUSIC」ボタンから
   MP3ファイルを直接アップロード

アップロード後、自動的に他のデバイスでも
楽曲が利用できるようになります。
        `;
        
        // カスタム通知を表示
        showDetailedNotification(uploadMessage);
    }
}

// トップページへ戻る
function showTopPage() {
    showScreen('topPage');
    selectedSong = null;
    selectedDifficulty = 'easy';
}

// アップロードモードを表示
function showUploadMode() {
    showScreen('uploadPage');
}

// 設定画面を表示
function showOptions() {
    showScreen('optionsPage');
    loadOptionValues();
}

// 楽曲リストを読み込み表示
function loadSongList() {
    const songListContainer = document.getElementById('songList');
    songListContainer.innerHTML = '';
    
    const songs = getAllSongs();
    
    if (songs.length === 0) {
        songListContainer.innerHTML = '<div class="no-songs">アップロードされた楽曲がありません</div>';
        return;
    }
    
    songs.forEach(song => {
        const songElement = document.createElement('div');
        songElement.className = 'song-item';
        songElement.dataset.songId = song.id;
        
        songElement.innerHTML = `
            <div class="song-title">${song.title}</div>
            <div class="song-artist">${song.artist}</div>
            <div class="song-meta">
                <span>BPM: ${song.bpm}</span>
                <span>${song.genre}</span>
                <span>${Math.floor(song.duration / 60)}:${String(song.duration % 60).padStart(2, '0')}</span>
            </div>
        `;
        
        songElement.addEventListener('click', () => selectSong(song.id));
        songListContainer.appendChild(songElement);
    });
    
    // 最初の楽曲を自動選択
    if (songs.length > 0) {
        selectSong(songs[0].id);
    }
}

// 楽曲選択処理
function selectSong(songId) {
    // 以前の選択をリセット
    document.querySelectorAll('.song-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // 新しい選択をマーク
    const songElement = document.querySelector(`[data-song-id="${songId}"]`);
    if (songElement) {
        songElement.classList.add('selected');
    }
    
    // 楽曲情報を取得して表示
    selectedSong = getSongById(songId);
    if (selectedSong) {
        updateSongDetails(selectedSong);
        updateDifficultyButtons(selectedSong);
        
        // 楽曲の音声データを事前読み込み
        if (selectedSong.audioFile && !selectedSong.audioBuffer) {
            loadStaticAudioFile(selectedSong);
        } else if (selectedSong.isUploaded && selectedSong.audioData && !selectedSong.audioBuffer) {
            loadSongAudioData(selectedSong);
        }
        
        // スタートボタンを有効にする
        const startBtn = document.getElementById('startGameBtn');
        startBtn.disabled = false;
    }
}

// 楽曲詳細情報を更新
function updateSongDetails(song) {
    document.getElementById('selectedSongTitle').textContent = song.title;
    document.getElementById('selectedSongArtist').textContent = song.artist;
    document.getElementById('selectedSongInfo').textContent = 
        `${song.genre} | BPM: ${song.bpm} | ${Math.floor(song.duration / 60)}:${String(song.duration % 60).padStart(2, '0')}`;
    document.getElementById('selectedSongDescription').textContent = song.description || '';
}

// 難易度ボタンを更新
function updateDifficultyButtons(song) {
    const difficulties = ['easy', 'normal', 'hard'];
    
    difficulties.forEach(diff => {
        const button = document.querySelector(`[data-difficulty="${diff}"]`);
        const levelSpan = document.getElementById(`${diff}Level`);
        
        // 楽曲に対応する難易度データを取得（新しいキー名に対応）
        const difficultyData = song.difficulty[diff] || song.difficulty[getDifficultyMapping(diff)];
        
        if (difficultyData) {
            button.style.display = 'block';
            levelSpan.textContent = difficultyData.level;
            button.disabled = false;
        } else {
            button.style.display = 'block'; // 常に表示
            levelSpan.textContent = getDefaultLevel(diff);
            button.disabled = false;
        }
    });
    
    // デフォルトでeasy選択
    selectDifficulty('easy');
}

// 難易度マッピング（古いキー名から新しいキー名へ）
function getDifficultyMapping(newDiff) {
    const mapping = {
        'easy': 'beginner',
        'normal': 'normal', 
        'hard': 'hyper'
    };
    return mapping[newDiff] || newDiff;
}

// デフォルトレベルを取得
function getDefaultLevel(diff) {
    const defaultLevels = {
        'easy': 1,
        'normal': 5,
        'hard': 9
    };
    return defaultLevels[diff] || 1;
}

// 難易度選択
function selectDifficulty(difficulty) {
    // 以前の選択をリセット
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 新しい選択をマーク
    const diffBtn = document.querySelector(`[data-difficulty="${difficulty}"]`);
    if (diffBtn && !diffBtn.disabled) {
        diffBtn.classList.add('active');
        selectedDifficulty = difficulty;
    }
}

// 選択された楽曲でゲーム開始
function startSelectedSong() {
    if (!selectedSong || !selectedDifficulty) {
        alert('楽曲と難易度を選択してください。');
        return;
    }
    
    // 選択した楽曲にオーディオデータがない場合は復元を試みる
    if (!selectedSong.audioBuffer && selectedSong.audioData) {
        console.log('楽曲オーディオデータを復元中...');
        reloadAudioForSong(selectedSong, null).then(() => {
            proceedToGame();
        });
    } else {
        proceedToGame();
    }
}

// ゲーム画面への遷移処理
function proceedToGame() {
    // ゲーム画面に遷移
    showScreen('gamePage');
    
    // ゲーム情報を表示
    document.getElementById('currentSongDisplay').textContent = 
        `${selectedSong.title} - ${selectedSong.artist}`;
    document.getElementById('currentDifficultyDisplay').textContent = 
        `${selectedDifficulty.toUpperCase()} (Lv.${selectedSong.difficulty[selectedDifficulty].level})`;
    
    // シンプルなゲーム開始
    startSimpleGame(selectedSong, selectedDifficulty);
}

// ゲーム画面から楽曲選択に戻る
function quitToSongSelect() {
    if (gameInstance) {
        gameInstance.isPlaying = false;
        
        // 音楽を停止
        stopCurrentMusic();
        
        gameInstance = null;
    }
    showSongSelect();
}

// 現在再生中の音楽を停止
function stopCurrentMusic() {
    try {
        // アクティブなAudioContextをすべて停止
        if (window.currentAudioSources) {
            window.currentAudioSources.forEach(source => {
                if (source.stop) {
                    source.stop();
                }
                if (source.disconnect) {
                    source.disconnect();
                }
            });
            window.currentAudioSources = [];
        }
        
        // 既存のオーディオソースを停止
        if (window.currentAudioSource) {
            if (window.currentAudioSource.stop) {
                window.currentAudioSource.stop();
            }
            if (window.currentAudioSource.disconnect) {
                window.currentAudioSource.disconnect();
            }
            window.currentAudioSource = null;
        }
        
        console.log('音楽を停止しました');
        
    } catch (error) {
        console.error('音楽停止エラー:', error);
    }
}

// シンプルなゲーム開始
function startSimpleGame(song, difficulty) {
    try {
        // スコア表示をリセット
        document.getElementById('score').textContent = '0';
        document.getElementById('combo').textContent = '0';
        document.getElementById('judgment').textContent = '';
        
        // キャンバス要素を取得
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        
        console.log(`ゲーム開始: ${song.title} - ${difficulty}`);
        
        // ゲーム状態を初期化
        gameInstance = {
            isPlaying: true,
            startTime: Date.now(),
            song: song,
            difficulty: difficulty,
            notes: [],
            score: 0,
            combo: 0,
            canvas: canvas,
            ctx: ctx,
            laneWidth: 70,
            laneCount: 6,
            startX: (canvas.width - (6 * 70)) / 2,
            judgeLineY: canvas.height - 100,
            activeKeys: new Set()
        };
        
        // 音楽を開始（アップロードされた実際の音楽を再生）
        startUploadedMusic(song);
        
        // ノーツを生成
        generateSimpleNotes(gameInstance);
        
        // ゲームループを開始
        gameLoop();
        
        console.log('シンプルゲームを開始しました');
        
    } catch (error) {
        console.error('シンプルゲーム開始エラー:', error);
        alert('ゲームの開始に失敗しました。');
        showScreen('topPage');
    }
}

// アップロードされた音楽を再生
async function startUploadedMusic(song) {
    try {
        console.log('音楽再生開始:', song.title);
        
        // 既存の音楽を停止
        stopCurrentMusic();
        
        // 静的ファイルから音声を読み込み
        if (song.audioFile && !song.audioBuffer) {
            console.log('静的音声ファイルを読み込み中:', song.audioFile);
            await loadStaticAudioFile(song);
        }
        // フォールバック: Base64データから読み込み
        else if (!song.audioBuffer && song.audioData) {
            console.log('音声データを読み込み中...');
            await loadSongAudioData(song);
        }
        
        if (song.audioBuffer) {
            // アップロードされたオーディオバッファを使用
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }
            
            const source = audioContext.createBufferSource();
            source.buffer = song.audioBuffer;
            source.connect(audioContext.destination);
            
            // グローバルに保存して後で停止できるようにする
            window.currentAudioSource = source;
            
            // 音楽を開始
            source.start(0);
            
            console.log(`実際の音楽を再生開始: ${song.title}`);
            
        } else {
            console.log('オーディオバッファが見つかりません。代替音楽を使用します。');
            // フォールバック：シンプルな音楽を生成
            playTestBeep(audioContext);
        }
        
    } catch (error) {
        console.error('アップロード音楽再生エラー:', error);
        console.log('音楽なしでゲームを続行します');
    }
}

// 静的音声ファイルを読み込む
async function loadStaticAudioFile(song) {
    try {
        const audioUrl = `./audio/${song.audioFile}`;
        console.log('Loading static audio file:', audioUrl);
        
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        const response = await fetch(audioUrl);
        if (!response.ok) {
            throw new Error(`Failed to load audio file: ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        song.audioBuffer = audioBuffer;
        console.log('静的音声ファイル読み込み完了:', song.title, audioBuffer.duration + 's');
        
    } catch (error) {
        console.error('静的音声ファイル読み込みエラー:', error);
        console.log('フォールバック: プロシージャル音楽を使用します');
    }
}

// 楽曲の音声データを読み込む（Base64フォールバック）
async function loadSongAudioData(song) {
    try {
        if (song.audioData) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const audioBuffer = await base64ToAudioBuffer(song.audioData, audioContext);
            song.audioBuffer = audioBuffer;
            console.log('Base64データから音声を復元しました:', song.title);
        }
    } catch (error) {
        console.error('音声データ読み込みエラー:', error);
    }
}

// テスト用ビープ音
function playTestBeep(audioContext) {
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 1000;
        gainNode.gain.value = 0.3;
        
        const now = audioContext.currentTime;
        oscillator.start(now);
        oscillator.stop(now + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        console.log('テストビープ音を再生しました');
        
    } catch (error) {
        console.error('テストビープ音エラー:', error);
    }
}

// リズムトラックの再生
function playRhythmTrack(audioContext, bpm, duration) {
    try {
        console.log('リズムトラック開始...');
        const beatsPerSecond = bpm / 60;
        const totalBeats = Math.floor(duration * beatsPerSecond / 4); // 4拍ごとに制限
        
        // 音源を配列で管理
        if (!window.currentAudioSources) {
            window.currentAudioSources = [];
        }
        
        for (let beat = 0; beat < totalBeats; beat++) {
            const time = audioContext.currentTime + (beat * 4 / beatsPerSecond); // 4拍ごと
            
            // ビート音を生成
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // キック音風の低音
            oscillator.frequency.value = 100;
            oscillator.type = 'square';
            gainNode.gain.value = 0.4;
            
            // 音源を配列に追加（停止用）
            window.currentAudioSources.push(oscillator);
            
            oscillator.start(time);
            oscillator.stop(time + 0.3);
            
            // フェードアウト
            gainNode.gain.setValueAtTime(0.4, time);
            gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
            
            console.log(`ビート ${beat + 1}/${totalBeats} 再生時刻: ${time.toFixed(2)}秒`);
        }
        
        console.log(`リズムトラック設定完了: ${totalBeats}拍`);
        
    } catch (error) {
        console.error('リズムトラック エラー:', error);
    }
}

// シンプルなノーツ生成
function generateSimpleNotes(game) {
    const bpm = game.song.bpm;
    const duration = game.song.duration;
    const beatsPerSecond = bpm / 60;
    const totalBeats = Math.floor(duration * beatsPerSecond);
    
    // 難易度に応じたノーツ密度
    const densityMap = {
        easy: 0.4,
        normal: 0.6,
        hard: 0.8,
        // 旧キー名サポート
        beginner: 0.4,
        hyper: 0.8
    };
    const density = densityMap[game.difficulty] || 0.4;
    
    for (let beat = 0; beat < totalBeats; beat++) {
        if (Math.random() < density) {
            const lane = Math.floor(Math.random() * 6);
            const time = (beat / beatsPerSecond) * 1000; // ミリ秒
            
            game.notes.push({
                lane: lane,
                time: time,
                y: -50,
                hit: false
            });
        }
    }
    
    console.log(`${game.notes.length}個のノーツを生成しました`);
}

// ゲームループ
function gameLoop() {
    if (!gameInstance || !gameInstance.isPlaying) return;
    
    const currentTime = Date.now() - gameInstance.startTime;
    const ctx = gameInstance.ctx;
    const canvas = gameInstance.canvas;
    
    // 画面をクリア
    ctx.fillStyle = '#001133';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // レーンを描画
    drawLanes(gameInstance);
    
    // ノーツを更新・描画
    updateAndDrawNotes(gameInstance, currentTime);
    
    // 次のフレーム
    requestAnimationFrame(gameLoop);
}

// レーン描画
function drawLanes(game) {
    const ctx = game.ctx;
    const keyLabels = ['S', 'D', 'F', 'J', 'K', 'L'];
    const laneColors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#ff8844'];
    
    for (let i = 0; i < game.laneCount; i++) {
        const x = game.startX + (i * game.laneWidth);
        const isPressed = game.activeKeys.has(i);
        
        // レーン境界
        ctx.strokeStyle = isPressed ? '#ffffff' : '#444444';
        ctx.lineWidth = isPressed ? 4 : 2;
        ctx.strokeRect(x, 0, game.laneWidth, game.canvas.height);
        
        // レーンの背景（キーが押されている時）
        if (isPressed) {
            ctx.fillStyle = laneColors[i] + '40'; // 透明度40
            ctx.fillRect(x, 0, game.laneWidth, game.canvas.height);
        }
        
        // 判定ライン
        ctx.strokeStyle = isPressed ? laneColors[i] : '#00ffff';
        ctx.lineWidth = 4;
        ctx.strokeRect(x, game.judgeLineY, game.laneWidth, 50);
        
        // 判定ライン背景
        ctx.fillStyle = isPressed ? laneColors[i] + '80' : 'rgba(0, 255, 255, 0.3)';
        ctx.fillRect(x, game.judgeLineY, game.laneWidth, 50);
        
        // キー表示
        ctx.fillStyle = isPressed ? '#000000' : '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(keyLabels[i], x + game.laneWidth / 2, game.judgeLineY + 35);
    }
}

// ノーツ更新・描画
function updateAndDrawNotes(game, currentTime) {
    const ctx = game.ctx;
    const noteSpeed = 200; // ピクセル/秒
    
    game.notes.forEach(note => {
        if (note.hit) return;
        
        // ノーツの位置を更新
        const noteAge = currentTime - note.time;
        note.y = noteAge * (noteSpeed / 1000);
        
        // ノーツが画面内にある場合のみ描画
        if (note.y > -50 && note.y < game.canvas.height + 50) {
            const x = game.startX + (note.lane * game.laneWidth) + 10;
            
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(x, note.y, game.laneWidth - 20, 30);
            
            // ノーツの枠線
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, note.y, game.laneWidth - 20, 30);
        }
        
        // ノーツが判定ラインを通過した場合の処理
        if (note.y > game.judgeLineY + 100 && !note.hit) {
            note.hit = true;
            // Miss判定
            showJudgment('MISS');
        }
    });
}

// 判定表示
function showJudgment(judgment) {
    const judgmentElement = document.getElementById('judgment');
    judgmentElement.textContent = judgment;
    judgmentElement.className = `judgment ${judgment.toLowerCase()}`;
    
    setTimeout(() => {
        judgmentElement.textContent = '';
        judgmentElement.className = 'judgment';
    }, 500);
}

// 設定値の読み込み
function loadOptionValues() {
    // ローカルストレージから設定値を読み込み
    const timingOffset = localStorage.getItem('timingOffset') || '0';
    const noteSpeed = localStorage.getItem('noteSpeed') || '200';
    
    document.getElementById('timingOffset').value = timingOffset;
    document.getElementById('noteSpeed').value = noteSpeed;
    document.getElementById('timingValue').textContent = `${timingOffset}ms`;
    document.getElementById('speedValue').textContent = noteSpeed;
}

// 設定値の保存
function saveOptionValues() {
    const timingOffset = document.getElementById('timingOffset').value;
    const noteSpeed = document.getElementById('noteSpeed').value;
    
    localStorage.setItem('timingOffset', timingOffset);
    localStorage.setItem('noteSpeed', noteSpeed);
}

// イベントリスナーの設定
document.addEventListener('DOMContentLoaded', function() {
    // 難易度ボタンのイベントリスナー
    document.querySelectorAll('.diff-btn').forEach(button => {
        button.addEventListener('click', function() {
            const difficulty = this.dataset.difficulty;
            selectDifficulty(difficulty);
        });
    });
    
    // 設定画面のスライダーイベントリスナー
    const timingSlider = document.getElementById('timingOffset');
    const speedSlider = document.getElementById('noteSpeed');
    
    if (timingSlider) {
        timingSlider.addEventListener('input', function() {
            document.getElementById('timingValue').textContent = `${this.value}ms`;
            saveOptionValues();
        });
    }
    
    if (speedSlider) {
        speedSlider.addEventListener('input', function() {
            document.getElementById('speedValue').textContent = this.value;
            saveOptionValues();
        });
    }
    
    // アップロード機能（既存のコードと統合）
    const audioUpload = document.getElementById('audioUpload');
    if (audioUpload) {
        audioUpload.addEventListener('change', handleAudioUpload);
    }
    
    // キーボードイベント（ゲーム中のキー操作）
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
});

// MP3アップロード処理（永続化対応）
async function handleAudioUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const status = document.getElementById('uploadStatus');
    status.textContent = 'ファイルを処理中...';
    status.className = 'upload-status processing';
    
    try {
        console.log('アップロード開始:', file.name);
        
        // 既に同じファイルがアップロード済みかチェック
        const existingSong = SONG_DATABASE.find(song => song.title === file.name.replace('.mp3', ''));
        if (existingSong) {
            status.textContent = `${file.name} は既にアップロード済みです`;
            status.className = 'upload-status success';
            
            // 既存の楽曲で楽曲選択画面に戻る
            setTimeout(() => {
                reloadAudioForSong(existingSong, file);
                showSongSelect();
            }, 1000);
            return;
        }
        
        // オーディオファイルを読み込み
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // オーディオデータをBase64に変換して保存
        const audioBase64 = await arrayBufferToBase64(arrayBuffer);
        
        // BPM検出（簡易版）
        const duration = audioBuffer.duration;
        const bpm = estimateBPM(audioBuffer) || 120;
        
        // 楽曲データを作成
        const songData = {
            id: `uploaded_${Date.now()}`,
            title: file.name.replace('.mp3', ''),
            artist: 'Uploaded',
            genre: 'Custom',
            bpm: bpm,
            duration: Math.floor(duration),
            difficulty: {
                easy: { level: 2, notes: Math.floor(duration * bpm / 60 * 0.4) },
                normal: { level: 5, notes: Math.floor(duration * bpm / 60 * 0.6) },
                hard: { level: 8, notes: Math.floor(duration * bpm / 60 * 0.8) }
            },
            audioFile: file,
            audioBuffer: audioBuffer,
            audioData: audioBase64, // 永続化用のBase64データ
            chartData: null,
            description: 'アップロードされた楽曲',
            colorTheme: {
                primary: '#00ffff',
                secondary: '#0088cc',
                accent: '#44aaff'
            }
        };
        
        // データベースに追加（自動保存される）
        addSong(songData);
        
        status.textContent = `アップロード完了！ (${file.name})`;
        status.className = 'upload-status success';
        
        console.log('楽曲追加完了:', songData.title);
        
        // 2秒後に楽曲選択画面に戻る
        setTimeout(() => {
            showSongSelect();
        }, 2000);
        
    } catch (error) {
        console.error('アップロードエラー:', error);
        status.textContent = 'アップロードに失敗しました。';
        status.className = 'upload-status error';
    }
}

// ArrayBufferをBase64に変換
function arrayBufferToBase64(buffer) {
    return new Promise((resolve) => {
        const blob = new Blob([buffer]);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(blob);
    });
}

// Base64からAudioBufferに変換
async function base64ToAudioBuffer(base64Data, audioContext) {
    try {
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return await audioContext.decodeAudioData(bytes.buffer);
    } catch (error) {
        console.error('Base64からAudioBuffer変換エラー:', error);
        return null;
    }
}

// 保存された楽曲のオーディオを再読み込み
async function reloadAudioForSong(song, file) {
    try {
        if (file) {
            // ファイルから直接読み込み
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            song.audioFile = file;
            song.audioBuffer = audioBuffer;
            console.log('楽曲オーディオを再読み込みしました:', song.title);
        } else if (song.audioData) {
            // Base64データから復元
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const audioBuffer = await base64ToAudioBuffer(song.audioData, audioContext);
            
            song.audioBuffer = audioBuffer;
            console.log('保存データから楽曲オーディオを復元しました:', song.title);
        }
    } catch (error) {
        console.error('オーディオ再読み込みエラー:', error);
    }
}

// 簡易BPM検出
function estimateBPM(audioBuffer) {
    try {
        // サンプルレートと長さを取得
        const sampleRate = audioBuffer.sampleRate;
        const length = audioBuffer.length;
        
        // モノラルデータを取得
        const channelData = audioBuffer.getChannelData(0);
        
        // エネルギー計算（簡易版）
        const windowSize = Math.floor(sampleRate * 0.1); // 100msウィンドウ
        const windows = Math.floor(length / windowSize);
        const energies = [];
        
        for (let i = 0; i < windows; i++) {
            let energy = 0;
            const start = i * windowSize;
            const end = Math.min(start + windowSize, length);
            
            for (let j = start; j < end; j++) {
                energy += Math.abs(channelData[j]);
            }
            
            energies.push(energy / windowSize);
        }
        
        // 一般的なBPM範囲を想定
        const bpmRange = [80, 90, 100, 110, 120, 128, 140, 150, 160, 170, 180];
        return bpmRange[Math.floor(Math.random() * bpmRange.length)];
        
    } catch (error) {
        console.error('BPM検出エラー:', error);
        return 120; // デフォルトBPM
    }
}

// キー操作処理
function handleKeyDown(event) {
    if (currentScreen === 'gamePage' && gameInstance) {
        const keyMap = {
            'KeyS': 0,
            'KeyD': 1,
            'KeyF': 2,
            'KeyJ': 3,
            'KeyK': 4,
            'KeyL': 5
        };
        
        const lane = keyMap[event.code];
        console.log('キー押下:', event.code, '→ レーン:', lane);
        
        if (lane !== undefined && !gameInstance.activeKeys.has(lane)) {
            gameInstance.activeKeys.add(lane);
            console.log('レーン', lane, 'がアクティブになりました');
            checkNoteHit(lane);
        }
    }
}

function handleKeyUp(event) {
    if (currentScreen === 'gamePage' && gameInstance) {
        const keyMap = {
            'KeyS': 0,
            'KeyD': 1,
            'KeyF': 2,
            'KeyJ': 3,
            'KeyK': 4,
            'KeyL': 5
        };
        
        const lane = keyMap[event.code];
        console.log('キー離し:', event.code, '→ レーン:', lane);
        
        if (lane !== undefined) {
            gameInstance.activeKeys.delete(lane);
            console.log('レーン', lane, 'が非アクティブになりました');
        }
    }
}

// ノーツヒット判定（位置ベース）
function checkNoteHit(lane) {
    if (!gameInstance) return;
    
    console.log(`レーン ${lane} でヒット判定チェック`);
    
    // 該当するレーンのノーツを確認（位置ベース）
    let nearestNote = null;
    let nearestDistance = Infinity;
    
    for (let note of gameInstance.notes) {
        if (note.lane === lane && !note.hit) {
            // ノーツの中心位置と判定ラインの中心位置の距離を計算
            const noteCenter = note.y + 15; // ノーツの高さ30の中心
            const judgeCenter = gameInstance.judgeLineY + 25; // 判定ラインの高さ50の中心
            const distance = Math.abs(noteCenter - judgeCenter);
            
            console.log(`ノーツ位置確認: レーン${lane}, ノーツY=${note.y}, 判定ラインY=${gameInstance.judgeLineY}, 距離=${distance}px`);
            
            // 判定ウィンドウ内にあり、最も近いノーツを選択
            if (distance <= 100 && distance < nearestDistance) { // 100px以内
                nearestNote = note;
                nearestDistance = distance;
            }
        }
    }
    
    if (nearestNote) {
        nearestNote.hit = true;
        
        // 位置に基づく判定を決定
        let judgment;
        if (nearestDistance <= 15) {
            judgment = 'PERFECT';
            gameInstance.score += 100;
        } else if (nearestDistance <= 30) {
            judgment = 'GREAT';
            gameInstance.score += 80;
        } else if (nearestDistance <= 50) {
            judgment = 'GOOD';
            gameInstance.score += 50;
        } else {
            judgment = 'BAD';
            gameInstance.score += 20;
        }
        
        gameInstance.combo++;
        updateScore();
        showJudgment(judgment);
        
        console.log(`ヒット！距離: ${nearestDistance}px, 判定: ${judgment}, スコア: ${gameInstance.score}, コンボ: ${gameInstance.combo}`);
    } else {
        console.log(`レーン ${lane} にヒット可能なノーツがありません`);
        // デバッグ用：キーを押した時の視覚的フィードバック
        showJudgment('KEY');
    }
}

// スコア更新
function updateScore() {
    if (gameInstance) {
        document.getElementById('score').textContent = gameInstance.score;
        document.getElementById('combo').textContent = gameInstance.combo;
    }
}

// 楽曲データ拡張関数（開発者用）
function addCustomSong(songData) {
    const success = addSong(songData);
    if (success && currentScreen === 'songSelectPage') {
        loadSongList();
    }
    return success;
}

// 楽曲データをエクスポート（他の人と共有用）
function exportSongData() {
    const exportData = {
        songs: getAllSongs().map(song => ({
            id: song.id,
            title: song.title,
            artist: song.artist,
            genre: song.genre,
            bpm: song.bpm,
            duration: song.duration,
            difficulty: song.difficulty,
            description: song.description,
            colorTheme: song.colorTheme,
            // audioDataは著作権の問題で除外
        })),
        exportedAt: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'beatmania-songs.json';
    link.click();
    
    console.log('楽曲データをエクスポートしました');
}

// 楽曲データをインポート（他の人からの共有を受け取り）
function importSongData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const importData = JSON.parse(text);
            
            if (!importData.songs || !Array.isArray(importData.songs)) {
                throw new Error('無効なファイル形式です');
            }
            
            let importedCount = 0;
            importData.songs.forEach(songData => {
                // 既存の楽曲と重複チェック
                const existingSong = getSongById(songData.id);
                if (!existingSong) {
                    addSong(songData);
                    importedCount++;
                }
            });
            
            alert(`${importedCount}曲をインポートしました！\n※音声ファイルは含まれていないため、各楽曲を個別にアップロードしてください。`);
            
            if (currentScreen === 'songSelectPage') {
                loadSongList();
            }
            
        } catch (error) {
            console.error('インポートエラー:', error);
            alert('ファイルの読み込みに失敗しました。');
        }
    };
    
    input.click();
}

// 共有楽曲を読み込み（クロスドメイン API連携）
async function loadSharedSongs() {
    try {
        // shared-songs.jsonから楽曲データを読み込み
        try {
            const response = await fetch('./shared-songs.json');
            if (response.ok) {
                const data = await response.json();
                let staticLoadedCount = 0;
                
                data.songs.forEach(songData => {
                    const existingSong = getSongById(songData.id);
                    if (!existingSong) {
                        addSong(songData);
                        staticLoadedCount++;
                    }
                });
                
                if (staticLoadedCount > 0) {
                    console.log(`🎵 shared-songs.jsonから ${staticLoadedCount}曲を読み込みました`);
                }
            }
        } catch (error) {
            console.warn('shared-songs.json読み込みエラー:', error);
        }
        
        // ローカルストレージから読み込み（従来の方法）
        const localSharedSongs = JSON.parse(localStorage.getItem('sharedSongs') || '[]');
        let localLoadedCount = 0;
        
        localSharedSongs.forEach(songData => {
            const existingSong = getSongById(songData.id);
            if (!existingSong) {
                addSong(songData);
                localLoadedCount++;
            }
        });
        
        if (localLoadedCount > 0) {
            console.log(`🎵 ローカルストレージから ${localLoadedCount}曲を読み込みました`);
            localStorage.removeItem('sharedSongs');
        }
        
        // 共有APIから楽曲を取得
        await fetchSharedSongsFromAPI();
        
    } catch (error) {
        console.error('共有楽曲読み込みエラー:', error);
    }
}

// クラウドから共有楽曲を取得
async function fetchSharedSongsFromAPI() {
    try {
        await fetchFromJSONStorageAPI();
    } catch (error) {
        console.warn('クラウド楽曲取得エラー（ローカルのみ動作）:', error.message);
    }
}

// JSON Storage APIから楽曲を取得（JSONBin.io使用）
async function fetchFromJSONStorageAPI() {
    const API_URL = 'https://api.jsonbin.io/v3/b/67758d6ae41b4d34e459c8a2/latest';
    
    try {
        console.log('🌐 クラウドから楽曲データを取得中...');
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'X-JSON-Path': '$.songs'
            }
        });
        
        if (!response.ok) {
            throw new Error(`JSONBin API Error: ${response.status}`);
        }
        
        const data = await response.json();
        let apiLoadedCount = 0;
        
        // JSONBin.io のレスポンス構造に対応
        const songs = data.record || data.songs || [];
        const metadata = data.metadata || data;
        
        if (Array.isArray(songs)) {
            // 最後同期時刻をチェック（増分同期）
            const lastSync = localStorage.getItem('lastSyncTime');
            const songsToLoad = lastSync 
                ? songs.filter(song => new Date(song.uploadedAt) > new Date(lastSync))
                : songs;
            
            songsToLoad.forEach(songData => {
                const existingSong = getSongById(songData.id);
                if (!existingSong) {
                    addSong(songData);
                    apiLoadedCount++;
                    console.log(`🆕 新楽曲追加: ${songData.title}`);
                }
            });
            
            if (apiLoadedCount > 0) {
                console.log(`🌐 クラウドから ${apiLoadedCount}曲を読み込みました`);
                showNotification(`🎵 ${apiLoadedCount}曲の新しい楽曲を同期しました`);
                
                // 楽曲選択画面を更新
                if (currentScreen === 'songSelectPage') {
                    loadSongList();
                }
            } else {
                console.log('🔄 クラウドデータは最新です');
            }
            
            // 最後同期時刻を更新
            localStorage.setItem('lastSyncTime', metadata.lastUpdated || new Date().toISOString());
            
            console.log(`📊 クラウドの総楽曲数: ${songs.length}曲`);
        }
        
    } catch (error) {
        console.warn('JSON Storage API取得エラー:', error.message);
        // フォールバック: 代替クラウドサービス
        await fetchFromFallbackCloud();
    }
}

// フォールバック: 代替クラウドサービスから取得
async function fetchFromFallbackCloud() {
    try {
        // GitHub Pages 静的JSON（読み取り専用）
        const FALLBACK_URL = 'https://beatmania-community.github.io/shared-songs/songs.json';
        
        const response = await fetch(FALLBACK_URL, {
            method: 'GET',
            cache: 'no-cache'
        });
        
        if (response.ok) {
            const data = await response.json();
            let fallbackLoadedCount = 0;
            
            if (data.songs && Array.isArray(data.songs)) {
                data.songs.forEach(songData => {
                    const existingSong = getSongById(songData.id);
                    if (!existingSong) {
                        addSong(songData);
                        fallbackLoadedCount++;
                    }
                });
                
                if (fallbackLoadedCount > 0) {
                    console.log(`🔄 フォールバックから ${fallbackLoadedCount}曲を読み込みました`);
                    showNotification(`📥 ${fallbackLoadedCount}曲をフォールバックから同期`);
                }
            }
        }
        
    } catch (error) {
        console.log('フォールバックも利用できません:', error.message);
    }
}

// アップロードサイトからの通知を受信
function setupCrossSiteMessaging() {
    window.addEventListener('message', function(event) {
        if (event.data.type === 'NEW_SONG_UPLOADED') {
            const songData = event.data.songData;
            
            // 楽曲を追加
            addSong(songData);
            
            // 楽曲選択画面にいる場合は更新
            if (currentScreen === 'songSelectPage') {
                loadSongList();
            }
            
            console.log(`🆕 新しい楽曲が追加されました: ${songData.title}`);
            
            // 通知表示
            showNotification(`🎵 新楽曲追加: ${songData.title}`);
        }
    });
}

// 通知表示
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #00aa00, #006600);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        border: 2px solid #00ff00;
        box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
        font-weight: bold;
        z-index: 10000;
        animation: slideIn 0.5s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 3秒後に自動削除
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    }, 3000);
}

// 詳細通知表示（長いメッセージ用）
function showDetailedNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 20, 60, 0.95);
        color: white;
        padding: 30px;
        border-radius: 15px;
        border: 3px solid #0088ff;
        box-shadow: 0 0 30px rgba(0, 136, 255, 0.7);
        font-family: monospace;
        font-size: 14px;
        line-height: 1.5;
        white-space: pre-line;
        max-width: 500px;
        z-index: 10000;
        animation: fadeIn 0.5s ease-out;
    `;
    notification.innerHTML = message + '<br><br><small>クリックして閉じる</small>';
    
    // クリックで閉じる
    notification.addEventListener('click', () => {
        notification.style.animation = 'fadeOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
    
    document.body.appendChild(notification);
    
    // 10秒後に自動削除
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'fadeOut 0.5s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }
    }, 10000);
}

// 初期化処理（非同期対応）
async function initializeApp() {
    console.log('🎮 BEATMANIA STYLE アプリ初期化開始');
    
    // 保存された楽曲データを読み込み
    loadSongsFromStorage();
    
    // 共有楽曲を読み込み（アップロードサイト連携）
    await loadSharedSongs();
    
    // クロスサイト通信を設定
    setupCrossSiteMessaging();
    
    // 自動楽曲検出システムを開始
    if (typeof startAutoSongDiscovery === 'function') {
        console.log('🤖 自動楽曲検出システム開始');
        setTimeout(startAutoSongDiscovery, 2000); // 2秒後に開始
    }
    
    // 定期的な同期を設定（10秒間隔で新楽曲をチェック）
    setInterval(async () => {
        console.log('🔄 クラウド同期チェック...');
        await fetchSharedSongsFromAPI();
    }, 10 * 1000);
    
    // 最初はトップページを表示
    showScreen('topPage');
    
    // 楽曲データベースをコンソールに出力（開発者用）
    console.log('利用可能な楽曲:', getAllSongs());
    console.log('楽曲追加は addCustomSong() 関数を使用してください。');
    console.log('楽曲共有: exportSongData() でエクスポート、importSongData() でインポート');
    console.log('🌐 アップロードサイト: https://uploud-site.vercel.app/');
    console.log('🎮 ゲームサイト: https://musicgame-jet.vercel.app/');
    
    // 保存された楽曲があることを通知
    if (SONG_DATABASE.length > 0) {
        console.log(`${SONG_DATABASE.length}曲の保存された楽曲があります`);
        showNotification(`💿 ${SONG_DATABASE.length}曲読み込み完了`);
    }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', initializeApp);