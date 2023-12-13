import React from 'react';
import { Typography } from 'antd';

const { Title, Paragraph, Text } = Typography;

interface HeroProps {
    title: string;
    subtitle?: string;
    backgroundColor?: string;
    children?: React.ReactNode;
}

const Hero: React.FC<HeroProps> = ({ title, subtitle, backgroundColor, children }) => {
    const heroStyles = {
        backgroundColor: backgroundColor || '#FFF',
        borderRadius: '10px',
        padding: '24px',
        textAlign: 'center' as const,
    };

    const titleStyles = {
        textAlign: 'center' as const,
    };

    const subtitleStyles = {
        textAlign: 'center' as const,
    };

    const textStyles = {
        textAlign: 'center' as const,
        fontSize: '18px',
    };

    return (
        <div style={heroStyles}>
            <Title style={titleStyles}>{title}</Title>
            {subtitle && (
                <Paragraph style={subtitleStyles}>
                    <Text style={textStyles}>{subtitle}</Text>
                </Paragraph>
            )}
            {children && <>{children}</>}
        </div>
    );
};

export default Hero;
