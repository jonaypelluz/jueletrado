import React from 'react';
import { Button, Typography } from 'antd';
import { GameConfig, RainWordItem } from '@models/types';
import GameRules from 'src/components/GameRules';
import Hero from 'src/components/Hero';
import LoadingScreen from 'src/components/LoadingScreen';

const { Text } = Typography;

type WordsRainUIProps = {
    gameConfig: GameConfig;
    error: Error | null;
    timer: number;
    isLoading: boolean;
    showButton: boolean;
    gameStarted: boolean;
    fallingWords: JSX.Element[];
    hearts: number;
    speed: number;
    incorrectWords: RainWordItem[];
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
    incorrectWords,
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
                {showButton && incorrectWords.length === 0 && (
                    <div className="words-rain-inner">
                        <GameRules {...gameConfig.gameRules} />
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
