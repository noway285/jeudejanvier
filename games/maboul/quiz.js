// quiz.js - Logique du quiz "4 images 1 personne"

let currentRound = 0;
let correctAnswers = 0;
let selectedPeople = [];
let currentPerson = null;

// Elements
const elements = {
    quizScreen: document.getElementById('quiz-screen'),
    successScreen: document.getElementById('success-screen'),
    failureScreen: document.getElementById('failure-screen'),
    personImage: document.getElementById('person-image'),
    optionsGrid: document.getElementById('options-grid'),
    currentRound: document.getElementById('current-round'),
    totalRounds: document.getElementById('total-rounds'),
    progressFill: document.getElementById('progress-fill'),
    btnContinue: document.getElementById('btn-continue'),
    btnRetry: document.getElementById('btn-retry')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initQuiz();

    elements.btnContinue.addEventListener('click', () => {
        // Mark quiz as validated and go to Docteur Maboul
        localStorage.setItem(QUIZ_VALIDATED_KEY, 'true');
        window.location.href = 'index.html';
    });

    elements.btnRetry.addEventListener('click', () => {
        // Reset and restart
        window.location.reload();
    });
});

function initQuiz() {
    // Reset state
    currentRound = 0;
    correctAnswers = 0;

    // Select random people for quiz
    selectedPeople = selectRandomPeople(QUIZ_ROUNDS);

    // Update total rounds display
    elements.totalRounds.textContent = QUIZ_ROUNDS;

    // Start first round
    showRound();
}

function selectRandomPeople(count) {
    // Shuffle and pick first 'count' people
    const shuffled = [...QUIZ_PEOPLE].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

function showRound() {
    if (currentRound >= QUIZ_ROUNDS) {
        // Quiz finished - check results (need at least MIN_CORRECT_TO_PASS)
        if (correctAnswers >= MIN_CORRECT_TO_PASS) {
            showSuccess();
        } else {
            showFailure();
        }
        return;
    }

    // Update progress
    elements.currentRound.textContent = currentRound + 1;
    elements.progressFill.style.width = `${(currentRound / QUIZ_ROUNDS) * 100}%`;

    // Get current person
    currentPerson = selectedPeople[currentRound];

    // Show image
    elements.personImage.src = currentPerson.image;

    // Generate options (correct answer + 3 random wrong answers)
    const options = generateOptions(currentPerson);

    // Display options
    displayOptions(options);
}

function generateOptions(correctPerson) {
    // Get other people (excluding correct one)
    const others = QUIZ_PEOPLE.filter(p => p.id !== correctPerson.id);

    // Fisher-Yates shuffle for reliable randomization
    for (let i = others.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [others[i], others[j]] = [others[j], others[i]];
    }

    // Pick 3 wrong answers
    const wrongAnswers = others.slice(0, 3);

    // Create options array with correct answer + 3 wrong
    const options = [correctPerson, ...wrongAnswers];

    // Fisher-Yates shuffle the final options
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }

    return options;
}

function displayOptions(options) {
    elements.optionsGrid.innerHTML = '';

    options.forEach(person => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = person.name;
        btn.dataset.id = person.id;
        btn.addEventListener('click', () => handleAnswer(person, btn));
        elements.optionsGrid.appendChild(btn);
    });
}

function handleAnswer(selectedPerson, btn) {
    // Disable all buttons
    const allButtons = elements.optionsGrid.querySelectorAll('.option-btn');
    allButtons.forEach(b => b.style.pointerEvents = 'none');

    if (selectedPerson.id === currentPerson.id) {
        // Correct answer
        btn.classList.add('correct');
        correctAnswers++;
    } else {
        // Wrong answer - just show it's wrong, don't reveal correct answer
        btn.classList.add('wrong');
    }

    // Move to next round after delay
    setTimeout(() => {
        currentRound++;
        showRound();
    }, 1000);
}

function showSuccess() {
    elements.quizScreen.style.display = 'none';
    elements.successScreen.style.display = 'flex';

    // Update progress to 100%
    elements.progressFill.style.width = '100%';
}

function showFailure() {
    elements.quizScreen.style.display = 'none';
    elements.failureScreen.style.display = 'flex';
}
