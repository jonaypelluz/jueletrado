import React from 'react';
import { Button, Typography } from 'antd';
import Hero from 'src/components/Hero';
import LoadingScreen from 'src/components/LoadingScreen';

const { Text } = Typography;

type WordsRainUIProps = {
    error: Error | null;
    isLoading: boolean;
    showButton: boolean;
    fallingWords: JSX.Element[];
    hearts: number;
    wrapperRef: React.RefObject<HTMLDivElement>;
    handleGameStartClick: () => void;
};

const UI: React.FC<WordsRainUIProps> = ({
    error,
    isLoading,
    showButton,
    fallingWords,
    hearts,
    wrapperRef,
    handleGameStartClick,
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
            </Hero>
            <div className="words-rain-wrapper" ref={wrapperRef}>
                {fallingWords}
                <div className="words-rain-lifes">
                    <Text strong style={{ fontSize: '48px' }}>
                        {hearts}
                    </Text>
                </div>
            </div>
        </>
    );
};

export default UI;
