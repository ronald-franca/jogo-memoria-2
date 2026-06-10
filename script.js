const board = document.getElementById('gameBoard');
const countdownElement = document.getElementById('countdown');
const attemptsElement = document.getElementById('attempts');

const startScreen = document.getElementById('startScreen');
const preGameOverlay = document.getElementById('preGameOverlay');
const preGameNumber = document.getElementById('preGameNumber');
const victoryOverlay = document.getElementById('victoryOverlay');

const finalTime = document.getElementById('finalTime');
const finalAttempts = document.getElementById('finalAttempts');
const rankBadge = document.getElementById('rankBadge');
const rankMessage = document.getElementById('rankMessage');

const startButton = document.getElementById('startButton');
const shareButton = document.getElementById('shareButton');
const photoButton = document.getElementById('photoButton');
const profilePhotoInput = document.getElementById('profilePhotoInput');
const playerNameInput = document.getElementById('playerName');
const musicButton = document.getElementById('musicButton');

const flipSound = document.getElementById('flipSound');
const matchSound = document.getElementById('matchSound');
const wrongSound = document.getElementById('wrongSound');
const victorySound = document.getElementById('victorySound');
const bgMusic = document.getElementById('bgMusic');

const shareCanvas = document.getElementById('shareCanvas');
const shareCtx = shareCanvas.getContext('2d');

const cardImages = [
  'assets/par1.jpg',
  'assets/par2.jpg',
  'assets/par3.jpg',
  'assets/par4.jpg'
];

let cards = [...cardImages, ...cardImages];
let firstCard = null;
let secondCard = null;
let lockBoard = true;

let attempts = 0;
let matches = 0;

let previewCountdown = 10;
let previewTimer = null;
let gameTimer = null;
let gameSeconds = 0;
let musicMuted = false;
let profilePhotoDataUrl = null;

function shuffle(array) {
  array.sort(() => Math.random() - 0.5);
}

function formatTime(totalSeconds) {
  const mins = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const secs = String(totalSeconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

function playSound(audio) {
  if (!audio) return;
  try {
    audio.currentTime = 0;
    const promise = audio.play();
    if (promise && typeof promise.catch === 'function') {
      promise.catch(() => {});
    }
  } catch (e) {}
}

function createBoard() {
  board.innerHTML = '';
  shuffle(cards);

  cards.forEach(image => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.image = image;

    card.innerHTML = `
      <div class="card-inner">
        <div class="card-front">
          <img src="assets/verso.png" alt="Verso da carta">
        </div>
        <div class="card-back">
          <img src="${image}" alt="Carta">
        </div>
      </div>
    `;

    card.classList.add('flipped');
    card.addEventListener('click', flipCard);
    board.appendChild(card);
  });
}

function hideCards() {
  const allCards = document.querySelectorAll('.card');
  allCards.forEach(card => card.classList.remove('flipped'));
  lockBoard = false;
}

function startGameTimer() {
  if (gameTimer) clearInterval(gameTimer);
  gameSeconds = 0;

  gameTimer = setInterval(() => {
    gameSeconds++;
  }, 1000);
}

function flipCard() {
  if (lockBoard) return;
  if (this === firstCard) return;
  if (this.classList.contains('matched')) return;

  playSound(flipSound);

  this.classList.add('flipped');

  if (!firstCard) {
    firstCard = this;
    return;
  }

  secondCard = this;
  lockBoard = true;

  attempts++;
  attemptsElement.textContent = attempts;

  checkMatch();
}

function checkMatch() {
  const isMatch = firstCard.dataset.image === secondCard.dataset.image;

  if (isMatch) {
    playSound(matchSound);

    firstCard.classList.add('matched');
    secondCard.classList.add('matched');

    matches++;
    resetCards();

    if (matches === cardImages.length) {
      if (gameTimer) clearInterval(gameTimer);
      playSound(victorySound);

      const rank = getRank(attempts, gameSeconds);

      finalTime.textContent = formatTime(gameSeconds);
      finalAttempts.textContent = attempts;
      rankBadge.textContent = rank.label;
      rankBadge.className = `rank-badge ${rank.className}`;
      rankMessage.textContent = rank.message;

      setTimeout(() => {
        victoryOverlay.classList.remove('hidden');
      }, 450);
    }
  } else {
    playSound(wrongSound);

    setTimeout(() => {
      firstCard.classList.remove('flipped');
      secondCard.classList.remove('flipped');
      resetCards();
    }, 1000);
  }
}

function resetCards() {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
}

function getRank(attemptsValue, timeValue) {
  if (timeValue <= 60 && attemptsValue <= 8) {
    return {
      label: 'OURO',
      className: 'gold',
      medalNumber: '1',
      message: 'Excelente memória! Você encontrou os pares com muito controle.'
    };
  }

  if (timeValue <= 90 && attemptsValue <= 11) {
    return {
      label: 'PRATA',
      className: 'silver',
      medalNumber: '2',
      message: 'Muito bem! Você teve uma boa estratégia durante o jogo.'
    };
  }

  return {
    label: 'BRONZE',
    className: 'bronze',
    medalNumber: '3',
    message: 'Você conseguiu! Com mais treino, seu resultado pode ficar ainda melhor.'
  };
}

function startPreGameCountdown() {
  startScreen.classList.add('hidden');
  preGameOverlay.classList.remove('hidden');

  let count = 3;
  preGameNumber.textContent = count;

  const interval = setInterval(() => {
    count--;

    if (count <= 0) {
      clearInterval(interval);
      preGameOverlay.classList.add('hidden');
      startCountdown();
      return;
    }

    preGameNumber.textContent = count;
  }, 1000);
}

function startCountdown() {
  createBoard();

  previewCountdown = 10;
  attempts = 0;
  matches = 0;
  gameSeconds = 0;
  firstCard = null;
  secondCard = null;
  lockBoard = true;

  attemptsElement.textContent = attempts;
  countdownElement.textContent = previewCountdown;
  victoryOverlay.classList.add('hidden');

  if (previewTimer) clearInterval(previewTimer);
  if (gameTimer) clearInterval(gameTimer);

  const allCards = document.querySelectorAll('.card');
  allCards.forEach(card => card.classList.add('flipped'));

  previewTimer = setInterval(() => {
    previewCountdown--;

    if (previewCountdown <= 0) {
      previewCountdown = 0;
      countdownElement.textContent = previewCountdown;

      clearInterval(previewTimer);
      hideCards();
      startGameTimer();
      return;
    }

    countdownElement.textContent = previewCountdown;
  }, 1000);
}

function restartGame() {
  location.reload();
}

function drawImageCover(ctx, img, x, y, w, h) {
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;

  if (imgRatio > boxRatio) {
    sw = img.height * boxRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / boxRatio;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src.startsWith('data:') ? src : `${src}?v=${Date.now()}`;
  });
}

