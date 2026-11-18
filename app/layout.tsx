import type { Metadata } from 'next';
import Providers from '@components/Providers';
import { INSTALL_PROMPT_SCRIPT } from '@store/InstallPromptStore';
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
            <head>
                <script dangerouslySetInnerHTML={{ __html: INSTALL_PROMPT_SCRIPT }} />
            </head>
            <body suppressHydrationWarning>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
