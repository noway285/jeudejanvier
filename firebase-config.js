// firebase-config.js - Configuration Firebase partagée
// Jeux de Janvier - Realtime Database

let database = null;
let firebaseReady = false;

// Try to initialize Firebase (won't crash if SDK not loaded)
try {
    if (typeof firebase !== 'undefined') {
        const firebaseConfig = {
            apiKey: "AIzaSyAHhNmBLeIkJrDAYLkhccbFQl014RiYkuw",
            authDomain: "jeux-janvier-mines.firebaseapp.com",
            databaseURL: "https://jeux-janvier-mines-default-rtdb.europe-west1.firebasedatabase.app",
            projectId: "jeux-janvier-mines",
            storageBucket: "jeux-janvier-mines.firebasestorage.app",
            messagingSenderId: "25669789704",
            appId: "1:25669789704:web:a94209cccead525fec09bd"
        };

        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        firebaseReady = true;
        console.log('🔥 Firebase initialized for Jeux de Janvier');
    } else {
        console.warn('⚠️ Firebase SDK not loaded - using localStorage only');
    }
} catch (error) {
    console.error('❌ Firebase init error:', error);
    console.warn('⚠️ Falling back to localStorage');
}

// ============================================
// SCORES API - Fonctions partagées
// ============================================

/**
 * Sauvegarde un score dans Firebase
 * @param {Object} scoreData - Les données du score
 * @returns {Promise} - Promise de l'opération
 */
async function saveScoreToFirebase(scoreData) {
    // Ajouter timestamp si pas présent
    if (!scoreData.date) {
        scoreData.date = new Date().toISOString();
    }
    if (!scoreData.timestamp) {
        scoreData.timestamp = Date.now();
    }

    // Always save to localStorage first (backup)
    saveScoreToLocalStorage(scoreData);

    // Try Firebase if available
    if (firebaseReady && database) {
        try {
            const newScoreRef = database.ref('scores').push();
            await newScoreRef.set(scoreData);
            console.log('✅ Score saved to Firebase:', scoreData.name);
            return { success: true, id: newScoreRef.key };
        } catch (error) {
            console.error('❌ Firebase save error:', error);
            return { success: false, error: error.message };
        }
    } else {
        console.log('💾 Score saved to localStorage (Firebase unavailable)');
        return { success: true, source: 'localStorage' };
    }
}

/**
 * Récupère tous les scores depuis Firebase
 * @param {string} gameFilter - Optionnel, filtre par jeu ('maboul', 'andrea')
 * @returns {Promise<Array>} - Liste des scores
 */
async function getScoresFromFirebase(gameFilter = null) {
    // Try Firebase first
    if (firebaseReady && database) {
        try {
            const snapshot = await database.ref('scores').once('value');
            const data = snapshot.val();

            if (!data) {
                console.log('📭 No scores in Firebase, checking localStorage');
                return getScoresFromLocalStorage(gameFilter);
            }

            // Convertir l'objet Firebase en array
            let scores = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));

            // Filtrer par jeu si spécifié
            if (gameFilter) {
                if (gameFilter === 'maboul') {
                    scores = scores.filter(s => !s.game || s.game === 'maboul');
                } else if (gameFilter === 'andrea') {
                    scores = scores.filter(s => s.game && s.game.startsWith('andrea'));
                }
            }

            console.log('✅ Loaded', scores.length, 'scores from Firebase');
            return scores;
        } catch (error) {
            console.error('❌ Firebase read error:', error);
            return getScoresFromLocalStorage(gameFilter);
        }
    } else {
        console.log('📂 Using localStorage (Firebase unavailable)');
        return getScoresFromLocalStorage(gameFilter);
    }
}

// ============================================
// LOCALSTORAGE FALLBACK
// ============================================

const FIREBASE_STORAGE_KEY = 'jeuxJanvier_scores';

function saveScoreToLocalStorage(scoreData) {
    try {
        const stored = localStorage.getItem(FIREBASE_STORAGE_KEY);
        const scores = stored ? JSON.parse(stored) : [];
        scores.push(scoreData);
        localStorage.setItem(FIREBASE_STORAGE_KEY, JSON.stringify(scores));
        console.log('💾 Score saved to localStorage');
    } catch (e) {
        console.error('❌ localStorage save error:', e);
    }
}

function getScoresFromLocalStorage(gameFilter = null) {
    try {
        const stored = localStorage.getItem(FIREBASE_STORAGE_KEY);
        let scores = stored ? JSON.parse(stored) : [];

        if (gameFilter) {
            if (gameFilter === 'maboul') {
                scores = scores.filter(s => !s.game || s.game === 'maboul');
            } else if (gameFilter === 'andrea') {
                scores = scores.filter(s => s.game && s.game.startsWith('andrea'));
            }
        }

        return scores;
    } catch (e) {
        console.error('❌ localStorage read error:', e);
        return [];
    }
}
