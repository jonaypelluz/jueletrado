'use client';

import React from 'react';
import { FormattedMessage } from 'react-intl';
import { GameConfig } from '@models/types';
import GameRules from '@components/GameRules';
import Hero from '@components/Hero';
import '@styles/Buttons.scss';

type SpellTowerUIProps = {
    gameConfig: GameConfig;
    error: Error | null;
    countdown: number;
    gameLevel: string | null;
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
    countdown,
    gameLevel,
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
                ) : (
                    <p className="game-timer">
                        {countdown} <FormattedMessage id="gameSeconds" />
                    </p>
                )}
            </Hero>
            {!hasBeenPlayed || !gameLevel ? (
                <div className="spell-tower-game">
                    <div className="spell-tower-game-inner">
                        <GameRules {...gameConfig.gameRules} />
                    </div>
                </div>
            ) : (
                <div className="spell-tower-layout">
                    <div className="spell-tower-col-main">
                        <div className="spell-tower-game">
                            <div className="spell-tower-game-inner">
                                <div className="spell-tower-variations">
                                    {gameStarted ? displayWordVariations() : renderGameResult()}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="spell-tower-col-aside">
                        <div className="spell-tower-wrapper">
                            <div className="spell-tower-top">{correctAnswers}</div>
                            <div className="spell-tower-wrapper-inner">
                                <div className="spell-tower">{renderTowerBlocks()}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UI;
