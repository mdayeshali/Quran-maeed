document.addEventListener('DOMContentLoaded', () => {
  // DOM Views & Buttons
  const pathwayView = document.getElementById('pathwayView');
  const quizPlayView = document.getElementById('quizPlayView');
  const quizResultView = document.getElementById('quizResultView');
  const exitQuizBtn = document.getElementById('exitQuizBtn');
  const mainStatsGroup = document.getElementById('mainStatsGroup');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIcon = document.getElementById('soundIcon');

  // Stats DOM
  const totalCoinsDisplay = document.getElementById('totalCoinsDisplay');
  const heartsDisplay = document.getElementById('heartsDisplay');
  const streakCount = document.getElementById('streakCount');

  // Roadmaps
  const worldOnePath = document.getElementById('worldOnePath');
  const worldTwoPath = document.getElementById('worldTwoPath');

  // Gameplay DOM
  const progressBar = document.getElementById('progressBar');
  const questionText = document.getElementById('questionText');
  const optionsContainer = document.getElementById('optionsContainer');
  const bottomSheet = document.getElementById('bottomSheet');
  const sheetIcon = document.getElementById('sheetIcon');
  const sheetTitle = document.getElementById('sheetTitle');
  const sheetExplanation = document.getElementById('sheetExplanation');
  const nextQuestionBtn = document.getElementById('nextQuestionBtn');

  // Result DOM
  const resultTitle = document.getElementById('resultTitle');
  const resultSubtitle = document.getElementById('resultSubtitle');
  const correctScoreText = document.getElementById('correctScoreText');
  const earnedCoinsText = document.getElementById('earnedCoinsText');
  const continuePathBtn = document.getElementById('continuePathBtn');
  const retryLevelBtn = document.getElementById('retryLevelBtn');

  // State
  let gameLevels = [];
  let currentLevelIndex = 0;
  let currentQuestionIndex = 0;
  let correctCountThisLevel = 0;
  let earnedCoinsThisLevel = 0;

  // Persistent Duolingo State
  let totalCoins = parseInt(localStorage.getItem('islamic_duo_coins')) || 0;
  let hearts = parseInt(localStorage.getItem('islamic_duo_hearts')) || 5;
  let unlockedLevels = JSON.parse(localStorage.getItem('islamic_duo_unlocked')) || [1];
  let isSoundEnabled = localStorage.getItem('islamic_duo_sound') !== 'false';

  // ==========================================
  // PURE SYNTHESIZER AUDIO (DUOLINGO TONES)
  // ==========================================
  let audioCtx = null;
  function initAudio() {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioCtx = new AudioCtx();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }

  ['click', 'touchstart'].forEach(e => document.addEventListener(e, () => initAudio(), { once: true }));

  function playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.15) {
    if (!isSoundEnabled) return;
    initAudio();
    if (!audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch(err){}
  }

  const DuoAudio = {
    click: () => playTone(600, 'sine', 0.05, 0.08),
    correct: () => {
      // Duolingo style cheerful chime
      playTone(523.25, 'triangle', 0.12, 0.18);
      setTimeout(() => playTone(783.99, 'triangle', 0.25, 0.2), 100);
    },
    wrong: () => {
      playTone(220, 'sawtooth', 0.18, 0.12);
      setTimeout(() => playTone(180, 'sawtooth', 0.25, 0.12), 100);
    },
    fanfare: () => {
      [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
        setTimeout(() => playTone(f, 'sine', 0.25, 0.2), i * 110);
      });
    }
  };

  function updateHUD() {
    totalCoinsDisplay.innerText = totalCoins.toLocaleString('bn-BD');
    heartsDisplay.innerText = hearts.toLocaleString('bn-BD');
    soundIcon.className = isSoundEnabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
  }

  soundToggleBtn.addEventListener('click', () => {
    isSoundEnabled = !isSoundEnabled;
    localStorage.setItem('islamic_duo_sound', isSoundEnabled);
    updateHUD();
    if (isSoundEnabled) DuoAudio.click();
  });

  // ==========================================
  // ROADMAP GENERATOR (S-CURVE NODES)
  // ==========================================
  const curvePattern = ['pos-center', 'pos-left', 'pos-left', 'pos-center', 'pos-right', 'pos-right'];

  async function loadLevels() {
    try {
      const res = await fetch('../data/quiz-game.json');
      gameLevels = await res.json();
      renderRoadmap();
    } catch (e) {
      console.error(e);
    }
  }

  function renderRoadmap() {
    worldOnePath.innerHTML = '';
    worldTwoPath.innerHTML = '';

    gameLevels.forEach((lvl, idx) => {
      const isUnlocked = unlockedLevels.includes(lvl.level);
      const isWorldTwo = lvl.level > 5;
      const targetContainer = isWorldTwo ? worldTwoPath : worldOnePath;

      const nodeWrapper = document.createElement('div');
      nodeWrapper.className = `duo-node-wrapper ${curvePattern[idx % curvePattern.length]} ${isWorldTwo ? 'unit-2-node' : ''}`;

      nodeWrapper.innerHTML = `
        <div class="node-title-popup">${lvl.title}</div>
        <button type="button" class="duo-node-btn ${isUnlocked ? 'active' : 'locked'}">
          <i class="fa-solid ${isUnlocked ? (lvl.level === 10 ? 'fa-crown' : 'fa-star') : 'fa-lock'}"></i>
        </button>
      `;

      const btn = nodeWrapper.querySelector('.duo-node-btn');
      if (isUnlocked) {
        btn.addEventListener('click', () => {
          DuoAudio.click();
          startLevel(idx);
        });
      }

      targetContainer.appendChild(nodeWrapper);
    });
  }

  // ==========================================
  // GAMEPLAY ENGINE
  // ==========================================
  function switchView(view) {
    pathwayView.style.display = 'none';
    quizPlayView.style.display = 'none';
    quizResultView.style.display = 'none';

    if (view === 'path') {
      pathwayView.style.display = 'block';
      exitQuizBtn.style.display = 'none';
      mainStatsGroup.style.display = 'flex';
      renderRoadmap();
    } else if (view === 'quiz') {
      quizPlayView.style.display = 'block';
      exitQuizBtn.style.display = 'flex';
    } else if (view === 'result') {
      quizResultView.style.display = 'block';
      exitQuizBtn.style.display = 'flex';
    }
  }

  function startLevel(lvlIdx) {
    currentLevelIndex = lvlIdx;
    currentQuestionIndex = 0;
    correctCountThisLevel = 0;
    earnedCoinsThisLevel = 0;

    switchView('quiz');
    renderQuestion();
  }

  function renderQuestion() {
    const questions = gameLevels[currentLevelIndex].questions;
    const currentQ = questions[currentQuestionIndex];

    progressBar.style.width = `${((currentQuestionIndex) / questions.length) * 100}%`;
    questionText.innerText = currentQ.question;
    optionsContainer.innerHTML = '';
    bottomSheet.className = 'duo-bottom-sheet'; // hide sheet

    currentQ.options.forEach((optText, optIdx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'duo-opt-btn';
      btn.innerText = optText;

      btn.addEventListener('click', () => handleOptionSelection(optIdx, btn));
      optionsContainer.appendChild(btn);
    });
  }

  function handleOptionSelection(selectedIdx, clickedBtn) {
    const questions = gameLevels[currentLevelIndex].questions;
    const currentQ = questions[currentQuestionIndex];
    const allBtns = optionsContainer.querySelectorAll('.duo-opt-btn');

    allBtns.forEach(b => b.disabled = true);

    if (selectedIdx === currentQ.answerIndex) {
      DuoAudio.correct();
      clickedBtn.classList.add('correct');
      totalCoins += 5;
      earnedCoinsThisLevel += 5;
      correctCountThisLevel++;
      localStorage.setItem('islamic_duo_coins', totalCoins);

      // Show Correct Bottom Sheet
      bottomSheet.className = 'duo-bottom-sheet correct-sheet';
      sheetIcon.innerHTML = '<i class="fa-solid fa-check"></i>';
      sheetTitle.innerText = 'অসাধারণ!';
      sheetExplanation.innerText = currentQ.explanation || 'সঠিক উত্তর নির্বাচন করেছেন।';
    } else {
      DuoAudio.wrong();
      clickedBtn.classList.add('wrong');
      allBtns[currentQ.answerIndex].classList.add('correct');

      if (hearts > 1) {
        hearts--;
      } else {
        hearts = 5; // রিসেট
      }
      localStorage.setItem('islamic_duo_hearts', hearts);

      // Show Wrong Bottom Sheet
      bottomSheet.className = 'duo-bottom-sheet wrong-sheet';
      sheetIcon.innerHTML = '<i class="fa-solid fa-xmark"></i>';
      sheetTitle.innerText = 'সঠিক উত্তরটি লক্ষ্য করুন:';
      sheetExplanation.innerText = currentQ.explanation || 'আবার মনে রাখার চেষ্টা করুন।';
    }

    updateHUD();
  }

  nextQuestionBtn.addEventListener('click', () => {
    DuoAudio.click();
    const questions = gameLevels[currentLevelIndex].questions;
    currentQuestionIndex++;

    if (currentQuestionIndex < questions.length) {
      renderQuestion();
    } else {
      progressBar.style.width = '100%';
      showLevelComplete();
    }
  });

  function showLevelComplete() {
    switchView('result');
    const totalQ = gameLevels[currentLevelIndex].questions.length;
    correctScoreText.innerText = `${correctCountThisLevel.toLocaleString('bn-BD')} / ${totalQ.toLocaleString('bn-BD')}`;
    earnedCoinsText.innerText = `+${earnedCoinsThisLevel.toLocaleString('bn-BD')}`;

    if (correctCountThisLevel >= 3) {
      DuoAudio.fanfare();
      resultTitle.innerText = 'পাঠ সম্পন্ন!';
      resultSubtitle.innerText = 'মাশাআল্লাহ! আপনি দারুণ নৈপুণ্য দেখিয়েছেন।';

      const nextLvl = gameLevels[currentLevelIndex].level + 1;
      if (!unlockedLevels.includes(nextLvl) && nextLvl <= gameLevels.length) {
        unlockedLevels.push(nextLvl);
        localStorage.setItem('islamic_duo_unlocked', JSON.stringify(unlockedLevels));
      }
    } else {
      DuoAudio.wrong();
      resultTitle.innerText = 'আরেকটু অনুশীলন প্রয়োজন!';
      resultSubtitle.innerText = 'পরবর্তী স্তর আনলক করতে কমপক্ষে ৩টি সঠিক উত্তর দিতে হবে।';
    }
  }

  continuePathBtn.addEventListener('click', () => {
    DuoAudio.click();
    switchView('path');
  });

  retryLevelBtn.addEventListener('click', () => {
    DuoAudio.click();
    startLevel(currentLevelIndex);
  });

  exitQuizBtn.addEventListener('click', () => {
    DuoAudio.click();
    switchView('path');
  });

  updateHUD();
  loadLevels();
});
        
