import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWordsContext } from '@store/WordsContext';
import Hero from 'src/components/Hero';
import MainLayout from 'src/layouts/MainLayout';

const NotFound: React.FC = () => {
    const intl = useIntl();
    const { locale } = useWordsContext();

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (locale === 'en' && location.pathname === '/') {
            navigate('/en/');
        }
    }, []);

    return (
        <MainLayout>
            <Hero
                title={intl.formatMessage({ id: 'errorTitle' })}
                subtitle={intl.formatMessage({ id: 'errorDescription' })}
            />
        </MainLayout>
    );
};

export default NotFound;
