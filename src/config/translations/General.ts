import { Translations } from '@models/interfaces';
import { LoadingMessagesType } from '@models/types';

const LoadingMessages: LoadingMessagesType = {
    es: [
        'Oops, las letras se han rebelado. ¡Algo ha ido mal!',
        'Parece que nuestras palabras están jugando al escondite. ¡Error detectado!',
        '¡Vaya! Alguien derramó café en el código. Estamos arreglándolo.',
        'Las tildes se han escapado, y con ellas, la estabilidad del sistema. Error en proceso.',
        'Estamos experimentando una tormenta de ideas... y de errores. Por favor, espera.',
        'Error en el sistema. Las letras están bailando salsa en vez de trabajar.',
        'Algo se ha torcido... posiblemente sean las eses. Trabajando para solucionarlo.',
        'Nuestros puntos y comas hicieron una pausa demasiado larga. Error encontrado.',
        'El alfabeto ha decidido tomarse un descanso. Error inesperado.',
        'Las palabras están haciendo huelga. Nos disculpamos por este error técnico.',
    ],
    en: [
        'Oops, the letters have rebelled. Something has gone wrong!',
        'It seems our words are playing hide and seek. Error detected!',
        // prettier-ignore
        'Oops! Someone spilled coffee on the code. We\'re fixing it.',
        // prettier-ignore
        'The accent marks have escaped, and with them, the system\'s stability. Error in process.',
        'We are experiencing a brainstorm... and errors. Please wait.',
        'System error. The letters are dancing salsa instead of working.',
        // prettier-ignore
        'Something has gone wrong... possibly the S\'s. Working to solve it.',
        'Our semicolons took a pause that was too long. Error found.',
        'The alphabet has decided to take a break. Unexpected error.',
        'The words are on strike. We apologize for this technical error.',
    ],
};

const GeneralTranslations: Translations = {
    en: {
        errorTitle: 'Ops!',
        errorDescription: 'Words not found!',
        errorMessageTitle: 'Go to the beginning to look for the letters',
        // prettier-ignore
        errorMessageDescription: 'If the letters are not found and the error continues to occur, let\'s try to delete all the downloaded content.',
        errorMessageAction: 'Delete downloaded content',
        gamesAllGames: 'All games',
        gameCheckWord: 'Check word',
        // prettier-ignore
        gameMissed: 'You didn\'t see',
        gamePlay: 'Start',
        gameRulesAdditionalRules: 'Additional rules:',
        gameRulesGoaloftheGame: 'Goal of the Game:',
        gameRulesHowtoPlay: 'How to Play:',
        gameRulesRules: 'Rules:',
        gameRulesTips: 'Tips:',
        gameSeconds: 'seconds',
        gameQuizWord: 'The definition of {quizWord} is:',
        gameQuizWordChoose: 'Choose another letter',
        gameQuizWordNextWord: 'Next word',
        gameWordBuilderGenerate: 'Generate other letters',
        headerHome: 'Home',
        headerGames: 'Games',
        headerRules: 'Spelling Rules',
        headerRulesDescription:
            'Here are some essential rules for writing correctly, including punctuation, grammar, and the proper use of words.',
        headerWordOfTheDay: 'Word of the Day:',
        headerWordOfTheDayUrl: 'https://www.dictionary.com/browse/',
        homeLevel: 'Level:',
        homeChoseLevel: 'Choose the level',
        incorrectWords: 'Incorrect words:',
        levelBeginner: 'Beginner',
        levelIntermediate: 'Intermediate',
        levelAdvanced: 'Advanced',
        mainTitle: 'Jueletrado',
        mainDescription: 'Where playing and learning to write well go hand in hand',
    },
    es: {
        errorTitle: '¡Ops!',
        errorDescription: 'Lo sentimos, ¡no encontramos las palabras que buscas!',
        errorMessageTitle: 'Ir al inicio a buscar las letras',
        errorMessageDescription:
            'Si no se encuentran las letras y el error sigue ocurriendo probemos a borrar todo el contenido descargado.',
        errorMessageAction: 'Borrar contenido descargado',
        gamesAllGames: 'Todos los juegos',
        gameCheckWord: 'Comprobar palabra',
        gameMissed: 'No viste',
        gamePlay: 'Jugar',
        gameRulesAdditionalRules: 'Reglas Adicionales:',
        gameRulesGoaloftheGame: 'Objetivo del Juego:',
        gameRulesHowtoPlay: 'Cómo Jugar:',
        gameRulesRules: 'Reglas',
        gameRulesTips: 'Consejos:',
        gameSeconds: 'segundos restantes',
        gameQuizWord: 'La definición de {quizWord} es:',
        gameQuizWordChoose: 'Elegir otra letra',
        gameQuizWordNextWord: 'Siguiente palabra',
        gameWordBuilderGenerate: 'Generar otras letras',
        headerHome: 'Inicio',
        headerGames: 'Juegos',
        headerRules: 'Normas de ortografía',
        headerRulesDescription:
            'Reglas esenciales para escribir correctamente, incluyendo puntuación, gramática y uso de palabras.',
        headerWordOfTheDay: 'Palabra del día:',
        headerWordOfTheDayUrl: 'https://dle.rae.es/',
        homeLevel: 'Nivel:',
        homeChoseLevel: 'Elige el nivel',
        incorrectWords: 'Palabras incorrectas:',
        levelBeginner: 'Principiante',
        levelIntermediate: 'Intermedio',
        levelAdvanced: 'Avanzado',
        mainTitle: 'Jueletrado',
        mainDescription: 'Donde jugar y aprender a escribir bien van de la mano',
    },
};

export { GeneralTranslations, LoadingMessages };
