'use client';

import React, { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import LevelsConfig from '@config/LevelConfig';
import { LevelConfig } from '@models/types';

interface LevelListProps {
    handlePopulateDBClick: (level: string) => void;
    handleLoadAllClick: () => void;
    gameLevel: string | null;
    isLoading: boolean;
    hydrated: boolean;
}

const LevelList: React.FC<LevelListProps> = ({
    handlePopulateDBClick,
    handleLoadAllClick,
    gameLevel,
    isLoading,
    hydrated,
}) => {
    const intl = useIntl();
    const [isOpen, setIsOpen] = useState(gameLevel === null);

    const levelTranslations: { [key: string]: string } = {
        beginner: intl.formatMessage({ id: 'levelBeginner' }),
        intermediate: intl.formatMessage({ id: 'levelIntermediate' }),
        advanced: intl.formatMessage({ id: 'levelAdvanced' }),
    };

    if (!hydrated) return <div className="level-wrapper" />;

    if (!gameLevel) {
        return (
            <div className="level-wrapper">
                <button
                    className="btn-primary level-load-btn"
                    onClick={handleLoadAllClick}
                    disabled={isLoading}
                >
                    <FormattedMessage id="homeLoadLevels" />
                    {isLoading && <span className="level-selector-spinner" aria-hidden="true" />}
                </button>
            </div>
        );
    }

    const summaryLabel = `${intl.formatMessage({ id: 'homeLevel' })} ${levelTranslations[gameLevel]}`;

    return (
        <div className="level-wrapper">
            <div className="level-collapse">
                <button
                    className="level-summary"
                    onClick={() => setIsOpen((o) => !o)}
                    aria-expanded={isOpen}
                >
                    {summaryLabel}
                    {isLoading && <span className="level-selector-spinner" aria-hidden="true" />}
                </button>
                {isOpen && (
                    <div className="level-content">
                        {LevelsConfig.map((level: LevelConfig, idx: number) => (
                            <div
                                key={idx}
                                onClick={() => handlePopulateDBClick(level.level)}
                                className={`btn-${level.level} btn-levels ${
                                    gameLevel === level.level ? 'selected' : ''
                                }`}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={`/images/levels/${level.level}Bg.png`}
                                    alt={level.level}
                                />
                                <strong>{levelTranslations[level.level]}</strong>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LevelList;
