import React from 'react';
import { Card, Col, Row } from 'antd';
import { RightSquareOutlined } from '@ant-design/icons';

const Games: React.FC = () => {
    return (
        <div style={{ padding: '60px 20px' }}>
            <Row>
                <Col>
                    <Card
                        title="La torre del acento"
                        bordered={false}
                        extra={
                            <a href="/games/spelltower">
                                <RightSquareOutlined />
                            </a>
                        }
                    >
                        Un juego de construcción de torres donde cada palabra bien escrita agrega un
                        bloque a la torre.
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Games;
