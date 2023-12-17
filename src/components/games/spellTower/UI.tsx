import React from 'react';
import { Button, Col, Flex, Row } from 'antd';
import Hero from 'src/components/Hero';
import LoadingScreen from 'src/components/LoadingScreen';
import LoadingSpinner from 'src/components/LoadingSpinner';

type SpellTowerUIProps = {
    error: Error | null;
    countdown: number;
    showButton: boolean;
    gameStarted: boolean;
    correctAnswers: number;
    isLoading: boolean;
    handleGameStartClick: () => void;
    renderTowerBlocks: () => JSX.Element[];
    displayWordVariations: () => JSX.Element[];
    renderGameResult: () => JSX.Element;
};

const UI: React.FC<SpellTowerUIProps> = ({
    error,
    countdown,
    showButton,
    gameStarted,
    correctAnswers,
    isLoading,
    handleGameStartClick,
    renderTowerBlocks,
    displayWordVariations,
    renderGameResult,
}) => {
    if (error) {
        return <LoadingScreen />;
    }

    return (
        <>
            <Hero
                image="/games/SpellTower.png"
                title="La torre de la ortografía"
                subtitle="Un juego de construcción de torres donde cada palabra bien escrita agrega un bloque y mal escrita lo retira de la torre. 
                El juego desafía a los jugadores a construir la torre más alta que puedan escribiendo o eligiendo 
                correctamente una serie de palabras donde la ortografía debe ser la correcta."
            >
                {showButton && !isLoading && (
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
            {isLoading ? (
                <div style={{ marginTop: '48px', textAlign: 'center' }}>
                    <LoadingSpinner />
                </div>
            ) : (
                <Row>
                    <Col span={18}>
                        <div className="spell-tower-game">
                            <Flex vertical gap="small" style={{ width: '100%' }}>
                                {gameStarted ? displayWordVariations() : renderGameResult()}
                            </Flex>
                        </div>
                    </Col>
                    <Col span={6}>
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
