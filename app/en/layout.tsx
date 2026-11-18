import type { Metadata } from 'next';

// English pages link the English manifest (start_url /en/); everything else comes from the root layout.
export const metadata: Metadata = {
    manifest: '/site-en.webmanifest',
};

export default function EnLayout({ children }: { children: React.ReactNode }) {
    return children;
}
