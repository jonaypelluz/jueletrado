import React from 'react';
import { Layout, Menu } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';

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
