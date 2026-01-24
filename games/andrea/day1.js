// day1.js - Logic for Andrea Enquête (5 enigmas)

const STATE = {
    startTime: 0,
    penaltyTime: 0, // In seconds
    timerInterval: null,
    hintLevel: 0,
    enigma3Done: false,
    enigma4Done: false
};

// Solutions
const SOLUTIONS = {
    enigma1: 'MAUDEPACE',
    enigma2: '10-72-LP',
    enigma3: 'C3', // Badge position on grid
    enigma4: '21', // Index of DAME in the list
    final: 'DABO'
};

// Coordinates data for Enigma 1
const COORDS_DATA = [
    { city: 'Akita', coords: "39°43'12'' N 140°05'44'' E" },
    { city: 'Magadan', coords: "59°33'39'' N 150°48'47'' E" },
    { city: 'Edmonton', coords: "53°31'35'' N 113°29'33'' W" },
    { city: 'Dasoguz', coords: "41°50'18'' N 59°57'55'' E" },
    { city: 'Cuzco', coords: "13°31'51'' N 71°58'03'' W" },
    { city: 'Erbil', coords: "36°11'15'' N 44°00'36'' E" },
    { city: 'Pita', coords: "11°03'26'' N 12°23'29'' W" },
    { city: 'Unnao', coords: "26°32'25'' N 80°29'18'' E" },
    { city: 'Arapica', coords: "9°44'58'' S 36°39'34'' W" },
];

// File names for Enigma 4
const FILE_NAMES = [
    'DE_WEER', 'HAUSSNER', 'CHARPIGNY', 'MALIGE', 'GERBAUD',
    'FRISSOU', 'NAGARAJAH', 'DEMARESCAUX', 'FRUGIER', 'PESTEL',
    'DEBEIR', 'BORRON', 'VEZMAR', 'CANALI', 'CAMRINOT',
    'FOGEL', 'MASSON', 'BUSIN', 'BOUBAKRI', 'BASTIE',
    'DAME'
];

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    checkSession();

    // Buttons
    document.getElementById('btn-start-mission').addEventListener('click', startMission);
    document.getElementById('btn-enigma1').addEventListener('click', checkEnigma1);
    document.getElementById('btn-hint').addEventListener('click', showHint);
    document.getElementById('btn-enigma3').addEventListener('click', checkEnigma3);
    document.getElementById('btn-final').addEventListener('click', checkFinal);
    document.getElementById('btn-continue-final').addEventListener('click', () => nextStep('step-enigma5'));

    // Dossier links
    document.querySelectorAll('.dossier-link').forEach(link => {
        link.addEventListener('click', () => {
            const target = link.getAttribute('data-target');
            const easter = link.getAttribute('data-easter');

            if (easter) {
                handleEasterEgg(easter);
            } else if (target && target !== 'none') {
                nextStep(target);
            }
        });
    });

    // Initial render
    initEnigma1();
    initEnigma2();
    initEnigma4();
});

// =======================
// EASTER EGGS 🥚
// =======================

function handleEasterEgg(type) {
    switch (type) {
        case 'rickroll':
            // Rickroll!
            window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank');
            alert('🎵 Never gonna give you up! 🎵\n\nCe document n\'existe pas vraiment...');
            break;

        case 'belge':
            // Blague sur les Belges
            const belgianJokes = [
                "🇧🇪 CONFIDENTIEL 🇧🇪\n\nRapport interne de la Police :\n\nAprès analyse approfondie, nous confirmons que les Belges font de meilleures gaufres ET de meilleurs enquêteurs que les Français.\n\nSigné: Un admirateur anonyme",
                "🇧🇪 NOTE DE SERVICE 🇧🇪\n\nIl a été prouvé scientifiquement que le chocolat belge améliore les capacités cognitives de 200%.\n\nLes Français sont priés de prendre des notes.",
                "🍟 ALERTE FRITES 🍟\n\nLes frites sont BELGES.\nPas françaises.\nMerci de votre compréhension.",
                "🇧🇪 INFO CLASSIFIÉE 🇧🇪\n\nPourquoi les Belges sont meilleurs ?\nParce qu'ils ont Matthias de Weer."
            ];
            alert(belgianJokes[Math.floor(Math.random() * belgianJokes.length)]);
            break;

        case 'matthias':
            // Matthias de Weer jokes
            const matthiasJokes = [
                "📋 RAPPORT CONFIDENTIEL\n\nSujet: Agent Matthias de Weer\n\nConclusion: Cet homme est tout simplement INCROYABLE.\n\nSes compétences dépassent l'entendement.\n\n⭐⭐⭐⭐⭐",
                "🏆 CLASSEMENT DES MEILLEURS AGENTS\n\n1. Matthias de Weer\n2. Très loin derrière... les autres\n\nRien à signaler.",
                "💡 FAIT INTÉRESSANT\n\nSaviez-vous que Matthias de Weer a résolu cette enquête en 2 minutes chrono ?\n\nVous, vous êtes encore là...",
                "🎯 ÉVALUATION ANNUELLE\n\nAgent: Matthias de Weer\nNote: Parfait++\n\nCommentaire: Nous avons dû inventer une nouvelle note pour lui."
            ];
            alert(matthiasJokes[Math.floor(Math.random() * matthiasJokes.length)]);
            break;

        case 'jeu':
            // Jeux de mots
            const puns = [
                "📝 NOTES PERSONNELLES\n\nPourquoi les policiers vont-ils toujours par deux ?\n\nParce que l'union fait la force... de l'ordre ! 👮‍♂️",
                "📝 PENSÉE DU JOUR\n\nUn suspect dit à un policier :\n\"Je suis innocent !\"\n\nLe policier répond :\n\"C'est ce que disent tous les non-cents !\" 💰",
                "📝 BLAGUE INTERNE\n\nQuel est le comble pour un détective ?\n\nDe perdre ses indices... de masse corporelle ! 🕵️",
                "📝 NOTE IMPORTANTE\n\nQu'est-ce qu'un dossier classé ?\n\nUn dossier qui a eu son bac ! 📚"
            ];
            alert(puns[Math.floor(Math.random() * puns.length)]);
            break;
    }
}

