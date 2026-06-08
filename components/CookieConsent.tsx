'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useIntl } from 'react-intl';
import { type ConsentStatus, LOCAL_STORAGE_KEY, useCookieConsent } from '@context/CookieContext';
import { useWordsContext } from '@store/WordsContext';
import '@styles/CookieConsent.scss';

const CookieConsent: React.FC<{
    showModal: boolean;
    setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ showModal, setShowModal }) => {
    const intl = useIntl();
    const { currentRoutes } = useWordsContext();
    const { consent, setConsent } = useCookieConsent();

    useEffect(() => {
        if (consent !== null) {
            setShowModal(false);
        }
    }, [consent, setShowModal]);

    const handleSetConsent = (value: ConsentStatus): void => {
        setConsent(value);
        setShowModal(false);
    };

    const deleteConsent = (): void => {
        setConsent(null);
        if (typeof window !== 'undefined') {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
        setShowModal(false);
    };

    return (
        <div id="cookieConsent" style={{ display: showModal ? 'block' : 'none' }}>
            <div className="cookie-wrapper">
                <p>
                    {intl.formatMessage({ id: 'cookiesConsent' })}&nbsp;
                    <Link href={currentRoutes.cookies}>
                        {intl.formatMessage({ id: 'cookiesMoreInfo' })}
                    </Link>
                </p>
                {consent !== null && (
                    <p className="cookie-consent">
                        {intl.formatMessage({ id: 'cookiesConsentCurrent' })}:{' '}
                        <b>
                            {consent === 'accepted'
                                ? intl.formatMessage({ id: 'cookiesConsentAccepted' })
                                : intl.formatMessage({ id: 'cookiesConsentRejected' })}
                        </b>
                    </p>
                )}
                <div>
                    <button onClick={() => handleSetConsent('rejected')} className="decline">
                        {intl.formatMessage({ id: 'cookiesDecline' })}
                    </button>
                    <button onClick={() => handleSetConsent('accepted')} className="accept">
                        {intl.formatMessage({ id: 'cookiesAccept' })}
                    </button>
                    {consent !== null && (
                        <button onClick={deleteConsent} className="delete">
                            {intl.formatMessage({ id: 'cookiesDelete' })}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CookieConsent;
