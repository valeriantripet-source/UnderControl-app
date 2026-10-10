# UnderControl

Toutes vos assurances au même endroit. UnderControl rassemble les polices d'un foyer, dit ce qui est couvert, ce qui manque et ce qui est payé deux fois, et permet de demander un comparatif.

> **Version de test (MVP).** Toutes les données restent sur le téléphone, dans le navigateur. Rien n'est envoyé à un serveur ni à un assureur.

## Fonctionnalités

| Écran | Ce qui fonctionne | Simulé dans cette version |
|---|---|---|
| Intro | Logo animé au démarrage (souffle puis cadenas), réglable dans le profil | — |
| Bienvenue | Présentation de l'app | — |
| Identification | Création de compte (prénom, e-mail, mot de passe), connexion, déconnexion | SwissID, Apple, Google |
| Vos polices | Saisie ligne par ligne (risque, assureur, n° de police), étape facultative | — |
| Mes polices | Liste, statut de chaque document, modification, suppression | — |
| Ajouter une police | Demande par assureur + n° avec mandat, ou import PDF / photo | L'envoi de la demande à l'assureur (bouton « Simuler la réception ») |
| Bilan | Lacunes classées par niveau de risque, doublons possibles, références légales, 3 questions de situation | La lecture des documents article par article |
| Comparatif | Enregistrement d'une demande de comparatif | Les offres |
| Assistant (Alfred) | Interface de conversation | Les réponses |
| Profil | Compte, statistiques, réglages de l'intro, déconnexion, effacement des données | — |

## Structure

```
index.html             Page de l'app
styles.css             Styles (thème clair et sombre)
intro.js               Intro animée au démarrage et symbole du logo
app.js                 Logique : écrans, mémoire locale, bilan
sons/                  Souffle et cadenas de l'intro
manifest.webmanifest   Installation sur l'écran d'accueil
sw.js                  Fonctionnement hors ligne
icons/                 Icônes de l'app
```

Aucune dépendance, aucune étape de build : ce sont des fichiers statiques.

## Intro au démarrage

À l'ouverture, le logo se dessine sur fond foncé : l'anneau avec un souffle de vent, puis le segment qui le ferme avec un bruit de cadenas, et le nom qui apparaît dessous. Un appui n'importe où passe l'intro.

Les navigateurs bloquent souvent le son tant que la personne n'a pas touché l'écran : l'intro peut donc démarrer sans son à l'ouverture. Le bouton « Revoir l'intro » du profil la rejoue toujours avec le son. Dans une future app native, le son jouera dès l'ouverture.

L'intro et son son se désactivent dans le profil. Avec le réglage système « réduire les animations », le logo s'affiche directement.

## Stockage local

- Compte, polices, réponses du bilan, demandes et conversation : `localStorage`, clé `undercontrol-mvp-v1`.
- Documents importés (PDF, photos) : IndexedDB, base `undercontrol-mvp`.
- Le mot de passe n'est pas stocké en clair : seule une empreinte SHA-256 est gardée. C'est suffisant pour un test, pas pour une vraie app.

Les données sont propres à chaque navigateur et à chaque appareil. Effacer les données du site ou utiliser « Effacer toutes mes données » dans le profil remet l'app à zéro.

## Tester en local

Le service worker et IndexedDB ont besoin d'un serveur (pas d'ouverture directe du fichier) :

```bash
python3 -m http.server 8000
```

Puis ouvrir http://localhost:8000.

## Publier avec GitHub Pages

1. Créer un dépôt sur GitHub et y déposer ces fichiers à la racine.
2. Dans le dépôt : **Settings › Pages**, source **Deploy from a branch**, branche `main`, dossier `/ (root)`.
3. L'app est en ligne après une minute environ, à l'adresse `https://<votre-compte>.github.io/<nom-du-depot>/`.
4. Sur le téléphone, ouvrir cette adresse puis **Ajouter à l'écran d'accueil** (Safari : bouton Partager ; Chrome : menu ⋮).

Après une mise à jour du code, changer la valeur `CACHE` dans `sw.js` (par exemple `undercontrol-v2`) pour que les téléphones chargent la nouvelle version.

## Prochaines étapes

- Serveur et vraie authentification (SwissID, Apple, Google), données chiffrées et hébergées.
- Envoi réel des demandes de documents aux assureurs, avec mandat signé.
- Lecture des polices par l'IA (Alfred) et bilan article par article.
- Comparateur d'offres.
