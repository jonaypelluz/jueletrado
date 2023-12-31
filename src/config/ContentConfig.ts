import { CardInfo } from '@models/types';

const ContentConfig: CardInfo[] = [
    {
        id: 'Spelling',
        link: '/spelling-rules/spelling',
        imgSrc: '/images/Spelling.png',
        title: 'Los signos de puntuación',
        description:
            'Son símbolos usados en la escritura para clarificar el sentido y la estructura del texto, indicando pausas, entonación, y organización. Incluyen puntos, comas, signos de interrogación y exclamación, paréntesis, entre otros, y cada uno tiene un propósito específico en la gramática y la sintaxis.',
        subtitle:
            'Símbolos que aclaran sentido y estructura del texto, incluyendo signos de puntuación.',
    },
    {
        id: 'Accentuation',
        link: '/spelling-rules/accentuation',
        imgSrc: '/images/Accentuation.png',
        title: 'Acentuación',
        description:
            'Se refiere a la colocación de acentos (tildes) en las palabras para marcar la sílaba tónica o modificar el significado. La acentuación sigue reglas específicas en cada idioma y puede cambiar según la categoría gramatical de la palabra, como en los casos de monosílabos, esdrújulas o palabras interrogativas.',
        subtitle:
            'Colocación de acentos en sílabas para indicar énfasis o cambiar significado en palabras.',
    },
    {
        id: 'Orthography',
        link: '/spelling-rules/orthography',
        imgSrc: '/images/Orthography.png',
        title: 'Ortografía',
        description:
            'Involucra las reglas y principios que rigen el correcto uso de las letras en la escritura de un idioma. Incluye normas sobre cómo se escriben las palabras, el uso correcto de las mayúsculas y minúsculas, y las reglas para la correcta formación de palabras y oraciones, como la colocación de "b" y "v", "g" y "j", entre otras.',
        subtitle:
            'Reglas para el uso correcto de letras en la escritura, incluyendo mayúsculas y ortografía.',
    },
];

export default ContentConfig;
