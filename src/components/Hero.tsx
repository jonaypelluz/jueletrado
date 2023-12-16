import React from 'react';
import { Typography } from 'antd';

const { Title, Paragraph, Text } = Typography;

interface HeroProps {
    title: string;
    subtitle?: string;
    image?: string;
    styles?: React.CSSProperties;
    children?: React.ReactNode;
}

const Hero: React.FC<HeroProps> = ({ title, subtitle, image, styles, children }) => {
    const heroStyles = {
        backgroundColor: '#FFF',
        borderRadius: '10px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'row' as const,
        ...styles,
    };

    const titleStyles = {
        marginTop: '0',
    };

    const subtitleStyles = {};

    const textStyles = {
        fontSize: '18px',
    };

    const imageStyles = {
        maxWidth: '240px',
        marginRight: '24px',
    };

    return (
        <div style={heroStyles}>
            {image && <img src={image} alt={title} style={imageStyles} />}
            <div>
                <Title style={titleStyles}>{title}</Title>
                {subtitle && (
                    <Paragraph style={subtitleStyles}>
                        <Text style={textStyles}>{subtitle}</Text>
                    </Paragraph>
                )}
                {children && <>{children}</>}
            </div>
        </div>
    );
};

export default Hero;
