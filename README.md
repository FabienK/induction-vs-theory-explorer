# Induction ou théorie

Démo interactive : un modèle appris sur des données interpole bien, mais ne dit rien de ce qui sort du jeu de données ; une théorie naît d'observations et s'engage sur d'autres que celles qui l'ont fait naître. Inspirée de la tribune d'Axel Cypel, « La question à 10⁴² dollars » (ActuIA n° 19).

Site statique, sans build, sans dépendance, sans collecte de données. Ouvrir `index.html` via un serveur local (`python3 -m http.server`) ou la page publiée.

## Utilisation

- **Récit** : choisir un scénario, lancer la visite guidée, lire le graphique, consulter les mots.
- **Modèle** : placer et déplacer des points dans la zone grisée ; régression polynomiale (degré 0 à 9) ou petit réseau de neurones (1 à 16 neurones), entraîné dans le navigateur.
- **Théorie** : écrire une loi `y = f(x, a, b, c)` et régler a, b, c ; analyse par un parseur maison, sans `eval`.
- **Révéler** : observations cachées, écart de chaque courbe, verdict chiffré.

## Scénarios

| Scénario | Données |
|---|---|
| Libre | simulées |
| Ondes gravitationnelles | simulées, inspirées du signal de 2015 |
| Sélection naturelle | simulées |
| Kepler et Newton | réelles (six planètes en entraînement ; Cérès, Vesta, Uranus, Neptune cachées ; valeurs arrondies) |

## Tests

`npm test` (Node 20 ou plus, rien à installer).

## Limites

- Trois scénarios sur quatre utilisent des données simulées, indiquées comme telles dans l'interface.
- Le seuil « juste » est fixé à 8 % de la hauteur du graphique.
- La démo est en cours de test auprès de lecteurs : `kit-test/accueil.html`.
