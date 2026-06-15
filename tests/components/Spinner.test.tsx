import React from 'react';
import { render, screen } from '@testing-library/react';
import Spinner from '@components/Spinner';

describe('Spinner', () => {
    test('renders the spinning circle', () => {
        const { container } = render(<Spinner />);
        expect(container.querySelector('.spinner-circle')).toBeInTheDocument();
    });

    test('omits the label when none is given', () => {
        const { container } = render(<Spinner />);
        expect(container.querySelector('.spinner-label')).not.toBeInTheDocument();
    });

    test('renders the label when provided', () => {
        render(<Spinner label="Cargando…" />);
        expect(screen.getByText('Cargando…')).toBeInTheDocument();
    });

    test('applies the size to the circle dimensions', () => {
        const { container } = render(<Spinner size={64} />);
        const circle = container.querySelector('.spinner-circle') as HTMLElement;
        expect(circle.style.width).toBe('64px');
        expect(circle.style.height).toBe('64px');
    });
});
