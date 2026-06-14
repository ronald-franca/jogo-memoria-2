// ==========================================
// ELEMENTOS DO DOM
// ==========================================
const board = document.getElementById('gameBoard'); [cite: 1]
const gameTimerView = document.getElementById('gameTimerView'); [cite: 1]
const attemptsElement = document.getElementById('attempts'); [cite: 1]

const startScreen = document.getElementById('startScreen'); [cite: 1]
const preGameOverlay = document.getElementById('preGameOverlay'); [cite: 1]
const preGameNumber = document.getElementById('preGameNumber'); [cite: 2]
const victoryOverlay = document.getElementById('victoryOverlay'); [cite: 2]

const finalTime = document.getElementById('finalTime'); [cite: 2]
const finalAttempts = document.getElementById('finalAttempts'); [cite: 2]
const rankBadge = document.getElementById('rankBadge'); [cite: 2]
const rankMessage = document.getElementById('rankMessage'); [cite: 3]

const startButton = document.getElementById('startButton'); [cite: 3]
const shareButton = document.getElementById('shareButton'); [cite: 3]
const playerNameInput = document.getElementById('playerName'); [cite: 3]
const musicButton = document.getElementById('musicButton'); [cite: 3]

const flipSound = document.getElementById('flipSound'); [cite: 4]
const matchSound = document.getElementById('matchSound'); [cite: 4]
const wrongSound = document.getElementById('wrongSound'); [cite: 4]
const victorySound = document.getElementById('victorySound'); [cite: 4]
const bgMusic = document.getElementById('bgMusic'); [cite: 4]

const shareCanvas = document.getElementById('shareCanvas'); [cite: 5]
const shareCtx = shareCanvas.getContext('2d'); [cite: 5]

// ==========================================
// CONFIGURAÇÕES E VARIÁVEIS DE ESTADO
// ==========================================
const cardImages = [ [cite: 5]
  'assets/par1.jpg', [cite: 5]
  'assets/par2.jpg', [cite: 5]
  'assets/par3.jpg', [cite: 5]
  'assets/par4.jpg' [cite: 5]
]; [cite: 5]

let cards = [...cardImages, ...cardImages]; [cite: 6]
let firstCard = null; [cite: 6]
let secondCard = null; [cite: 6]
let lockBoard = true; [cite: 6]
let attempts = 0; [cite: 7]
let matches = 0; [cite: 7]

let previewTimer = null; [cite: 7]
let gameTimer = null; [cite: 7]
let gameSeconds = 0; [cite: 7]
let musicMuted = false; [cite: 8]

// ==========================================
// FUNÇÕES UTILITÁRIAS
// ==========================================
function shuffle(array) { [cite: 8]
  array.sort(() => Math.random() - 0.5); [cite: 8]
} [cite: 9]

function formatTime(totalSeconds) { [cite: 9]
  const mins = String(Math.floor(totalSeconds / 60)).padStart(2, '0'); [cite: 9]
  const secs = String(totalSeconds % 60).padStart(2, '0'); [cite: 9]
  return `${mins}:${secs}`; [cite: 9]
} [cite: 10]

function playSound(audio) { [cite: 10]
  if (!audio) return; [cite: 10]
  try { [cite: 10]
    audio.currentTime = 0; [cite: 10]
    const promise = audio.play(); [cite: 10]
    if (promise && typeof promise.catch === 'function') { [cite: 11]
      promise.catch(() => {}); [cite: 11]
    } [cite: 12]
  } catch (e) {} [cite: 12]
} [cite: 12]

function fitText(ctx, text, maxWidth, initialFontSize, fontFamily = 'Arial') { [cite: 35]
  let size = initialFontSize; [cite: 35]
  ctx.font = `bold ${size}px ${fontFamily}`; [cite: 36]
  while (ctx.measureText(text).width > maxWidth && size > 14) { [cite: 36]
    size -= 1; [cite: 36]
    ctx.font = `bold ${size}px ${fontFamily}`; [cite: 37]
  } [cite: 37]
  return size; [cite: 37]
} [cite: 37]

function loadImage(src) { [cite: 37]
  return new Promise((resolve, reject) => { [cite: 37]
    const img = new Image(); [cite: 37]
    if (!src.startsWith('data:')) { [cite: 37]
      img.crossOrigin = 'anonymous'; [cite: 37]
    } [cite: 37]
    img.onload = () => resolve(img); [cite: 37]
    img.onerror = reject; [cite: 37]
    img.src = src.startsWith('data:') ? src : `${src}?v=${Date.now()}`; [cite: 37]
  }); [cite: 38]
} [cite: 38]

