import { ContentPreConfig, Translations } from '@models/interfaces';

const ContentRoutes: Translations = {
    en: {
        home: '/en/',
        games: '/en/games',
        spellingRules: '/en/spelling-rules',
        spelling: '/en/spelling-rules/spelling',
        accentuation: '/en/spelling-rules/accentuation',
        orthography: '/en/spelling-rules/orthography',
        privacy: '/en/privacy',
        cookies: '/en/cookies',
    },
    es: {
        home: '/',
        games: '/juegos',
        spellingRules: '/reglas-de-ortografia',
        spelling: '/reglas-de-ortografia/deletreo',
        accentuation: '/reglas-de-ortografia/acentuacion',
        orthography: '/reglas-de-ortografia/ortografia',
        privacy: '/politica-de-privacidad',
        cookies: '/politica-de-cookies',
    },
};

const ContentTranslations: ContentPreConfig = {
    en: [
        {
            id: 'spelling',
            imgSrc: '/images/Spelling.png',
            title: 'Punctuation marks',
            description:
                'Symbols used in writing to clarify the meaning and structure of a text, indicating pauses, intonation, and organization. They include periods, commas, question and exclamation marks, parentheses, among others, and each one has a specific purpose in grammar and syntax.',
            subtitle:
                'Symbols that clarify the meaning and structure of a text, including punctuation marks.',
        },
        {
            id: 'accentuation',
            imgSrc: '/images/Accentuation.png',
            title: 'Accentuation',
            description:
                'Refers to placing accent marks on words to mark the stressed syllable or change their meaning. Accentuation follows specific rules in each language and can vary depending on the grammatical category of the word, as in the cases of monosyllables, esdrújulas, or interrogative words.',
            subtitle:
                'Placement of accent marks on syllables to indicate emphasis or change a word\'s meaning.',
        },
        {
            id: 'orthography',
            imgSrc: '/images/Orthography.png',
            title: 'Orthography',
            description:
                'Involves the rules and principles that govern the correct use of letters in writing a language. It includes rules on how words are written, the correct use of uppercase and lowercase letters, and the rules for correctly forming words and sentences, such as the use of "b" and "v", "g" and "j", among others.',
            subtitle:
                'Rules for the correct use of letters in writing, including capitalization and spelling.',
        },
    ],
    es: [
        {
            id: 'spelling',
            imgSrc: '/images/Spelling.png',
            title: 'Los signos de puntuación',
            description:
                'Son símbolos usados en la escritura para clarificar el sentido y la estructura del texto, indicando pausas, entonación, y organización. Incluyen puntos, comas, signos de interrogación y exclamación, paréntesis, entre otros, y cada uno tiene un propósito específico en la gramática y la sintaxis.',
            subtitle:
                'Símbolos que aclaran sentido y estructura del texto, incluyendo signos de puntuación.',
        },
        {
            id: 'accentuation',
            imgSrc: '/images/Accentuation.png',
            title: 'Acentuación',
            description:
                'Se refiere a la colocación de acentos (tildes) en las palabras para marcar la sílaba tónica o modificar el significado. La acentuación sigue reglas específicas en cada idioma y puede cambiar según la categoría gramatical de la palabra, como en los casos de monosílabos, esdrújulas o palabras interrogativas.',
            subtitle:
                'Colocación de acentos en sílabas para indicar énfasis o cambiar significado en palabras.',
        },
        {
            id: 'orthography',
            imgSrc: '/images/Orthography.png',
            title: 'Ortografía',
            description:
                'Involucra las reglas y principios que rigen el correcto uso de las letras en la escritura de un idioma. Incluye normas sobre cómo se escriben las palabras, el uso correcto de las mayúsculas y minúsculas, y las reglas para la correcta formación de palabras y oraciones, como la colocación de "b" y "v", "g" y "j", entre otras.',
            subtitle:
                'Reglas para el uso correcto de letras en la escritura, incluyendo mayúsculas y ortografía.',
        },
    ],
};

export { ContentTranslations, ContentRoutes };
