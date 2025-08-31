class BeatmaniaGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.comboElement = document.getElementById('combo');
        this.judgmentElement = document.getElementById('judgment');
        
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.startTime = 0;
        this.currentTime = 0;
        
        this.lanes = [
            { key: 'KeyS', x: 150, color: '#ff4444' },
            { key: 'KeyD', x: 220, color: '#44ff44' },
            { key: 'KeyF', x: 290, color: '#4444ff' },
            { key: 'KeyJ', x: 360, color: '#ffff44' },
            { key: 'KeyK', x: 430, color: '#ff44ff' },
            { key: 'KeyL', x: 500, color: '#ff8844' }
        ];
        
        this.notes = [];
        this.activeKeys = new Set();
        this.noteSpeed = 200;
        this.judgeLineY = 400;
        this.keyboardY = 430;
        this.judgeWindow = {
            perfect: 50,
            great: 100,
            good: 150,
            bad: 200
        };
        
        this.audioContext = null;
        this.audioBuffer = null;
        this.audioSource = null;
        this.uploadedAudio = null;
        this.currentBPM = 120;
        
        // アップロードした楽曲のストック
        this.uploadedSongs = [];
        this.currentSongIndex = -1; // -1 = サンプル曲, 0以上 = アップロード曲
        
        this.currentLevel = 'easy';
        this.charts = {
            easy: [],
            normal: [],
            hard: []
        };
        
        this.generateCharts();
        this.init();
    }
    
    init() {
        console.log('=== Game Initialization ===');
        console.log('Setting up event listeners...');
        this.setupEventListeners();
        
        console.log('Setting up audio context...');
        this.setupAudio();
        
        console.log('Starting game loop...');
        this.startGameLoop();
        
        console.log('Drawing initial screen...');
        // 初期画面を描画
        this.drawLanes();
        this.drawJudgeLine();
        this.drawKeyboards();
        
        console.log('Game initialization complete');
    }
    
    setupEventListeners() {
        // 新しい構造の要素が存在するかチェックしてからイベントリスナーを追加
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const resetBtn = document.getElementById('resetBtn');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startGame());
        }
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.pauseGame());
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetGame());
        }
        
        // キーボードイベントは常に設定
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // レベルボタンがあればイベントリスナーを追加
        const levelBtns = document.querySelectorAll('.level-btn');
        levelBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.selectLevel(e.target.dataset.level));
        });
        
        // アップロード要素は新しい構造では別途処理されるので、ここでは設定しない
        console.log('Event listeners setup completed for available elements');
        
        // 楽曲選択のイベントリスナー
        document.addEventListener('click', (e) => {
            if (e.target.closest('.song-item')) {
                const songItem = e.target.closest('.song-item');
                if (e.target.classList.contains('delete-btn')) {
                    this.deleteSong(parseInt(songItem.dataset.song));
                } else {
                    this.selectSong(parseInt(songItem.dataset.song));
                }
            }
        });
    }
    
    selectLevel(level) {
        this.currentLevel = level;
        
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-level="${level}"]`).classList.add('active');
    }
    
    selectSong(songIndex) {
        console.log('Selecting song:', songIndex);
        this.currentSongIndex = songIndex;
        
        // 楽曲リストの選択状態を更新
        document.querySelectorAll('.song-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-song="${songIndex}"]`).classList.add('active');
        
        // 選択された楽曲に応じてオーディオと譜面を設定
        if (songIndex === -1) {
            // サンプル曲
            this.uploadedAudio = null;
            this.currentBPM = 120;
            this.generateCharts(); // デフォルト譜面
        } else {
            // アップロードされた曲
            const song = this.uploadedSongs[songIndex];
            this.uploadedAudio = song.audioBuffer;
            this.currentBPM = song.bpm;
            this.charts = { ...song.charts };
        }
        
        console.log(`Selected: ${songIndex === -1 ? 'Sample Song' : this.uploadedSongs[songIndex].name}`);
    }
    
    addSongToLibrary(songData) {
        this.uploadedSongs.push(songData);
        const songIndex = this.uploadedSongs.length - 1;
        
        // 楽曲リストに追加
        const songList = document.getElementById('songList');
        const songElement = document.createElement('div');
        songElement.className = 'song-item';
        songElement.dataset.song = songIndex;
        
        const duration = Math.floor(songData.duration / 60) + ':' + 
                        String(Math.floor(songData.duration % 60)).padStart(2, '0');
        
        songElement.innerHTML = `
            <div class="song-name">${songData.name}</div>
            <div class="song-info">${duration} | BPM: ${songData.bpm}</div>
            <button class="delete-btn">×</button>
        `;
        
        songList.appendChild(songElement);
        
        // 新しく追加した楽曲を選択
        this.selectSong(songIndex);
        
        console.log('Added song to library:', songData.name);
    }
    
    deleteSong(songIndex) {
        if (songIndex === -1) return; // サンプル曲は削除不可
        
        const song = this.uploadedSongs[songIndex];
        if (confirm(`"${song.name}" を削除しますか？`)) {
            // 配列から削除
            this.uploadedSongs.splice(songIndex, 1);
            
            // DOMから削除
            const songElement = document.querySelector(`[data-song="${songIndex}"]`);
            songElement.remove();
            
            // インデックスを更新
            this.updateSongIndices();
            
            // 削除した曲が選択されていた場合はサンプル曲に戻す
            if (this.currentSongIndex === songIndex) {
                this.selectSong(-1);
            } else if (this.currentSongIndex > songIndex) {
                this.currentSongIndex--;
            }
            
            console.log('Deleted song:', song.name);
        }
    }
    
    updateSongIndices() {
        document.querySelectorAll('.song-item').forEach((item, index) => {
            if (item.dataset.song !== '-1') {
                item.dataset.song = index - 1; // -1を除いた実際のインデックス
            }
        });
    }
    
    async handleAudioUpload(event) {
        console.log('=== Audio Upload Started ===');
        const file = event.target.files[0];
        
        if (!file) {
            console.log('No file selected');
            return;
        }
        
        console.log('Selected file:', file.name, file.type, file.size, 'bytes');
        
        const statusElement = document.getElementById('uploadStatus');
        statusElement.textContent = '音声を解析中...';
        statusElement.className = 'upload-status processing';
        
        try {
            console.log('Starting file processing...');
            
            // ファイルをArrayBufferとして読み込み
            console.log('Reading file as ArrayBuffer...');
            const arrayBuffer = await file.arrayBuffer();
            console.log('ArrayBuffer created, size:', arrayBuffer.byteLength);
            
            // Web Audio APIで音声データをデコード
            console.log('Creating AudioContext...');
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            console.log('AudioContext state:', this.audioContext.state);
            
            console.log('Decoding audio data...');
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            console.log('Audio decoded successfully:', audioBuffer.duration, 'seconds');
            this.uploadedAudio = audioBuffer;
            
            // BPMを検出
            console.log('Detecting BPM...');
            const detectedBPM = await this.detectBPM(audioBuffer);
            this.currentBPM = detectedBPM;
            console.log('BPM detected:', detectedBPM);
            
            // 楽曲用の譜面を生成
            const charts = {
                easy: [],
                normal: [],
                hard: []
            };
            
            // 一時的に譜面を生成
            this.generateSimpleChartsFromAudio(audioBuffer, detectedBPM);
            charts.easy = [...this.charts.easy];
            charts.normal = [...this.charts.normal];
            charts.hard = [...this.charts.hard];
            
            // 楽曲をライブラリに追加
            const songData = {
                name: file.name.replace(/\.[^/.]+$/, ''), // 拡張子を除去
                audioBuffer: audioBuffer,
                duration: audioBuffer.duration,
                bpm: detectedBPM,
                charts: charts
            };
            
            this.addSongToLibrary(songData);
            
            // デバッグ: 譜面生成結果を確認
            console.log('Generated charts:', {
                easy: charts.easy.length,
                normal: charts.normal.length,
                hard: charts.hard.length
            });
            
            let statusText = `${file.name} を追加しました！`;
            if (this.audioContext.state === 'suspended') {
                statusText += ' (STARTボタンで音声を有効化)';
            }
            
            statusElement.textContent = statusText;
            statusElement.className = 'upload-status success';
            
            // ファイル選択をクリア
            event.target.value = '';
            
        } catch (error) {
            console.error('=== Audio Upload Error ===');
            console.error('Error details:', error);
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Stack trace:', error.stack);
            
            statusElement.textContent = `エラー: ${error.message}`;
            statusElement.className = 'upload-status error';
            
            // エラーに応じた対処
            if (error.name === 'EncodingError') {
                statusElement.textContent = 'エラー: 音声ファイルの形式が対応していません';
            } else if (error.name === 'NotSupportedError') {
                statusElement.textContent = 'エラー: この音声形式はサポートされていません';
            }
        }
    }
    
    async detectBPM(audioBuffer) {
        const sampleRate = audioBuffer.sampleRate;
        const channelData = audioBuffer.getChannelData(0);
        
        // 簡単なBPM検出アルゴリズム
        const windowSize = Math.floor(sampleRate * 0.1); // 100ms窓
        const hopSize = Math.floor(windowSize / 4);
        
        // エネルギー変化を検出
        const energyChanges = [];
        for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
            let energy1 = 0, energy2 = 0;
            
            // 前半と後半のエネルギーを計算
            for (let j = 0; j < windowSize / 2; j++) {
                energy1 += Math.abs(channelData[i + j]);
                energy2 += Math.abs(channelData[i + windowSize / 2 + j]);
            }
            
            energyChanges.push(Math.abs(energy2 - energy1));
        }
        
        // ピークを検出してBPMを推定
        const peaks = this.findPeaks(energyChanges);
        const intervals = [];
        
        for (let i = 1; i < peaks.length; i++) {
            const interval = (peaks[i] - peaks[i-1]) * hopSize / sampleRate;
            if (interval > 0.3 && interval < 2.0) { // 30-200 BPMの範囲
                intervals.push(60 / interval);
            }
        }
        
        if (intervals.length > 0) {
            const avgBPM = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            return Math.round(Math.max(80, Math.min(180, avgBPM))); // 80-180 BPMに制限
        }
        
        return 120; // デフォルト値
    }
    
    findPeaks(data) {
        const peaks = [];
        const threshold = Math.max(...data) * 0.3; // しきい値を最大値の30%に設定
        
        for (let i = 1; i < data.length - 1; i++) {
            if (data[i] > data[i-1] && data[i] > data[i+1] && data[i] > threshold) {
                peaks.push(i);
            }
        }
        
        return peaks;
    }
    
    generateSimpleChartsFromAudio(audioBuffer, bpm) {
        const duration = audioBuffer.duration;
        console.log(`Generating simple charts for ${duration}s audio at ${bpm} BPM`);
        
        // シンプルな時間ベースの譜面生成
        this.charts.easy = this.generateSimpleChart(duration, bpm, 'easy');
        this.charts.normal = this.generateSimpleChart(duration, bpm, 'normal');
        this.charts.hard = this.generateSimpleChart(duration, bpm, 'hard');
    }
    
    generateSimpleChart(duration, bpm, difficulty) {
        const chart = [];
        const beatInterval = (60 / bpm) * 1000; // ミリ秒
        
        // 難易度別の設定
        const settings = {
            easy: { interval: beatInterval, density: 0.4 },
            normal: { interval: beatInterval * 0.5, density: 0.6 },
            hard: { interval: beatInterval * 0.25, density: 0.8 }
        };
        
        const config = settings[difficulty];
        
        for (let time = 1000; time < duration * 1000; time += config.interval) {
            if (Math.random() < config.density) {
                const lane = Math.floor(Math.random() * 6);
                chart.push({
                    time: time,
                    lane: lane,
                    type: 'normal'
                });
            }
        }
        
        console.log(`Generated ${chart.length} notes for ${difficulty} (${duration}s)`);
        return chart.sort((a, b) => a.time - b.time);
    }
    
    generateEmergencyChart() {
        console.log('Generating emergency chart...');
        const duration = this.uploadedAudio ? this.uploadedAudio.duration : 180;
        
        for (let level of ['easy', 'normal', 'hard']) {
            this.charts[level] = [];
            const noteCount = level === 'easy' ? 50 : level === 'normal' ? 100 : 150;
            
            for (let i = 0; i < noteCount; i++) {
                const time = (i * duration * 1000) / noteCount + 2000; // 2秒後から開始
                const lane = Math.floor(Math.random() * 6);
                
                this.charts[level].push({
                    time: time,
                    lane: lane,
                    type: 'normal'
                });
            }
            
            this.charts[level].sort((a, b) => a.time - b.time);
        }
    }
    
    generateChartsFromAudio(audioBuffer, bpm) {
        const duration = audioBuffer.duration;
        const beatInterval = (60 / bpm) * 1000;
        const totalBeats = (duration * 1000) / beatInterval;
        
        // 音声の振幅データを解析してノーツ配置を決める
        const channelData = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        const segmentSize = Math.floor(sampleRate * 60 / bpm / 4); // 16分音符相当
        
        // 各レベル用のパターンを生成
        this.charts.easy = this.generateChartFromAudio(audioBuffer, bpm, 'easy');
        this.charts.normal = this.generateChartFromAudio(audioBuffer, bpm, 'normal');
        this.charts.hard = this.generateChartFromAudio(audioBuffer, bpm, 'hard');
    }
    
    generateChartFromAudio(audioBuffer, bpm, difficulty) {
        const chart = [];
        const channelData = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        const duration = audioBuffer.duration;
        
        console.log(`Generating ${difficulty} chart for ${duration}s audio at ${bpm} BPM`);
        
        // 難易度設定
        const difficultySettings = {
            easy: { notePerBeat: 0.4, energyThreshold: 0.05, minInterval: 0.5 },
            normal: { notePerBeat: 0.6, energyThreshold: 0.03, minInterval: 0.25 },
            hard: { notePerBeat: 0.8, energyThreshold: 0.02, minInterval: 0.125 }
        };
        
        const settings = difficultySettings[difficulty];
        const segmentDuration = settings.minInterval; // より細かい間隔で解析
        const segmentSamples = Math.floor(sampleRate * segmentDuration);
        
        for (let time = 0; time < duration; time += segmentDuration) {
            const startSample = Math.floor(time * sampleRate);
            const endSample = Math.min(startSample + segmentSamples, channelData.length);
            
            // このセグメントのエネルギーを計算
            let energy = 0;
            for (let i = startSample; i < endSample; i++) {
                energy += Math.abs(channelData[i]);
            }
            energy /= (endSample - startSample);
            
            // エネルギーベースの判定 + ランダム要素
            const shouldPlaceNote = (energy > settings.energyThreshold) || 
                                  (Math.random() < settings.notePerBeat * 0.3);
            
            if (shouldPlaceNote && Math.random() < settings.notePerBeat) {
                // 周波数帯域に基づいてレーンを決定
                let lane = 0;
                
                // 異なる周波数帯域をシミュレート
                const freqAnalysis = this.analyzeFrequencyContent(channelData, startSample, endSample);
                
                if (freqAnalysis.bass > freqAnalysis.mid && freqAnalysis.bass > freqAnalysis.high) {
                    lane = 0; // 低音 -> 左端
                } else if (freqAnalysis.high > freqAnalysis.mid) {
                    lane = 5; // 高音 -> 右端
                } else {
                    lane = Math.floor(Math.random() * 4) + 1; // 中音域 -> 中央レーン
                }
                
                chart.push({
                    time: time * 1000,
                    lane: lane,
                    type: 'normal'
                });
            }
        }
        
        // 最低限のノーツ数を保証（楽曲の長さに応じて）
        const minNotes = Math.floor(duration / 2); // 2秒に1個の最低密度
        if (chart.length < minNotes) {
            for (let i = chart.length; i < minNotes; i++) {
                const randomTime = Math.random() * duration * 1000;
                const randomLane = Math.floor(Math.random() * 6);
                
                chart.push({
                    time: randomTime,
                    lane: randomLane,
                    type: 'normal'
                });
            }
        }
        
        chart.sort((a, b) => a.time - b.time);
        console.log(`Generated ${chart.length} notes for ${difficulty} difficulty`);
        return chart;
    }
    
    analyzeFrequencyContent(data, start, end) {
        // 簡易的な周波数解析（実際のFFTではなく時間軸での近似）
        let bass = 0, mid = 0, high = 0;
        
        for (let i = start; i < end; i++) {
            const sample = Math.abs(data[i]);
            
            // 簡易的な周波数分離（時間軸での近似）
            if (i % 8 === 0) bass += sample;      // 低周波数近似
            else if (i % 4 === 0) mid += sample;  // 中周波数近似
            else high += sample;                  // 高周波数近似
        }
        
        const length = end - start;
        return {
            bass: bass / (length / 8),
            mid: mid / (length / 4),
            high: high / (length * 3 / 4)
        };
    }
    
    async setupAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            await this.loadSampleAudio();
        } catch (error) {
            console.warn('Audio setup failed:', error);
        }
    }
    
    async loadSampleAudio() {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 180; // 3分 = 180秒
        const frameCount = sampleRate * duration;
        const audioBuffer = this.audioContext.createBuffer(2, frameCount, sampleRate);
        
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            const channelData = audioBuffer.getChannelData(channel);
            for (let i = 0; i < frameCount; i++) {
                const t = i / sampleRate;
                let sample = 0;
                
                // メインメロディ (4小節ごとに変化)
                const measure = Math.floor(t / 2) % 4;
                const baseFreq = [440, 523, 392, 494][measure];
                sample += Math.sin(2 * Math.PI * baseFreq * t) * 0.08 * Math.sin(2 * Math.PI * 0.5 * t);
                
                // ベースライン
                const bassFreq = baseFreq / 2;
                sample += Math.sin(2 * Math.PI * bassFreq * t) * 0.12 * Math.sin(2 * Math.PI * 0.25 * t);
                
                // ハーモニー
                sample += Math.sin(2 * Math.PI * (baseFreq * 1.25) * t) * 0.04 * Math.sin(2 * Math.PI * 0.3 * t);
                
                // ドラム的なリズム
                const beat = Math.floor(t * 2) % 4;
                if (beat === 0 || beat === 2) {
                    sample += Math.sin(2 * Math.PI * 80 * t) * 0.15 * Math.exp(-((t % 0.5) * 10));
                }
                
                // ハイハット的な音
                if (Math.floor(t * 4) % 2 === 1) {
                    sample += (Math.random() - 0.5) * 0.02 * Math.exp(-((t % 0.25) * 20));
                }
                
                channelData[i] = sample * 0.7; // 全体の音量調整
            }
        }
        
        this.audioBuffer = audioBuffer;
    }
    
    generateCharts() {
        const bpm = 120;
        const beatInterval = (60 / bpm) * 1000;
        const totalBeats = (180 * 1000) / beatInterval; // 3分間のビート数
        
        // BEGINNER (Easy) - シンプルなパターン
        this.charts.easy = this.generateChart({
            notePerBeat: 0.3,
            patterns: [
                [0, null, 2, null],
                [1, null, 3, null],
                [null, 2, null, 4],
                [0, null, 1, null],
                [3, null, 5, null]
            ],
            totalBeats,
            beatInterval
        });
        
        // NORMAL - 中程度の難易度
        this.charts.normal = this.generateChart({
            notePerBeat: 0.5,
            patterns: [
                [0, 2, null, 4],
                [1, null, 3, 0],
                [2, 4, 1, null],
                [null, 3, 0, 2],
                [4, null, 1, 3],
                [5, 1, null, 4],
                [0, null, 5, 2]
            ],
            totalBeats,
            beatInterval
        });
        
        // HYPER (Hard) - 高難易度
        this.charts.hard = this.generateChart({
            notePerBeat: 0.8,
            patterns: [
                [0, 2, 4, 1],
                [1, 3, 0, 4],
                [2, 0, 3, 1],
                [4, 2, 1, 0],
                [0, 1, 2, 3],
                [3, 4, 0, 2],
                [1, 4, 3, 0],
                [5, 0, 3, 1],
                [2, 5, 4, 0]
            ],
            totalBeats,
            beatInterval
        });
    }
    
    generateChart({ notePerBeat, patterns, totalBeats, beatInterval }) {
        const chart = [];
        const beatsPerMeasure = 4;
        const totalMeasures = Math.floor(totalBeats / beatsPerMeasure);
        
        for (let measure = 0; measure < totalMeasures; measure++) {
            const pattern = patterns[measure % patterns.length];
            
            // 通常ノーツ
            for (let beat = 0; beat < beatsPerMeasure; beat++) {
                if (Math.random() < notePerBeat && pattern[beat] !== null) {
                    const time = (measure * beatsPerMeasure + beat) * beatInterval;
                    const lane = pattern[beat];
                    
                    if (lane < 6) { // レーン0-5のみ
                        chart.push({
                            time: time,
                            lane: lane,
                            type: 'normal'
                        });
                    }
                }
            }
        }
        
        return chart.sort((a, b) => a.time - b.time);
    }
    
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    async startGame() {
        if (!this.audioContext) {
            alert('Audio system not ready. Please try again.');
            return;
        }
        
        // AudioContextが suspended 状態の場合は resume する
        if (this.audioContext.state === 'suspended') {
            console.log('Resuming AudioContext...');
            try {
                await this.audioContext.resume();
                console.log('AudioContext resumed successfully');
            } catch (error) {
                console.error('Failed to resume AudioContext:', error);
                alert('音声システムの開始に失敗しました');
                return;
            }
        }
        
        this.isPlaying = true;
        this.isPaused = false;
        this.startTime = performance.now();
        this.notes = [];
        this.currentChart = this.charts[this.currentLevel];
        this.nextNoteIndex = 0;
        
        // デバッグ: 使用する譜面の確認
        console.log(`Starting game with ${this.currentLevel} chart:`, this.currentChart.length, 'notes');
        console.log('First few notes:', this.currentChart.slice(0, 5));
        
        if (this.currentChart.length === 0) {
            console.warn('No notes in current chart! Regenerating...');
            // 緊急時の確実な譜面生成
            this.generateEmergencyChart();
            this.currentChart = this.charts[this.currentLevel];
            console.log('Emergency chart generated:', this.currentChart.length, 'notes');
        }
        
        this.playAudio();
        
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.disabled = true;
        });
    }
    
    pauseGame() {
        this.isPaused = !this.isPaused;
        document.getElementById('pauseBtn').textContent = this.isPaused ? 'RESUME' : 'PAUSE';
        
        if (this.audioSource) {
            if (this.isPaused) {
                this.audioSource.stop();
            } else {
                this.playAudio();
            }
        }
    }
    
    resetGame() {
        this.isPlaying = false;
        
        if (this.audioSource) {
            this.audioSource.stop();
        }
        
        // ゲーム状態を完全にリセット
        this.resetGameState();
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('pauseBtn').textContent = 'PAUSE';
        
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.disabled = false;
        });
    }
    
    playAudio() {
        const bufferToPlay = this.uploadedAudio || this.audioBuffer;
        
        if (bufferToPlay && this.audioContext) {
            this.audioSource = this.audioContext.createBufferSource();
            this.audioSource.buffer = bufferToPlay;
            this.audioSource.connect(this.audioContext.destination);
            this.audioSource.start();
        }
    }
    
    handleKeyDown(event) {
        if (event.repeat) return;
        this.handleKeyPress(event.code);
    }
    
    handleKeyUp(event) {
        this.handleKeyRelease(event.code);
    }
    
    handleKeyPress(keyCode) {
        if (!this.isPlaying || this.isPaused) return;
        
        this.activeKeys.add(keyCode);
        this.checkHit(keyCode);
    }
    
    handleKeyRelease(keyCode) {
        this.activeKeys.delete(keyCode);
    }
    
    
    checkHit(keyCode) {
        const lane = this.lanes.find(l => l.key === keyCode);
        if (!lane) return;
        
        const laneIndex = this.lanes.indexOf(lane);
        const hitWindow = this.judgeWindow.bad;
        
        const hitNotes = this.notes.filter(note => 
            !note.hit && 
            !note.passed && 
            note.lane === laneIndex &&
            Math.abs(note.y - this.judgeLineY) <= hitWindow
        );
        
        if (hitNotes.length > 0) {
            const closestNote = hitNotes.reduce((closest, note) => 
                Math.abs(note.y - this.judgeLineY) < Math.abs(closest.y - this.judgeLineY) ? note : closest
            );
            
            this.hitNote(closestNote);
        }
    }
    
    hitNote(note) {
        const distance = Math.abs(note.y - this.judgeLineY);
        let judgment, points;
        
        if (distance <= this.judgeWindow.perfect) {
            judgment = 'PERFECT';
            points = 1000;
        } else if (distance <= this.judgeWindow.great) {
            judgment = 'GREAT';
            points = 800;
        } else if (distance <= this.judgeWindow.good) {
            judgment = 'GOOD';
            points = 500;
        } else {
            judgment = 'BAD';
            points = 100;
        }
        
        note.hit = true;
        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.score += points * Math.max(1, Math.floor(this.combo / 10));
        
        this.showJudgment(judgment);
        this.updateUI();
        this.createHitEffect(note);
    }
    
    showJudgment(judgment) {
        this.judgmentElement.textContent = judgment;
        this.judgmentElement.className = `judgment ${judgment.toLowerCase()}`;
        
        setTimeout(() => {
            this.clearJudgment();
        }, 500);
    }
    
    clearJudgment() {
        this.judgmentElement.textContent = '';
        this.judgmentElement.className = 'judgment';
    }
    
    createHitEffect(note) {
        const lane = this.lanes[note.lane];
        
        setTimeout(() => {
            this.ctx.save();
            this.ctx.globalAlpha = 0.8;
            this.ctx.fillStyle = lane.color;
            this.ctx.beginPath();
            this.ctx.arc(lane.x + 30, this.judgeLineY, 40, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }, 0);
    }
    
    updateUI() {
        this.scoreElement.textContent = this.score.toLocaleString();
        this.comboElement.textContent = this.combo;
        
        if (this.combo > 0 && this.combo % 50 === 0) {
            this.comboElement.parentElement.classList.add('combo-flash');
            setTimeout(() => {
                this.comboElement.parentElement.classList.remove('combo-flash');
            }, 300);
        }
    }
    
    update(deltaTime) {
        if (!this.isPlaying || this.isPaused) return;
        
        this.currentTime = performance.now() - this.startTime;
        
        // 時間に合わせて新しいノーツを追加
        while (this.nextNoteIndex < this.currentChart.length) {
            const nextNote = this.currentChart[this.nextNoteIndex];
            
            // デバッグログ
            if (this.nextNoteIndex < 3) {
                console.log(`Checking note ${this.nextNoteIndex}: time=${nextNote.time}, currentTime=${this.currentTime}, shouldShow=${this.currentTime >= nextNote.time - 2000}`);
            }
            
            if (this.currentTime >= nextNote.time - 2000) { // 2秒前から表示開始
                if (this.nextNoteIndex < 10) {
                    console.log(`Adding note ${this.nextNoteIndex} at lane ${nextNote.lane}, time=${nextNote.time}`);
                }
                this.notes.push({
                    ...nextNote,
                    y: -50,
                    hit: false,
                    passed: false
                });
                this.nextNoteIndex++;
            } else {
                break;
            }
        }
        
        // 既存のノーツを更新
        this.notes.forEach(note => {
            if (!note.hit && !note.passed) {
                note.y += this.noteSpeed * (deltaTime / 1000);
                
                if (note.y > this.judgeLineY + this.judgeWindow.bad) {
                    note.passed = true;
                    this.combo = 0;
                    this.showJudgment('MISS');
                }
            }
        });
        
        // 曲の終了判定
        const songDuration = this.uploadedAudio ? 
            this.uploadedAudio.duration * 1000 : 180000; // アップロード音声またはデフォルト3分
            
        if (this.currentTime >= songDuration) {
            setTimeout(() => {
                this.showGameComplete();
            }, 2000);
        }
    }
    
    showGameComplete() {
        if (!this.isPlaying) return; // 重複実行を防ぐ
        
        this.isPlaying = false;
        
        if (this.audioSource) {
            this.audioSource.stop();
        }
        
        // 全ノーツ数を現在追加されたノーツ + 残りのノーツで計算
        const totalNotes = this.currentChart.length;
        const hitNotes = this.notes.filter(note => note.hit).length;
        const accuracy = totalNotes > 0 ? ((hitNotes / totalNotes) * 100).toFixed(1) : '0.0';
        const finalScore = this.score;
        const finalMaxCombo = this.maxCombo;
        
        // ゲーム状態を完全にリセット
        this.resetGameState();
        
        setTimeout(() => {
            alert(`Song Complete!\nScore: ${finalScore.toLocaleString()}\nMax Combo: ${finalMaxCombo}\nAccuracy: ${accuracy}%\n\nGreat job!`);
        }, 500);
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('pauseBtn').textContent = 'PAUSE';
        
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.disabled = false;
        });
    }
    
    resetGameState() {
        // スコアとコンボをリセット
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.notes = [];
        this.activeKeys.clear();
        this.isPaused = false;
        this.nextNoteIndex = 0;
        this.currentChart = [];
        
        // UIを更新
        this.updateUI();
        this.clearJudgment();
        
        // キャンバスをクリア
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawLanes();
        this.drawJudgeLine();
        this.drawKeyboards();
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawLanes();
        this.drawJudgeLine();
        this.drawKeyboards();
        this.drawNotes();
    }
    
    drawLanes() {
        this.lanes.forEach((lane, index) => {
            const isActive = this.activeKeys.has(lane.key);
            
            this.ctx.save();
            
            if (isActive) {
                // キーが押されている時は明るく光らせる
                const gradient = this.ctx.createLinearGradient(lane.x, 0, lane.x + 60, 0);
                const laneColor = this.hexToRgba(lane.color, 0.3);
                gradient.addColorStop(0, laneColor);
                gradient.addColorStop(0.5, this.hexToRgba(lane.color, 0.2));
                gradient.addColorStop(1, laneColor);
                
                this.ctx.fillStyle = gradient;
                this.ctx.shadowColor = lane.color;
                this.ctx.shadowBlur = 30;
                this.ctx.fillRect(lane.x, 0, 60, this.canvas.height);
                
                // 枠線も光らせる
                this.ctx.strokeStyle = lane.color;
                this.ctx.lineWidth = 3;
                this.ctx.shadowBlur = 15;
            } else {
                // 通常状態
                const gradient = this.ctx.createLinearGradient(lane.x, 0, lane.x + 60, 0);
                gradient.addColorStop(0, 'rgba(255,255,255,0.1)');
                gradient.addColorStop(0.5, 'rgba(255,255,255,0.05)');
                gradient.addColorStop(1, 'rgba(255,255,255,0.1)');
                
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(lane.x, 0, 60, this.canvas.height);
                
                this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                this.ctx.lineWidth = 2;
            }
            
            this.ctx.beginPath();
            this.ctx.moveTo(lane.x, 0);
            this.ctx.lineTo(lane.x, this.canvas.height);
            this.ctx.moveTo(lane.x + 60, 0);
            this.ctx.lineTo(lane.x + 60, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.restore();
        });
    }
    
    drawJudgeLine() {
        this.ctx.save();
        
        // 押されているキーがある場合はジャッジライン周辺を光らせる
        this.lanes.forEach(lane => {
            if (this.activeKeys.has(lane.key)) {
                this.ctx.fillStyle = this.hexToRgba(lane.color, 0.2);
                this.ctx.fillRect(lane.x, this.judgeLineY - 20, 60, 40);
            }
        });
        
        // メインのジャッジライン
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(150, this.judgeLineY);
        this.ctx.lineTo(560, this.judgeLineY);
        this.ctx.stroke();
        
        this.ctx.shadowColor = '#ffffff';
        this.ctx.shadowBlur = 10;
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    drawKeyboards() {
        this.lanes.forEach((lane, index) => {
            const isActive = this.activeKeys.has(lane.key);
            
            this.ctx.save();
            
            // キーボードの背景
            if (isActive) {
                this.ctx.fillStyle = lane.color;
                this.ctx.shadowColor = lane.color;
                this.ctx.shadowBlur = 30;
                
                // 追加の光るエフェクト
                this.ctx.beginPath();
                this.ctx.arc(lane.x + 30, this.keyboardY + 30, 40, 0, Math.PI * 2);
                this.ctx.fillStyle = this.hexToRgba(lane.color, 0.3);
                this.ctx.fill();
                
                this.ctx.fillStyle = lane.color;
            } else {
                this.ctx.fillStyle = '#333333';
            }
            
            // キーボードを描画
            this.ctx.fillRect(lane.x + 5, this.keyboardY, 50, 60);
            
            // 枠線
            this.ctx.strokeStyle = isActive ? '#ffffff' : lane.color;
            this.ctx.lineWidth = isActive ? 3 : 2;
            this.ctx.strokeRect(lane.x + 5, this.keyboardY, 50, 60);
            
            // キー文字
            this.ctx.fillStyle = isActive ? '#000000' : '#ffffff';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(
                lane.key.replace('Key', ''),
                lane.x + 30,
                this.keyboardY + 30
            );
            
            this.ctx.restore();
        });
    }
    
    drawNotes() {
        this.notes.forEach(note => {
            if (!note.hit && !note.passed && note.y > -50 && note.y < this.canvas.height + 50) {
                const lane = this.lanes[note.lane];
                
                this.ctx.save();
                this.ctx.fillStyle = lane.color;
                this.ctx.shadowColor = lane.color;
                this.ctx.shadowBlur = 15;
                
                this.ctx.fillRect(lane.x + 5, note.y - 15, 50, 30);
                
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(lane.x + 5, note.y - 15, 50, 30);
                
                this.ctx.restore();
            }
        });
    }
    
    startGameLoop() {
        let lastTime = performance.now();
        
        const gameLoop = (currentTime) => {
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;
            
            this.update(deltaTime);
            this.render();
            
            requestAnimationFrame(gameLoop);
        };
        
        requestAnimationFrame(gameLoop);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BeatmaniaGame();
});