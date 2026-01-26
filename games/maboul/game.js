/**
 * DOCTEUR MABOUL v2 - Enhanced Game Logic
 * Multi-cavity system, money scoring, realistic feedback
 */

// ============================================
// GAME CONFIGURATION
// ============================================

const CONFIG = {
    CANVAS_WIDTH: 360,
    CANVAS_HEIGHT: 480,

    // Scoring - Points-based system (higher = better)
    STARTING_POINTS: 0,
    TIME_BONUS_MULTIPLIER: 10, // Points per second saved (faster = more points)
    MAX_TIME_FOR_BONUS: 30, // Max seconds for time bonus calculation

    // Collision detection - smaller piece = harder
    PIECE_RADIUS: 6,

    // Audio
    BUZZ_FREQUENCY: 150,
    BUZZ_DURATION: 400,

    // Vibration
    VIBRATION_DURATION: 300,

    // Attempts per object
    MAX_ATTEMPTS: 3,

    // Admin code for organizer mode
    ADMIN_CODE: 'matthiaslebelge',

    // Server API URL (relative path from games/maboul/)
    API_URL: '../../api/api.php',

    // Colors (plastic theme)
    COLORS: {
        background: '#FFF8E1',
        body: '#FFCCBC',
        bodyOutline: '#D7CCC8',
        bodyShadow: 'rgba(0, 0, 0, 0.2)',
        hair: '#5D4037',
        face: '#FFCCBC',
        clothes: '#1E88E5',
        nose: '#E53935',
        cavity: '#263238',
        cavityBorder: '#E53935',
        piece: '#FDD835',
        pieceOutline: '#C6A700',
        target: '#43A047'
    }
};

// Objects to extract with different difficulties - HARDER sizes
const GAME_OBJECTS = [
    { id: 'bone', emoji: '🦴', name: 'Os', size: 6, reward: 150, difficulty: 1, extracted: false },
    { id: 'butterfly', emoji: '🦋', name: 'Papillon', size: 6, reward: 150, difficulty: 1, extracted: false },
    { id: 'heart', emoji: '💔', name: 'Cœur', size: 7, reward: 300, difficulty: 2, extracted: false },
    { id: 'apple', emoji: '🍎', name: 'Pomme', size: 7, reward: 300, difficulty: 2, extracted: false },
    { id: 'frog', emoji: '🐸', name: 'Grenouille', size: 8, reward: 600, difficulty: 3, extracted: false },
    { id: 'bucket', emoji: '🪣', name: 'Seau', size: 8, reward: 600, difficulty: 3, extracted: false }
];

// Cavity positions - VERY NARROW paths for harder gameplay
const CAVITIES = [
    { id: 'bone', x: 0.25, y: 0.3, width: 0.15, height: 0.12, pathWidth: 14 },
    { id: 'butterfly', x: 0.7, y: 0.28, width: 0.15, height: 0.12, pathWidth: 14 },
    { id: 'heart', x: 0.45, y: 0.38, width: 0.18, height: 0.14, pathWidth: 12 },
    { id: 'apple', x: 0.28, y: 0.52, width: 0.18, height: 0.14, pathWidth: 12 },
    { id: 'frog', x: 0.58, y: 0.55, width: 0.2, height: 0.15, pathWidth: 10 },
    { id: 'bucket', x: 0.42, y: 0.7, width: 0.2, height: 0.15, pathWidth: 10 }
];

// ============================================
// GAME STATE
// ============================================

const GameState = {
    WELCOME: 'welcome',
    SELECTING: 'selecting',
    PLAYING: 'playing',
    SUCCESS: 'success',
    GAMEOVER: 'gameover'
};

let state = {
    current: GameState.WELCOME,
    playerName: '',
    firstName: '',
    lastName: '',
    points: CONFIG.STARTING_POINTS, // Start at 0, gain points on success

    // Timer
    timerStarted: false,
    startTime: 0,
    elapsedTime: 0,
    timerInterval: null,

    // Current extraction
    currentObject: null,
    currentCavity: null,
    currentAttempts: 0,
    collisionCooldown: false, // Prevent multiple collisions being counted at once

    // Piece position
    pieceX: 0,
    pieceY: 0,
    isDragging: false,

    // Collision mask
    collisionCanvas: null,
    collisionCtx: null,

    // Audio
    audioCtx: null,

    // Local scores (all players who played)
    localScores: [],
    registeredPlayers: [], // Track all player names to prevent duplicates

    // Objects state
    objects: JSON.parse(JSON.stringify(GAME_OBJECTS)),

    // Admin mode
    isAdminMode: false
};

// ============================================
// DOM ELEMENTS
// ============================================

let elements = {};

// ============================================
// INITIALIZATION
// ============================================

// localStorage key for this game
const STORAGE_KEY = 'docteurMaboul_scores';
const PLAYERS_KEY = 'docteurMaboul_players';

