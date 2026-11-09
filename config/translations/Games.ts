import { GamePreConfig, Translations } from '@models/interfaces';

const GamesRoutes: Translations = {
    es: {
        spellTower: '/juegos/la-torre-de-la-ortografia',
        wordsRain: '/juegos/lluvia-de-palabras',
        wordBuilder: '/juegos/constructor-de-palabras',
        wordFinder: '/juegos/buscador-de-palabras',
        definitionMaster: '/juegos/maestro-de-las-definiciones',
        crossWordPuzzle: '/juegos/crucigramas',
        accentFixer: '/juegos/corregidor-de-acentos',
        letterMatcher: '/juegos/maestro-de-letras',
        syllableSplitter: '/juegos/separador-de-silabas',
        spellingBee: '/juegos/abeja-deletreadora',
    },
    en: {
        spellTower: '/en/games/spell-tower',
        wordsRain: '/en/games/words-rain',
        wordBuilder: '/en/games/word-builder',
        wordFinder: '/en/games/word-finder',
        definitionMaster: '/en/games/definition-master',
        crossWordPuzzle: '/en/games/crossword-puzzles',
        // ES-only game: no EN page exists, route points at the ES page and is unreachable via the EN UI.
        accentFixer: '/juegos/corregidor-de-acentos',
        letterMatcher: '/en/games/letter-matcher',
        // ES-only game: no EN page exists, route points at the ES page and is unreachable via the EN UI.
        syllableSplitter: '/juegos/separador-de-silabas',
        spellingBee: '/en/games/spelling-bee',
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
            en: 'Pick the correctly spelled word from the options to add a block to your tower. Practise tricky spellings.',
            es: 'Elige la palabra bien escrita entre las opciones y suma un bloque a tu torre. Practica b/v, g/j, h, ll/y y tildes.',
        },
        subtitle: {
            en: 'Pick the correctly spelled word to grow your tower.',
            es: 'Elige la palabra bien escrita y haz crecer tu torre.',
        },
        gameRules: {
            en: {
                gameGoal: 'Build the tallest tower you can in 30 seconds.',
                howToPlay: [
                    'Press Start: you have 30 seconds and up to 15 words.',
                    'Each round shows the correct word, usually next to one or two misspelled versions.',
                    'Tap the correctly spelled word to add a block to your tower.',
                    'A wrong tap removes a block and the correct word lights up in green.',
                ],
                additionalRules: [
                    'The tower never drops below zero blocks.',
                    'The game ends when time runs out or after the 15th word. You then see the words you got wrong.',
                    'Misspelled versions swap letters that are easy to confuse and are never real words.',
                ],
                tips: [
                    'Read the whole word before tapping: the mistake is often a single letter.',
                    'Every miss costs a block, so a careful answer beats a fast wrong one.',
                ],
            },
            es: {
                gameGoal: 'Construye la torre más alta que puedas en 30 segundos.',
                howToPlay: [
                    'Pulsa Jugar: tienes 30 segundos y hasta 15 palabras.',
                    'En cada ronda aparece la palabra bien escrita, normalmente junto a una o dos versiones mal escritas.',
                    'Pulsa la palabra bien escrita para sumar un bloque a tu torre.',
                    'Si fallas, pierdes un bloque y la palabra correcta se marca en verde.',
                ],
                additionalRules: [
                    'La torre nunca baja de cero bloques.',
                    'La partida acaba al agotarse el tiempo o tras la palabra 15. Después verás las palabras que fallaste.',
                    'Las versiones mal escritas cambian letras que se confunden con facilidad o la tilde, y nunca son palabras reales.',
                ],
                tips: [
                    'Lee la palabra entera antes de pulsar: el error suele estar en una sola letra.',
                    'Cada fallo cuesta un bloque: acertar con calma vale más que fallar rápido.',
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
            en: 'Tap the correctly spelled words before they hit the ground and let the misspelled ones fall. Spelling at speed.',
            es: 'Pulsa las palabras bien escritas antes de que lleguen al suelo y deja caer las mal escritas. Ortografía con rapidez.',
        },
        subtitle: {
            en: 'Catch the correctly spelled words before they land.',
            es: 'Atrapa las palabras bien escritas antes de que caigan.',
        },
        gameRules: {
            en: {
                gameGoal: 'Last as long as you can without losing your 15 lives.',
                howToPlay: [
                    'Correctly and incorrectly spelled words fall from the top of the screen.',
                    'Tap the correctly spelled words to clear them. They do not score points.',
                    'Tapping a misspelled word costs you a life.',
                    'A correctly spelled word that reaches the ground also costs a life. Misspelled words can fall safely.',
                ],
                additionalRules: [
                    'Every 10 seconds the level goes up and words fall faster. Every 5 levels they also appear more often.',
                    'The game ends when you lose all 15 lives. You then see the words you tapped wrongly or let fall.',
                ],
                tips: [
                    'A word and its misspelled versions usually fall close together: compare them.',
                    'Do not tap just to tap: letting a misspelled word fall costs nothing.',
                ],
            },
            es: {
                gameGoal: 'Aguanta el mayor tiempo posible sin perder tus 15 vidas.',
                howToPlay: [
                    'Desde arriba caen palabras bien y mal escritas.',
                    'Pulsa las palabras bien escritas para quitarlas. No suman puntos.',
                    'Pulsar una palabra mal escrita te quita una vida.',
                    'Si una palabra bien escrita llega al suelo, también pierdes una vida. Las mal escritas pueden caer sin problema.',
                ],
                additionalRules: [
                    'Cada 10 segundos subes de nivel y las palabras caen más rápido. Cada 5 niveles, además, aparecen más a menudo.',
                    'La partida termina al perder las 15 vidas. Después verás qué palabras pulsaste mal o dejaste caer.',
                ],
                tips: [
                    'Una palabra y sus versiones mal escritas suelen caer juntas: compáralas.',
                    'No pulses por pulsar: dejar caer una palabra mal escrita no cuesta nada.',
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
            en: 'Combine four consonants and two vowels into dictionary words. No timer: grow your vocabulary at your own pace.',
            es: 'Combina cuatro consonantes y dos vocales para formar palabras del diccionario. Sin tiempo: amplía tu vocabulario.',
        },
        subtitle: {
            en: 'Make as many words as you can from six letters.',
            es: 'Forma todas las palabras que puedas con seis letras.',
        },
        gameRules: {
            en: {
                gameGoal: 'Find every word you can make with your six letters.',
                howToPlay: [
                    'Press Start to get six letters in a circle. The number in the middle shows how many words are left to find.',
                    'Tap letters to build a word. You can use each letter as many times as you like.',
                    'Delete removes the last letter, Clear empties the word and Check word tests it.',
                    'Each word you find is added to the list and the number goes down.',
                ],
                additionalRules: [
                    'Words must have at least two letters.',
                    'There is no time limit and no end: press Generate other letters for a new set.',
                ],
                tips: [
                    'Start with short two- and three-letter words, then make them longer.',
                    'Try changing one letter of a word you have already found.',
                ],
            },
            es: {
                gameGoal: 'Encuentra todas las palabras que puedas formar con tus seis letras.',
                howToPlay: [
                    'Pulsa Jugar para recibir seis letras en círculo. El número del centro indica cuántas palabras quedan por encontrar.',
                    'Pulsa letras para formar una palabra. Puedes usar cada letra tantas veces como quieras.',
                    'Borrar quita la última letra, Limpiar vacía la palabra y Comprobar palabra la valida.',
                    'Cada palabra encontrada se añade a la lista y el número baja.',
                ],
                additionalRules: [
                    'Las palabras deben tener al menos dos letras.',
                    'No hace falta escribir la tilde: si la palabra existe con tilde, se acepta.',
                    'No hay tiempo ni final: pulsa Generar otras letras para cambiar de letras.',
                ],
                tips: [
                    'Empieza por palabras cortas de dos o tres letras y luego alárgalas.',
                    'Prueba a cambiar una sola letra de una palabra que ya hayas encontrado.',
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
            en: 'Guess secret words letter by letter with green, yellow and red clues. You have 3 minutes for up to 10 words.',
            es: 'Adivina palabras secretas letra a letra con pistas verdes, amarillas y rojas. Tienes 3 minutos para hasta 10 palabras.',
        },
        subtitle: {
            en: 'Guess the secret word with colour clues.',
            es: 'Adivina la palabra secreta con pistas de colores.',
        },
        gameRules: {
            en: {
                gameGoal: 'Guess as many secret words as you can in 3 minutes.',
                howToPlay: [
                    'You see one box for each letter of the secret word.',
                    'Type a word in the boxes. It is checked as soon as you fill the last one.',
                    'Green: right letter, right place. Yellow: the letter is in the word, elsewhere. Red: not in the word.',
                    'You get as many attempts as the word has letters. Green letters stay in place for your next attempt.',
                ],
                additionalRules: [
                    'The game ends when time runs out, even if you still have attempts left.',
                    'Letters can repeat in the secret word.',
                ],
                tips: [
                    'Start with words that use different vowels to uncover more letters.',
                    'Use the yellow letters: try them in a different position.',
                ],
            },
            es: {
                gameGoal: 'Adivina el mayor número de palabras secretas en 3 minutos.',
                howToPlay: [
                    'Verás una casilla por cada letra de la palabra secreta.',
                    'Escribe una palabra en las casillas. Se comprueba sola al rellenar la última.',
                    'Verde: letra en su sitio. Amarillo: la letra está en la palabra, en otro sitio. Rojo: no está.',
                    'Tienes tantos intentos como letras tiene la palabra. Las letras en verde se mantienen en el siguiente intento.',
                ],
                additionalRules: [
                    'La partida termina cuando se acaba el tiempo, aunque te queden intentos.',
                    'No hace falta escribir tildes: una «a» vale por «á».',
                    'Las letras pueden repetirse en la palabra secreta.',
                ],
                tips: [
                    'Empieza con palabras que tengan vocales distintas para descubrir más letras.',
                    'Aprovecha las letras amarillas: pruébalas en otra posición.',
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
            en: 'Choose a letter and match 10 words to their definitions, picking from five options each time. Learn new words.',
            es: 'Elige una letra y acierta la definición de 10 palabras entre cinco opciones cada vez. Aprende palabras nuevas.',
        },
        subtitle: {
            en: 'Pick the right definition for each word.',
            es: 'Elige la definición correcta de cada palabra.',
        },
        gameRules: {
            en: {
                gameGoal: 'Match as many words as you can to their correct definition.',
                howToPlay: [
                    'Press Start and choose a letter.',
                    'You see a word and five definitions: tap the correct one.',
                    'A right answer turns blue and scores a point.',
                    'A wrong answer turns red and shows which word it belongs to. The correct one turns blue.',
                    'Press Next word. After 10 words you see your score.',
                ],
                additionalRules: [
                    'Wrong answers do not subtract points.',
                    'To keep playing, press Choose another letter. The letters J, K, L, X and Z are not available.',
                ],
                tips: [
                    'The wrong options are definitions of the other words in the round, so they can help you later.',
                ],
            },
            es: {
                gameGoal: 'Acierta la definición del mayor número de palabras posible.',
                howToPlay: [
                    'Pulsa Jugar y elige una letra.',
                    'Verás una palabra y cinco definiciones: pulsa la correcta.',
                    'Si aciertas, se marca en azul y sumas un punto.',
                    'Si fallas, tu opción se marca en rojo con la palabra a la que pertenece, y la correcta en azul.',
                    'Pulsa Siguiente palabra. Tras 10 palabras verás tu puntuación.',
                ],
                additionalRules: [
                    'Fallar no resta puntos.',
                    'Para seguir jugando, pulsa Elegir otra letra. La letra X no está disponible.',
                ],
                tips: [
                    'Las opciones incorrectas son definiciones de las otras palabras de la partida: te servirán más adelante.',
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
            en: 'Fill the grid with the words that match each definition. Wrong letters turn red, so you can fix them as you go.',
            es: 'Rellena la cuadrícula con las palabras de cada definición. Las letras incorrectas se marcan en rojo al momento.',
        },
        subtitle: {
            en: 'Solve crosswords from dictionary definitions.',
            es: 'Resuelve crucigramas a partir de definiciones.',
        },
        gameRules: {
            en: {
                gameGoal: 'Complete the crossword by filling every square correctly.',
                howToPlay: [
                    'Press Start to generate a new crossword.',
                    'Each definition in the list has a colour. Its word uses the same colour in the grid.',
                    'Type one letter per square. A wrong letter turns red.',
                    'When a word is complete, its definition is crossed out.',
                    'The crossword is done when every square is correct.',
                ],
                additionalRules: [
                    'The first letter of one word is already filled in.',
                    'Grey squares are shared by two words.',
                    'Higher levels have more words.',
                ],
                tips: [
                    'Start with the definitions you find easiest and use the crossing letters for the hard ones.',
                ],
            },
            es: {
                gameGoal: 'Completa el crucigrama rellenando bien todas las casillas.',
                howToPlay: [
                    'Pulsa Jugar para generar un crucigrama nuevo.',
                    'Cada definición de la lista tiene un color. Su palabra usa ese mismo color en la cuadrícula.',
                    'Escribe una letra en cada casilla. Si es incorrecta, se marca en rojo.',
                    'Al completar una palabra, su definición se tacha.',
                    'El crucigrama está resuelto cuando todas las casillas son correctas.',
                ],
                additionalRules: [
                    'Las palabras se escriben sin tildes.',
                    'La primera letra de una palabra ya viene puesta. Las casillas grises son compartidas por dos palabras.',
                    'Cuanto más alto es el nivel, más palabras tiene el crucigrama.',
                ],
                tips: [
                    'Empieza por las definiciones más fáciles y usa las letras que se cruzan para las difíciles.',
                ],
            },
        },
    },
    {
        id: 'accentFixer',
        imgSrc: '/images/games/accentFixer.png',
        availableLocales: ['es'],
        title: {
            en: 'Accent Fixer',
            es: 'Corregidor de acentos',
        },
        description: {
            en: 'Tap the vowel that should carry the accent mark, or say it has none. Practise agudas, llanas and esdrújulas.',
            es: 'Pulsa la vocal que debería llevar tilde, o indica que no lleva. Repasa agudas, llanas y esdrújulas.',
        },
        subtitle: {
            en: 'Find the vowel that takes the accent mark.',
            es: 'Encuentra la vocal que lleva la tilde.',
        },
        gameRules: {
            en: {
                gameGoal: 'Find where the accent mark goes in as many words as you can in 60 seconds.',
                howToPlay: [
                    'Press Start: you have 60 seconds and up to 10 words.',
                    'A word appears without its accent mark.',
                    'Tap the vowel that should carry it, or "No accent mark" if it has none.',
                    'Each correct answer adds a point and each mistake subtracts one. Your score never goes below zero.',
                ],
                additionalRules: [
                    'After a mistake, the correct answer lights up in green.',
                    'At the end you see the words you got wrong.',
                ],
                tips: [
                    'Agudas take an accent mark when they end in a vowel, n or s.',
                    'Llanas take one when they do not end in a vowel, n or s.',
                    'Esdrújulas always carry an accent mark.',
                ],
            },
            es: {
                gameGoal: 'Acierta dónde va la tilde en el mayor número de palabras en 60 segundos.',
                howToPlay: [
                    'Pulsa Jugar: tienes 60 segundos y hasta 10 palabras.',
                    'Aparece una palabra sin tilde.',
                    'Pulsa la vocal que debería llevarla, o «No lleva tilde» si no lleva.',
                    'Cada acierto suma un punto y cada fallo resta uno. La puntuación nunca baja de cero.',
                ],
                additionalRules: [
                    'Si fallas, la respuesta correcta se marca en verde.',
                    'Al final verás la lista de palabras que fallaste.',
                ],
                tips: [
                    'Las agudas llevan tilde si terminan en vocal, n o s.',
                    'Las llanas llevan tilde si no terminan en vocal, n o s.',
                    'Las esdrújulas siempre llevan tilde.',
                ],
            },
        },
    },
    {
        id: 'letterMatcher',
        imgSrc: '/images/games/letterMatcher.png',
        title: {
            en: 'Letter Master',
            es: 'Maestro de letras',
        },
        description: {
            en: 'A word appears with a gap: pick the letters that complete it from two options. Practise sounds that are easy to mix up.',
            es: 'Aparece una palabra con un hueco: elige entre dos opciones la que la completa. Practica b/v, g/j, h, ll/y y más.',
        },
        subtitle: {
            en: 'Complete the word with the right letters.',
            es: 'Completa la palabra con las letras correctas.',
        },
        gameRules: {
            en: {
                gameGoal: 'Complete as many words as you can correctly in 60 seconds.',
                howToPlay: [
                    'Press Start: you have 60 seconds and up to 10 words.',
                    'A word appears with a gap and two options.',
                    'Tap the option that completes it. "(nothing)" means no letter is missing.',
                    'Each correct answer adds a point and each mistake subtracts one. Your score never goes below zero.',
                ],
                additionalRules: [
                    'The gap can be one letter or several.',
                    'At the end you see the words you got wrong and their correct spelling.',
                ],
                tips: [
                    'Think of words in the same family: they keep the same tricky letters.',
                ],
            },
            es: {
                gameGoal: 'Completa bien el mayor número de palabras en 60 segundos.',
                howToPlay: [
                    'Pulsa Jugar: tienes 60 segundos y hasta 10 palabras.',
                    'Aparece una palabra con un hueco y dos opciones.',
                    'Pulsa la opción que la completa. «(nada)» significa que no falta ninguna letra.',
                    'Cada acierto suma un punto y cada fallo resta uno. La puntuación nunca baja de cero.',
                ],
                additionalRules: [
                    'El hueco puede ser de una letra o de varias, como ll, rr o gu.',
                    'Al final verás las palabras que fallaste y cómo se escriben.',
                ],
                tips: [
                    'Piensa en palabras de la misma familia: si «haber» lleva h, «habrá» también.',
                ],
            },
        },
    },
    {
        id: 'syllableSplitter',
        imgSrc: '/images/games/syllableSplitter.png',
        availableLocales: ['es'],
        title: {
            en: 'Syllable Splitter',
            es: 'Separador de sílabas',
        },
        description: {
            en: 'Tap the gaps between letters to split the Spanish word into syllables, then check your answer.',
            es: 'Toca los huecos entre letras para separar la palabra en sílabas y comprueba si aciertas.',
        },
        subtitle: {
            en: 'Split the word into syllables.',
            es: 'Divide la palabra en sílabas.',
        },
        gameRules: {
            en: {
                gameGoal: 'Split as many words as possible into their correct syllables.',
                howToPlay: [
                    'A word appears with its letters separated by gaps.',
                    'Tap a gap to place a syllable divider; tap it again to remove it.',
                    'Press "Check" to see if your split is correct, then "Next" to continue.',
                    'Each correct word adds one point; mistakes do not subtract.',
                ],
                additionalRules: [
                    'A round has up to 10 words and no time limit.',
                ],
                tips: [
                    'A single consonant between two vowels goes with the next syllable.',
                    'Ch, ll and rr are never split.',
                    'An accented í or ú is split from the vowel next to it: rí-o.',
                ],
            },
            es: {
                gameGoal: 'Separa en sílabas correctamente el mayor número de palabras posible.',
                howToPlay: [
                    'Aparecerá una palabra con huecos entre sus letras.',
                    'Toca un hueco para poner un divisor de sílaba; vuelve a tocarlo para quitarlo.',
                    'Pulsa "Comprobar" para ver si has acertado y "Siguiente" para continuar.',
                    'Cada palabra bien separada suma un punto; los fallos no restan.',
                ],
                additionalRules: [
                    'Cada partida tiene hasta 10 palabras y no hay límite de tiempo.',
                ],
                tips: [
                    'Una consonante entre dos vocales va con la sílaba siguiente.',
                    'La ch, la ll y la rr nunca se separan.',
                    'La í y la ú con tilde se separan de la vocal de al lado: rí-o.',
                ],
            },
        },
    },
    {
        id: 'spellingBee',
        imgSrc: '/images/games/spellingBee.png',
        title: {
            en: 'Spelling Bee',
            es: 'Abeja deletreadora',
        },
        description: {
            en: 'Read a definition and type the whole word from memory. Practise spelling without multiple choice.',
            es: 'Te damos una definición y tú escribes la palabra completa, con sus tildes. Practica la ortografía de memoria.',
        },
        subtitle: {
            en: 'Read the definition and spell the word correctly.',
            es: 'Lee la definición y escribe la palabra sin errores.',
        },
        gameRules: {
            en: {
                gameGoal: 'Spell all 5 words correctly to score up to 15 points.',
                howToPlay: [
                    'Read the definition, the word type and how many letters the word has.',
                    'Type the word and press Check word or Enter.',
                    'You have 3 attempts: 3 points on the first, 2 on the second, 1 on the third.',
                    'Each miss gives you a hint: first the initial letter, then the last one. After the third miss the word is shown.',
                ],
                additionalRules: [
                    'If only the accent marks are wrong, you get one free retry per word.',
                ],
                tips: [
                    'Use the word type to tell nouns, verbs and adjectives apart.',
                ],
            },
            es: {
                gameGoal: 'Escribe correctamente las 5 palabras para conseguir hasta 15 puntos.',
                howToPlay: [
                    'Lee la definición, el tipo de palabra y cuántas letras tiene.',
                    'Escribe la palabra y pulsa Comprobar palabra o Intro.',
                    'Tienes 3 intentos: 3 puntos al primero, 2 al segundo, 1 al tercero.',
                    'Cada fallo te da una pista: primero la letra inicial, luego la final. Al tercer fallo se muestra la palabra.',
                ],
                additionalRules: [
                    'Si solo te equivocas en las tildes o la diéresis, tienes un reintento gratis por palabra.',
                ],
                tips: [
                    'Fíjate en el tipo de palabra: te ayuda a saber si es nombre, verbo o adjetivo.',
                ],
            },
        },
    },
];

export { GamesTranslations, GamesRoutes };
