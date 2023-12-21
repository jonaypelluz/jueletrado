import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography } from 'antd';
import { HomeOutlined, PlaySquareOutlined } from '@ant-design/icons';
import { useWordsContext } from 'src/store/WordsContext';
import './Header.scss';

const { Text } = Typography;

const { Header } = Layout;

const Head: React.FC = () => {
    const location = useLocation();
    const { wordOfTheDay } = useWordsContext();

    const items = [
        {
            label: (
                <Link to="/">
                    <HomeOutlined />
                </Link>
            ),
            key: '/',
        },
        {
            label: <Link to="/games">Juegos</Link>,
            icon: <PlaySquareOutlined />,
            key: '/games',
        },
    ];

    return (
        <Header className="header">
            <Menu
                style={{ lineHeight: '78px', backgroundColor: '#000' }}
                theme="dark"
                mode="horizontal"
                items={items}
                selectedKeys={[location.pathname]}
            />
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
