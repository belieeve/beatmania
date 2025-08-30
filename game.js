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
        this.setupEventListeners();
        this.setupAudio();
        this.startGameLoop();
        
        // 初期画面を描画
        this.drawLanes();
        this.drawJudgeLine();
        this.drawKeyboards();
    }
    
    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pauseGame());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectLevel(e.target.dataset.level));
        });
    }
    
    selectLevel(level) {
        this.currentLevel = level;
        
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-level="${level}"]`).classList.add('active');
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
    
    startGame() {
        if (!this.audioContext) {
            alert('Audio system not ready. Please try again.');
            return;
        }
        
        this.isPlaying = true;
        this.isPaused = false;
        this.startTime = performance.now();
        this.notes = [];
        this.currentChart = this.charts[this.currentLevel];
        this.nextNoteIndex = 0;
        
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
        if (this.audioBuffer && this.audioContext) {
            this.audioSource = this.audioContext.createBufferSource();
            this.audioSource.buffer = this.audioBuffer;
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
            if (this.currentTime >= nextNote.time - 2000) { // 2秒前から表示開始
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
        
        // 曲の終了判定（3分経過後）
        if (this.currentTime >= 180000) { // 3分 = 180秒 = 180000ミリ秒
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