import type { Metadata } from 'next';
import Providers from '@components/Providers';
import '../styles/globals.scss';

export const metadata: Metadata = {
    title: 'Jueletrado',
    description: 'Donde jugar y aprender a escribir bien van de la mano',
    icons: {
        icon: '/favicon.ico',
        apple: '/apple-touch-icon.png',
    },
    manifest: '/site.webmanifest',
};

export const viewport = {
    width: 'device-width',
    initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es">
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