// Initialize DOM elements
function initElements() {
    elements = {
        // Screens
        welcomeScreen: document.getElementById('welcome-screen'),
        gameScreen: document.getElementById('game-screen'),
        loadingMessage: document.getElementById('loading-message'),

        // Buttons
        resetBtn: document.getElementById('reset-btn'),
        backBtn: document.getElementById('back-btn'),
        nextObjectBtn: document.getElementById('next-object-btn'),
        playAgainBtn: document.getElementById('play-again-btn'),
        viewScoresBtn: document.getElementById('view-scores-btn'),
        nextAfterFailBtn: document.getElementById('next-after-fail-btn'),
        adminBtn: document.getElementById('admin-btn'),
        submitAdminCode: document.getElementById('submit-admin-code'),
        cancelAdminCode: document.getElementById('cancel-admin-code'),
        closeAdminBtn: document.getElementById('close-admin-btn'),

        // Game display
        canvas: document.getElementById('game-canvas'),
        ctx: null, // Will be set after canvas is retrieved
        displayName: document.getElementById('display-name'),
        moneyDisplay: document.getElementById('money'),
        timer: document.getElementById('timer'),
        attemptsDisplay: document.getElementById('attempts-display'),
        currentObjectDisplay: document.getElementById('current-object'),
        gameMessage: document.getElementById('game-message'),
        objectSelection: document.getElementById('object-selection'),
        objectsGrid: document.getElementById('objects-grid'),
        noseFlash: document.getElementById('nose-flash'),
        flashOverlay: document.getElementById('flash-overlay'),
        collisionIndicator: document.getElementById('collision-indicator'),

        // Modals
        successModal: document.getElementById('success-modal'),
        gameoverModal: document.getElementById('gameover-modal'),
        failedModal: document.getElementById('failed-modal'),
        adminCodeModal: document.getElementById('admin-code-modal'),
        adminModal: document.getElementById('admin-modal'),

        // Modal elements
        rewardMessage: document.getElementById('reward-message'),
        finalTime: document.getElementById('final-time'),
        finalScore: document.getElementById('final-score'),
        rankMessage: document.getElementById('rank-message'),
        failedMessage: document.getElementById('failed-message'),
        adminCodeInput: document.getElementById('admin-code-input'),
        adminCodeError: document.getElementById('admin-code-error'),
        adminScores: document.getElementById('admin-scores'),

        // Leaderboard
        leaderboard: document.getElementById('leaderboard')
    };

    // Initialize canvas context
    if (elements.canvas) {
        elements.ctx = elements.canvas.getContext('2d');
    }
}

// Initialize event listeners
function initEventListeners() {
    // No start button anymore - game auto-starts from hub session

    // Game controls
    if (elements.resetBtn) elements.resetBtn.addEventListener('click', resetCurrentExtraction);
    if (elements.backBtn) elements.backBtn.addEventListener('click', goBackToSelection);

    // Modal buttons
    if (elements.nextObjectBtn) elements.nextObjectBtn.addEventListener('click', () => {
        elements.successModal.classList.add('hidden');
        showObjectSelection();
    });

    if (elements.nextAfterFailBtn) elements.nextAfterFailBtn.addEventListener('click', () => {
        elements.failedModal.classList.add('hidden');
        showObjectSelection();
    });

    if (elements.playAgainBtn) elements.playAgainBtn.addEventListener('click', () => {
        elements.gameoverModal.classList.add('hidden');
        resetFullGame();
    });

    if (elements.viewScoresBtn) elements.viewScoresBtn.addEventListener('click', () => {
        elements.gameoverModal.classList.add('hidden');
        elements.welcomeScreen.classList.add('active');
        elements.gameScreen.classList.remove('active');
    });

    // Admin
    if (elements.adminBtn) elements.adminBtn.addEventListener('click', showAdminCodeModal);
    if (elements.submitAdminCode) elements.submitAdminCode.addEventListener('click', validateAdminCode);
    if (elements.cancelAdminCode) elements.cancelAdminCode.addEventListener('click', () => {
        elements.adminCodeModal.classList.add('hidden');
    });
    if (elements.closeAdminBtn) elements.closeAdminBtn.addEventListener('click', () => {
        elements.adminModal.classList.add('hidden');
    });

    // Canvas touch/mouse events
    if (elements.canvas) {
        elements.canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        elements.canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        elements.canvas.addEventListener('touchend', handleTouchEnd);
        elements.canvas.addEventListener('mousedown', handleMouseDown);
        elements.canvas.addEventListener('mousemove', handleMouseMove);
        elements.canvas.addEventListener('mouseup', handleMouseUp);
        elements.canvas.addEventListener('mouseleave', handleMouseUp);
    }
}

// Initialize audio context
function initAudio() {
    try {
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.warn('Audio not supported:', e);
    }
}

// Load saved data from localStorage
function loadFromLocalStorage() {
    try {
        const savedScores = localStorage.getItem(STORAGE_KEY);
        if (savedScores) {
            state.localScores = JSON.parse(savedScores);
        }
        const savedPlayers = localStorage.getItem(PLAYERS_KEY);
        if (savedPlayers) {
            state.registeredPlayers = JSON.parse(savedPlayers);
        }
    } catch (e) {
        console.warn('Could not load from localStorage:', e);
    }
}

// Save data to localStorage
function saveToLocalStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.localScores));
        localStorage.setItem(PLAYERS_KEY, JSON.stringify(state.registeredPlayers));
    } catch (e) {
        console.warn('Could not save to localStorage:', e);
    }
}

// ============================================
// GAME FLOW
// ============================================