function checkSession() {
    const user = JSON.parse(localStorage.getItem('jeuxJanvier_user'));
    if (!user) {
        alert("Session expirée. Retour au QG.");
        location.href = '../../index.html';
        return;
    }
    document.getElementById('agent-name').textContent = user.firstName.toUpperCase();
}

function startMission() {
    startTimer();
    nextStep('step-enigma1');
}

function nextStep(stepId) {
    // Hide current active steps
    document.querySelectorAll('.step-box').forEach(el => el.classList.remove('active'));

    // Show new step
    document.getElementById(stepId).classList.add('active');
}

// =======================
// CHRONO
// =======================

function startTimer() {
    STATE.startTime = Date.now();
    STATE.timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    const elapsed = Math.floor((Date.now() - STATE.startTime) / 1000) + STATE.penaltyTime;
    const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const secs = (elapsed % 60).toString().padStart(2, '0');
    document.getElementById('chrono').textContent = `${mins}:${secs}`;
}

function addPenalty(seconds) {
    STATE.penaltyTime += seconds;
    // Flash chrono red
    const chrono = document.getElementById('chrono');
    chrono.style.background = '#e53935';
    setTimeout(() => chrono.style.background = '', 500);
}

function stopTimer() {
    clearInterval(STATE.timerInterval);
}

