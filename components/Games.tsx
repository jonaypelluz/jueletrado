'use client';

import React from 'react';
import Link from 'next/link';
import { GamesRoutes } from '@config/translations/Games';
import { createAllGamesConfig } from '@hooks/useGamesConfig';
import { CardInfo } from '@models/types';
import { useWordsContext } from '@store/WordsContext';
import '@styles/Cards.scss';

const GamesList: React.FC = () => {
    const { locale } = useWordsContext();
    const gamesConfig = createAllGamesConfig(locale);

    const filteredGamesConfig = gamesConfig
        ? gamesConfig.filter((game: CardInfo) => GamesRoutes[locale][game.id] !== undefined)
        : [];

    return (
        <>
            {filteredGamesConfig.length > 0 &&
                filteredGamesConfig.map((game: CardInfo, index: number) => (
                    <div key={index}>
                        <Link href={game.link}>
                            <div className="card">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img alt={game.title} src={game.imgSrc} />
                                <div className="card-meta">
                                    <h3>{game.title}</h3>
                                    <p>{game.subtitle}</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                ))}
        </>
    );
};

const Games: React.FC = () => {
    return (
        <div className="content-wrapper">
            <div className="cards-grid">
                <GamesList />
            </div>
        </div>
    );
};

export default Games;
