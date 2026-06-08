const board = document.getElementById('gameBoard');
const timerElement = document.getElementById('timer');
const attemptsElement = document.getElementById('attempts');

const startOverlay = document.getElementById('startOverlay');
const countdownOverlay = document.getElementById('countdownOverlay');
const countdownElement = document.getElementById('countdown');
const victoryScreen = document.getElementById('victoryScreen');

const finalTime = document.getElementById('finalTime');
const finalAttempts = document.getElementById('finalAttempts');
const rankBadge = document.getElementById('rankBadge');
const rankMessage = document.getElementById('rankMessage');

const startBtn = document.getElementById('startBtn');
const shareButton = document.getElementById('shareButton');
const photoButton = document.getElementById('photoButton');
const profileInput = document.getElementById('profileInput');

const flipSound = document.getElementById('flipSound');
const matchSound = document.getElementById('matchSound');
const victorySound = document.getElementById('victorySound');

const shareCanvas = document.getElementById('shareCanvas');
const shareCtx = shareCanvas.getContext('2d');

const cardsData = [
  'assets/milho.jpg',
  'assets/galinha.jpg',
  'assets/vaca.jpg',
  'assets/fava.jpg'
];

let gameCards = [...cardsData, ...cardsData];

let firstCard = null;
let secondCard = null;
let lockBoard = false;

let attempts = 0;
let matches = 0;

let seconds = 0;
let timer;
let currentRank = {
  label: 'BRONZE',
  className: 'bronze',
  medalNumber: '3',
  message: ''
};

let profileImageBase64 = null;

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
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
  shuffle(gameCards);
  board.innerHTML = '';

  gameCards.forEach(image => {
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

    board.appendChild(card);
  });

  const allCards = document.querySelectorAll('.card');

  allCards.forEach(card => {
    card.classList.add('flipped');
  });

  setTimeout(() => {
    allCards.forEach(card => {
      card.classList.remove('flipped');
      card.addEventListener('click', flipCard);
    });

    startTimer();
  }, 10000);
}

function startTimer() {
  timer = setInterval(() => {
    seconds++;

    timerElement.textContent = formatTime(seconds);
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
    resetBoard();

    if (matches === cardsData.length) {
      finishGame();
    }
  } else {
    setTimeout(() => {
      firstCard.classList.remove('flipped');
      secondCard.classList.remove('flipped');
      resetBoard();
    }, 1000);
  }
}

function resetBoard() {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
}

function getRank(attemptsValue, timeValue) {
  const score = attemptsValue + Math.ceil(timeValue / 10);

  if (score <= 7) {
    return {
      label: 'Ouro',
      className: 'gold',
      medalNumber: '1',
      message: 'Excelente memória! Você encontrou os pares com muito controle.'
    };
  }

  if (score <= 11) {
    return {
      label: 'Prata',
      className: 'silver',
      medalNumber: '2',
      message: 'Muito bem! Você teve uma boa estratégia durante o jogo.'
    };
  }

  return {
    label: 'Bronze',
    className: 'bronze',
    medalNumber: '3',
    message: 'Você conseguiu! Com mais treino, seu resultado pode ficar ainda melhor.'
  };
}

function finishGame() {
  clearInterval(timer);

  currentRank = getRank(attempts, seconds);

  finalTime.textContent = formatTime(seconds);
  finalAttempts.textContent = attempts;
  rankBadge.textContent = currentRank.label;
  rankBadge.className = `rank-badge ${currentRank.className}`;
  rankMessage.textContent = currentRank.message;

  playSound(victorySound);

  setTimeout(() => {
    victoryScreen.classList.remove('hidden');
  }, 500);
}

function startCountdown() {
  startOverlay.classList.add('hidden');
  countdownOverlay.classList.remove('hidden');

  let count = 3;
  countdownElement.textContent = count;

  const interval = setInterval(() => {
    count--;
    countdownElement.textContent = count;

    if (count === 0) {
      clearInterval(interval);
      countdownOverlay.classList.add('hidden');
      createBoard();
    }
  }, 1000);
}

function restartGame() {
  location.reload();
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
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

async function createShareImage() {
  const rank = currentRank && currentRank.className ? currentRank : getRank(attempts, seconds);
  const templatePath = rank.className === 'gold'
    ? 'assets/story-ouro.png'
    : rank.className === 'silver'
      ? 'assets/story-prata.png'
      : 'assets/story-bronze.png';

  const ctx = shareCtx;
  const w = shareCanvas.width;
  const h = shareCanvas.height;

  ctx.clearRect(0, 0, w, h);

  try {
    const template = await loadImage(templatePath);
    ctx.drawImage(template, 0, 0, w, h);

    // Atualiza apenas os valores que mudam no layout pronto
    ctx.fillStyle = '#ffffff';
    drawRoundedRect(ctx, 228, 417, 200, 56, 18);
    ctx.fill();

    drawRoundedRect(ctx, 618, 417, 200, 56, 18);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#c47e16';
    ctx.font = 'bold 42px Arial';

    ctx.fillText(formatTime(seconds), 328, 446);
    ctx.fillText(String(attempts).padStart(2, '0'), 718, 446);

    // Foto opcional do jogador na moldura circular
    if (profileImageBase64) {
      const userImg = await loadImage(profileImageBase64);

      const circleX = 86;
      const circleY = 790;
      const circleSize = 390;

      ctx.save();
      ctx.beginPath();
      ctx.arc(
        circleX + circleSize / 2,
        circleY + circleSize / 2,
        circleSize / 2,
        0,
        Math.PI * 2
      );
      ctx.clip();

      drawImageCover(ctx, userImg, circleX, circleY, circleSize, circleSize);

      ctx.restore();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.arc(
        circleX + circleSize / 2,
        circleY + circleSize / 2,
        circleSize / 2,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }

  } catch (e) {
    // fallback simples, caso o template não carregue
    ctx.fillStyle = '#f3dfb4';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#ffffff';
    drawRoundedRect(ctx, 120, 120, 840, 160, 50);
    ctx.fill();

    ctx.fillStyle = '#c47e16';
    ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Jogo da Memória', w / 2, 200);

    ctx.font = 'bold 42px Arial';
    ctx.fillText(`Tempo: ${formatTime(seconds)}`, w / 2, 420);
    ctx.fillText(`Tentativas: ${attempts}`, w / 2, 490);

    ctx.fillText(`Ranking: ${rank.label}`, w / 2, 580);
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
          title: 'Meu resultado no jogo da memória',
          text: 'Completei o jogo da biodiversidade crioula!'
        });
        return;
      } catch (e) {
        // Se o usuário cancelar, cai no download
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resultado-jogo-memoria.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  } catch (error) {
    alert('Não foi possível gerar a imagem para compartilhar.');
  }
}

photoButton.addEventListener('click', () => {
  profileInput.click();
});

profileInput.addEventListener('change', () => {
  const file = profileInput.files && profileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    profileImageBase64 = reader.result;
    photoButton.textContent = 'Foto adicionada ✓';
  };
  reader.readAsDataURL(file);
});

startBtn.addEventListener('click', startCountdown);
shareButton.addEventListener('click', shareToStories);