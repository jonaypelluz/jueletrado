import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography } from 'antd';
import { HomeOutlined, PlaySquareOutlined } from '@ant-design/icons';
import { useWordsContext } from '@store/WordsContext';
import './Header.scss';

const { Text } = Typography;
const { Header } = Layout;

const Head: React.FC = () => {
    const location = useLocation();
    const { wordOfTheDay } = useWordsContext();

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
                <Link to="/">
                    {isCollapsed ? (
                        <>
                            <HomeOutlined />&nbsp;&nbsp;&nbsp;Inicio
                        </>
                    ) : (
                        <img src="/logo-jueletrado.jpg" className="logo" alt="Jueletrado" />
                    )}
                </Link>
            ),
            key: '/',
        },
        {
            label: <Link to="/games">Juegos</Link>,
            icon: <PlaySquareOutlined />,
            key: '/games',
        },
        {
            label: <Link to="/spelling-rules">Normas de ortografía</Link>,
            icon: <PlaySquareOutlined />,
            key: '/spelling-rules',
        },
    ];

    return (
        <Header className="header" ref={headerRef}>
            <Menu theme="dark" mode="horizontal" items={items} selectedKeys={[location.pathname]} />
            {wordOfTheDay ? (
                <div className="word-of-the-day">
                    <Text italic style={{ fontSize: '14px', color: '#FFF' }}>
                        Palabra del día:
                    </Text>
                    <Text strong style={{ fontSize: '14px', color: '#FFF', marginLeft: '6px' }}>
                        <a
                            href={'https://dle.rae.es/' + wordOfTheDay}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {wordOfTheDay}
                        </a>
                    </Text>
                </div>
            ) : (
                ''
            )}
        </Header>
    );
};

export default Head;
