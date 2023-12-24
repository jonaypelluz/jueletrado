import React from 'react';
import { Button, Typography } from 'antd';
import Hero from 'src/components/Hero';
import LoadingScreen from 'src/components/LoadingScreen';
import { Game } from 'src/models/types';

const { Text, Title } = Typography;

type WordsRainUIProps = {
    gameConfig: Game;
    error: Error | null;
    timer: number;
    isLoading: boolean;
    showButton: boolean;
    gameStarted: boolean;
    fallingWords: JSX.Element[];
    hearts: number;
    speed: number;
    wrapperRef: React.RefObject<HTMLDivElement>;
    handleGameStartClick: () => void;
    renderGameResult: () => JSX.Element;
};

const UI: React.FC<WordsRainUIProps> = ({
    gameConfig,
    error,
    timer,
    isLoading,
    showButton,
    gameStarted,
    fallingWords,
    hearts,
    speed,
    wrapperRef,
    handleGameStartClick,
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
                {timer > 0 && (
                    <p style={{ fontSize: '24px', fontWeight: '800' }}>{timer} segundos</p>
                )}
            </Hero>
            <div className="words-rain-wrapper" ref={wrapperRef}>
                {showButton && fallingWords.length === 0 && (
                    <div className="words-rain-inner">
                        <div className="game-rules">
                            <Title level={2}>Reglas</Title>
                            <p>
                                <Text strong>Objetivo del Juego:</Text>
                            </p>
                            <p>
                                <Text>
                                    Mantente en juego el mayor tiempo posible sin perder todas tus
                                    vidas.
                                </Text>
                            </p>
                            <p>
                                <Text strong>Cómo Jugar:</Text>
                            </p>
                            <div>
                                <Text>
                                    <ul>
                                        <li>
                                            El juego inicia a velocidad {speed} y el jugador
                                            comienza con {hearts} vidas.
                                        </li>
                                        <li>
                                            Palabras, bien y mal escritas, caerán desde la parte
                                            superior de la pantalla. El jugador debe seleccionar las
                                            palabras escritas correctamente.
                                        </li>
                                        <li>
                                            Si el jugador elige una palabra incorrecta, perderá una
                                            vida.
                                        </li>
                                        <li>
                                            No hay penalización por seleccionar una palabra
                                            correcta. Sin embargo, si una palabra correcta llega al
                                            suelo, el jugador perderá una vida.
                                        </li>
                                    </ul>
                                </Text>
                            </div>
                            <p>
                                <Text strong>Reglas Adicionales:</Text>
                            </p>
                            <p>
                                <Text>
                                    Conforme avance el tiempo, la velocidad del juego aumentará y
                                    podrían aparecer más palabras.
                                    <br />
                                    El juego termina cuando el jugador pierde todas sus vidas.
                                </Text>
                            </p>
                            <p>
                                <Text strong>Consejos:</Text>
                            </p>
                            <p>
                                <Text>
                                    Las palabras suelen aparecer en grupos, lo que puede ayudarte a
                                    deducir cuáles están escritas correctamente. <br />
                                    Si pierdes una vida por seleccionar una palabra incorrecta,
                                    actúa rápidamente para elegir la correcta antes de que llegue al
                                    suelo.
                                </Text>
                            </p>
                        </div>
                    </div>
                )}
                {gameStarted ? (
                    <>
                        {fallingWords}
                        <div className="words-rain-points">
                            <Text style={{ fontSize: '12px' }}>Velocidad</Text>
                            <Text strong style={{ fontSize: '24px', lineHeight: '0.8' }}>
                                {speed}
                            </Text>
                        </div>
                        <div className="words-rain-lifes">
                            <div id="heart">
                                <Text strong style={{ fontSize: '24px', color: '#fff' }}>
                                    {hearts}
                                </Text>
                            </div>
                        </div>
                    </>
                ) : (
                    renderGameResult()
                )}
            </div>
        </>
    );
};

export default UI;
