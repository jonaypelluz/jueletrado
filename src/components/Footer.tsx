import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Select, Typography } from 'antd';
import LocalesConfig from '@config/LocaleConfig';
import { LocaleConfig } from '@models/types';
import { useWordsContext } from '@store/WordsContext';

const { Footer } = Layout;
const { Text } = Typography;
const { Option } = Select;

const Foot: React.FC = () => {
    const { locale, setLocale } = useWordsContext();
    const navigate = useNavigate();

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
            <Text strong className="powered">
                powered by @jonaypelluz
            </Text>
        </Footer>
    );
};

export default Foot;
