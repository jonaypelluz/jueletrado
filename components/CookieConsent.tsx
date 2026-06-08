'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useIntl } from 'react-intl';
import { Button } from 'antd';
import { type ConsentStatus, LOCAL_STORAGE_KEY, useCookieConsent } from '@context/CookieContext';
import { useWordsContext } from '@store/WordsContext';
import './CookieConsent.scss';

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
                    <Button onClick={() => handleSetConsent('rejected')} className="decline">
                        {intl.formatMessage({ id: 'cookiesDecline' })}
                    </Button>
                    <Button onClick={() => handleSetConsent('accepted')} className="accept">
                        {intl.formatMessage({ id: 'cookiesAccept' })}
                    </Button>
                    {consent !== null && (
                        <Button onClick={deleteConsent} className="delete">
                            {intl.formatMessage({ id: 'cookiesDelete' })}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CookieConsent;
