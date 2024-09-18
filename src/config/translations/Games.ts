import { GamePreConfig, Translations } from '@models/interfaces';

const GamesRoutes: Translations = {
    es: {
        spellTower: '/juegos/la-torre-de-la-ortografia',
        wordsRain: '/juegos/lluvia-de-palabras',
        wordBuilder: '/juegos/constructor-de-palabras',
        wordFinder: '/juegos/buscador-de-palabras',
        definitionMaster: '/juegos/maestro-de-las-definiciones',
        crossWordPuzzle: '/juegos/crucigramas',
    },
    en: {
        wordBuilder: '/en/games/word-builder',
        wordFinder: '/en/games/word-finder',
        definitionMaster: '/en/games/definition-master',
        crossWordPuzzle: '/en/games/crossword-puzzles',
    },
};

const GamesTranslations: GamePreConfig[] = [
    {
        id: 'spellTower',
        imgSrc: '/images/games/spellTower.png',
        title: {
            en: 'The Spelling Tower',
            es: 'La torre de la ortografía',
        },
        description: {
            en: 'A game where you build towers, adding a block for each correctly spelled word. The game challenges players to build the tallest tower they can by spelling or choosing a series of words where the spelling must be correct.',
            es: 'Un juego donde construyes torres, añadiendo un bloque por cada palabra bien escrita. El juego desafía a los jugadores a construir la torre más alta que puedan escribiendo o eligiendo correctamente una serie de palabras donde la ortografía debe ser la correcta.',
        },
        subtitle: {
            en: 'It is a competitive game where players guess word definitions.',
            es: 'Es un juego competitivo donde los jugadores adivinan definiciones de palabras.',
        },
        gameRules: {
            en: {
                gameGoal: 'The objective of the game is to build the tallest tower possible.',
                howToPlay: [
                    'When the game starts, words will be displayed, some spelled correctly and others incorrectly.',
                    'Choose a word: if it is spelled correctly, a block will be added to your tower.',
                    'If you choose a word spelled incorrectly, a block will be removed from your tower.',
                ],
                additionalRules: [],
                // prettier-ignore
                tips: [
                    'Take your time to carefully read each word.',
                    'Remember that going faster doesn\'t always mean getting there first.',
                ],
            },
            es: {
                gameGoal: 'El objetivo del juego es construir la torre más alta posible.',
                howToPlay: [
                    'Al comenzar el juego, se mostrarán palabras, algunas escritas correctamente y otras incorrectamente.',
                    'Elige una palabra: si está escrita correctamente, se añadirá un bloque a tu torre.',
                    'Si eliges una palabra escrita incorrectamente, se eliminará un bloque de tu torre.',
                ],
                additionalRules: [],
                tips: [
                    'Dedica tiempo a leer cuidadosamente cada palabra.',
                    'Recuerda que ir más rápido no siempre significa llegar primero.',
                ],
            },
        },
    },
    {
        id: 'wordsRain',
        imgSrc: '/images/games/wordsRain.png',
        title: {
            en: 'Word Rain',
            es: 'Lluvia de palabras',
        },
        description: {
            en: 'A game where you have to prevent well-spelled words from falling, as misspelled words will cause you to lose. You must last as long as possible; the one who lasts the longest, wins.',
            es: 'Un juego donde debes evitar que las palabras bien escritas caigan, ya que las mal escritas harán que pierdas. Debes durar el mayor tiempo posible; quien dure más tiempo, gana.',
        },
        subtitle: {
            en: 'A game where you have to prevent well-spelled words from falling or you will lose.',
            es: 'Un juego dónde hay que evitar que las palabras bien escritas caigan o perderás.',
        },
        gameRules: {
            en: {
                additionalRules: [
                    'As time progresses, the game speed will increase, and more words might appear.',
                    'The game ends when the player loses all their lives.',
                ],
                howToPlay: [
                    'The game starts at speed level 1, and the player begins with a certain number of lives.',
                    'Words, both correctly and incorrectly spelled, will fall from the top of the screen. The player must select the correctly spelled words.',
                    'If the player chooses an incorrect word, they will lose a life.',
                    'There is no penalty for selecting a correct word. However, if a correct word reaches the ground, the player will lose a life.',
                ],
                gameGoal: 'Stay in the game for as long as possible without losing all your lives.',
                tips: [
                    'Words often appear in groups, which can help you deduce which ones are spelled correctly.',
                    'If you lose a life by selecting an incorrect word, act quickly to choose the correct one before it reaches the ground.',
                ],
            },
            es: {
                additionalRules: [
                    'Conforme avance el tiempo, la velocidad del juego aumentará y podrían aparecer más palabras.',
                    'El juego termina cuando el jugador pierde todas sus vidas.',
                ],
                howToPlay: [
                    'El juego inicia a velocidad 1 y el jugador comienza con un número de vidas determinado.',
                    'Palabras, bien y mal escritas, caerán desde la parte superior de la pantalla. El jugador debe seleccionar las palabras escritas correctamente.',
                    'Si el jugador elige una palabra incorrecta, perderá una vida.',
                    'No hay penalización por seleccionar una palabra correcta. Sin embargo, si una palabra correcta llega al suelo, el jugador perderá una vida.',
                ],
                gameGoal: 'Mantente en juego el mayor tiempo posible sin perder todas tus vidas.',
                tips: [
                    'Las palabras suelen aparecer en grupos, lo que puede ayudarte a deducir cuáles están escritas correctamente.',
                    'Si pierdes una vida por seleccionar una palabra incorrecta, actúa rápidamente para elegir la correcta antes de que llegue al suelo.',
                ],
            },
        },
    },
    {
        id: 'wordBuilder',
        imgSrc: '/images/games/wordBuilder.png',
        title: {
            en: 'Word Builder',
            es: 'Constructor de palabras',
        },
        description: {
            en: 'It is a challenging word-building game with random letters, promoting language and vocabulary skills in a playful and educational way.',
            es: 'Es un desafiante juego de formación de palabras con letras aleatorias, fomentando habilidades lingüísticas y de vocabulario de manera lúdica y educativa.',
        },
        subtitle: {
            en: 'Dynamic and interactive letter combination game to form creative words.',
            es: 'Juego dinámico e interactivo de combinación de letras para formar palabras creativas.',
        },
        gameRules: {
            en: {
                gameGoal:
                    'The goal is to guess as many words as possible using the displayed letters.',
                howToPlay: [
                    'At the beginning of the game, letters are presented arranged in a circle, and in the center, a number indicates the total possible word combinations.',
                    'Select a letter to have it appear next to a verification button, allowing you to check if the word exists.',
                    'Correctly guessed words will be displayed sequentially one after another.',
                ],
                additionalRules: [
                    'Words with accents will be accepted even if the letter combination does not include accents.',
                    'The game concludes when all possible word combinations have been found.',
                ],
                tips: [
                    'Word combinations with two syllables are possible.',
                    'Keep in mind that single-syllable words are not included among the possible options.',
                ],
            },
            es: {
                gameGoal:
                    'El objetivo es adivinar la mayor cantidad de palabras posibles utilizando las letras que se muestran.',
                howToPlay: [
                    'Al inicio del juego, se presentan letras dispuestas en un círculo, y en el centro, un número indica el total de posibles combinaciones de palabras.',
                    'Selecciona una letra para que aparezca junto a un botón de verificación, que te permite comprobar si la palabra existe.',
                    'Las palabras adivinadas correctamente se mostrarán secuencialmente una detrás de otra.',
                ],
                additionalRules: [
                    'Las palabras con acentos serán aceptadas aunque la combinación de letras no incluya acentos.',
                    'El juego concluye cuando se hayan encontrado todas las combinaciones posibles de palabras.',
                ],
                tips: [
                    'Combinaciones de palabras que tengan dos sílabas es posible.',
                    'Ten en cuenta que entre las opciones posibles, no se incluyen palabras de una sola sílaba.',
                ],
            },
        },
    },
    {
        id: 'wordFinder',
        imgSrc: '/images/games/wordFinder.png',
        title: {
            en: 'Word Finder',
            es: 'Buscador de palabras',
        },
        description: {
            en: 'Search and guess the secret word by guessing letters and their exact location. A stimulating mental challenge that tests your vocabulary and mental agility.',
            es: 'Busca y acierta la palabra secreta adivinando letras y su ubicación exacta. Un desafío mental estimulante que pone a prueba tu vocabulario y agilidad mental.',
        },
        subtitle: {
            en: 'Search and guess the secret word by guessing letters and their exact location.',
            es: 'Busca y acierta la palabra secreta adivinando letras y su ubicación exacta.',
        },
        gameRules: {
            en: {
                gameGoal:
                    'The player must guess the greatest number of secret words within a limited number of attempts for each word and within a limited time.',
                howToPlay: [
                    'The game starts by displaying a series of blank spaces, each representing a letter of the secret word.',
                    'The player enters a word of the same length as the secret word, attempting to guess it.',
                    'After each attempt, the game provides feedback as follows: Green: The letter is in the secret word and in the correct position. Yellow: The letter is in the secret word but in an incorrect position. Red: The letter is not in the secret word.',
                ],
                additionalRules: [
                    'Letters can be repeated in the secret word.',
                    'The game ends when the time runs out.',
                ],
                tips: [
                    'Pay attention to the color clues to adjust your next attempts.',
                    'Use common words for your initial attempts to uncover more letters.',
                ],
            },
            es: {
                gameGoal:
                    'El jugador debe adivinar el mayor número de palabras secretas en un número limitado de intentos por cada palabra y un tiempo limitado.',
                howToPlay: [
                    'El juego comienza mostrando una serie de espacios en blanco, cada uno representando una letra de la palabra secreta.',
                    'El jugador escribe una palabra del mismo largo que la palabra secreta, intentando adivinarla.',
                    'Después de cada intento, el juego proporciona retroalimentación de la siguiente manera: Verde: La letra está en la palabra secreta y en la posición correcta. Amarillo: La letra está en la palabra secreta pero en una posición incorrecta. Rojo: La letra no está en la palabra secreta.',
                ],
                additionalRules: [
                    'Las letras pueden repetirse en la palabra secreta.',
                    'El juego termina cuando se acaba el tiempo.',
                ],
                tips: [
                    'Presta atención a las pistas de color para ajustar tus siguientes intentos.',
                    'Usa palabras comunes para tus primeros intentos y así descubrir más letras.',
                ],
            },
        },
    },
    {
        id: 'definitionMaster',
        imgSrc: '/images/games/definitionMaster.png',
        title: {
            en: 'Master of Definitions',
            es: 'Maestro de las definiciones',
        },
        description: {
            // prettier-ignore
            en: 'It\'s an exciting guessing game in which players compete to find the precise definition of a given word, testing their knowledge and language skills in a challenging and fun environment.',
            es: 'Es un emocionante juego de adivinanzas en el que los jugadores compiten por encontrar la definición precisa de una palabra dada, poniendo a prueba su conocimiento y habilidades lingüísticas en un ambiente desafiante y divertido.',
        },
        subtitle: {
            en: 'It is a competitive game where players guess word definitions.',
            es: 'Es un juego competitivo donde los jugadores adivinan definiciones de palabras.',
        },
        gameRules: {
            en: {
                gameGoal:
                    'The goal is to learn and guess the definitions of as many words as possible.',
                // prettier-ignore
                howToPlay: [
                    'At the beginning of the game, a word is presented along with several possible definitions.',
                    'The player selects the definition they believe is correct. If it\'s correct, it will be highlighted in blue.',
                    'If the definition is incorrect, it will be displayed in red, and the correct word corresponding to that definition will be revealed.',
                ],
                additionalRules: [
                    'Once randomly selected words have been exhausted, you will need to choose another letter to get new words.',
                ],
                tips: [
                    'Sometimes, the word to be guessed may appear in one of the provided definitions.',
                ],
            },
            es: {
                gameGoal:
                    'El objetivo es aprender y adivinar las definiciones de tantas palabras como sea posible.',
                howToPlay: [
                    'Al inicio del juego, se presenta una palabra acompañada de varias definiciones posibles.',
                    'El jugador selecciona la definición que cree correcta. Si es correcta, se resaltará en color azul.',
                    'Si la definición es incorrecta, se mostrará en color rojo, y se revelará la palabra correcta a la que corresponde esa definición.',
                ],
                additionalRules: [
                    'Una vez que se hayan agotado las palabras seleccionadas aleatoriamente, tendrás que elegir otra letra para obtener nuevas palabras.',
                ],
                tips: [
                    'A veces, la palabra a adivinar puede aparecer en una de las definiciones proporcionadas.',
                ],
            },
        },
    },
    {
        id: 'crossWordPuzzle',
        imgSrc: '/images/games/crossWordPuzzle.png',
        title: {
            en: 'Crossword Puzzle',
            es: 'Crucigramas',
        },
        description: {
            en: 'The crossword is an intellectual and fun game where squares on a board are filled to form words that cross both horizontally and vertically, based on given clues, thus stimulating mental agility and knowledge.',
            es: 'El crucigrama es un juego intelectual y divertido donde se rellenan cuadros en un tablero para formar palabras que se cruzan horizontal y verticalmente, basadas en pistas dadas, estimulando así la agilidad mental y el conocimiento.',
        },
        subtitle: {
            en: 'Challenge your mind and enrich your vocabulary with the crossword, an entertaining puzzle.',
            es: 'Desafía tu mente y enriquece tu vocabulario con el crucigrama, un entretenido rompecabezas.',
        },
        gameRules: {
            en: {
                gameGoal:
                    'The goal of the crossword puzzle is to fill in the grid with words based on the given clues, such that all the words intersect correctly and fit the provided definitions.',
                howToPlay: [
                    'Read the clues provided for both across and down entries.',
                    'Fill in the empty squares in the grid with letters to form words that match the clues.',
                    'Ensure that the words intersect correctly at shared letters.',
                ],
                additionalRules: [
                    'Each word must be spelled correctly and fit the length specified by the empty squares in the grid.',
                    'All words should be valid and found in a standard dictionary.',
                ],
                tips: [
                    'Start with the easiest clues to fill in some letters and get a sense of the puzzle.',
                    'Use the intersecting letters to help solve more difficult clues.',
                    'Double-check spelling and word length to ensure accuracy.',
                ],
            },
            es: {
                gameGoal:
                    'El objetivo del crucigrama es llenar la cuadrícula con palabras basadas en las pistas dadas, de manera que todas las palabras se crucen correctamente y se ajusten a las definiciones proporcionadas.',
                howToPlay: [
                    'Lee las pistas proporcionadas para las entradas tanto horizontales como verticales.',
                    'Llena los espacios vacíos en la cuadrícula con letras para formar palabras que coincidan con las pistas.',
                    'Asegúrate de que las palabras se crucen correctamente en las letras compartidas.',
                ],
                additionalRules: [
                    'Cada palabra debe estar escrita correctamente y ajustarse a la longitud especificada por los espacios vacíos en la cuadrícula.',
                    'Todas las palabras deben ser válidas y encontrarse en un diccionario estándar.',
                ],
                tips: [
                    'Comienza con las pistas más fáciles para llenar algunas letras y tener una idea del rompecabezas.',
                    'Utiliza las letras que se cruzan para ayudar a resolver las pistas más difíciles.',
                    'Verifica la ortografía y la longitud de las palabras para asegurar la precisión.',
                ],
            },
        },
    },
];

export { GamesTranslations, GamesRoutes };
