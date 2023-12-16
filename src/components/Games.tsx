import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Col, Row } from 'antd';

const { Meta } = Card;

const Games: React.FC = () => {
    return (
        <div style={{ padding: '60px 20px' }}>
            <Row gutter={16}>
                <Col span={12}>
                    <Link to="/games/spelltower">
                        <Card
                            hoverable
                            cover={
                                <img alt="La torre de la ortografía" src="/games/SpellTower.png" />
                            }
                        >
                            <Meta
                                title="La torre de la ortografía"
                                description="Un juego de construcción de torres donde cada palabra bien escrita agrega un
                                bloque a la torre."
                            />
                        </Card>
                    </Link>
                </Col>
                <Col span={12}>
                    <Link to="/games/wordsrain">
                        <Card
                            hoverable
                            cover={<img alt="Lluvia de palabras" src="/games/WordsRain.png" />}
                        >
                            <Meta
                                title="Lluvia de palabras"
                                description="Un juego dónde hay que evitar que las palabras bien escritas caigan y las
                                mal escritas haran que pierdas."
                            />
                        </Card>
                    </Link>
                </Col>
            </Row>
        </div>
    );
};

export default Games;
