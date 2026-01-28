# 🏥 Jeu de Linda - Guide d'intégration

## Pour intégrer ce jeu dans ton projet

### Prérequis
Tu dois avoir le projet "Docteur Maboul" avec la structure de base :
- `firebase-config.js` à la racine
- `styles.css` à la racine

### Installation

1. **Remplace** ton dossier `games/maboul/` entièrement par celui-ci
2. C'est tout ! 🎉

### Flow du jeu

```
intro.html → quiz.html → index.html (Docteur Maboul) → contact.html
```

1. **Intro** (`intro.html`) : Contexte narratif - Noé a fait passer un téléphone à Linda
2. **Quiz** (`quiz.html`) : 4 photos à identifier correctement pour prouver qu'on fait partie du personnel
3. **Docteur Maboul** (`index.html`) : Le jeu classique - atteindre 3000 points pour le certificat
4. **Contact** (`contact.html`) : Instructions pour contacter Linda sur Messenger/Instagram

### Point d'entrée

Les joueurs doivent commencer par : `games/maboul/intro.html`

### Modification des contacts Linda

Dans `contact.html`, modifie les liens Messenger et Instagram avec les vrais identifiants de Linda :

```html
<a href="https://m.me/IDENTIFIANT_LINDA" class="contact-btn messenger">
<a href="https://instagram.com/IDENTIFIANT_LINDA" class="contact-btn instagram">
```

### Modification du seuil de points

Dans `game.js`, modifie la constante `CERTIFICATE_THRESHOLD` si tu veux changer le seuil :

```javascript
CERTIFICATE_THRESHOLD: 3000, // Modifie cette valeur
```

### Personnes dans le quiz

Les images dans `images/` correspondent à ces personnes :
- image0 = Lounes
- image1 = Haitam  
- image2 = Anoj
- image3 = Mathilde
- image4 = Doriane
- image5 = Mickael
- image6 = Kilian
- image7 = Adelin
- image8 = Michael
- image9 = Louis
- image10 = Hippolyte
- image11 = Antoine
- image12 = Florentin
- image13 = Bénédicte

Pour ajouter ou modifier des personnes, édite `quiz-data.js`.
