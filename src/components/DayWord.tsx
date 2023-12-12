import React from 'react';
import { Layout, Typography } from 'antd';

const { Title, Paragraph, Text } = Typography;

const { Content } = Layout;

interface DayWordProps {
    word?: string;
}

const DayWord: React.FC<DayWordProps> = ({ word }) => {
    return (
        <Content style={{ padding: '60px 20px' }}>
            <Title level={2} style={{ textAlign: 'center' }}>
                Palabra del día:
            </Title>
            <Paragraph style={{ textAlign: 'center' }}>
                <Text italic style={{ fontSize: '30px' }}>
                    {word}
                </Text>
            </Paragraph>
        </Content>
    );
};

export default DayWord;
