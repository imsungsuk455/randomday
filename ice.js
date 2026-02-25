// ice.js - Ice Breaker Game Logic

let iceParticipants = [];
let iceShowScreenFunc = null;

// Audio Context setup (will be initialized on user interaction)
let iceAudioCtx;
function initIceAudio() {
    if (!iceAudioCtx) {
        iceAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (iceAudioCtx.state === 'suspended') {
        iceAudioCtx.resume();
    }
}

// Setup UI Elements
const iceInput = document.getElementById('ice-participant-input');
const iceBtnAdd = document.getElementById('ice-btn-add-participant');
const iceList = document.getElementById('ice-participant-list');
const iceBtnStart = document.getElementById('ice-btn-start-game');

// Game UI Elements
const iceCurrentPlayerDisplay = document.getElementById('ice-current-player');
const iceBtnHit = document.getElementById('ice-btn-hit');
const iceBlock = document.getElementById('ice-block');
const iceLoserDisplay = document.getElementById('ice-loser');

// Game State
let currentIcePlayerIndex = 0;
let iceHits = 0;
let iceCrackThreshold = 0; // When to break
let isIceBroken = false;

// Initialize Game (Called from main.js)
function initIceGame(showScreen) {
    iceShowScreenFunc = showScreen;
    iceParticipants = [];
    updateIceSetupUI('');
    iceInput.value = '';
}

// Add Participant Elements
iceBtnAdd.addEventListener('click', addIceParticipant);
iceInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addIceParticipant();
});

function addIceParticipant() {
    const name = iceInput.value.trim();
    if (name && !iceParticipants.includes(name)) {
        iceParticipants.push(name);
        updateIceSetupUI(name);
        iceInput.value = '';
    }
}

function updateIceSetupUI(newName) {
    iceList.innerHTML = '';
    iceParticipants.forEach(p => {
        const li = document.createElement('li');
        li.textContent = p;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.onclick = () => {
            iceParticipants = iceParticipants.filter(name => name !== p);
            updateIceSetupUI('');
        };

        if (p === newName) {
            li.style.animation = 'slideIn 0.3s ease-out forwards';
        }

        li.appendChild(deleteBtn);
        iceList.appendChild(li);
    });

    iceBtnStart.disabled = iceParticipants.length < 2;
}

// Start Game
iceBtnStart.addEventListener('click', () => {
    initIceAudio();
    iceShowScreenFunc('iceGame');
    startIceGameSequence();
});

function startIceGameSequence() {
    iceHits = 0;
    isIceBroken = false;
    currentIcePlayerIndex = 0;

    // Random threshold between 3 and 15 hits depending on players
    const minHits = Math.max(2, iceParticipants.length / 2);
    const maxHits = 20;
    iceCrackThreshold = Math.floor(Math.random() * (maxHits - minHits + 1)) + minHits;

    iceBtnHit.disabled = false;

    // Clear cracks and reset appearance
    resetIceBlock();
    updateIceTurn();
}

function updateIceTurn() {
    if (!isIceBroken) {
        iceCurrentPlayerDisplay.textContent = iceParticipants[currentIcePlayerIndex];
    }
}

// Game Action
iceBtnHit.addEventListener('click', () => {
    if (isIceBroken) return;
    initIceAudio();

    iceHits++;

    // Visual effect
    iceBlock.classList.remove('hit-anim');
    void iceBlock.offsetWidth; // trigger reflow
    iceBlock.classList.add('hit-anim');

    if (iceHits >= iceCrackThreshold) {
        // BREAK!
        breakIce();
    } else {
        // Crack
        addCrack();
        playCrackSound();
        currentIcePlayerIndex = (currentIcePlayerIndex + 1) % iceParticipants.length;
        updateIceTurn();
    }
});

function resetIceBlock() {
    iceBlock.classList.remove('shattered');
    const cracks = iceBlock.querySelectorAll('.crack');
    cracks.forEach(c => c.remove());
}

function addCrack() {
    const crack = document.createElement('div');
    crack.className = 'crack';

    // Random position and angle
    const angle = Math.random() * 360;
    const length = 20 + Math.random() * 80; // 20px to 100px
    const thickness = 1 + Math.random() * 3; // 1px to 4px

    const x = 50 + Math.random() * 150;
    const y = 50 + Math.random() * 150;

    crack.style.width = `${length}px`;
    crack.style.height = `${thickness}px`;
    crack.style.left = `${x}px`;
    crack.style.top = `${y}px`;
    crack.style.transform = `rotate(${angle}deg)`;

    iceBlock.appendChild(crack);
}

function breakIce() {
    isIceBroken = true;
    iceBtnHit.disabled = true;

    playShatterSound();
    iceBlock.classList.add('shattered');
    document.body.classList.add('shaking');

    setTimeout(() => {
        document.body.classList.remove('shaking');
        showIceResult();
    }, 1000);
}

function showIceResult() {
    iceShowScreenFunc('iceResult');
    const loser = iceParticipants[currentIcePlayerIndex];
    iceLoserDisplay.textContent = loser;
}

// Result Screen Buttons
document.getElementById('ice-btn-restart').addEventListener('click', () => {
    iceShowScreenFunc('iceGame');
    startIceGameSequence();
});

// === Audio Synthesis for Sounds ===

function playCrackSound() {
    if (!iceAudioCtx) return;

    // Create a noise buffer
    const bufferSize = iceAudioCtx.sampleRate * 0.15; // 0.15 seconds
    const buffer = iceAudioCtx.createBuffer(1, bufferSize, iceAudioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1; // white noise
    }

    const noiseSource = iceAudioCtx.createBufferSource();
    noiseSource.buffer = buffer;

    // Filter to make it sound like high frequency cracking
    const filter = iceAudioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 4000;

    // Envelope
    const gainNode = iceAudioCtx.createGain();
    gainNode.gain.setValueAtTime(1.5, iceAudioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, iceAudioCtx.currentTime + 0.15);

    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(iceAudioCtx.destination);

    noiseSource.start();
}

function playShatterSound() {
    if (!iceAudioCtx) return;

    // Create a noise buffer for the main shatter
    const bufferSize = iceAudioCtx.sampleRate * 1.2; // 1.2 seconds
    const buffer = iceAudioCtx.createBuffer(1, bufferSize, iceAudioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = iceAudioCtx.createBufferSource();
    noiseSource.buffer = buffer;

    const filter = iceAudioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2500;
    filter.Q.value = 1.0;

    const gainNode = iceAudioCtx.createGain();
    gainNode.gain.setValueAtTime(2.0, iceAudioCtx.currentTime);
    gainNode.gain.setTargetAtTime(0.01, iceAudioCtx.currentTime + 0.1, 0.2); // Slower decay

    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(iceAudioCtx.destination);

    noiseSource.start();

    // Add a satisfying low 'THUD' impact
    const osc = iceAudioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, iceAudioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, iceAudioCtx.currentTime + 0.3);

    const oscGain = iceAudioCtx.createGain();
    oscGain.gain.setValueAtTime(1.5, iceAudioCtx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.01, iceAudioCtx.currentTime + 0.3);

    osc.connect(oscGain);
    oscGain.connect(iceAudioCtx.destination);

    osc.start();
    osc.stop(iceAudioCtx.currentTime + 0.4);
}
