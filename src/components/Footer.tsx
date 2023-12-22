import React from 'react';
import { Layout } from 'antd';

const { Footer } = Layout;

const Foot: React.FC = () => {
    return (
        <Footer>
            <a
                target="_blank"
                href="https://www.buymeacoffee.com/jonaypelluz"
                rel="noopener noreferrer"
                className="buy-m-a-coffee"
            >
                <img
                    src="https://cdn.buymeacoffee.com/buttons/bmc-new-btn-logo.svg"
                    alt="Buy Me a Coffee"
                />
                <span>
                    Buy
                    <br /> Me a<br /> Coffee
                </span>
            </a>
        </Footer>
    );
};

export default Foot;
