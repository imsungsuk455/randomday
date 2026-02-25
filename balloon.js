// balloon.js - Game Logic for Water Balloon Roulette

let balloonAudioCtx;
function getBalloonAudioContext() {
    if (!balloonAudioCtx) {
        balloonAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return balloonAudioCtx;
}

function playPumpSound() {
    const ctx = getBalloonAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
}

function playExplosionSound() {
    const ctx = getBalloonAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const bufferSize = ctx.sampleRate * 0.8;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.8);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
}

function initBalloonGame(showScreenCallback) {
    let participants = [];
    let currentPlayerIndex = 0;
    let pumpCount = 0;
    let explosionThreshold = 0;

    // DOM Elements - Setup
    const inputParticipant = document.getElementById('participant-input');
    const btnAddParticipant = document.getElementById('btn-add-participant');
    const listParticipants = document.getElementById('participant-list');
    const btnStartGame = document.getElementById('btn-start-game');

    // DOM Elements - Game
    const currentPlayerSpan = document.getElementById('current-player');
    const btnPump = document.getElementById('btn-pump');
    const balloon = document.getElementById('water-balloon');

    // DOM Elements - Result
    const loserSpan = document.getElementById('loser');
    const totalPumpsSpan = document.getElementById('total-pumps');
    const btnRestart = document.getElementById('btn-restart');

    // --- Setup Phase ---

    function renderParticipantList() {
        listParticipants.innerHTML = '';
        participants.forEach((name, index) => {
            const li = document.createElement('li');
            li.textContent = name;

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '❌';
            deleteBtn.className = 'delete-btn';
            deleteBtn.onclick = () => {
                participants.splice(index, 1);
                renderParticipantList();
            };

            li.appendChild(deleteBtn);
            listParticipants.appendChild(li);
        });

        btnStartGame.disabled = participants.length < 2;
    }

    function addParticipant() {
        const name = inputParticipant.value.trim();
        if (name && !participants.includes(name)) {
            participants.push(name);
            inputParticipant.value = '';
            renderParticipantList();
        }
    }

    btnAddParticipant.onclick = addParticipant;
    inputParticipant.onkeypress = (e) => {
        if (e.key === 'Enter') addParticipant();
    };

    btnStartGame.onclick = () => {
        startGame();
    };

    // --- Game Phase ---

    function startGame() {
        currentPlayerIndex = 0;
        pumpCount = 0;

        // Random threshold between 5 and 25 pumps
        explosionThreshold = Math.floor(Math.random() * 21) + 5;

        updateBalloonVisuals();
        updateTurnDisplay();
        showScreenCallback('game');
    }

    function updateTurnDisplay() {
        currentPlayerSpan.textContent = participants[currentPlayerIndex];
    }

    function updateBalloonVisuals() {
        // Calculate scale: starts at 1, max scale around 2.5 near threshold
        // Use a slight curve so it looks scarier towards the end
        const progress = Math.min(pumpCount / explosionThreshold, 1.2);
        const scale = 1 + (progress * 1.5);

        // Update CSS variable
        balloon.style.setProperty('--balloon-scale', scale);

        // Jiggle animation trigger
        balloon.classList.remove('pump-anim');
        void balloon.offsetWidth; // trigger reflow
        if (pumpCount > 0) balloon.classList.add('pump-anim');

        // Color changes slightly red/darker as it gets closer to popping
        const redTint = Math.floor(progress * 100);
        // balloon.style.background = `radial-gradient(circle at 30% 30%, rgb(${100+redTint}, 189, 248), rgb(${2+redTint}, 132, 199), rgb(${3+redTint}, 105, 161))`;
    }

    function handlePump() {
        pumpCount++;
        playPumpSound();

        if (pumpCount >= explosionThreshold) {
            explodeBalloon();
        } else {
            updateBalloonVisuals();
            // Next player
            currentPlayerIndex = (currentPlayerIndex + 1) % participants.length;
            setTimeout(updateTurnDisplay, 200); // Slight delay for tension
        }
    }

    btnPump.onclick = handlePump;

    // --- Result Phase ---

    function explodeBalloon() {
        // Explode effect logic
        playExplosionSound();
        balloon.style.transform = `scale(${3}) rotate(10deg)`; // Final swell

        setTimeout(() => {
            // Transition to result
            loserSpan.textContent = participants[currentPlayerIndex];
            totalPumpsSpan.textContent = pumpCount;
            showScreenCallback('result');

            // Reset balloon instantly when hidden, to be ready next time
            setTimeout(() => {
                balloon.style.setProperty('--balloon-scale', 1);
                balloon.style.transform = '';
            }, 500);

        }, 300); // Wait a fraction for final swell before showing result
    }

    btnRestart.onclick = () => {
        // Keep participants, just restart the logic
        startGame();
    };

    // Initial render cleanup if called multiple times (though not strictly necessary here)
    renderParticipantList();
}
