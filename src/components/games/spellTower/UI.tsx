import React from 'react';
import { Col, Row, Button } from 'antd';
import MainLayout from 'src/layouts/MainLayout';
import Hero from 'src/components/Hero';
import LoadingSpinner from 'src/components/LoadingSpinner';
import LoadingScreen from 'src/components/LoadingScreen';

type SpellTowerUIProps = {
    error: Error | null;
    countdown: number;
    showButton: boolean;
    isGameActive: boolean;
    handleButtonClick: () => void;
    displayWordVariations: () => JSX.Element[];
    renderTowerBlocks: () => JSX.Element[];
    isLoading: boolean;
};

const UI: React.FC<SpellTowerUIProps> = ({
    error,
    countdown,
    showButton,
    isGameActive,
    handleButtonClick,
    displayWordVariations,
    renderTowerBlocks,
    isLoading,
}) => {
    if (error) {
        return <LoadingScreen />;
    }

    return (
        <MainLayout>
            <Hero
                title="La torre de la ortografía"
                subtitle="Un juego de construcción de torres donde cada palabra bien escrita agrega un bloque a la torre. El juego desafía a los jugadores a construir la torre más alta que puedan escribiendo o eligiendo correctamente una serie de palabras donde la ortografía debe ser la correcta."
            >
                {showButton && !isLoading && (
                    <Button
                        type="primary"
                        style={{ fontSize: '18px', padding: '10px 22px', height: 'auto' }}
                        onClick={handleButtonClick}
                    >
                        Jugar
                    </Button>
                )}
                {!showButton && <div>{countdown} segundos restantes</div>}
            </Hero>
            {isLoading ? (
                <div style={{ marginTop: '48px', textAlign: 'center' }}>
                    <LoadingSpinner />
                </div>
            ) : (
                <Row>
                    <Col span={18}>
                        <div className="jenga-game">{isGameActive && displayWordVariations()}</div>
                    </Col>
                    <Col span={6}>
                        <div className="jenga-wrapper">
                            <div className="jenga-tower">{renderTowerBlocks()}</div>
                        </div>
                    </Col>
                </Row>
            )}
        </MainLayout>
    );
};

export default UI;
