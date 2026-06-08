'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FormattedMessage, useIntl } from 'react-intl';
import { Layout, Menu, Typography } from 'antd';
import { BarsOutlined, PlaySquareOutlined } from '@ant-design/icons';
import { useWordsContext } from '@store/WordsContext';
import './Header.scss';

const { Text } = Typography;
const { Header } = Layout;

const Head: React.FC = () => {
    const intl = useIntl();
    const pathname = usePathname() ?? '/';
    const { locale, wordOfTheDay, currentRoutes } = useWordsContext();

    const headerRef = useRef<HTMLElement>(null);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const headerElement = headerRef.current;
        if (!headerElement) return;

        const handleResize = (entries: ResizeObserverEntry[]) => {
            const entry = entries[0];
            setIsCollapsed(entry.contentRect.width < 851);
        };

        const observer = new ResizeObserver(handleResize);
        observer.observe(headerElement);

        return () => {
            observer.disconnect();
        };
    }, []);

    const items = [
        {
            label: (
                <Link href={currentRoutes.games}>
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
                <Link href={currentRoutes.spellingRules}>
                    <FormattedMessage id="headerRules" />
                </Link>
            ),
            icon: <PlaySquareOutlined />,
            key: `${currentRoutes.spellingRules}`,
        });
    }

    return (
        <Header className="header" ref={headerRef}>
            <Link href={currentRoutes.home} className="logo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/jueletradoLogo.png" alt={intl.formatMessage({ id: 'mainTitle' })} />
            </Link>
            <Menu
                theme="dark"
                mode="horizontal"
                items={items}
                selectedKeys={[pathname]}
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
