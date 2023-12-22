import React from 'react';
import { Button, Typography } from 'antd';
import Hero from 'src/components/Hero';
import LoadingScreen from 'src/components/LoadingScreen';

const { Text } = Typography;

type WordsRainUIProps = {
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
                image="/games/WordsRain.png"
                title="Lluvia de palabras"
                subtitle="Un juego donde debes evitar que las palabras bien escritas caigan, ya que las mal escritas harán 
                que pierdas. Debes durar el mayor tiempo posible; quien dure más tiempo, gana."
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
