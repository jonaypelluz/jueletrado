'use client';

import React from 'react';
import { FormattedMessage } from 'react-intl';
import { GameConfig } from '@models/types';
import { RejectionReason } from '@utils/ChainLetterIndex';
import GameRules from '@components/GameRules';
import Hero from '@components/Hero';
import '@styles/Buttons.scss';

type WordChainUIProps = {
    gameConfig: GameConfig;
    locale: string;
    gameLevel: string | null;
    error: Error | null;
    isLoading: boolean;
    showButton: boolean;
    loadError: boolean;
    gameStarted: boolean;
    hasBeenPlayed: boolean;
    isGameOver: boolean;
    chain: string[];
    requiredLetter: string;
    countdown: number;
    isLowTime: boolean;
    score: number;
    best: number;
    isNewRecord: boolean;
    rejection: RejectionReason | null;
    input: string;
    handleInputChange: (value: string) => void;
    handleSubmit: (event?: React.FormEvent) => void;
    handleGameStartClick: () => Promise<void>;
};

const BREADCRUMB_SIZE = 5;

const REJECTION_MESSAGE_IDS: Record<RejectionReason, string> = {
    'wrong-letter': 'gameWordChainRejectWrongLetter',
    'too-short': 'gameWordChainRejectTooShort',
    'not-in-dictionary': 'gameWordChainRejectNotInDictionary',
    repeated: 'gameWordChainRejectRepeated',
    'dead-end': 'gameWordChainRejectDeadEnd',
};

const UI: React.FC<WordChainUIProps> = ({
    gameConfig,
    locale,
    gameLevel,
    error,
    isLoading,
    showButton,
    loadError,
    gameStarted,
    hasBeenPlayed,
    isGameOver,
    chain,
    requiredLetter,
    countdown,
    isLowTime,
    score,
    best,
    isNewRecord,
    rejection,
    input,
    handleInputChange,
    handleSubmit,
    handleGameStartClick,
}) => {
    const renderHeroAction = () => {
        if (!gameLevel) {
            return (
                <button className="btn-primary game-btn" disabled>
                    <FormattedMessage id="gameSelectLevel" />
                </button>
            );
        }
        if (isLoading) {
            return (
                <button className="btn-primary game-btn" disabled>
                    <FormattedMessage id="gamePlay" />
                </button>
            );
        }
        if (showButton) {
            return (
                <button className="btn-primary game-btn" onClick={handleGameStartClick}>
                    <FormattedMessage id={isGameOver ? 'gameWordChainPlayAgain' : 'gamePlay'} />
                </button>
            );
        }
        return (
            <p className={'game-timer' + (isLowTime ? ' text-danger' : '')}>
                {countdown} <FormattedMessage id="gameSeconds" />
            </p>
        );
    };

    const renderTurn = () => (
        <div className="word-chain-turn">
            <p className="word-chain-breadcrumb">{chain.slice(-BREADCRUMB_SIZE).join(' → ')}</p>
            <h2 className="word-chain-prompt">
                <FormattedMessage id="gameWordChainPrompt" values={{ letter: requiredLetter }} />
            </h2>
            <form className="word-chain-form" onSubmit={handleSubmit}>
                <label htmlFor="word-chain-input">
                    <FormattedMessage id="gameWordChainInputLabel" />
                </label>
                <input
                    id="word-chain-input"
                    type="text"
                    value={input}
                    onChange={(event) => handleInputChange(event.target.value)}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    lang={locale}
                />
                <button type="submit" className="btn-primary" disabled={!input.trim()}>
                    <FormattedMessage id="gameWordChainSubmit" />
                </button>
            </form>
            {rejection && (
                <p className="word-chain-rejection">
                    <FormattedMessage id={REJECTION_MESSAGE_IDS[rejection]} values={{ letter: requiredLetter }} />
                </p>
            )}
            <p className="word-chain-stats">
                <FormattedMessage id="gameWordChainScore" values={{ score }} />
                {' · '}
                <FormattedMessage id="gameWordChainBest" values={{ best }} />
            </p>
        </div>
    );

    const renderSummary = () => (
        <div className="word-chain-summary">
            <h2>
                <FormattedMessage id="gameWordChainGameOver" />
            </h2>
            <p className="word-chain-final-score">
                <FormattedMessage id="gameWordChainFinalScore" values={{ score }} />
            </p>
            <p>
                <FormattedMessage id="gameWordChainBest" values={{ best }} />
            </p>
            {isNewRecord && (
                <p className="word-chain-record">
                    <FormattedMessage id="gameWordChainNewRecord" />
                </p>
            )}
            <h3>
                <FormattedMessage id="gameWordChainChainLabel" />
            </h3>
            <ol className="word-chain-list">
                {chain.map((word, index) => (
                    <li key={word}>
                        {word}
                        {index === 0 && (
                            <span className="word-chain-seed">
                                {' ('}
                                <FormattedMessage id="gameWordChainSeed" />
                                {')'}
                            </span>
                        )}
                    </li>
                ))}
            </ol>
        </div>
    );

    const renderBody = () => {
        if (loadError) {
            return (
                <p className="load-error">
                    <FormattedMessage id="gameWordChainLoadError" />
                </p>
            );
        }
        if (!hasBeenPlayed || !gameLevel) return <GameRules {...gameConfig.gameRules} />;
        if (gameStarted) return renderTurn();
        return isGameOver ? renderSummary() : null;
    };

    return (
        <>
            <Hero image={gameConfig.imgSrc} title={gameConfig.title} subtitle={gameConfig.description}>
                {renderHeroAction()}
            </Hero>
            <div className="word-chain-wrapper">
                <div className="word-chain-inner">
                    {error && <p className="load-error">{error.message}</p>}
                    {renderBody()}
                </div>
            </div>
        </>
    );
};

export default UI;
