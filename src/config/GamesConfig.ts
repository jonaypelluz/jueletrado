import { CardInfo } from '@models/types';

const GamesConfig: CardInfo[] = [
    {
        id: 'SpellTower',
        link: '/games/spelltower',
        imgSrc: '/images/games/SpellTower.png',
        title: 'La torre de la ortografía',
        description:
            'Un juego donde construyes torres, añadiendo un bloque por cada palabra bien escrita. El juego desafía a los jugadores a construir la torre más alta que puedan escribiendo o eligiendo correctamente una serie de palabras donde la ortografía debe ser la correcta.',
        subtitle:
            'Un juego donde construyes torres, añadiendo un bloque por cada palabra bien escrita.',
    },
    {
        id: 'WordsRain',
        link: '/games/wordsrain',
        imgSrc: '/images/games/WordsRain.png',
        title: 'Lluvia de palabras',
        description:
            'Un juego donde debes evitar que las palabras bien escritas caigan, ya que las mal escritas harán que pierdas. Debes durar el mayor tiempo posible; quien dure más tiempo, gana.',
        subtitle: 'Un juego dónde hay que evitar que las palabras bien escritas caigan o perderás.',
    },
    {
        id: 'WordBuilder',
        link: '/games/wordbuilder',
        imgSrc: '/images/games/WordBuilder.png',
        title: 'Constructor de palabras',
        description:
            'Es un desafiante juego de formación de palabras con letras aleatorias, fomentando habilidades lingüísticas y de vocabulario de manera lúdica y educativa',
        subtitle:
            'Juego dinámico e interactivo de combinación de letras para formar palabras creativas.',
    },
    {
        id: 'WordFinder',
        link: '/games/wordfinder',
        imgSrc: '/images/games/WordFinder.png',
        title: 'Buscador de palabras',
        description:
            'Busca y acierta la palabra secreta adivinando letras y su ubicación exacta. Un desafío mental estimulante que pone a prueba tu vocabulario y agilidad mental.',
        subtitle: 'Busca y acierta la palabra secreta adivinando letras y su ubicación exacta.',
    },
];

export default GamesConfig;
