'use client';

import React, { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import '@styles/WiktionaryCredit.scss';

const WIKTIONARY_URL = 'https://es.wiktionary.org';
const LICENCE_URL = 'https://creativecommons.org/licenses/by-sa/4.0/';

const link = (href: string) =>
    function CreditLink(chunks: ReactNode[]) {
        return (
            <a href={href} target="_blank" rel="noopener noreferrer">
                {chunks}
            </a>
        );
    };

/** CC BY-SA 4.0 §3(a) attribution, shown under definitions that come from Wiktionary (`source: 'wiktionary'`). */
const WiktionaryCredit: React.FC = () => (
    <p className="wiktionary-credit">
        <FormattedMessage id="wiktionaryCredit" values={{ wiktionary: link(WIKTIONARY_URL), licence: link(LICENCE_URL) }} />
    </p>
);

export default WiktionaryCredit;
