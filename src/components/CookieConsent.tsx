import React from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { Button } from 'antd';
import { useWordsContext } from '@store/WordsContext';
import Cookie from 'universal-cookie';
import './CookieConsent.scss';

const CookieConsent: React.FC<{ setShowModal: React.Dispatch<React.SetStateAction<boolean>> }> = ({
    setShowModal,
}) => {
    const intl = useIntl();
    const { currentRoutes } = useWordsContext();

    const declineCookies = (): void => {
        const cookie = new Cookie();
        cookie.set('jueletrado-analytics', false, {
            path: '/',
            expires: new Date(Date.now() + 31536000000),
        });
        setShowModal(false);
    };

    const acceptCookies = (): void => {
        const cookie = new Cookie();
        cookie.set('jueletrado-analytics', true, {
            path: '/',
            expires: new Date(Date.now() + 31536000000),
        });
        setShowModal(false);
    };

    return (
        <div id="cookieConsent">
            <p>
                {intl.formatMessage({ id: 'cookiesConsent' })}&nbsp;
                <Link to={currentRoutes.cookies}>
                    {intl.formatMessage({ id: 'cookiesMoreInfo' })}
                </Link>
            </p>
            <div>
                <Button onClick={declineCookies} className="decline">
                    {intl.formatMessage({ id: 'cookiesDecline' })}
                </Button>
                <Button onClick={acceptCookies} className="accept">
                    {intl.formatMessage({ id: 'cookiesAccept' })}
                </Button>
            </div>
        </div>
    );
};

export default CookieConsent;