function canvasToBlob(canvas) { [cite: 38]
  return new Promise(resolve => { [cite: 38]
    if (canvas.toBlob) { [cite: 38]
      canvas.toBlob(blob => resolve(blob), 'image/png'); [cite: 38]
    } else { [cite: 38]
      const dataUrl = canvas.toDataURL('image/png'); [cite: 38]
      const parts = dataUrl.split(','); [cite: 38]
      const binary = atob(parts[1]); [cite: 38]
      const bytes = new Uint8Array(binary.length); [cite: 38]
      for (let i = 0; i < binary.length; i++) { [cite: 38]
        bytes[i] = binary.charCodeAt(i); [cite: 38]
      } [cite: 38]
      resolve(new Blob([bytes], { type: 'image/png' })); [cite: 39]
    } [cite: 40]
  }); [cite: 40]
} [cite: 40]

// ==========================================
// LÓGICA DO JOGO DA MEMÓRIA
// ==========================================
function createBoard() { [cite: 12]
  board.innerHTML = ''; [cite: 12]
  shuffle(cards); [cite: 12]
  cards.forEach(image => { [cite: 13]
    const card = document.createElement('div'); [cite: 13]
    card.classList.add('card', 'flipped'); [cite: 13]
    card.dataset.image = image; [cite: 13]

    card.innerHTML = `
      <div class="card-inner">
        <div class="card-front">
          <img src="assets/verso.png" alt="Verso da carta">
        </div>
        <div class="card-back">
          <img src="${image}" alt="Carta">
        </div>
      </div>
    `; [cite: 13]

    card.addEventListener('click', flipCard); [cite: 14]
    board.appendChild(card); [cite: 14]
  }); [cite: 15]
} [cite: 15]

function hideCards() { [cite: 15]
  const allCards = document.querySelectorAll('.card'); [cite: 15]
  allCards.forEach(card => card.classList.remove('flipped')); [cite: 15]
  lockBoard = false; [cite: 15]
} [cite: 16]

function startGameTimer() { [cite: 16]
  if (gameTimer) { [cite: 16]
    clearInterval(gameTimer); [cite: 16]
  } [cite: 16]

  gameSeconds = 0; [cite: 16]
  gameTimerView.textContent = '00:00'; [cite: 16]
  gameTimer = setInterval(() => { [cite: 17]
    gameSeconds++; [cite: 17]
    gameTimerView.textContent = formatTime(gameSeconds); [cite: 17]
  }, 1000); [cite: 18]
} [cite: 18]

function flipCard() { [cite: 18]
  if (lockBoard) return; [cite: 18]
  if (this === firstCard) return; [cite: 18]
  if (this.classList.contains('matched')) return; [cite: 18]

  playSound(flipSound); [cite: 18]
  this.classList.add('flipped'); [cite: 18]
  if (!firstCard) { [cite: 19]
    firstCard = this; [cite: 19]
    return; [cite: 19]
  } [cite: 19]

  secondCard = this; [cite: 19]
  lockBoard = true; [cite: 19]

  attempts++; [cite: 19]
  attemptsElement.textContent = attempts; [cite: 20]

  checkMatch(); [cite: 20]
} [cite: 20]

function checkMatch() { [cite: 20]
  const isMatch = firstCard.dataset.image === secondCard.dataset.image; [cite: 20]
  if (isMatch) { [cite: 21]
    playSound(matchSound); [cite: 21]
    firstCard.classList.add('matched'); [cite: 21]
    secondCard.classList.add('matched'); [cite: 21]

    matches++; [cite: 21]
    resetCards(); [cite: 21]
    if (matches === cardImages.length) { [cite: 22]
      if (gameTimer) clearInterval(gameTimer); [cite: 22]
      playSound(victorySound); [cite: 22]

      const rank = getRank(attempts, gameSeconds); [cite: 22]
      finalTime.textContent = formatTime(gameSeconds); [cite: 23]
      finalAttempts.textContent = attempts; [cite: 23]
      rankBadge.textContent = rank.label; [cite: 23]
      rankBadge.className = `rank-badge ${rank.className}`; [cite: 23]
      rankMessage.textContent = rank.message; [cite: 23]
      setTimeout(() => { [cite: 24]
        victoryOverlay.classList.remove('hidden'); [cite: 24]
      }, 450); [cite: 24]
    } [cite: 25]
  } else { [cite: 25]
    playSound(wrongSound); [cite: 25]

    setTimeout(() => { [cite: 25]
      firstCard.classList.remove('flipped'); [cite: 25]
      secondCard.classList.remove('flipped'); [cite: 25]
      resetCards(); [cite: 25]
    }, 1000); [cite: 26]
  } [cite: 26]
} [cite: 26]

