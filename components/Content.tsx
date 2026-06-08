'use client';

import React from 'react';
import Link from 'next/link';
import { createAllContentConfig } from '@hooks/useContentConfig';
import { CardInfo } from '@models/types';
import { useWordsContext } from '@store/WordsContext';
import '@styles/Cards.scss';

const ContentList: React.FC = () => {
    const { locale } = useWordsContext();
    const ContentConfig = createAllContentConfig(locale);

    return (
        <>
            {ContentConfig &&
                ContentConfig.map((content: CardInfo, index: number) => (
                    <div key={index}>
                        <Link href={content.link}>
                            <div className="card">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img alt={content.title} src={content.imgSrc} />
                                <div className="card-meta">
                                    <h3>{content.title}</h3>
                                    <p>{content.subtitle}</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                ))}
        </>
    );
};

const Content: React.FC = () => {
    return (
        <div className="content-wrapper">
            <div className="cards-grid">
                <ContentList />
            </div>
        </div>
    );
};

export default Content;
