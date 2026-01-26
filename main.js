// main.js - Hub Logic (Firebase)

const STORAGE_KEY_USER = 'jeuxJanvier_user';

const elements = {
    loginScreen: document.getElementById('login-screen'),
    dashboard: document.getElementById('dashboard'),
    firstname: document.getElementById('firstname'),
    lastname: document.getElementById('lastname'),
    loginBtn: document.getElementById('login-btn'),
    errorMsg: document.getElementById('login-error'),
    playerNameDisplay: document.getElementById('player-name-display')
};

// Init
document.addEventListener('DOMContentLoaded', () => {
    checkSession();

    elements.loginBtn.addEventListener('click', handleLogin);

    // Enter key support
    elements.lastname.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
});

function checkSession() {
    const savedUser = localStorage.getItem(STORAGE_KEY_USER);
    if (savedUser) {
        const user = JSON.parse(savedUser);
        showDashboard(user);
    }
}

async function handleLogin() {
    const first = elements.firstname.value.trim();
    const last = document.getElementById('lastname').value.trim();

    if (!first || !last) {
        alert("Veuillez entrer votre NOM et PRÉNOM.");
        return;
    }

    const fullName = `${capitalize(first)} ${capitalize(last)}`;

    // Check availability (Anti-Cheat)
    const btn = document.getElementById('login-btn');
    const originalText = btn.textContent;
    btn.textContent = "VÉRIFICATION...";
    btn.disabled = true;

    try {
        // Use Firebase to check existing scores
        const scores = await getScoresFromFirebase();

        // Check if name exists in records (checking Real Name inside parentheses for agents)
        const exists = scores.some(s => {
            if (!s.name) return false;
            const nameToCheck = s.name.toUpperCase();
            const currentName = fullName.toUpperCase();
            // Check exact match or "Agent (RealName)" match
            return nameToCheck === currentName || nameToCheck.includes(`(${currentName})`);
        });

        if (exists && first !== 'Debug' && first !== 'Auto') { // Allow Debug users
            alert(`🛑 DÉSOLÉ ${first.toUpperCase()} !\n\nUne participation a déjà été enregistrée à votre nom.\nUne seule tentative autorisée.`);
            btn.textContent = originalText;
            btn.disabled = false;
            return;
        }

        // Login OK
        const user = { firstName: capitalize(first), lastName: capitalize(last), fullName: fullName, id: Date.now() };
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
        showDashboard(user);
    } catch (err) {
        console.warn("Firebase unavailable, allowing login...", err);
        // Fallback: Allow login if Firebase unreachable
        const user = { firstName: capitalize(first), lastName: capitalize(last), fullName: fullName, id: Date.now() };
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
        showDashboard(user);
    }
}

function showDashboard(user) {
    elements.playerNameDisplay.textContent = user.fullName.toUpperCase();
    elements.loginScreen.classList.add('hidden');
    elements.dashboard.style.display = 'block';
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function showError(msg) {
    elements.errorMsg.textContent = msg;
    setTimeout(() => elements.errorMsg.textContent = '', 3000);
}

// Game Navigation
window.startGame = function (game) {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEY_USER));
    if (!user) return location.reload();

    if (game === 'maboul') {
        window.location.href = 'games/maboul/index.html';
    } else if (game === 'andrea') {
        window.location.href = 'games/andrea/index.html';
    } else if (game === 'noe') {
        window.location.href = 'games/noe/index.html'; // Redirect to Agent Login
    }
};

const LINDA_PASSWORD = "161205";

function askLindaPassword() {
    document.getElementById("linda-overlay").classList.remove("hidden");
    document.getElementById("linda-password").value = "";
    document.getElementById("linda-error").textContent = "";
}

function closeLindaOverlay() {
    document.getElementById("linda-overlay").classList.add("hidden");
}

function checkLindaPassword() {
    const input = document.getElementById("linda-password").value;
    const error = document.getElementById("linda-error");

    if (input === LINDA_PASSWORD) {
        closeLindaOverlay();
        startGame("maboul");
    } else {
        error.textContent = "Mot de passe incorrect.";
    }
}

const NOE_ALIAS = "noway285"; 

function askNoeAlias() {
    document.getElementById("noe-overlay").classList.remove("hidden");
    document.getElementById("noe-alias-input").value = "";
    document.getElementById("noe-error").textContent = "";
}

function closeNoeOverlay() {
    document.getElementById("noe-overlay").classList.add("hidden");
}

function checkNoeAlias() {
    const input = document.getElementById("noe-alias-input").value.trim();
    const error = document.getElementById("noe-error");

    if (input.toLowerCase() === NOE_ALIAS.toLowerCase()) {
        closeNoeOverlay();
        startGame("noe");
    } else {
        error.textContent = "Alias incorrect.";
    }
}

// Admin - handled in admin.js