function checkSharedSession() {
    const savedUser = localStorage.getItem('jeuxJanvier_user');
    if (!savedUser) {
        // Not logged in -> Redirect to Hub (with small delay for UX)
        if (elements.loadingMessage) {
            elements.loadingMessage.innerHTML = '<p>❌ Session non trouvée</p><p>Redirection vers l\'accueil...</p>';
        }
        setTimeout(() => {
            window.location.href = '../../index.html';
        }, 1500);
        return;
    }

    try {
        const user = JSON.parse(savedUser);
        if (elements.loadingMessage) {
            elements.loadingMessage.innerHTML = `<p>✅ Bienvenue Dr. ${user.firstName} !</p><p>Chargement du jeu...</p>`;
        }
        // Small delay for UX, then start game
        setTimeout(() => {
            startMaboulGame(user);
        }, 800);
    } catch (e) {
        console.error('Invalid session data:', e);
        window.location.href = '../../index.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI references FIRST
    initElements();
    initEventListeners();
    initAudio();

    // Then check session (which may use elements)
    checkSharedSession();
    // loadLeaderboard called in startMaboulGame
});


function startMaboulGame(user) {
    state.firstName = user.firstName;
    state.lastName = user.lastName;
    state.playerName = user.fullName;
    state.points = CONFIG.STARTING_POINTS;
    state.objects = JSON.parse(JSON.stringify(GAME_OBJECTS));
    state.currentAttempts = 0;

    // Update UI
    if (elements.displayName) elements.displayName.textContent = state.playerName;
    updatePointsDisplay();
    updateAttemptsDisplay();

    // Skip welcome screen, go straight to game screen
    if (elements.welcomeScreen) elements.welcomeScreen.classList.remove('active');
    if (elements.gameScreen) elements.gameScreen.classList.add('active');

    // Show object selection
    showObjectSelection();

    // Now load scores
    loadLeaderboard();
}

// Keeping old startGame for compatibility if needed, but unused now
function startGame() {
    // ... outdated ...
}

function showObjectSelection() {
    state.current = GameState.SELECTING;
    elements.objectSelection.classList.remove('hidden');
    elements.currentObjectDisplay.textContent = '';

    // Hide canvas container during selection
    document.querySelector('.board-container').style.opacity = '0.3';

    renderObjectsGrid();

    // Check if all objects extracted
    const allExtracted = state.objects.every(obj => obj.extracted);
    if (allExtracted) {
        endGame();
    }
}

function renderObjectsGrid() {
    const grid = elements.objectsGrid;
    grid.innerHTML = '';

    state.objects.forEach(obj => {
        const card = document.createElement('div');
        card.className = `object-card ${obj.extracted ? 'extracted' : ''}`;
        card.innerHTML = `
            <span class="emoji">${obj.emoji}</span>
            <span class="name">${obj.name}</span>
            <span class="reward">+${obj.reward}€</span>
            <span class="difficulty">${'⭐'.repeat(obj.difficulty)}</span>
        `;

        if (!obj.extracted) {
            card.addEventListener('click', () => selectObject(obj));
        }

        grid.appendChild(card);
    });
}

function selectObject(obj) {
    state.currentObject = obj;
    state.currentCavity = CAVITIES.find(c => c.id === obj.id);
    state.currentAttempts = 0; // Reset attempts for new object
    state.collisionCooldown = false; // Reset cooldown

    elements.objectSelection.classList.add('hidden');
    document.querySelector('.board-container').style.opacity = '1';
    elements.currentObjectDisplay.textContent = obj.emoji;
    updateAttemptsDisplay();

    state.current = GameState.PLAYING;

    // Initialize canvas for this cavity
    initCanvas();
}

function goBackToSelection() {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
    }
    state.timerStarted = false;
    state.timerInterval = null;

    // Go back to hub (main menu)
    window.location.href = '../../index.html';
}

function resetCurrentExtraction() {
    state.timerStarted = false;
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
    }
    elements.timer.textContent = '00.000s';

    // Reset piece to start position
    if (state.currentCavity) {
        const w = elements.canvas.width;
        const h = elements.canvas.height;
        const cavity = state.currentCavity;

        state.pieceX = cavity.x * w + (cavity.width * w) / 2;
        state.pieceY = (cavity.y + cavity.height) * h + 30;
    }

    drawGame();
}

function resetFullGame() {
    state.points = CONFIG.STARTING_POINTS;
    state.objects = JSON.parse(JSON.stringify(GAME_OBJECTS));
    updatePointsDisplay();
    showObjectSelection();
}

function endGame() {
    state.current = GameState.GAMEOVER;

    elements.objectSelection.classList.add('hidden');
    elements.finalScore.textContent = `Score Final: ${state.points} pts`;
    elements.gameoverModal.classList.remove('hidden');

    // Save score to Firebase
    saveScore(state.playerName, state.points);
}

// ============================================
// CANVAS & RENDERING
// ============================================

