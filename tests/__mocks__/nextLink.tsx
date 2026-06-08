import React, { type MouseEventHandler, type ReactNode } from 'react';

interface LinkProps {
    children: ReactNode;
    href: string;
    className?: string;
    target?: string;
    rel?: string;
    title?: string;
    onClick?: MouseEventHandler<HTMLAnchorElement>;
}

const Link = ({ children, href, className, target, rel, title, onClick }: LinkProps) => (
    <a href={href} className={className} target={target} rel={rel} title={title} onClick={onClick}>
        {children}
    </a>
);

export default Link;