function resetCards() { [cite: 26]
  firstCard = null; [cite: 26]
  secondCard = null; [cite: 26]
  lockBoard = false; [cite: 26]
} [cite: 27]

function getRank(attemptsValue, timeValue) { [cite: 27]
  if (timeValue <= 30 && attemptsValue <= 6) { [cite: 27]
    return { [cite: 27]
      label: 'OURO', [cite: 27]
      className: 'gold', [cite: 27]
      message: 'Excelente memória! Você encontrou os pares com muito controle.' [cite: 27]
    }; [cite: 27]
  } [cite: 27]

  if (timeValue <= 60 && attemptsValue <= 10) { [cite: 28]
    return { [cite: 28]
      label: 'PRATA', [cite: 28]
      className: 'silver', [cite: 28]
      message: 'Muito bem! Você teve uma boa estratégia durante o jogo.' [cite: 28]
    }; [cite: 28]
  } [cite: 29]

  return { [cite: 29]
    label: 'BRONZE', [cite: 29]
    className: 'bronze', [cite: 29]
    message: 'Você conseguiu! Com mais treino, seu resultado pode ficar ainda melhor.' [cite: 29]
  }; [cite: 30]
} [cite: 30]

function startPreGameCountdown() { [cite: 30]
  startScreen.classList.add('hidden'); [cite: 30]
  preGameOverlay.classList.remove('hidden'); [cite: 30]

  let count = 3; [cite: 30]
  preGameNumber.textContent = count; [cite: 31]

  const interval = setInterval(() => { [cite: 31]
    count--; [cite: 31]

    if (count <= 0) { [cite: 31]
      clearInterval(interval); [cite: 31]
      preGameOverlay.classList.add('hidden'); [cite: 31]
      initGameplay(); [cite: 31]
      return; [cite: 31]
    } [cite: 31]

    preGameNumber.textContent = count; [cite: 31]
  }, 1000); [cite: 32]
} [cite: 32]

function initGameplay() { [cite: 32]
  createBoard(); [cite: 32]

  attempts = 0; [cite: 32]
  matches = 0; [cite: 32]
  gameSeconds = 0; [cite: 32]

  firstCard = null; [cite: 32]
  secondCard = null; [cite: 32]
  attemptsElement.textContent = attempts; [cite: 33]
  victoryOverlay.classList.add('hidden'); [cite: 33]

  lockBoard = true; [cite: 33]

  if (previewTimer) clearInterval(previewTimer); [cite: 33]
  if (gameTimer) clearInterval(gameTimer); [cite: 33]

  let previewTime = 10; [cite: 33]
  gameTimerView.textContent = String(previewTime); [cite: 33]
  previewTimer = setInterval(() => { [cite: 34]
    previewTime--; [cite: 34]
    gameTimerView.textContent = String(previewTime); [cite: 34]

    if (previewTime <= 0) { [cite: 34]
      clearInterval(previewTimer); [cite: 34]

      document.querySelectorAll('.card').forEach(card => { [cite: 34]
        card.classList.remove('flipped'); [cite: 34]
      }); [cite: 34]

      lockBoard = false; [cite: 34]
      startGameTimer(); [cite: 34]
    } [cite: 34]
  }, 1000); [cite: 35]
} [cite: 35]

function restartGame() { [cite: 35]
  location.reload(); [cite: 35]
} [cite: 35]

