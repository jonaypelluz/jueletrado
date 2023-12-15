import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import { HomeOutlined, PlaySquareOutlined } from '@ant-design/icons';

const { Header } = Layout;

const Head: React.FC = () => {
    const location = useLocation();

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
        <Header style={{ backgroundColor: '#000', height: '78px', paddingInline: '20px' }}>
            <Menu
                style={{ lineHeight: '78px', backgroundColor: '#000' }}
                theme="dark"
                mode="horizontal"
                items={items}
                selectedKeys={[location.pathname]}
            />
        </Header>
    );
};

export default Head;
