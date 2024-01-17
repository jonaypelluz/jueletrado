import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Col, Flex, Row } from 'antd';
import { GameConfig } from '@models/types';
import GameRules from 'src/components/GameRules';
import Hero from 'src/components/Hero';
import LoadingScreen from 'src/components/LoadingScreen';

type SpellTowerUIProps = {
    gameConfig: GameConfig;
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
                        <FormattedMessage id="gamePlay" />
                    </Button>
                )}
                {!showButton && (
                    <p style={{ fontSize: '24px', fontWeight: '800' }}>
                        {countdown} <FormattedMessage id="gameSeconds" />
                    </p>
                )}
            </Hero>
            {!hasBeenPlayed ? (
                <div className="spell-tower-game">
                    <div className="spell-tower-game-inner">
                        <GameRules {...gameConfig.gameRules} />
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