// ==========================================
// GERAÇÃO DA IMAGEM E COMPARTILHAMENTO
// ==========================================
async function createShareImage() { [cite: 40]
  try {
    const rank = getRank(attempts, gameSeconds); [cite: 40]
    
    // Imagens limpas solicitadas (6.png, 7.png e 8.png)
    const templateMap = { [cite: 41]
      gold: 'assets/6.png', [cite: 41]
      silver: 'assets/7.png', [cite: 41]
      bronze: 'assets/8.png' [cite: 41]
    }; [cite: 41]
    
    const templateSrc = templateMap[rank.className] || templateMap.gold; [cite: 42]
    const canvas = shareCanvas; [cite: 42]
    const ctx = shareCtx; [cite: 42]

    ctx.clearRect(0, 0, canvas.width, canvas.height); [cite: 42]
    const template = await loadImage(templateSrc); [cite: 43]
    ctx.drawImage(template, 0, 0, canvas.width, canvas.height); [cite: 43]

    const playerName = (playerNameInput?.value || '').trim() || 'Jogador'; [cite: 44]
    
    // Configuração base do texto dinâmico
    ctx.fillStyle = '#be7612'; [cite: 44]
    ctx.textAlign = 'center'; [cite: 44]
    ctx.textBaseline = 'middle'; [cite: 44]

    // 1. NOME: Centralizado horizontalmente no balão superior (Y: 320)
    ctx.font = 'bold 45px Arial'; [cite: 45]
    ctx.fillText(playerName, 540, 320); [cite: 46]

    // 2. TEMPO E TENTATIVAS: Alinhados dentro dos balões simétricos (Y: 475)
    ctx.font = 'bold 50px Arial'; [cite: 46]
    ctx.fillText(formatTime(gameSeconds), 340, 475); // Caixa esquerda [cite: 47]
    ctx.fillText(String(attempts).padStart(2, '0'), 740, 475); // Caixa direita [cite: 47]

    // 3. RANKING: Centralizado no balão inferior (Y: 635)
    ctx.font = 'bold 40px Arial'; [cite: 48]
    ctx.fillText(rank.label, 540, 635); [cite: 49]
    
  } catch (err) {
    console.error("Erro ao desenhar elementos no canvas:", err);
  }
} [cite: 50]

async function shareToStories() { [cite: 53]
  try {
    await createShareImage(); [cite: 53]
    const blob = await canvasToBlob(shareCanvas); [cite: 54]
    if (!blob) throw new Error('Falha ao gerar imagem.'); [cite: 55]
    const file = new File([blob], 'conquista-raizes-crioulas.png', { type: 'image/png' }); [cite: 55]
    const canShareFiles = [cite: 56]
      typeof navigator.share === 'function' && [cite: 56]
      ( [cite: 56]
        typeof navigator.canShare !== 'function' || [cite: 56]
        navigator.canShare({ files: [file] }) [cite: 56]
      ); [cite: 56]
    if (canShareFiles) { [cite: 57]
      try { [cite: 57]
        await navigator.share({ [cite: 57]
          files: [file], [cite: 57]
          title: 'Jogo da Memória', [cite: 57]
          text: 'Olha a minha conquista no Jogo da Memória - Raízes da Biodiversidade Crioula do Piauí!' [cite: 57]
        }); [cite: 57]
        return; [cite: 58]
      } catch (e) {} [cite: 58]
    } [cite: 58]

    const url = URL.createObjectURL(blob); [cite: 58]
    const a = document.createElement('a'); [cite: 58]
    a.href = url; [cite: 59]
    a.download = 'conquista-raizes-crioulas.png'; [cite: 59]
    document.body.appendChild(a); [cite: 59]
    a.click(); [cite: 59]
    a.remove(); [cite: 59]
    setTimeout(() => URL.revokeObjectURL(url), 1500); [cite: 60]
    alert('Imagem baixada! Agora você pode postá-la diretamente nos seus Stories.'); [cite: 61]
  } catch (error) { [cite: 61]
    alert('Erro ao gerar imagem de compartilhamento.'); [cite: 62]
  } [cite: 62]
} [cite: 62]

// ==========================================
// EVENTOS / LISTENERS
// ==========================================
startButton.addEventListener('click', () => { [cite: 62]
  bgMusic.volume = 0.25; [cite: 62]
  bgMusic.play().catch(() => {}); [cite: 62]
  startPreGameCountdown(); [cite: 63]
}); [cite: 63]

musicButton.addEventListener('click', () => { [cite: 63]
  if (!musicMuted) { [cite: 63]
    bgMusic.pause(); [cite: 63]
    musicButton.textContent = '🔇 Música'; [cite: 63]
    musicMuted = true; [cite: 63]
  } else { [cite: 63]
    bgMusic.play().catch(() => {}); [cite: 64]
    musicButton.textContent = '🔊 Música'; [cite: 64]
    musicMuted = false; [cite: 64]
  } [cite: 64]
}); [cite: 64]

shareButton.addEventListener('click', shareToStories); [cite: 64]