function getFinalTime() {
    const elapsed = Math.floor((Date.now() - STATE.startTime) / 1000) + STATE.penaltyTime;
    const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const secs = (elapsed % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

// =======================
// ENIGMA 1: COORDINATES
// =======================

function initEnigma1() {
    const grid = document.getElementById('coords-grid');
    grid.innerHTML = '';

    COORDS_DATA.forEach(item => {
        const div = document.createElement('div');
        div.className = 'coord-item';
        div.innerHTML = `<strong>${item.city}</strong><br>${item.coords}`;
        grid.appendChild(div);
    });
}

function checkEnigma1() {
    const input = document.getElementById('code-enigma1').value.toUpperCase().trim();
    if (input === SOLUTIONS.enigma1) {
        nextStep('step-enigma2');
    } else {
        addPenalty(600); // 10 minutes
        showError('code-enigma1', 'ACCÈS REFUSÉ. Essayez encore.');
    }
}

// =======================
// ENIGMA 2: FOLDERS
// =======================

function initEnigma2() {
    const grid = document.getElementById('folder-grid');
    grid.innerHTML = '';

    // Generate lots of fake folders MM-AA-XX format
    const folders = [];
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const years = ['68', '69', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '80'];
    const initials = ['AB', 'CD', 'EF', 'GH', 'IJ', 'KL', 'MN', 'OP', 'QR', 'ST', 'UV', 'WX', 'YZ',
        'AA', 'BB', 'CC', 'DD', 'EE', 'FF', 'GG', 'HH', 'JJ', 'KK', 'LL', 'MM', 'NN',
        'PP', 'RR', 'SS', 'TT', 'VV', 'ZZ', 'AC', 'BD', 'CE', 'DF', 'EG', 'FH', 'GI',
        'HJ', 'IK', 'JL', 'KM', 'LN', 'MO', 'NP', 'OQ', 'PR', 'QS', 'RT', 'SU', 'TV',
        'LM', 'BC', 'DE', 'FG', 'HI', 'JK', 'NO', 'PQ', 'RS', 'TU', 'VW', 'XY'];

    // Add the solution
    folders.push(SOLUTIONS.enigma2);

    // Generate 100+ fake folders
    for (let i = 0; i < 120; i++) {
        const m = months[Math.floor(Math.random() * months.length)];
        const y = years[Math.floor(Math.random() * years.length)];
        const init = initials[Math.floor(Math.random() * initials.length)];
        const folder = `${m}-${y}-${init}`;
        if (folder !== SOLUTIONS.enigma2 && !folders.includes(folder)) {
            folders.push(folder);
        }
    }

    // Shuffle
    folders.sort(() => Math.random() - 0.5);

    // Render
    folders.forEach(folder => {
        const div = document.createElement('div');
        div.className = 'folder';
        div.textContent = folder;
        div.addEventListener('click', () => checkFolder(folder));
        grid.appendChild(div);
    });
}

function checkFolder(folder) {
    if (folder === SOLUTIONS.enigma2) {
        nextStep('step-dossier');
    } else {
        addPenalty(600); // 10 minutes
        // Briefly highlight wrong folder
        event.target.style.background = '#8b0000';
        setTimeout(() => event.target.style.background = '', 300);
    }
}

function showHint() {
    STATE.hintLevel++;
    const display = document.getElementById('hint-display');

    if (STATE.hintLevel === 1) {
        addPenalty(30); // 30 secondes
        display.innerHTML += `<img src="hint_godfather1.png" class="hint-image" alt="Indice 2">`;
    } else if (STATE.hintLevel === 2) {
        addPenalty(30); // 30 secondes
        display.innerHTML += `<img src="hint_godfather2.png" class="hint-image" alt="Indice 3">`;
    } else {
        display.innerHTML += `<p style="color:#888;">Plus d'indices disponibles.</p>`;
    }
}

// =======================
// ENIGMA 3: MAP (Where's Waldo)
// =======================

function checkEnigma3() {
    const input = document.getElementById('code-enigma3').value.toUpperCase().trim();

    // Accept H3 or I3 as valid (badge is between columns)
    if (input === 'C3') {
        STATE.enigma3Done = true;
        document.getElementById('check-enigma3').style.display = 'inline';
        nextStep('step-dossier');
        checkAllDone();
    } else {
        addPenalty(600); // 10 minutes
        showError('code-enigma3', 'Badge non trouvé à ces coordonnées.');
    }
}

// =======================
// ENIGMA 4: AUDIO
// =======================

function initEnigma4() {
    const list = document.getElementById('file-list');
    list.innerHTML = '';

    FILE_NAMES.forEach((name, index) => {
        const div = document.createElement('div');
        div.className = 'file-option';
        div.textContent = `${index + 1} - ${name}`;
        div.addEventListener('click', () => checkAudioAnswer(index + 1));
        list.appendChild(div);
    });
    // Audio is now HTML5 controls - no JS needed
}

function checkAudioAnswer(index) {
    // DAME is index 21
    if (index === 21) {
        STATE.enigma4Done = true;
        document.getElementById('check-enigma4').style.display = 'inline';
        nextStep('step-dossier');
        checkAllDone();
    } else {
        addPenalty(600); // 10 minutes
        event.target.style.background = '#8b0000';
        setTimeout(() => event.target.style.background = '', 300);
    }
}

function checkAllDone() {
    if (STATE.enigma3Done && STATE.enigma4Done) {
        document.getElementById('dossier-instruction').textContent = 'Tous les éléments ont été examinés !';
        document.getElementById('btn-continue-final').style.display = 'block';
    }
}

// =======================
// ENIGMA 5: FINAL CIPHER
// =======================

function checkFinal() {
    const input = document.getElementById('code-final').value.toUpperCase().trim();
    if (input === SOLUTIONS.final) {
        stopTimer();
        document.getElementById('final-time-display').textContent = getFinalTime();
        saveScore();
        nextStep('step-success');
    } else {
        addPenalty(1200); // 20 minutes
        showError('code-final', 'Ce n\'est pas la bonne ville...');
    }
}

// =======================
// UTILITIES
// =======================

function showError(inputId, message) {
    const input = document.getElementById(inputId);
    input.style.borderColor = '#e53935';
    input.placeholder = message;
    setTimeout(() => {
        input.style.borderColor = '';
        input.placeholder = '';
    }, 2000);
}

function saveScore() {
    const user = JSON.parse(localStorage.getItem('jeuxJanvier_user'));
    const elapsed = Math.floor((Date.now() - STATE.startTime) / 1000) + STATE.penaltyTime;

    const scoreData = {
        name: user?.fullName || 'Anonyme',
        game: 'andrea',
        time: getFinalTime(),
        seconds: elapsed * 1000,
        penaltyTime: STATE.penaltyTime,
        date: new Date().toISOString()
    };

    // Save to localStorage (works without PHP)
    const stored = localStorage.getItem('jeuxJanvier_scores');
    const scores = stored ? JSON.parse(stored) : [];
    scores.push(scoreData);
    localStorage.setItem('jeuxJanvier_scores', JSON.stringify(scores));
    console.log('Score saved to localStorage:', scoreData);

    // Also try PHP API
    fetch('../../api/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scoreData)
    }).catch(err => console.log('PHP API unavailable, score saved locally only'));
}
