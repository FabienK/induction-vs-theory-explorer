/* Textes du professeur (rédigés pour un public non spécialiste). Données seules, aucune logique. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ITE = Object.assign(root.ITE || {}, api);
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const LESSONS = {
    "common": {
      "principle": "Pas de théorie sans observation. Un modèle appris résume ses données ; une théorie naît d'observations, mais s'engage sur d'autres que celles qui l'ont fait naître.",
      "reading": {
        "title": "Lire le graphique",
        "items": [
          {
            "mark": "point noir",
            "means": "Une observation déjà faite. On peut en ajouter, la déplacer ou la retirer."
          },
          {
            "mark": "zone grisée",
            "means": "Le connu : la plage où nous avons des observations. À droite commence le hors du connu."
          },
          {
            "mark": "courbe bleue, trait plein puis pointillé",
            "means": "Le modèle appris sur les points, polynôme ou réseau. Plein dans le connu, pointillé quand il prolonge au-delà."
          },
          {
            "mark": "courbe orange",
            "means": "La théorie : une loi proposée à partir de ce qu'on a observé, réglée avec les curseurs ou le bouton de la loi."
          },
          {
            "mark": "losange violet, creux ou plein",
            "means": "Une observation cachée, révélée à la fin. Creux dans le connu, plein hors du connu. Une étiquette donne son nom quand il existe."
          },
          {
            "mark": "trait pointillé vertical",
            "means": "L'écart entre une observation révélée et chaque courbe. Plus il est long, plus la courbe se trompe."
          }
        ]
      },
      "words": [
        {
          "word": "observation",
          "means": "Remarquer que le pain rassis durcit, noter l'heure du lever du soleil : un fait vu ou mesuré. Point de départ des modèles comme des théories."
        },
        {
          "word": "interpolation",
          "means": "Deviner la taille d'un enfant à 7 ans quand on l'a mesuré à 6 et 8 ans : on comble un trou entre des points connus."
        },
        {
          "word": "extrapolation",
          "means": "Deviner sa taille à 30 ans en prolongeant sa croissance d'enfant : on sort des points connus, et l'erreur peut devenir énorme."
        },
        {
          "word": "induction",
          "means": "Voir le soleil se lever chaque matin et en tirer une règle : on généralise à partir d'exemples répétés."
        },
        {
          "word": "théorie",
          "means": "Savoir pourquoi la pâte lève, après l'avoir vue lever souvent : une explication née d'observations, qui annonce aussi ce qu'on n'a pas encore vu."
        },
        {
          "word": "modèle",
          "means": "Une recette tirée de nombreux plats goûtés. Ici, une courbe calculée pour passer au plus près des points mesurés, sans dire pourquoi."
        },
        {
          "word": "réseau de neurones",
          "means": "Un apprenti qui règle mille petits boutons à force d'essais : un calcul fait d'unités simples, ajusté pour reproduire les exemples reçus."
        }
      ],
      "intro": "Bienvenue. Nous allons comparer deux façons de prévoir à partir des mêmes observations : apprendre une courbe qui les résume, ou proposer une loi qui explique le phénomène. Puis nous regarderons hors du connu.",
      "outro": "Voilà pour ce scénario. Dans chaque cas, tout part d'observations ; la différence tient à ce qu'on en fait. Essayons un autre scénario pour regarder la même question sous un autre angle."
    },
    "scenarios": {
      "libre": {
        "steps": [
          {
            "id": "data",
            "title": "Des mesures, sans plus",
            "say": "Regardons ces points noirs : des mesures simulées d'un phénomène inconnu, y en fonction de x, entre 0 et 6. Nous n'en voyons qu'un morceau, comme une route dont on ne voit que les premiers virages.",
            "task": "Placez ou déplacez un point dans la zone grisée.",
            "hint": "Un clic dans la zone grisée ajoute un point ; glissez-le pour le déplacer."
          },
          {
            "id": "learn",
            "title": "Deux modèles apprennent",
            "say": "Deux modèles apprennent ces points : un polynôme et un petit réseau de neurones. Tous deux finissent par coller au connu, comme un calque posé sur un dessin. Mais au-delà de 6, chacun prolonge à sa façon.",
            "task": "Choisissez un modèle ci-dessous et faites varier son curseur.",
            "hint": "Le polynôme part en flèche ou plonge ; le réseau s'aplatit en plateau. Aucun ne retrouve les vagues."
          },
          {
            "id": "bet",
            "title": "Et au-delà ?",
            "say": "Avant de regarder, prédisons. Que fera ce phénomène plus à droite, jusqu'à 16, là où personne n'a mesuré ? Un pari posé avant de voir vaut mieux qu'une explication trouvée après coup.",
            "task": "Pariez : où ira la courbe dans « Hors du connu » ?",
            "hint": "Regardez les pointillés bleus : suivent-ils votre intuition, ou partent-ils ailleurs ?"
          },
          {
            "id": "theory",
            "title": "Proposer une loi",
            "say": "Observons d'abord : une bosse vers 2, puis un creux de même taille vers 6. Cette alternance suggère un balancement, comme une balançoire : a·sin(b·x)+c. a règle l'ampleur, b le rythme, c la hauteur moyenne.",
            "task": "Réglez a, b et c ci-dessous pour que l'orange suive les points.",
            "hint": "Commencez par b, le rythme, puis ajustez a, l'ampleur. La hauteur moyenne semble proche de 0."
          },
          {
            "id": "reveal",
            "title": "Le moment de vérité",
            "say": "Des mesures cachées vont apparaître : losanges creux dans le connu, pleins au-delà. Les pointillés verticaux montreront l'écart de chaque courbe à la réalité, comme une règle posée entre la prévision et le fait.",
            "task": "Appuyez sur Révéler.",
            "hint": "Comparez les pointillés dans la zone grisée, puis à droite : où l'écart grandit-il ?"
          },
          {
            "id": "verdict",
            "title": "Ce que montre l'écart",
            "say": "Dans le connu, polynôme et réseau excellent : ils résument leurs points. Au-delà de 6, chacun prolonge à sa façon, sans vagues. La loi, suggérée par une bosse et un creux, s'engageait au-delà ; bien réglée, elle tient.",
            "task": "",
            "hint": "Les modèles ne sont pas mauvais : ils résument ce qu'ils ont reçu, rien de plus."
          },
          {
            "id": "further",
            "title": "À retenir",
            "say": "La loi n'est pas tombée du ciel : elle est née de quelques points. Mais elle a parié sur des points qu'elle n'avait pas vus, et c'est là, hors du connu, qu'on a pu la juger.",
            "task": "",
            "hint": "Essayez plusieurs réglages des deux modèles : l'un retrouve-t-il les vagues au-delà de 6 ?"
          }
        ],
        "debate": [
          "Si plusieurs lois différentes collent aux mêmes points, comment choisir entre elles ?",
          "Une bosse et un creux suffisent-ils pour deviner une oscillation ? Combien d'observations faut-il pour oser une loi ?",
          "Un modèle qui aurait vu des milliers d'oscillations différentes pourrait-il proposer lui-même la forme a·sin(b·x)+c ?"
        ]
      },
      "ondes": {
        "steps": [
          {
            "id": "data",
            "title": "Un signal qui monte",
            "say": "Ces points donnent la fréquence d'un signal, en hertz, juste avant la fusion de deux astres massifs. De −0,4 à −0,18 seconde, elle monte doucement, de 33 à 45 Hz environ, comme une sirène qui démarre.",
            "task": "Placez ou déplacez un point dans la zone grisée.",
            "hint": "Données illustratives (simulées), inspirées du signal observé en 2015."
          },
          {
            "id": "learn",
            "title": "Deux modèles apprennent",
            "say": "Polynôme ou réseau, les deux modèles apprennent cette montée douce, comme un conducteur qui ne regarderait que le rétroviseur. Dans le connu, ils collent. Après −0,18 s, l'un s'emballe ou plonge, l'autre s'aplatit.",
            "task": "Choisissez un modèle ci-dessous et faites varier son curseur.",
            "hint": "Le polynôme change d'avis selon le degré ; le réseau fait un plateau. Aucun ne retrouve la loi."
          },
          {
            "id": "bet",
            "title": "Jusqu'à la fusion",
            "say": "Il reste moins de deux dixièmes de seconde avant la fusion. La fréquence va-t-elle continuer à monter doucement, se stabiliser, ou faire autre chose ? Prenons position avant de regarder.",
            "task": "Pariez : quelle fréquence à l'instant de la fusion ?",
            "hint": "Avec les seuls points, impossible de trancher. Qu'est-ce qui pourrait nous aider ?"
          },
          {
            "id": "theory",
            "title": "La loi d'Einstein",
            "say": "La relativité générale est née de problèmes d'observation, comme l'orbite de Mercure, qui avance plus que prévu. Pour deux astres qui spiralent en perdant de l'énergie, comme une bille dans un entonnoir, elle prédit f = a·(−t)^b.",
            "task": "Appuyez ci-dessous sur le bouton de la loi.",
            "hint": "Ici b = −3/8. La courbe orange suit les points, puis grimpe en flèche près de 0 s."
          },
          {
            "id": "reveal",
            "title": "Le moment de vérité",
            "say": "Voici les mesures cachées, jusqu'à la fusion. En 2015, ce signal a été détecté par des instruments construits pour le chercher, parce que la théorie l'annonçait. Laquelle des courbes l'avait prévu ?",
            "task": "Appuyez sur Révéler.",
            "hint": "Les losanges pleins dépassent 120 Hz. Où passent les pointillés bleus et la courbe orange ?"
          },
          {
            "id": "verdict",
            "title": "Ce que montre l'écart",
            "say": "Les modèles ont bien résumé la montée douce, mais rien dans ces points n'annonçait l'envolée. La loi, née d'autres observations, s'engageait sur ce signal jamais vu, au-delà de 120 Hz. Elle a passé l'épreuve.",
            "task": "",
            "hint": "Dans la zone grisée, les courbes se valent. Tout se joue dans le dernier dixième de seconde."
          },
          {
            "id": "further",
            "title": "À retenir",
            "say": "Une théorie nourrie par l'orbite de Mercure a parlé d'un signal que personne n'avait vu. Elle n'a pas remplacé les mesures : elle a dit quoi chercher, et ce sont les mesures de 2015 qui l'ont jugée.",
            "task": "",
            "hint": "Retirez quelques points : la loi ne bouge pas. Et les modèles ?"
          }
        ],
        "debate": [
          "Mercure et une fusion d'astres lointains semblent sans rapport. Comment une même théorie peut-elle parler des deux ?",
          "Un modèle entraîné sur des milliers de fusions observées aurait-il pu prévoir la première ? Que lui aurait-il manqué ?",
          "Une théorie qui prédit juste est-elle vraie pour autant ? Que faudrait-il observer pour la mettre en doute ?"
        ]
      },
      "evolution": {
        "steps": [
          {
            "id": "data",
            "title": "Une variante se répand",
            "say": "Chaque point indique la part d'une population qui porte une variante héréditaire avantageuse, génération après génération. De 0 à 25, elle passe d'environ 2 % à 30 % : on dirait une montée régulière.",
            "task": "Placez ou déplacez un point dans la zone grisée.",
            "hint": "Données illustratives (simulées). Une part se lit entre 0 et 1 : 0,3 veut dire 30 %."
          },
          {
            "id": "learn",
            "title": "Deux modèles apprennent",
            "say": "Polynôme ou réseau, chacun apprend la montée, comme on devine la fin d'un livre en lisant les premières pages. Dans le connu, ils collent. Au-delà de 25, le polynôme file ou plonge, le réseau fait un plateau.",
            "task": "Choisissez un modèle ci-dessous et faites varier son curseur.",
            "hint": "Vers la génération 80, le polynôme reste-t-il sous 1 ? Le plateau du réseau tombe-t-il juste ?"
          },
          {
            "id": "bet",
            "title": "Génération 80",
            "say": "À la génération 80, quelle part de la population portera la variante ? Une chose est sûre avant tout calcul : une part ne peut pas dépasser 100 %.",
            "task": "Pariez : quelle part à la génération 80 ?",
            "hint": "Si la montée gardait son rythme, que se passerait-il ? Est-ce seulement possible ?"
          },
          {
            "id": "theory",
            "title": "Le mécanisme de Darwin",
            "say": "Darwin a observé des élevages, des espèces voisines, des fossiles. Il en tire un mécanisme : les porteurs d'une variante utile laissent plus de descendants. Comme une rumeur, ça s'étend vite puis ralentit quand presque tous la connaissent.",
            "task": "Appuyez ci-dessous sur le bouton de la loi.",
            "hint": "La forme en S, la logistique, a été écrite plus tard par la génétique des populations."
          },
          {
            "id": "reveal",
            "title": "Le moment de vérité",
            "say": "Découvrons les générations cachées. Quand presque tous portent la variante, il reste peu de place pour progresser, comme un verre presque plein qu'on remplit plus doucement. Les modèles l'ont-ils deviné ?",
            "task": "Appuyez sur Révéler.",
            "hint": "Suivez les losanges pleins : ils s'aplatissent près de 1. Et les pointillés bleus ?"
          },
          {
            "id": "verdict",
            "title": "Ce que montre l'écart",
            "say": "De 0 à 25, les modèles résument bien les mesures. Au-delà, ils ignorent le plafond ou s'arrêtent au hasard. Le mécanisme, né d'autres observations, s'engageait sur ces générations jamais vues : il plafonne vers 100 %.",
            "task": "",
            "hint": "Un plateau du réseau peut tomber juste par chance. La loi, elle, dit pourquoi elle plafonne."
          },
          {
            "id": "further",
            "title": "À retenir",
            "say": "Darwin n'a pas inventé sa théorie hors du monde : il l'a tirée d'observations peu nombreuses mais réelles. Sa force est ailleurs : elle s'engage sur des générations qu'il n'a jamais vues.",
            "task": "",
            "hint": "Retirez des points avant la génération 25 : la loi tient, et les modèles ?"
          }
        ],
        "debate": [
          "Le plafond de 100 % se voit sans calcul. Quelles connaissances pourrait-on donner à un modèle pour qu'il prévoie mieux ?",
          "Des pigeons d'élevage aux fossiles, Darwin avait peu d'observations. Pourquoi ont-elles suffi à proposer un mécanisme ?",
          "Une courbe en S décrit aussi une rumeur qui circule. Est-ce la même explication, ou seulement la même forme ?"
        ]
      },
      "kepler": {
        "steps": [
          {
            "id": "data",
            "title": "Six planètes mesurées",
            "say": "Ces six points sont réels : les planètes que suivaient Tycho Brahe et Kepler. Plus une planète est loin, plus son tour est long, comme un coureur au couloir extérieur, qui a plus de chemin.",
            "task": "Placez ou déplacez un point dans la zone grisée.",
            "hint": "Données réelles. Distance en UA (Terre = 1), durée en années. Mercure : 0,387 UA, 0,241 an."
          },
          {
            "id": "learn",
            "title": "Deux modèles apprennent",
            "say": "Polynôme ou réseau, chacun colle aux six planètes, comme un costume sur mesure. Au-delà de 10 UA, le polynôme s'emballe ou plonge ; le réseau s'aplatit, comme si les lointaines tournaient aussi vite que Saturne.",
            "task": "Choisissez un modèle ci-dessous et faites varier son curseur.",
            "hint": "Six points, c'est peu : changez le curseur et regardez le pointillé bleu changer d'avis."
          },
          {
            "id": "bet",
            "title": "Loin de Saturne",
            "say": "Saturne, à 9,537 UA, met 29,46 ans pour faire le tour du Soleil. Imaginons une planète trois fois plus loin, vers 30 UA. Combien de temps durerait son tour ? Prenons position avant de regarder.",
            "task": "Pariez : quelle durée d'un tour à 30 UA ?",
            "hint": "Trois fois plus loin, est-ce trois fois plus long, ou davantage ?"
          },
          {
            "id": "theory",
            "title": "La loi de Kepler",
            "say": "Kepler a scruté les mesures de Tycho Brahe et y a trouvé une forme simple : T² = x³, le carré de la durée égale le cube de la distance. Elle prédit qu'à 30 UA, un tour dure plus d'un siècle.",
            "task": "Appuyez ci-dessous sur « Troisième loi de Kepler ».",
            "hint": "Ici T = x^(3/2), en années et en UA. La courbe orange frôle les six points."
          },
          {
            "id": "reveal",
            "title": "Le moment de vérité",
            "say": "Voici les observations cachées. Dans le connu, Cérès et Vesta, deux petits corps entre Mars et Jupiter. Au-delà, Uranus, découverte au télescope en 1781, et Neptune, à 30,07 UA. Leurs noms s'affichent près des losanges.",
            "task": "Appuyez sur Révéler.",
            "hint": "Neptune met 164,8 ans. Où passent les pointillés bleus, et la courbe orange ?"
          },
          {
            "id": "verdict",
            "title": "Ce que montre l'écart",
            "say": "Les modèles collaient aux six planètes, puis se trompent. La loi tient jusqu'à Neptune. Soyons honnêtes : sa forme se lisait dans les données. Ce qui tient hors du connu, c'est cette forme simple, pas une courbe collée à six points.",
            "task": "",
            "hint": "Cérès et Vesta, dans le connu, sont bien placées par presque toutes les courbes."
          },
          {
            "id": "further",
            "title": "De Kepler à Neptune",
            "say": "Newton a ensuite expliqué la loi par la gravitation, une force en 1/r². En 1846, Le Verrier s'en sert, avec les irrégularités de l'orbite d'Uranus, pour calculer où chercher Neptune, avant qu'on ne l'observe.",
            "task": "",
            "hint": "Comme un détective : des traces sur Uranus, une explication, puis une adresse où regarder."
          }
        ],
        "debate": [
          "Kepler a trouvé T² = x³ dans six points. Un modèle pourrait-il trouver cette forme simple, et pas seulement une courbe ?",
          "Quelle différence entre la loi de Kepler, lue dans les mesures, et l'explication de Newton par la gravitation ?",
          "Le Verrier a désigné Neptune par le calcul avant qu'on ne la voie. Qu'est-ce qui rendait ce pari possible ?"
        ]
      }
    }
  };
  return { LESSONS };
});
