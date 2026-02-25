// mimic.js - Game Logic for Find the Mimic

let mimicAudioCtx;
function getMimicAudioContext() {
    if (!mimicAudioCtx) {
        mimicAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return mimicAudioCtx;
}

function playChestOpenSound() {
    const ctx = getMimicAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
}

function playMimicSound() {
    const ctx = getMimicAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc2.type = 'square';
    osc.frequency.setValueAtTime(50, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.1);
    osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.8);

    osc2.frequency.setValueAtTime(60, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(5, ctx.currentTime + 0.8);

    gain.gain.setValueAtTime(1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc2.start();
    osc.stop(ctx.currentTime + 0.8);
    osc2.stop(ctx.currentTime + 0.8);
}

function initMimicGame(showScreenCallback) {
    let participants = [];
    let currentPlayerIndex = 0;
    let chestCount = 0;
    let mimicIndex = 0;
    let openedChests = 0;
    let isGameOver = false;

    // DOM Elements - Setup
    const inputParticipant = document.getElementById('mimic-participant-input');
    const btnAddParticipant = document.getElementById('mimic-btn-add-participant');
    const listParticipants = document.getElementById('mimic-participant-list');
    const btnStartGame = document.getElementById('mimic-btn-start-game');

    // DOM Elements - Game
    const currentPlayerSpan = document.getElementById('mimic-current-player');
    const chestGrid = document.getElementById('chest-grid');

    // DOM Elements - Result
    const loserSpan = document.getElementById('mimic-loser');
    const btnRestart = document.getElementById('mimic-btn-restart');

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

        // Need at least 2 participants
        btnStartGame.disabled = participants.length < 2;
    }

    btnAddParticipant.onclick = addParticipant;
    inputParticipant.onkeypress = (e) => {
        if (e.key === 'Enter') addParticipant();
    };

    function addParticipant() {
        const name = inputParticipant.value.trim();
        if (name && !participants.includes(name)) {
            participants.push(name);
            inputParticipant.value = '';
            renderParticipantList();
        }
    }

    btnStartGame.onclick = () => {
        startGame();
    };

    // --- Game Phase ---
    function startGame() {
        isGameOver = false;
        currentPlayerIndex = 0;
        chestCount = participants.length;
        mimicIndex = Math.floor(Math.random() * chestCount);
        openedChests = 0;

        renderChests();
        updateTurnDisplay();
        showScreenCallback('mimicGame');
    }

    function updateTurnDisplay() {
        currentPlayerSpan.textContent = participants[currentPlayerIndex];
    }

    function renderChests() {
        chestGrid.innerHTML = '';
        for (let i = 0; i < chestCount; i++) {
            const chestBtn = document.createElement('div');
            chestBtn.className = 'chest';
            chestBtn.textContent = '🧰';
            chestBtn.onclick = () => handleChestClick(i, chestBtn);
            chestGrid.appendChild(chestBtn);
        }
    }

    function handleChestClick(index, chestElem) {
        if (isGameOver || chestElem.classList.contains('opened')) return;

        chestElem.classList.add('opened');

        if (index === mimicIndex) {
            isGameOver = true;
            chestElem.classList.add('mimic');
            chestElem.textContent = '👹'; // Mimic face
            triggerMimicLoss();
        } else {
            chestElem.textContent = '💰'; // Safe coin
            playChestOpenSound();
            openedChests++;

            // Next player
            currentPlayerIndex = (currentPlayerIndex + 1) % participants.length;
            updateTurnDisplay();
        }
    }

    // --- Result Phase ---
    function triggerMimicLoss() {
        playMimicSound();
        document.body.classList.add('shaking');

        setTimeout(() => {
            document.body.classList.remove('shaking');
            loserSpan.textContent = participants[currentPlayerIndex];
            showScreenCallback('mimicResult');
        }, 800);
    }

    btnRestart.onclick = () => {
        startGame();
    };

    renderParticipantList();
}
