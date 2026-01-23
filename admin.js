// admin.js - Gestion du Dashboard et des Scores

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
        // Try PHP API first
        const response = await fetch('api/api.php');
        if (!response.ok) throw new Error('Network error');

        // Check if response is JSON (PHP working) or text (PHP not working)
        const text = await response.text();
        if (text.startsWith('<?php') || text.includes('<?php')) {
            // PHP is not being executed, fall back to localStorage
            console.warn("PHP not available, using localStorage");
            allData = loadFromLocalStorage();
        } else {
            allData = JSON.parse(text);
            // Also save to localStorage as backup
            saveToLocalStorage(allData);
        }

        renderMaboulScores();
        renderAndreaScores();
    } catch (e) {
        console.warn("API unavailable, using localStorage", e);
        // Fallback to localStorage
        allData = loadFromLocalStorage();
        renderMaboulScores();
        renderAndreaScores();
    }
};

// LocalStorage fallback functions
function loadFromLocalStorage() {
    const stored = localStorage.getItem('jeuxJanvier_scores');
    return stored ? JSON.parse(stored) : [];
}

function saveToLocalStorage(data) {
    localStorage.setItem('jeuxJanvier_scores', JSON.stringify(data));
}

function renderMaboulScores() {
    // Filter games without 'game' property OR game='maboul'
    // Maboul legacy scores just have {name, points}
    const scores = allData.filter(d => !d.game || d.game === 'maboul')
        .sort((a, b) => b.points - a.points);

    const tbody = document.querySelector('#table-maboul tbody');
    tbody.innerHTML = '';

    scores.forEach((s, index) => {
        const row = `
            <tr>
                <td>${index + 1}</td>
                <td>${s.name}</td>
                <td>${s.points} pts</td>
                <td>${formatDate(s.date)}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function renderAndreaScores() {
    // Andrea scores have game='andrea_day1' or game='andrea'
    const scores = allData.filter(d => d.game && d.game.startsWith('andrea'))
        .sort((a, b) => (a.seconds || 0) - (b.seconds || 0)); // Sort by time (asc)

    const tbody = document.querySelector('#table-andrea tbody');
    tbody.innerHTML = '';

    scores.forEach((s, index) => {
        // Parse "AgentName (RealName)"
        let agent = s.name;
        let real = "-";

        if (s.name.includes('(')) {
            const parts = s.name.match(/(.*) \((.*)\)/);
            if (parts) {
                agent = parts[1];
                real = parts[2];
            }
        }

        // Get penalties from stored data or show "-"
        let penalties = "-";
        if (s.penaltyTime !== undefined) {
            const penaltyMins = Math.floor(s.penaltyTime / 60);
            const penaltySecs = s.penaltyTime % 60;
            penalties = penaltyMins > 0 ? `${penaltyMins}min ${penaltySecs}s` : `${penaltySecs}s`;
        }

        const row = `
            <tr>
                <td style="color:${index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#fff'}; font-weight:bold;">
                    ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '#' + (index + 1)}
                </td>
                <td><span style="color:#f5c566; font-weight:bold;">${agent}</span></td>
                <td>${real}</td>
                <td style="font-family:monospace;">${s.time || '-'}</td>
                <td>${penalties}</td>
                <td>${formatDate(s.date)}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });

    // Show message if no scores
    if (scores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#888;">Aucun score enregistré</td></tr>';
    }
}

function formatDate(isoDate) {
    if (!isoDate) return "-";
    const d = new Date(isoDate);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