function canvasToBlob(canvas) {
  return new Promise(resolve => {
    if (canvas.toBlob) {
      canvas.toBlob(blob => resolve(blob), 'image/png');
    } else {
      const dataUrl = canvas.toDataURL('image/png');
      const parts = dataUrl.split(',');
      const binary = atob(parts[1]);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      resolve(new Blob([bytes], { type: 'image/png' }));
    }
  });
}

async function createShareImage() {
  const rank = getRank(attempts, gameSeconds);

  const templateMap = {
    gold: 'assets/story-ouro.png',
    silver: 'assets/story-prata.png',
    bronze: 'assets/story-bronze.png'
  };

  // Se quiser usar URL, substitua os caminhos acima por links completos.
  const templateSrc = templateMap[rank.className] || templateMap.gold;

  const canvas = shareCanvas;
  const ctx = shareCtx;

  canvas.width = 1080;
  canvas.height = 1920;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const template = await loadImage(templateSrc);
  ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

  const playerName = (playerNameInput?.value || '').trim() || 'Jogador';

  ctx.fillStyle = '#c47e16';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 46px Arial';
  ctx.fillText(playerName, 540, 620);

  ctx.font = 'bold 52px Arial';
  ctx.fillText(formatTime(gameSeconds), 310, 835);
  ctx.fillText(String(attempts).padStart(2, '0'), 770, 835);

  if (profilePhotoDataUrl) {
    try {
      const userImg = await loadImage(profilePhotoDataUrl);

      const centerX = 305;
      const centerY = 1460;
      const radius = 225;

      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      drawImageCover(ctx, userImg, centerX - radius, centerY - radius, radius * 2, radius * 2);

      ctx.restore();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
    } catch (e) {}
  }
}

async function shareToStories() {
  try {
    await createShareImage();

    const blob = await canvasToBlob(shareCanvas);
    if (!blob) throw new Error('Falha ao gerar imagem.');

    const file = new File([blob], 'resultado-jogo-memoria.png', { type: 'image/png' });

    const canShareFiles =
      typeof navigator.share === 'function' &&
      (
        typeof navigator.canShare !== 'function' ||
        navigator.canShare({ files: [file] })
      );

    if (canShareFiles) {
      try {
        await navigator.share({
          files: [file],
          title: 'Jogo da Memória',
          text: 'Veja meu resultado no Jogo da Memória da Biodiversidade Crioula!'
        });
        return;
      } catch (e) {}
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resultado-jogo-memoria.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);

    alert('A imagem foi baixada. No celular, abra a imagem e compartilhe nos stories.');
  } catch (error) {
    alert('Não foi possível gerar a imagem para compartilhar.');
  }
}

startButton.addEventListener('click', () => {
  bgMusic.volume = 0.25;
  bgMusic.play().catch(() => {});
  startPreGameCountdown();
});

musicButton.addEventListener('click', () => {
  if (!musicMuted) {
    bgMusic.pause();
    musicButton.textContent = '🔇 Música';
    musicMuted = true;
  } else {
    bgMusic.play().catch(() => {});
    musicButton.textContent = '🔊 Música';
    musicMuted = false;
  }
});

photoButton.addEventListener('click', () => {
  profilePhotoInput.click();
});

profilePhotoInput.addEventListener('change', () => {
  const file = profilePhotoInput.files && profilePhotoInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    profilePhotoDataUrl = reader.result;
    photoButton.textContent = 'Foto adicionada ✓';
  };
  reader.readAsDataURL(file);
});

shareButton.addEventListener('click', shareToStories);
