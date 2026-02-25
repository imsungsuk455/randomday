// main.js - Screen Navigation and App Entry Point

const screens = {
  home: document.getElementById('home-screen'),
  setup: document.getElementById('setup-screen'),
  game: document.getElementById('game-screen'),
  result: document.getElementById('result-screen'),
  mimicSetup: document.getElementById('mimic-setup-screen'),
  mimicGame: document.getElementById('mimic-game-screen'),
  mimicResult: document.getElementById('mimic-result-screen'),
  iceSetup: document.getElementById('ice-setup-screen'),
  iceGame: document.getElementById('ice-game-screen'),
  iceResult: document.getElementById('ice-result-screen'),
  bombSetup: document.getElementById('bomb-setup-screen'),
  bombGame: document.getElementById('bomb-game-screen'),
  bombResult: document.getElementById('bomb-result-screen')
};

const btnStartBalloon = document.getElementById('btn-start-balloon');
const btnStartMimic = document.getElementById('btn-start-mimic');
const btnStartIce = document.getElementById('btn-start-ice');
const btnStartBomb = document.getElementById('btn-start-bomb');

const btnGoHome = document.getElementById('btn-go-home');
const btnMimicGoHome = document.getElementById('mimic-btn-go-home');
const btnIceGoHome = document.getElementById('ice-btn-go-home');
const btnBombGoHome = document.getElementById('bomb-btn-go-home');

// Navigation Logic
function showScreen(screenId) {
  Object.values(screens).forEach(screen => {
    screen.classList.remove('active');
  });
  screens[screenId].classList.add('active');
}

// Event Listeners
btnStartBalloon.addEventListener('click', () => {
  showScreen('setup');
  initBalloonGame(showScreen);
});

btnStartMimic.addEventListener('click', () => {
  showScreen('mimicSetup');
  initMimicGame(showScreen);
});

btnStartIce.addEventListener('click', () => {
  showScreen('iceSetup');
  if (typeof initIceGame === 'function') {
    initIceGame(showScreen);
  }
});

btnStartBomb.addEventListener('click', () => {
  showScreen('bombSetup');
  if (typeof initBombGame === 'function') {
    initBombGame(showScreen);
  }
});

btnGoHome.addEventListener('click', () => {
  showScreen('home');
});

btnMimicGoHome.addEventListener('click', () => {
  showScreen('home');
});

btnIceGoHome.addEventListener('click', () => {
  showScreen('home');
});

btnBombGoHome.addEventListener('click', () => {
  showScreen('home');
});
