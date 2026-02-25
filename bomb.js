// bomb.js
let bombParticipants = [];
let currentBombPlayerIndex = 0;
let bombGameShowScreen;
let explosionTimeout;
let tempoInterval;

// Audio context and synth
let audioContext;
let isBeating = false;
let nextNoteTime = 0;
let tempo = 120;
let lookahead = 25.0;
let scheduleAheadTime = 0.1;
let current16thNote = 0;
let timerID;

function nextNote() {
    const secondsPerBeat = 60.0 / tempo;
    nextNoteTime += 0.25 * secondsPerBeat;
    current16thNote++;
    if (current16thNote === 16) {
        current16thNote = 0;
    }
}

function playDrum(time, type) {
    if (!audioContext) return;
    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === 'kick') {
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
        gainNode.gain.setValueAtTime(1, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
    } else if (type === 'snare') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, time);
        gainNode.gain.setValueAtTime(0.8, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    } else if (type === 'hihat') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, time);
        gainNode.gain.setValueAtTime(0.1, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
    }

    osc.start(time);
    osc.stop(time + 0.5);
}

function scheduleNote(beatNumber, time) {
    // Basic Hip-hop / Rock beat
    // Kick on 0, 8 (1 and 3)
    // Snare on 4, 12 (2 and 4)
    // Hihat on every 2
    if (beatNumber === 0 || beatNumber === 8 || beatNumber === 10) {
        playDrum(time, 'kick');
    }
    if (beatNumber === 4 || beatNumber === 12) {
        playDrum(time, 'snare');
    }
    if (beatNumber % 2 === 0) {
        playDrum(time, 'hihat');
    }
}

function scheduler() {
    if (!isBeating) return;
    while (nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
        scheduleNote(current16thNote, nextNoteTime);
        nextNote();
    }
    timerID = setTimeout(scheduler, lookahead);
}

function startBeat() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    tempo = 120;
    isBeating = true;
    current16thNote = 0;
    nextNoteTime = audioContext.currentTime + 0.1;
    scheduler();

    // Gradually increase tempo
    tempoInterval = setInterval(() => {
        if (tempo < 300) tempo += 5;
    }, 1000);
}

function stopBeat() {
    isBeating = false;
    clearTimeout(timerID);
    clearInterval(tempoInterval);
}

function playExplosionSound() {
    if (!audioContext) return;
    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    osc.type = 'sawtooth';
    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Simulate explosion boom
    osc.frequency.setValueAtTime(100, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);

    gainNode.gain.setValueAtTime(1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);

    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 1.5);
}

// UI Elements
const bombInputEl = document.getElementById('bomb-participant-input');
const bombBtnAdd = document.getElementById('bomb-btn-add-participant');
const bombListEl = document.getElementById('bomb-participant-list');
const bombBtnStart = document.getElementById('bomb-btn-start-game');
const bombCurrentPlayerEl = document.getElementById('bomb-current-player');
const bombItem = document.getElementById('bomb-item');
const bombBtnPass = document.getElementById('bomb-btn-pass');
const bombLoserEl = document.getElementById('bomb-loser');
const bombBtnRestart = document.getElementById('bomb-btn-restart');

function updateBombList() {
    bombListEl.innerHTML = '';
    bombParticipants.forEach((p, index) => {
        const li = document.createElement('li');
        li.textContent = p;
        const delBtn = document.createElement('button');
        delBtn.textContent = '❌';
        delBtn.className = 'delete-btn';
        delBtn.onclick = () => {
            bombParticipants.splice(index, 1);
            updateBombList();
        };
        li.appendChild(delBtn);
        bombListEl.appendChild(li);
    });
    bombBtnStart.disabled = bombParticipants.length < 2;
}

bombBtnAdd.onclick = () => {
    const val = bombInputEl.value.trim();
    if (val && !bombParticipants.includes(val)) {
        bombParticipants.push(val);
        bombInputEl.value = '';
        updateBombList();
    }
};

bombInputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') bombBtnAdd.click();
});

bombBtnStart.onclick = () => {
    startBombGame();
};

bombBtnPass.onclick = () => {
    // Pass bomb to next player
    currentBombPlayerIndex = (currentBombPlayerIndex + 1) % bombParticipants.length;
    updateBombPlayerDisplay();

    // Vibrate/Scale effect
    bombItem.style.transform = 'scale(1.2)';
    setTimeout(() => {
        bombItem.style.transform = 'scale(1)';
    }, 100);
};

bombBtnRestart.onclick = () => {
    bombGameShowScreen('bombSetup');
};

function updateBombPlayerDisplay() {
    bombCurrentPlayerEl.textContent = bombParticipants[currentBombPlayerIndex];
}

function startBombGame() {
    // Randomize players
    bombParticipants.sort(() => Math.random() - 0.5);
    currentBombPlayerIndex = 0;
    updateBombPlayerDisplay();

    bombGameShowScreen('bombGame');
    bombItem.classList.add('beating');

    startBeat();

    // Random explosion time between 5s and 15s
    let explosionTime = (Math.random() * 10 + 5) * 1000;

    bombBtnPass.disabled = false;

    explosionTimeout = setTimeout(() => {
        explodeBomb();
    }, explosionTime);
}

function explodeBomb() {
    stopBeat();
    bombBtnPass.disabled = true;
    bombItem.classList.remove('beating');

    playExplosionSound();

    document.body.classList.add('explosion-flash');
    setTimeout(() => {
        document.body.classList.remove('explosion-flash');

        bombLoserEl.textContent = bombParticipants[currentBombPlayerIndex];
        bombGameShowScreen('bombResult');
    }, 800);
}

// Global exposure
window.initBombGame = function (showScreenFunc) {
    bombGameShowScreen = showScreenFunc;
    if (bombParticipants.length === 0) {
        bombParticipants = ['루피', '조로', '나미', '우솝'];
        updateBombList();
    }
};
