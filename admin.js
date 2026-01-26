// admin.js - Gestion du Dashboard et des Scores (Firebase)

const ADMIN_CODE = "matthiaslebelge";
let allData = [];

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('close-admin').addEventListener('click', closeAdmin);
});

// Override window.openAdmin from main.js
window.openAdmin = function () {
    const code = prompt("CODE ORGANISATEUR :");
    if (code === ADMIN_CODE) {
        document.getElementById('admin-dashboard').classList.remove('hidden');
        refreshAdminScores();
    } else if (code !== null) {
        alert("Code Incorrect");
    }
};

function closeAdmin() {
    document.getElementById('admin-dashboard').classList.add('hidden');
}

window.switchAdminTab = function (tab) {
    // Buttons
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');

    // Content
    document.querySelectorAll('.admin-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`admin-view-${tab}`).classList.add('active');
};

window.refreshAdminScores = async function () {
    try {
        // Use Firebase via the shared helper function
        allData = await getScoresFromFirebase();
        console.log('✅ Loaded', allData.length, 'scores from Firebase');

        renderMaboulScores();
        renderAndreaScores();
    } catch (e) {
        console.warn("Firebase unavailable, using localStorage", e);
        // Fallback to localStorage
        allData = getScoresFromLocalStorage();
        renderMaboulScores();
        renderAndreaScores();
    }
};

// ============================================
// FORMAT HELPERS
// ============================================

function formatTimeMinutes(seconds) {
    if (seconds === undefined || seconds === null) return "-";

    // If it's in milliseconds, convert to seconds
    if (seconds > 10000) {
        seconds = Math.floor(seconds / 1000);
    }

    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}h ${mins}min ${secs}s`;
    } else if (mins > 0) {
        return `${mins}min ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

function formatDate(isoDate) {
    if (!isoDate) return "-";
    const d = new Date(isoDate);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) +
        ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// MABOUL (LINDA) SCORES
// ============================================

function renderMaboulScores() {
    const scores = allData.filter(d => !d.game || d.game === 'maboul')
        .sort((a, b) => b.points - a.points);

    const tbody = document.querySelector('#table-maboul tbody');
    tbody.innerHTML = '';

    if (scores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#888;">Aucun score enregistré</td></tr>';
        return;
    }

    scores.forEach((s, index) => {
        // Get rank emoji
        const rankDisplay = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
        const rankColor = index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#fff';

        // Format time
        const timeDisplay = s.formattedTime || formatTimeMinutes(s.totalTime);

        // Format objects extracted
        let objectsDisplay = '-';
        if (s.objectsSucceeded !== undefined || s.objectsFailed !== undefined) {
            const success = s.objectsSucceeded || 0;
            const failed = s.objectsFailed || 0;
            objectsDisplay = `✅${success} / ❌${failed}`;
        }

        const row = `
            <tr>
                <td style="color:${rankColor}; font-weight:bold;">${rankDisplay}</td>
                <td><span style="color:#f5c566; font-weight:bold;">${escapeHtml(s.name)}</span></td>
                <td style="font-size:1.1em; font-weight:bold;">${s.points || 0} pts</td>
                <td>${objectsDisplay}</td>
                <td style="font-family:monospace;">${timeDisplay}</td>
                <td>${formatDate(s.date)}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });

    // Add summary row
    const totalPlayers = scores.length;
    const avgScore = Math.round(scores.reduce((sum, s) => sum + (s.points || 0), 0) / totalPlayers);
    tbody.innerHTML += `
        <tr style="background:#222; font-style:italic; color:#888;">
            <td colspan="2">📊 ${totalPlayers} joueur(s)</td>
            <td colspan="4">Score moyen: ${avgScore} pts</td>
        </tr>
    `;
}

// ============================================
// ANDREA SCORES
// ============================================

function renderAndreaScores() {
    const scores = allData.filter(d => d.game && d.game.startsWith('andrea'))
        .sort((a, b) => {
            // Sort by total time (seconds field, lower is better)
            const aTime = a.seconds || (a.penaltyTime || 0);
            const bTime = b.seconds || (b.penaltyTime || 0);
            return aTime - bTime;
        });

    const tbody = document.querySelector('#table-andrea tbody');
    tbody.innerHTML = '';

    if (scores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#888;">Aucun score enregistré</td></tr>';
        return;
    }

    scores.forEach((s, index) => {
        // Parse name
        let displayName = s.name || 'Anonyme';
        let realName = "-";

        if (displayName.includes('(')) {
            const parts = displayName.match(/(.*) \((.*)\)/);
            if (parts) {
                displayName = parts[1];
                realName = parts[2];
            }
        }

        // Rank styling
        const rankDisplay = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
        const rankColor = index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#fff';

        // Time total (from the 'time' field which is MM:SS format or calculate from seconds)
        let totalTimeDisplay = s.time || '-';
        if (s.seconds) {
            totalTimeDisplay = formatTimeMinutes(Math.floor(s.seconds / 1000));
        }

        // Penalties
        let penaltyDisplay = '-';
        if (s.penaltyTime !== undefined && s.penaltyTime > 0) {
            penaltyDisplay = `+${formatTimeMinutes(s.penaltyTime)}`;
        }

        // Calculate "real" time (total - penalties) for display
        let realTimeDisplay = '-';
        if (s.seconds && s.penaltyTime !== undefined) {
            const realSeconds = Math.floor(s.seconds / 1000) - s.penaltyTime;
            if (realSeconds > 0) {
                realTimeDisplay = formatTimeMinutes(realSeconds);
            }
        }

        const row = `
            <tr>
                <td style="color:${rankColor}; font-weight:bold;">${rankDisplay}</td>
                <td><span style="color:#f5c566; font-weight:bold;">${escapeHtml(displayName)}</span></td>
                <td>${escapeHtml(realName)}</td>
                <td style="font-family:monospace; font-weight:bold; color:#4CAF50;">${totalTimeDisplay}</td>
                <td style="font-family:monospace; color:#ff6b6b;">${penaltyDisplay}</td>
                <td>${formatDate(s.date)}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });

    // Add summary
    const totalPlayers = scores.length;
    if (totalPlayers > 0) {
        const bestTime = scores[0].time || formatTimeMinutes(Math.floor((scores[0].seconds || 0) / 1000));
        tbody.innerHTML += `
            <tr style="background:#222; font-style:italic; color:#888;">
                <td colspan="3">📊 ${totalPlayers} agent(s) ont terminé</td>
                <td colspan="3">Meilleur temps: ${bestTime}</td>
            </tr>
        `;
    }
}
