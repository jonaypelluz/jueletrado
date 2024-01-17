import React, { useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography } from 'antd';
import { BarsOutlined, PlaySquareOutlined } from '@ant-design/icons';
import { useWordsContext } from '@store/WordsContext';
import './Header.scss';

const { Text } = Typography;
const { Header } = Layout;

const Head: React.FC = () => {
    const intl = useIntl();
    const location = useLocation();
    const { locale, wordOfTheDay, currentRoutes } = useWordsContext();

    const headerRef = useRef(null);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const headerElement = headerRef.current;

        const handleResize = (entries: ResizeObserverEntry[]) => {
            const entry = entries[0];
            setIsCollapsed(entry.contentRect.width < 851);
        };

        const observer = new ResizeObserver(handleResize);

        if (headerElement) {
            observer.observe(headerElement);
        }

        return () => {
            if (headerElement) {
                observer.unobserve(headerElement);
            }
        };
    }, []);

    const items = [
        {
            label: (
                <Link to={currentRoutes.games}>
                    <FormattedMessage id="headerGames" />
                </Link>
            ),
            icon: <PlaySquareOutlined />,
            key: `${currentRoutes.games}`,
        },
    ];

    if (locale === 'es') {
        items.push({
            label: (
                <Link to={currentRoutes.spellingRules}>
                    <FormattedMessage id="headerRules" />
                </Link>
            ),
            icon: <PlaySquareOutlined />,
            key: `${currentRoutes.spellingRules}`,
        });
    }

    return (
        <Header className="header" ref={headerRef}>
            <Link to={currentRoutes.home} className="logo">
                <img src="/jueletradoLogo.png" alt={intl.formatMessage({ id: 'mainTitle' })} />
            </Link>
            <Menu
                theme="dark"
                mode="horizontal"
                items={items}
                selectedKeys={[location.pathname]}
                overflowedIndicator={<BarsOutlined />}
            />
            {!isCollapsed && wordOfTheDay && (
                <div className="word-of-the-day">
                    <Text italic style={{ fontSize: '14px', color: '#FFF' }}>
                        <FormattedMessage id="headerWordOfTheDay" />
                    </Text>
                    <Text strong style={{ fontSize: '14px', color: '#FFF', marginLeft: '6px' }}>
                        <a
                            href={
                                intl.formatMessage({ id: 'headerWordOfTheDayUrl' }) + wordOfTheDay
                            }
                            target="_blank"
                            rel="noreferrer"
                        >
                            {wordOfTheDay}
                        </a>
                    </Text>
                </div>
            )}
        </Header>
    );
};

export default Head;
