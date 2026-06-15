'use client';

import React from 'react';
import '@styles/Spinner.scss';

interface SpinnerProps {
    /** Optional caption shown under the spinner (pass a localized node). */
    label?: React.ReactNode;
    /** Diameter in px. Border thickness scales with it. */
    size?: number;
}

const Spinner: React.FC<SpinnerProps> = ({ label, size = 40 }) => (
    <div className="spinner-wrapper">
        <span
            className="spinner-circle"
            style={{ width: size, height: size, borderWidth: Math.max(3, Math.round(size / 10)) }}
        />
        {label != null && <p className="spinner-label">{label}</p>}
    </div>
);

export default Spinner;
