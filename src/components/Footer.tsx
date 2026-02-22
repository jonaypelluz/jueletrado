import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { Link, useNavigate } from 'react-router-dom';
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
    const navigate = useNavigate();

    const [showModal, setShowModal] = useState(true);

    const handleLocaleChange = (value: string) => {
        setLocale(value);
        const url: { [key: string]: string } = {
            es: '/',
            en: '/en/',
        };
        navigate(url[value]);
    };

    return (
        <Footer className="footer">
            <a
                target="_blank"
                href="https://www.buymeacoffee.com/jonaypelluz"
                rel="noopener noreferrer"
                className="buy-m-a-coffee"
            >
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
                {LocalesConfig.map((locale: LocaleConfig, index: number) => (
                    <Option key={index} value={locale.lang}>
                        {locale.name}
                    </Option>
                ))}
            </Select>
            <div>
                <p>
                    <Link className="first-link" to={currentRoutes.privacy}>
                        {intl.formatMessage({ id: 'privacyTitle' })}
                    </Link>
                    <Link className="first-link" to={currentRoutes.cookies}>
                        {intl.formatMessage({ id: 'cookiesTitle' })}
                    </Link>
                    <Link
                        to="#"
                        className="cookie-button"
                        onClick={(e) => {
                            e.preventDefault();
                            setShowModal(true);
                        }}
                    >
                        {intl.formatMessage({ id: 'cookiesSettings' })}
                    </Link>
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
