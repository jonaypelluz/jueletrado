'use client';

import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import LevelsConfig from '@config/LevelConfig';
import { LevelConfig } from '@models/types';

interface LevelListProps {
    handlePopulateDBClick: (level: string) => void;
    gameLevel: string | null;
}

const LevelList: React.FC<LevelListProps> = ({ handlePopulateDBClick, gameLevel }) => {
    const intl = useIntl();
    const [isOpen, setIsOpen] = useState(gameLevel === null);

    const levelTranslations: { [key: string]: string } = {
        beginner: intl.formatMessage({ id: 'levelBeginner' }),
        intermediate: intl.formatMessage({ id: 'levelIntermediate' }),
        advanced: intl.formatMessage({ id: 'levelAdvanced' }),
    };

    const summaryLabel = gameLevel
        ? `${intl.formatMessage({ id: 'homeLevel' })} ${levelTranslations[gameLevel]}`
        : intl.formatMessage({ id: 'homeChoseLevel' });

    return (
        <div className="level-wrapper">
            <div className="level-collapse">
                <button
                    className="level-summary"
                    onClick={() => setIsOpen((o) => !o)}
                    aria-expanded={isOpen}
                >
                    {summaryLabel}
                </button>
                {isOpen && (
                    <div className="level-content">
                        {LevelsConfig.map((level: LevelConfig, idx: number) => (
                            <div
                                key={idx}
                                onClick={() => handlePopulateDBClick(level.level)}
                                className={`btn-${level.level} btn-levels ${
                                    gameLevel && gameLevel === level.level ? 'selected' : ''
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
