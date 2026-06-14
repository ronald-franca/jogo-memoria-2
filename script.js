const board = document.getElementById('gameBoard');
const gameTimerView = document.getElementById('gameTimerView');
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

let previewTimer = null;
let gameTimer = null;
let gameSeconds = 0;
let musicMuted = false;

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
    card.classList.add('card', 'flipped');
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
  if (gameTimer) {
    clearInterval(gameTimer);
  }

  gameSeconds = 0;
  gameTimerView.textContent = '00:00';

  gameTimer = setInterval(() => {
    gameSeconds++;
    gameTimerView.textContent = formatTime(gameSeconds);
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
  if (timeValue <= 30 && attemptsValue <= 6) {
    return {
      label: 'OURO',
      className: 'gold',
      message: 'Excelente memória! Você encontrou os pares com muito controle.'
    };
  }

  if (timeValue <= 60 && attemptsValue <= 10) {
    return {
      label: 'PRATA',
      className: 'silver',
      message: 'Muito bem! Você teve uma boa estratégia durante o jogo.'
    };
  }

  return {
    label: 'BRONZE',
    className: 'bronze',
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
      initGameplay();
      return;
    }

    preGameNumber.textContent = count;
  }, 1000);
}

function initGameplay() {
  createBoard();

  attempts = 0;
  matches = 0;
  gameSeconds = 0;

  firstCard = null;
  secondCard = null;

  attemptsElement.textContent = attempts;
  victoryOverlay.classList.add('hidden');

  lockBoard = true;

  if (previewTimer) clearInterval(previewTimer);
  if (gameTimer) clearInterval(gameTimer);

  let previewTime = 10;
  gameTimerView.textContent = String(previewTime);

  previewTimer = setInterval(() => {
    previewTime--;
    gameTimerView.textContent = String(previewTime);

    if (previewTime <= 0) {
      clearInterval(previewTimer);

      document.querySelectorAll('.card').forEach(card => {
        card.classList.remove('flipped');
      });

      lockBoard = false;
      startGameTimer();
    }
  }, 1000);
}

function restartGame() {
  location.reload();
}

function fitText(ctx, text, maxWidth, initialFontSize, fontFamily = 'Arial') {
  let size = initialFontSize;
  ctx.font = `bold ${size}px ${fontFamily}`;
  while (ctx.measureText(text).width > maxWidth && size > 14) {
    size -= 1;
    ctx.font = `bold ${size}px ${fontFamily}`;
  }
  return size;
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
  const rank = getRank(attempts, gameSeconds); [cite: 40]
  
  // Atualizado para usar os novos arquivos de imagem mapeados pelo rank
  const templateMap = {
    gold: 'assets/6.png',    // Imagem limpa para o Rank OURO
    silver: 'assets/7.png',  // Imagem limpa para o Rank PRATA
    bronze: 'assets/8.png'   // Imagem limpa para o Rank BRONZE
  };
  
  const templateSrc = templateMap[rank.className] || templateMap.gold; [cite: 42]
  const canvas = shareCanvas; [cite: 42]
  const ctx = shareCtx; [cite: 42]

  // Limpa o canvas antes de desenhar
  ctx.clearRect(0, 0, canvas.width, canvas.height); [cite: 42]
  
  // Carrega e desenha o template de fundo limpo
  const template = await loadImage(templateSrc); [cite: 43]
  ctx.drawImage(template, 0, 0, canvas.width, canvas.height); [cite: 43]

  const playerName = (playerNameInput?.value || '').trim() || 'Jogador'; [cite: 43]
  
  // Configuração padrão de estilo dos textos
  ctx.fillStyle = '#be7612';  [cite: 44]
  ctx.textAlign = 'center'; [cite: 44]
  ctx.textBaseline = 'middle'; [cite: 44]

  // 1. NOME DO JOGADOR: Centralizado horizontalmente no canvas (X: 540) e ajustado na altura correta (Y: 320)
  ctx.font = 'bold 45px Arial';
  ctx.fillText(playerName, 540, 320); [cite: 46]

  // 2. TEMPO E TENTATIVAS: Ajustados para os centros exatos dos balões menores (X: 340 e X: 740, Y: 475)
  ctx.font = 'bold 50px Arial'; [cite: 46]
  ctx.fillText(formatTime(gameSeconds), 340, 475); // Balão da Esquerda (Tempo) [cite: 47]
  ctx.fillText(String(attempts).padStart(2, '0'), 740, 475); // Balão da Direita (Tentativas) [cite: 47]

  // 3. TEXTO DO RANKING: Centralizado no balão inferior (X: 540, Y: 635)
  ctx.fillStyle = '#be7612';  [cite: 50]
  ctx.font = 'bold 40px Arial'; [cite: 48]
  ctx.fillText(rank.label, 540, 635); [cite: 49]
}

async function shareToStories() {
  try {
    await createShareImage();

    const blob = await canvasToBlob(shareCanvas);
    if (!blob) throw new Error('Falha ao gerar imagem.');

    const file = new File([blob], 'conquista-raizes-crioulas.png', { type: 'image/png' });

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
          text: 'Olha a minha conquista no Jogo da Memória - Raízes da Biodiversidade Crioula do Piauí!'
        });
        return;
      } catch (e) {}
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'conquista-raizes-crioulas.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);

    alert('Imagem baixada! Agora você pode postá-la diretamente nos seus Stories.');
  } catch (error) {
    alert('Erro ao gerar imagem de compartilhamento.');
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

shareButton.addEventListener('click', shareToStories);
