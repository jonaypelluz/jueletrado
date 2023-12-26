import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Col, Row } from 'antd';
import GamesConfig from '@config/GamesConfig';
import { Game } from '@models/types';

const { Meta } = Card;

const GamesList: React.FC = () => {
    return (
        <>
            {GamesConfig.map((game: Game, index: number) => (
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
