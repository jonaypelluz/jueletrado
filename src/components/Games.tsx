import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Col, Row } from 'antd';
import { GamesRoutes } from '@config/translations/Games';
import { createAllGamesConfig } from '@hooks/useGamesConfig';
import { CardInfo } from '@models/types';
import { useWordsContext } from '@store/WordsContext';

const { Meta } = Card;

const GamesList: React.FC = () => {
    const { locale } = useWordsContext();
    const gamesConfig = createAllGamesConfig(locale);

    const filteredGamesConfig = gamesConfig
        ? gamesConfig.filter((game: CardInfo) => GamesRoutes[locale][game.id] !== undefined)
        : [];

    return (
        <>
            {filteredGamesConfig.length > 0 &&
                filteredGamesConfig.map((game: CardInfo, index: number) => (
                    <Col key={index} xs={12} sm={8} md={8} lg={6}>
                        <Link to={game.link}>
                            <Card hoverable cover={<img alt={game.title} src={game.imgSrc} />}>
                                <Meta title={game.title} description={game.subtitle} />
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
