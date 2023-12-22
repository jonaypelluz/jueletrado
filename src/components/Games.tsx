import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Col, Row } from 'antd';

const { Meta } = Card;

type Game = {
    link: string;
    imgSrc: string;
    title: string;
    description: string;
};

const games: Game[] = [
    {
        link: '/games/spelltower',
        imgSrc: '/games/SpellTower.png',
        title: 'La torre de la ortografía',
        description:
            'Un juego donde construyes torres, añadiendo un bloque por cada palabra bien escrita.',
    },
    {
        link: '/games/wordsrain',
        imgSrc: '/games/WordsRain.png',
        title: 'Lluvia de palabras',
        description:
            'Un juego dónde hay que evitar que las palabras bien escritas caigan o perderás.',
    },
    {
        link: '/games/wordbuilder',
        imgSrc: '/games/WordBuilder.png',
        title: 'Constructor de palabras',
        description: 'Juego dinámico de combinación de letras para formar palabras creativas.',
    },
];

const GamesList: React.FC = () => {
    return (
        <>
            {games.map((game, index) => (
                <Col key={index} xs={12} sm={8} md={8} lg={6}>
                    <Link to={game.link}>
                        <Card hoverable cover={<img alt={game.title} src={game.imgSrc} />}>
                            <Meta title={game.title} description={game.description} />
                        </Card>
                    </Link>
                </Col>
            ))}
        </>
    );
};

const Games: React.FC = () => {
    return (
        <div className="content-wrapper">
            <Row gutter={[16, 16]}>
                <GamesList />
            </Row>
        </div>
    );
};

export default Games;