function initCanvas() {
    const container = document.querySelector('.canvas-container');
    const containerWidth = container.clientWidth - 16;
    const containerHeight = container.clientHeight - 16;

    const scaleX = containerWidth / CONFIG.CANVAS_WIDTH;
    const scaleY = containerHeight / CONFIG.CANVAS_HEIGHT;
    const scale = Math.min(scaleX, scaleY, 1.2);

    elements.canvas.width = CONFIG.CANVAS_WIDTH;
    elements.canvas.height = CONFIG.CANVAS_HEIGHT;
    elements.canvas.style.width = `${CONFIG.CANVAS_WIDTH * scale}px`;
    elements.canvas.style.height = `${CONFIG.CANVAS_HEIGHT * scale}px`;

    // Create collision canvas with willReadFrequently for performance
    state.collisionCanvas = document.createElement('canvas');
    state.collisionCanvas.width = CONFIG.CANVAS_WIDTH;
    state.collisionCanvas.height = CONFIG.CANVAS_HEIGHT;
    state.collisionCtx = state.collisionCanvas.getContext('2d', { willReadFrequently: true });

    // Set initial piece position (below the cavity)
    const w = CONFIG.CANVAS_WIDTH;
    const h = CONFIG.CANVAS_HEIGHT;
    const cavity = state.currentCavity;

    state.pieceX = cavity.x * w + (cavity.width * w) / 2;
    state.pieceY = (cavity.y + cavity.height) * h + 35;

    // Draw collision mask
    drawCollisionMask();

    // Draw game
    drawGame();
}

function drawCollisionMask() {
    const ctx = state.collisionCtx;
    const w = CONFIG.CANVAS_WIDTH;
    const h = CONFIG.CANVAS_HEIGHT;

    // Clear (transparent = collision)
    ctx.clearRect(0, 0, w, h);

    if (!state.currentCavity) return;

    const cavity = state.currentCavity;

    // Calculate cavity coordinates
    const cavityX = cavity.x * w;
    const cavityY = cavity.y * h;
    const cavityW = cavity.width * w;
    const cavityH = cavity.height * h;
    const centerX = cavityX + cavityW / 2;
    const targetY = cavityY + cavityH / 2;
    const startY = cavityY + cavityH + 40;

    // HARDER: Use exact pathWidth from cavity config
    const effectivePathWidth = cavity.pathWidth;

    // Draw valid path (white = safe zone)
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = effectivePathWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // VERY SINUOUS PATH - Multiple S-curves based on difficulty
    ctx.beginPath();
    ctx.moveTo(centerX, startY);

    const difficulty = state.currentObject?.difficulty || 1;
    const amplitude = 20 + (difficulty * 10); // More zigzag for harder objects
    const segments = 4 + difficulty; // More segments for harder objects

    const totalDistance = startY - targetY;
    const segmentHeight = totalDistance / segments;

    let currentY = startY;
    let direction = 1; // Alternates left/right

    // Create zigzag serpentine path
    for (let i = 0; i < segments; i++) {
        const nextY = currentY - segmentHeight;
        const controlX = centerX + (direction * amplitude);
        const midY = (currentY + nextY) / 2;

        // S-curve for each segment
        ctx.quadraticCurveTo(controlX, midY, centerX + (direction * amplitude * 0.3), nextY);

        currentY = nextY;
        direction *= -1; // Alternate direction
    }

    // Final approach to target
    ctx.lineTo(centerX, targetY);

    ctx.stroke();

    // Smaller start zone
    ctx.beginPath();
    ctx.arc(centerX, startY, 16, 0, Math.PI * 2);
    ctx.fill();

    // TINY target zone
    ctx.beginPath();
    ctx.arc(centerX, targetY, 12, 0, Math.PI * 2);
    ctx.fill();

    // Cavity area
    ctx.beginPath();
    ctx.roundRect(cavityX, cavityY, cavityW, cavityH, 8);
    ctx.fill();

    console.log('Sinuous path drawn for:', cavity.id, 'difficulty:', difficulty, 'segments:', segments);
}


function drawGame() {
    const ctx = elements.ctx;
    const w = CONFIG.CANVAS_WIDTH;
    const h = CONFIG.CANVAS_HEIGHT;

    // Clear
    ctx.fillStyle = CONFIG.COLORS.background;
    ctx.fillRect(0, 0, w, h);

    // Draw body
    drawBody(ctx, w, h);

    // Draw all cavities
    drawCavities(ctx, w, h);

    // Draw current extraction path if playing
    if (state.current === GameState.PLAYING && state.currentCavity) {
        drawExtractionPath(ctx, w, h);
        drawPiece(ctx);
    }
}

