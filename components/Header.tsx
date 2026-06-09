'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FormattedMessage, useIntl } from 'react-intl';
import LevelsConfig from '@config/LevelConfig';
import { LevelConfig } from '@models/types';
import useLevelLoader from '@hooks/useLevelLoader';
import { useWordsContext } from '@store/WordsContext';
import '@styles/Header.scss';

const Head: React.FC = () => {
    const intl = useIntl();
    const pathname = usePathname() ?? '/';
    const { locale, wordOfTheDay, gameLevel, currentRoutes } = useWordsContext();
    const { selectLevel } = useLevelLoader();
    const [navOpen, setNavOpen] = useState(false);
    const [levelOpen, setLevelOpen] = useState(false);

    const navItems = [
        { href: currentRoutes.games, labelId: 'headerGames' },
        ...(locale === 'es' ? [{ href: currentRoutes.spellingRules, labelId: 'headerRules' }] : []),
    ];

    const levelTranslations: Record<string, string> = {
        beginner: intl.formatMessage({ id: 'levelBeginner' }),
        intermediate: intl.formatMessage({ id: 'levelIntermediate' }),
        advanced: intl.formatMessage({ id: 'levelAdvanced' }),
    };

    const handleLevelSelect = (level: string) => {
        selectLevel(level);
        setLevelOpen(false);
    };

    return (
        <header className="header">
            <Link href={currentRoutes.home} className="logo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/jueletradoLogo.png" alt={intl.formatMessage({ id: 'mainTitle' })} />
            </Link>
            <nav>
                <button
                    className="nav-toggle"
                    aria-label="Toggle navigation"
                    onClick={() => setNavOpen((o) => !o)}
                >
                    ☰
                </button>
                <div className={`nav-items${navOpen ? ' open' : ''}`}>
                    <ul>
                        {navItems.map(({ href, labelId }) => (
                            <li key={href} className={pathname === href ? 'active' : ''}>
                                <Link href={href} onClick={() => setNavOpen(false)}>
                                    <FormattedMessage id={labelId} />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </nav>
            <div className="header-right">
                <div className="level-selector">
                    <button
                        className={`level-selector-toggle${gameLevel ? ' has-level' : ''}`}
                        onClick={() => setLevelOpen((o) => !o)}
                        aria-expanded={levelOpen}
                    >
                        {gameLevel
                            ? levelTranslations[gameLevel]
                            : intl.formatMessage({ id: 'homeChoseLevel' })}
                    </button>
                    {levelOpen && (
                        <div className="level-selector-dropdown">
                            {LevelsConfig.map((level: LevelConfig) => (
                                <button
                                    key={level.level}
                                    className={`level-option btn-${level.level}${gameLevel === level.level ? ' selected' : ''}`}
                                    onClick={() => handleLevelSelect(level.level)}
                                >
                                    {levelTranslations[level.level]}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                {wordOfTheDay && (
                    <div className="word-of-the-day">
                        <em>
                            <FormattedMessage id="headerWordOfTheDay" />
                        </em>
                        <strong>
                            <a
                                href={
                                    intl.formatMessage({ id: 'headerWordOfTheDayUrl' }) +
                                    wordOfTheDay
                                }
                                target="_blank"
                                rel="noreferrer"
                            >
                                {wordOfTheDay}
                            </a>
                        </strong>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Head;
