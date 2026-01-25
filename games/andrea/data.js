// Données du jeu Andréa - Configuration des énigmes

const ANDREA_DATA = {
    enigma1: {
        code: "MAUDEPACE",
        hint: "Suivre le soleil... (Est -> Ouest - Première lettre de chaque ville)",
        locations: [
            { city: "Magadan", coords: "59°33'39'' N 150°48'47'' E" },
            { city: "Akita", coords: "39°43'12'' N 140°05'44'' E" },
            { city: "Unnao", coords: "26°32'25'' N 80°29'18'' E" },
            { city: "Dasoguz", coords: "41°50'18'' N 59°57'55'' E" },
            { city: "Erbil", coords: "36°11'15'' N 44°00'36'' E" },
            { city: "Pita", coords: "11°03'26'' N 12°23'29'' W" },
            { city: "Arapica", coords: "9°44'58'' S 36°39'34'' W" },
            { city: "Cuzco", coords: "13°31'51'' N 71°58'03'' W" },
            { city: "Edmonton", coords: "53°31'35'' N 113°29'33'' W" }
        ]
    },
    enigma2: {
        folderName: "10-72-LP",
        hints: [
            { text: "\"Je suis un homme d'affaire, et le sang ça coûte trop cher.\"", penalty: 30 },
            { image: "hint_godfather1.png", penalty: 60 },
            { image: "hint_godfather2.png", penalty: 60 }
        ]
    },
    enigma3: {
        // Badge sur la carte
        solution: "H3", // Position du badge ID
        altSolutions: ["H2", "I3", "I2"] // Zones acceptables proches
    },
    enigma4: {
        // Audio morse - la réponse est DAME
        solution: 21, // Index du fichier DAME dans la liste
        files: [
            'DE_WEER', 'HAUSSNER', 'CHARPIGNY', 'MALIGE', 'GERBAUD',
            'FRISSOU', 'NAGARAJAH', 'DEMARESCAUX', 'FRUGIER', 'PESTEL',
            'DEBEIR', 'BORRON', 'VEZMAR', 'CANALI', 'CAMRINOT',
            'FOGEL', 'MASSON', 'BUSIN', 'BOUBAKRI', 'BASTIE',
            'DAME'
        ]
    },
    final: {
        // Message d'Hélène avec chiffre de César (L=N, décalage +2)
        cipherText: "ITCEG C TGIKU, NC EJQWGVVG A GUV F'QT",
        plainText: "grâce à Regis, la chouette y est d'or",
        solution: "DABO"
    }
};

// Mélangeur de tableau pour l'affichage aléatoire
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