function drawBody(ctx, w, h) {
    ctx.save();

    // Body shadow
    ctx.fillStyle = CONFIG.COLORS.bodyShadow;
    ctx.beginPath();
    ctx.ellipse(w * 0.52, h * 0.48, w * 0.38, h * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Main body
    ctx.fillStyle = CONFIG.COLORS.body;
    ctx.strokeStyle = CONFIG.COLORS.bodyOutline;
    ctx.lineWidth = 4;

    // Torso
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.48, w * 0.35, h * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Head
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.08, w * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Hair
    ctx.fillStyle = CONFIG.COLORS.hair;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.04, w * 0.13, h * 0.04, 0, Math.PI, 0);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(w * 0.43, h * 0.07, 5, 0, Math.PI * 2);
    ctx.arc(w * 0.57, h * 0.07, 5, 0, Math.PI * 2);
    ctx.fill();

    // Nose (the famous red nose!)
    ctx.fillStyle = CONFIG.COLORS.nose;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.10, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#B71C1C';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Mouth (worried expression)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.15, 10, 0.3, Math.PI - 0.3);
    ctx.stroke();

    // Arms
    ctx.fillStyle = CONFIG.COLORS.body;
    ctx.strokeStyle = CONFIG.COLORS.bodyOutline;
    ctx.lineWidth = 3;

    // Left arm
    ctx.beginPath();
    ctx.ellipse(w * 0.12, h * 0.45, w * 0.08, h * 0.18, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Right arm
    ctx.beginPath();
    ctx.ellipse(w * 0.88, h * 0.45, w * 0.08, h * 0.18, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Hospital gown
    ctx.fillStyle = CONFIG.COLORS.clothes;
    ctx.beginPath();
    ctx.moveTo(w * 0.3, h * 0.75);
    ctx.lineTo(w * 0.2, h * 0.9);
    ctx.lineTo(w * 0.4, h * 0.9);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(w * 0.7, h * 0.75);
    ctx.lineTo(w * 0.8, h * 0.9);
    ctx.lineTo(w * 0.6, h * 0.9);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function drawCavities(ctx, w, h) {
    CAVITIES.forEach(cavity => {
        const obj = state.objects.find(o => o.id === cavity.id);
        const isExtracted = obj?.extracted;
        const isActive = state.currentCavity?.id === cavity.id;

        const x = cavity.x * w;
        const y = cavity.y * h;
        const cw = cavity.width * w;
        const ch = cavity.height * h;

        // Cavity hole
        ctx.fillStyle = isExtracted ? '#90A4AE' : CONFIG.COLORS.cavity;
        ctx.strokeStyle = isActive ? '#FDD835' : CONFIG.COLORS.cavityBorder;
        ctx.lineWidth = isActive ? 4 : 3;

        // Rounded rectangle for cavity
        ctx.beginPath();
        const radius = 8;
        ctx.roundRect(x, y, cw, ch, radius);
        ctx.fill();
        ctx.stroke();

        // Draw object emoji inside if not extracted
        if (!isExtracted && obj) {
            ctx.font = `${Math.min(cw, ch) * 0.6}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(obj.emoji, x + cw / 2, y + ch / 2);
        } else if (isExtracted) {
            // Checkmark for extracted
            ctx.fillStyle = '#4CAF50';
            ctx.font = `${Math.min(cw, ch) * 0.5}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✓', x + cw / 2, y + ch / 2);
        }
    });
}

function drawExtractionPath(ctx, w, h) {
    if (!state.currentCavity) return;

    const cavity = state.currentCavity;
    const cavityX = cavity.x * w;
    const cavityY = cavity.y * h;
    const cavityW = cavity.width * w;
    const cavityH = cavity.height * h;
    const centerX = cavityX + cavityW / 2;
    const targetY = cavityY + cavityH / 2;
    const startY = cavityY + cavityH + 40;

    // Draw SINUOUS path visual (matches collision mask)
    ctx.strokeStyle = 'rgba(38, 50, 56, 0.3)';
    ctx.lineWidth = cavity.pathWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const difficulty = state.currentObject?.difficulty || 1;
    const amplitude = 20 + (difficulty * 10);
    const segments = 4 + difficulty;

    const totalDistance = startY - targetY;
    const segmentHeight = totalDistance / segments;

    ctx.beginPath();
    ctx.moveTo(centerX, startY);

    let currentY = startY;
    let direction = 1;

    // Draw zigzag serpentine path
    for (let i = 0; i < segments; i++) {
        const nextY = currentY - segmentHeight;
        const controlX = centerX + (direction * amplitude);
        const midY = (currentY + nextY) / 2;

        ctx.quadraticCurveTo(controlX, midY, centerX + (direction * amplitude * 0.3), nextY);

        currentY = nextY;
        direction *= -1;
    }

    ctx.lineTo(centerX, targetY);
    ctx.stroke();

    // Start zone
    ctx.fillStyle = 'rgba(253, 216, 53, 0.4)';
    ctx.strokeStyle = CONFIG.COLORS.pieceOutline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, startY, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Target zone
    ctx.fillStyle = 'rgba(67, 160, 71, 0.4)';
    ctx.strokeStyle = CONFIG.COLORS.target;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, targetY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Label
    ctx.fillStyle = CONFIG.COLORS.pieceOutline;
    ctx.font = '10px Fredoka';
    ctx.textAlign = 'center';
    ctx.fillText('DÉPART', centerX, startY + 30);
}

function drawPiece(ctx) {
    const size = state.currentObject?.size || CONFIG.PIECE_RADIUS;

    // Glow
    const gradient = ctx.createRadialGradient(
        state.pieceX, state.pieceY, 0,
        state.pieceX, state.pieceY, size * 2
    );
    gradient.addColorStop(0, 'rgba(253, 216, 53, 0.5)');
    gradient.addColorStop(1, 'rgba(253, 216, 53, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(state.pieceX, state.pieceY, size * 2, 0, Math.PI * 2);
    ctx.fill();

    // Main piece
    ctx.fillStyle = CONFIG.COLORS.piece;
    ctx.strokeStyle = CONFIG.COLORS.pieceOutline;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(state.pieceX, state.pieceY, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Object emoji on piece
    if (state.currentObject) {
        ctx.font = `${size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(state.currentObject.emoji, state.pieceX, state.pieceY);
    }

    // Dragging indicator
    if (state.isDragging) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(state.pieceX, state.pieceY, size + 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

// ============================================
// INPUT HANDLING
// ============================================

function getCanvasCoordinates(clientX, clientY) {
    const rect = elements.canvas.getBoundingClientRect();
    const scaleX = elements.canvas.width / rect.width;
    const scaleY = elements.canvas.height / rect.height;

    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

function handleTouchStart(e) {
    e.preventDefault();
    if (state.current !== GameState.PLAYING) return;

    const touch = e.touches[0];
    const coords = getCanvasCoordinates(touch.clientX, touch.clientY);

    const size = state.currentObject?.size || CONFIG.PIECE_RADIUS;
    const dist = Math.hypot(coords.x - state.pieceX, coords.y - state.pieceY);

    if (dist <= size * 2.5) {
        state.isDragging = true;
        startTimer();
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!state.isDragging || state.current !== GameState.PLAYING) return;

    const touch = e.touches[0];
    const coords = getCanvasCoordinates(touch.clientX, touch.clientY);
    movePiece(coords.x, coords.y);
}

function handleTouchEnd(e) {
    e.preventDefault();
    if (state.isDragging && state.current === GameState.PLAYING) {
        checkSuccess();
    }
    state.isDragging = false;
}

function handleMouseDown(e) {
    if (state.current !== GameState.PLAYING) return;

    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    const size = state.currentObject?.size || CONFIG.PIECE_RADIUS;
    const dist = Math.hypot(coords.x - state.pieceX, coords.y - state.pieceY);

    if (dist <= size * 2.5) {
        state.isDragging = true;
        startTimer();
    }
}

function handleMouseMove(e) {
    if (!state.isDragging || state.current !== GameState.PLAYING) return;

    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    movePiece(coords.x, coords.y);
}

function handleMouseUp() {
    if (state.isDragging && state.current === GameState.PLAYING) {
        checkSuccess();
    }
    state.isDragging = false;
}

function movePiece(x, y) {
    state.pieceX = x;
    state.pieceY = y;

    // Check collision
    if (checkCollision(x, y)) {
        triggerBuzz();
        return;
    }

    drawGame();

    // Check target reached
    if (checkTargetReached()) {
        handleSuccess();
    }
}

function checkCollision(x, y) {
    const size = state.currentObject?.size || CONFIG.PIECE_RADIUS;

    // Sample points around the piece
    const checkPoints = [
        { x, y },
        { x: x - size + 2, y },
        { x: x + size - 2, y },
        { x, y: y - size + 2 },
        { x, y: y + size - 2 }
    ];

    for (const point of checkPoints) {
        if (point.x < 0 || point.x >= CONFIG.CANVAS_WIDTH ||
            point.y < 0 || point.y >= CONFIG.CANVAS_HEIGHT) {
            return true;
        }

        const pixel = state.collisionCtx.getImageData(
            Math.floor(point.x),
            Math.floor(point.y),
            1, 1
        ).data;

        if (pixel[3] === 0) {
            return true;
        }
    }

    return false;
}

function checkTargetReached() {
    if (!state.currentCavity) return false;

    const w = CONFIG.CANVAS_WIDTH;
    const h = CONFIG.CANVAS_HEIGHT;
    const cavity = state.currentCavity;
    const targetX = cavity.x * w + (cavity.width * w) / 2;
    const targetY = cavity.y * h + (cavity.height * h) / 2;

    const dist = Math.hypot(state.pieceX - targetX, state.pieceY - targetY);
    return dist < 15;
}

function checkSuccess() {
    if (checkTargetReached()) {
        handleSuccess();
    }
}

// ============================================
// BUZZ & FEEDBACK
// ============================================

function triggerBuzz() {
    // Prevent multiple collisions counting at once
    if (state.collisionCooldown) return;
    state.collisionCooldown = true;

    // 1. Show visual collision indicator
    if (elements.collisionIndicator) {
        elements.collisionIndicator.classList.remove('hidden');
        // Hide after animation
        setTimeout(() => {
            elements.collisionIndicator.classList.add('hidden');
        }, 800);
    }

    // 2. Flash the screen red
    if (elements.flashOverlay) {
        elements.flashOverlay.classList.remove('hidden');
        elements.flashOverlay.classList.add('flash-active');
        setTimeout(() => {
            elements.flashOverlay.classList.remove('flash-active');
            elements.flashOverlay.classList.add('hidden');
        }, 300);
    }

    // 3. Vibration
    if (navigator.vibrate) {
        navigator.vibrate(CONFIG.VIBRATION_DURATION);
    }

    // 4. Buzz sound
    playBuzzSound();

    // Increment attempts
    state.currentAttempts++;
    updateAttemptsDisplay();

    // Reset piece to start position so player can try again
    resetPiecePosition();
    state.isDragging = false;

    // Check if max attempts reached for this object
    if (state.currentAttempts >= CONFIG.MAX_ATTEMPTS) {
        // Object lost - mark as failed and move to next
        handleObjectFailed();
        return;
    }

    drawGame();

    // Reset cooldown after 1 second
    setTimeout(() => {
        state.collisionCooldown = false;
    }, 1000);
}

function resetPiecePosition() {
    if (state.currentCavity) {
        const w = CONFIG.CANVAS_WIDTH;
        const h = CONFIG.CANVAS_HEIGHT;
        const cavity = state.currentCavity;

        state.pieceX = cavity.x * w + (cavity.width * w) / 2;
        state.pieceY = (cavity.y + cavity.height) * h + 35;
    }
}

function playBuzzSound() {
    if (!state.audioCtx) {
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    const ctx = state.audioCtx;
    if (ctx.state === 'suspended') ctx.resume();

    // Create harsh buzz sound
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Distortion for harsher sound
    const distortion = ctx.createWaveShaper();
    distortion.curve = makeDistortionCurve(50);

    oscillator.connect(distortion);
    distortion.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(CONFIG.BUZZ_FREQUENCY, ctx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + CONFIG.BUZZ_DURATION / 1000);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + CONFIG.BUZZ_DURATION / 1000);
}

function makeDistortionCurve(amount) {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;

    for (let i = 0; i < samples; i++) {
        const x = (i * 2) / samples - 1;
        curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }

    return curve;
}

function playSuccessSound() {
    if (!state.audioCtx) {
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    const ctx = state.audioCtx;
    if (ctx.state === 'suspended') ctx.resume();

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.value = freq;

        const startTime = ctx.currentTime + i * 0.12;
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);

        osc.start(startTime);
        osc.stop(startTime + 0.25);
    });
}

// ============================================
// SUCCESS & SCORING
// ============================================

function handleSuccess() {
    state.current = GameState.SUCCESS;

    // Stop timer
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
    }

    // Mark object as extracted
    const objIndex = state.objects.findIndex(o => o.id === state.currentObject.id);
    if (objIndex !== -1) {
        state.objects[objIndex].extracted = true;
    }

    // Calculate points with time bonus
    const baseReward = state.currentObject.reward;
    const timeSeconds = state.elapsedTime / 1000;
    const timeBonus = Math.max(0, Math.floor((CONFIG.MAX_TIME_FOR_BONUS - timeSeconds) * CONFIG.TIME_BONUS_MULTIPLIER));
    const totalReward = baseReward + timeBonus;

    // Add points
    state.points += totalReward;
    updatePointsDisplay();

    // Play success sound
    playSuccessSound();

    // Show success modal with breakdown
    const bonusText = timeBonus > 0 ? ` (+${timeBonus} bonus temps)` : '';
    elements.rewardMessage.textContent = `+${totalReward} pts${bonusText}`;
    elements.finalTime.textContent = `Temps: ${formatTime(state.elapsedTime)}`;
    elements.successModal.classList.remove('hidden');
}

function updatePointsDisplay(isLoss = false) {
    elements.moneyDisplay.textContent = `${state.points} pts`;

    // Animation class
    elements.moneyDisplay.classList.remove('gain', 'loss');
    if (isLoss) {
        elements.moneyDisplay.classList.add('loss');
    } else {
        elements.moneyDisplay.classList.add('gain');
    }

    setTimeout(() => {
        elements.moneyDisplay.classList.remove('gain', 'loss');
    }, 500);
}

// ============================================
// TIMER
// ============================================

function startTimer() {
    if (state.timerStarted) return;

    state.timerStarted = true;
    state.startTime = performance.now();

    state.timerInterval = setInterval(() => {
        state.elapsedTime = performance.now() - state.startTime;
        elements.timer.textContent = formatTime(state.elapsedTime);
    }, 10);
}

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = Math.floor(ms % 1000);
    return `${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}s`;
}

// ============================================
// LEADERBOARD & FIREBASE
// ============================================

async function saveScore(name, points) {
    // Calculate detailed stats
    const succeededObjects = state.objects.filter(o => o.extracted && !o.failed);
    const failedObjects = state.objects.filter(o => o.extracted && o.failed);

    const score = {
        name: name.substring(0, 30),
        firstName: state.firstName,
        lastName: state.lastName,
        points: points,
        game: 'maboul',
        totalTime: state.elapsedTime,
        formattedTime: formatTime(state.elapsedTime),
        objectsSucceeded: succeededObjects.length,
        objectsFailed: failedObjects.length,
        objectsDetails: state.objects.map(o => ({
            name: o.name,
            emoji: o.emoji,
            extracted: o.extracted || false,
            failed: o.failed || false,
            reward: o.reward
        })),
        timestamp: Date.now(),
        date: new Date().toLocaleDateString('fr-FR')
    };

    // Local save (keep all for admin)
    state.localScores.push(score);
    state.localScores.sort((a, b) => b.points - a.points);

    // Persist to localStorage
    saveToLocalStorage();

    // Firebase save (uses shared helper function)
    try {
        await saveScoreToFirebase(score);
        console.log('✅ Score saved to Firebase');
    } catch (error) {
        console.warn('⚠️ Could not save to Firebase:', error);
    }

    loadLeaderboard();

    // Update rank message
    const rank = state.localScores.findIndex(s => s.points === points && s.name === name) + 1;
    if (rank > 0 && rank <= 10) {
        elements.rankMessage.textContent = `🎉 Vous êtes #${rank} au classement !`;
    } else {
        elements.rankMessage.textContent = 'Continuez à vous entraîner !';
    }
}

async function loadLeaderboard() {
    let scores = [];

    try {
        // Load from Firebase (uses shared helper function)
        const data = await getScoresFromFirebase('maboul');
        scores = data.map(s => ({
            name: s.name,
            points: s.points || 0
        }));
        console.log('✅ Loaded', scores.length, 'scores from Firebase');
    } catch (error) {
        console.warn('⚠️ Could not load from Firebase:', error);
        scores = state.localScores;
    }

    // Sort and limit
    scores.sort((a, b) => b.points - a.points);
    scores = scores.slice(0, 10);

    renderLeaderboard(scores);
}

function renderLeaderboard(scores) {
    if (scores.length === 0) {
        elements.leaderboard.innerHTML = `
            <div class="no-scores">
                Aucun score enregistré.<br>
                Soyez le premier chirurgien ! 🏆
            </div>
        `;
        return;
    }

    const rankEmojis = ['🥇', '🥈', '🥉'];

    elements.leaderboard.innerHTML = scores.map((score, index) => `
        <div class="score-item ${index < 3 ? `top-${index + 1}` : ''}">
            <span class="score-rank">${rankEmojis[index] || `${index + 1}.`}</span>
            <span class="score-name">${escapeHtml(score.name)}</span>
            <span class="score-time">${score.points || score.money || 0} pts</span>
        </div>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// ATTEMPTS DISPLAY
// ============================================

function updateAttemptsDisplay() {
    if (elements.attemptsDisplay) {
        const remaining = CONFIG.MAX_ATTEMPTS - state.currentAttempts;
        elements.attemptsDisplay.textContent = `Essais: ${state.currentAttempts}/${CONFIG.MAX_ATTEMPTS}`;

        // Color code based on remaining attempts
        if (remaining === 1) {
            elements.attemptsDisplay.style.color = '#FF5722';
        } else if (remaining === 0) {
            elements.attemptsDisplay.style.color = '#F44336';
        } else {
            elements.attemptsDisplay.style.color = '#4CAF50';
        }
    }
}

function handleObjectFailed() {
    // Mark object as extracted (failed, not earned)
    if (state.currentObject) {
        const obj = state.objects.find(o => o.id === state.currentObject.id);
        if (obj) {
            obj.extracted = true;
            obj.failed = true; // Track that it was failed, not successfully extracted
        }
    }

    // Stop timer
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
    state.timerStarted = false;
    state.isDragging = false;

    // Show failed modal
    elements.failedModal.classList.remove('hidden');
}

// ============================================
// ADMIN MODE
// ============================================

function showAdminCodeModal() {
    elements.adminCodeModal.classList.remove('hidden');
    elements.adminCodeInput.value = '';
    elements.adminCodeError.classList.add('hidden');
    elements.adminCodeInput.focus();
}

function validateAdminCode() {
    const code = elements.adminCodeInput.value;
    if (code === CONFIG.ADMIN_CODE) {
        elements.adminCodeModal.classList.add('hidden');
        elements.adminCodeInput.value = '';
        elements.adminCodeError.classList.add('hidden');
        showAdminPanel();
    } else {
        elements.adminCodeError.classList.remove('hidden');
        elements.adminCodeInput.value = '';
        elements.adminCodeInput.focus();
    }
}

function showAdminPanel() {
    state.isAdminMode = true;
    loadAllScoresForAdmin();
    elements.adminModal.classList.remove('hidden');
}

async function loadAllScoresForAdmin() {
    let allScores = [...state.localScores];

    // Load from Firebase (uses shared helper function)
    try {
        allScores = await getScoresFromFirebase('maboul');
        // Ensure dates are properly parsed for admin display
        allScores.forEach(s => {
            if (!s.timestamp && s.date) s.timestamp = new Date(s.date).getTime();
        });
        console.log('✅ Admin: Loaded', allScores.length, 'scores from Firebase');
    } catch (error) {
        console.warn('⚠️ Could not load from Firebase:', error);
    }

    renderAdminScores(allScores);
}

function renderAdminScores(scores) {
    if (scores.length === 0) {
        elements.adminScores.innerHTML = `
            <div class="no-scores">Aucun score enregistré.</div>
        `;
        return;
    }

    const rankEmojis = ['🥇', '🥈', '🥉'];

    elements.adminScores.innerHTML = `
        <div class="admin-scores-header">
            <span>Rang</span>
            <span>Joueur</span>
            <span>Score</span>
            <span>Objets</span>
            <span>Temps</span>
            <span>Date</span>
        </div>
        ${scores.map((score, index) => `
            <div class="admin-score-row">
                <div class="admin-score-main ${index < 3 ? `top-${index + 1}` : ''}">
                    <span class="score-rank">${rankEmojis[index] || `${index + 1}.`}</span>
                    <span class="score-name">${escapeHtml(score.name)}</span>
                    <span class="score-money">${score.points || score.money || 0} pts</span>
                    <span class="score-objects">
                        ✅ ${score.objectsSucceeded || 0} / ❌ ${score.objectsFailed || 0}
                    </span>
                    <span class="score-time">${score.formattedTime || 'N/A'}</span>
                    <span class="score-date">${score.date || new Date(score.timestamp).toLocaleDateString('fr-FR')}</span>
                </div>
                ${score.objectsDetails ? `
                    <div class="admin-score-details">
                        ${score.objectsDetails.map(obj => `
                            <span class="obj-detail ${obj.extracted ? (obj.failed ? 'failed' : 'success') : 'pending'}">
                                ${obj.emoji} ${obj.extracted ? (obj.failed ? '❌' : '✅') : '⏸️'}
                            </span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('')}
        <div class="admin-total">
            📊 Total: ${scores.length} joueur(s)
        </div>
    `;
}

// Prevent scrolling on touch
document.addEventListener('touchmove', (e) => {
    if (e.target === elements.canvas) {
        e.preventDefault();
    }
}, { passive: false });
