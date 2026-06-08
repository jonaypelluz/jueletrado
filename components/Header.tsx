'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FormattedMessage, useIntl } from 'react-intl';
import { useWordsContext } from '@store/WordsContext';
import '@styles/Header.scss';

const Head: React.FC = () => {
    const intl = useIntl();
    const pathname = usePathname() ?? '/';
    const { locale, wordOfTheDay, currentRoutes } = useWordsContext();
    const [navOpen, setNavOpen] = useState(false);

    const navItems = [
        { href: currentRoutes.games, labelId: 'headerGames' },
        ...(locale === 'es' ? [{ href: currentRoutes.spellingRules, labelId: 'headerRules' }] : []),
    ];

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
            {wordOfTheDay && (
                <div className="word-of-the-day">
                    <em>
                        <FormattedMessage id="headerWordOfTheDay" />
                    </em>
                    <strong>
                        <a
                            href={
                                intl.formatMessage({ id: 'headerWordOfTheDayUrl' }) + wordOfTheDay
                            }
                            target="_blank"
                            rel="noreferrer"
                        >
                            {wordOfTheDay}
                        </a>
                    </strong>
                </div>
            )}
        </header>
    );
};

export default Head;
