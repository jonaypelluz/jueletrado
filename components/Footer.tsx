'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useIntl } from 'react-intl';
import { Layout, Select, Typography } from 'antd';
import LocalesConfig from '@config/LocaleConfig';
import { LocaleConfig } from '@models/types';
import { useWordsContext } from '@store/WordsContext';
import CookieConsent from './CookieConsent';

const { Footer } = Layout;
const { Text } = Typography;
const { Option } = Select;

const Foot: React.FC = () => {
    const intl = useIntl();
    const { locale, setLocale, currentRoutes } = useWordsContext();
    const router = useRouter();

    const [showModal, setShowModal] = useState(true);

    const handleLocaleChange = (value: string) => {
        setLocale(value);
        const url: { [key: string]: string } = {
            es: '/',
            en: '/en/',
        };
        router.push(url[value]);
    };

    return (
        <Footer className="footer">
            <a
                target="_blank"
                href="https://www.buymeacoffee.com/jonaypelluz"
                rel="noopener noreferrer"
                className="buy-m-a-coffee"
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="https://cdn.buymeacoffee.com/buttons/bmc-new-btn-logo.svg"
                    alt="Buy Me a Coffee"
                />
                <span>
                    Buy
                    <br /> Me a<br /> Coffee
                </span>
            </a>
            <Select
                value={locale}
                defaultValue="es"
                style={{ width: 120, marginLeft: '20px' }}
                onChange={handleLocaleChange}
            >
                {LocalesConfig.map((loc: LocaleConfig, index: number) => (
                    <Option key={index} value={loc.lang}>
                        {loc.name}
                    </Option>
                ))}
            </Select>
            <div>
                <p>
                    <Link className="first-link" href={currentRoutes.privacy}>
                        {intl.formatMessage({ id: 'privacyTitle' })}
                    </Link>
                    <Link className="first-link" href={currentRoutes.cookies}>
                        {intl.formatMessage({ id: 'cookiesTitle' })}
                    </Link>
                    <a
                        href="#"
                        className="cookie-button"
                        onClick={(e) => {
                            e.preventDefault();
                            setShowModal(true);
                        }}
                    >
                        {intl.formatMessage({ id: 'cookiesSettings' })}
                    </a>
                </p>
                <Text strong className="powered">
                    powered by @jonaypelluz
                </Text>
            </div>
            <CookieConsent showModal={showModal} setShowModal={setShowModal} />
        </Footer>
    );
};

export default Foot;
