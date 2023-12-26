import React from 'react';
import { Button, Col, Flex, Row, Typography } from 'antd';
import { Game } from '@models/types';
import Hero from 'src/components/Hero';
import LoadingScreen from 'src/components/LoadingScreen';

const { Text, Title } = Typography;

type SpellTowerUIProps = {
    gameConfig: Game;
    error: Error | null;
    countdown: number;
    showButton: boolean;
    gameStarted: boolean;
    hasBeenPlayed: boolean;
    correctAnswers: number;
    isLoading: boolean;
    handleGameStartClick: () => void;
    renderTowerBlocks: () => JSX.Element[];
    displayWordVariations: () => JSX.Element[];
    renderGameResult: () => JSX.Element;
};

const UI: React.FC<SpellTowerUIProps> = ({
    gameConfig,
    error,
    countdown,
    showButton,
    gameStarted,
    hasBeenPlayed,
    correctAnswers,
    isLoading,
    handleGameStartClick,
    renderTowerBlocks,
    displayWordVariations,
    renderGameResult,
}) => {
    if (error || isLoading) {
        return <LoadingScreen />;
    }

    return (
        <>
            <Hero
                image={gameConfig.imgSrc}
                title={gameConfig.title}
                subtitle={gameConfig.description}
            >
                {showButton && (
                    <Button
                        type="primary"
                        style={{ fontSize: '18px', padding: '10px 22px', height: 'auto' }}
                        onClick={handleGameStartClick}
                    >
                        Jugar
                    </Button>
                )}
                {!showButton && (
                    <p style={{ fontSize: '24px', fontWeight: '800' }}>
                        {countdown} segundos restantes
                    </p>
                )}
            </Hero>
            {!hasBeenPlayed ? (
                <div className="spell-tower-game">
                    <div className="spell-tower-game-inner">
                        <div className="game-rules">
                            <Title level={2}>Reglas</Title>
                            <p>
                                <Text strong>Objetivo del Juego:</Text>
                            </p>
                            <p>
                                <Text>
                                    El objetivo del juego es construir la torre más alta posible.
                                </Text>
                            </p>
                            <p>
                                <Text strong>Cómo Jugar:</Text>
                            </p>
                            <div>
                                <Text>
                                    <ul>
                                        <li>
                                            Al comenzar el juego, se mostrarán palabras, algunas
                                            escritas correctamente y otras incorrectamente.
                                        </li>
                                        <li>
                                            Elige una palabra: si está escrita correctamente, se
                                            añadirá un bloque a tu torre.
                                        </li>
                                        <li>
                                            Si eliges una palabra escrita incorrectamente, se
                                            eliminará un bloque de tu torre.
                                        </li>
                                    </ul>
                                </Text>
                            </div>
                            <p>
                                <Text strong>Consejos:</Text>
                            </p>
                            <p>
                                <Text>
                                    Dedica tiempo a leer cuidadosamente cada palabra.
                                    <br />
                                    Recuerda que ir más rápido no siempre significa llegar primero.
                                </Text>
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <Row gutter={[16, 16]}>
                    <Col xs={16} sm={16} md={16} lg={18}>
                        <div className="spell-tower-game">
                            <div className="spell-tower-game-inner">
                                <Flex vertical gap="small" style={{ width: '100%' }}>
                                    {gameStarted ? displayWordVariations() : renderGameResult()}
                                </Flex>
                            </div>
                        </div>
                    </Col>
                    <Col xs={8} sm={8} md={8} lg={6}>
                        <div className="spell-tower-wrapper">
                            <div className="spell-tower-top">{correctAnswers}</div>
                            <div className="spell-tower-wrapper-inner">
                                <div className="spell-tower">{renderTowerBlocks()}</div>
                            </div>
                        </div>
                    </Col>
                </Row>
            )}
        </>
    );
};

export default UI;
