// quiz-data.js - Données des personnes pour le quiz "4 images 1 personne"

const QUIZ_PEOPLE = [
    { id: 0, name: "Lounes", image: "images/image0.jpeg" },
    { id: 1, name: "Haitam", image: "images/image1.jpeg" },
    { id: 2, name: "Anoj", image: "images/image2.jpeg" },
    { id: 3, name: "Mathilde", image: "images/image3.jpeg" },
    { id: 4, name: "Doriane", image: "images/image4.jpeg" },
    { id: 5, name: "Mickael", image: "images/image5.jpeg" },
    { id: 6, name: "Kilian", image: "images/image6.jpeg" },
    { id: 7, name: "Adelin", image: "images/image7.jpeg" },
    { id: 8, name: "Louis", image: "images/image8.jpeg" },
    { id: 9, name: "Michael", image: "images/image9.jpeg" },
    { id: 10, name: "Hippolyte", image: "images/image10.jpeg" },
    { id: 11, name: "Antoine", image: "images/image11.jpeg" },
    { id: 12, name: "Florentin", image: "images/image12.jpeg" },
    { id: 13, name: "Bénédicte", image: "images/image13.jpeg" }
];

// Nombre de rounds dans le quiz
const QUIZ_ROUNDS = 5;

// Minimum correct answers to pass
const MIN_CORRECT_TO_PASS = 5;

// Clé localStorage pour savoir si le quiz est validé
const QUIZ_VALIDATED_KEY = 'linda_quiz_validated';
