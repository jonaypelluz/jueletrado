'use client';

import React from 'react';
import { FormattedMessage } from 'react-intl';
import { GameConfig, RainWordItem } from '@models/types';
import GameRules from '@components/GameRules';
import Hero from '@components/Hero';
import '@styles/Buttons.scss';

type WordsRainUIProps = {
    gameConfig: GameConfig;
    error: Error | null;
    timer: number;
    gameLevel: string | null;
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
    timer,
    gameLevel,
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
    return (
        <>
            <Hero
                image={gameConfig.imgSrc}
                title={gameConfig.title}
                subtitle={gameConfig.description}
            >
                {!gameLevel ? (
                    <button className="btn-primary game-btn" disabled>
                        <FormattedMessage id="gameSelectLevel" />
                    </button>
                ) : isLoading ? (
                    <button className="btn-primary game-btn" disabled>
                        <FormattedMessage id="gamePlay" />
                    </button>
                ) : showButton ? (
                    <button className="btn-primary game-btn" onClick={handleGameStartClick}>
                        <FormattedMessage id="gamePlay" />
                    </button>
                ) : null}
                {timer > 0 && <p className="game-timer">{timer} segundos</p>}
            </Hero>
            <div className="words-rain-wrapper" ref={wrapperRef}>
                {(showButton || !gameLevel) && incorrectWords.length === 0 && (
                    <div className="words-rain-inner">
                        <GameRules {...gameConfig.gameRules} />
                    </div>
                )}
                {gameStarted ? (
                    <>
                        {fallingWords}
                        <div className="words-rain-points">
                            <span className="label">Velocidad</span>
                            <span className="value">{speed}</span>
                        </div>
                        <div className="words-rain-lifes">
                            <div id="heart">
                                <span>{hearts}</span>
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
