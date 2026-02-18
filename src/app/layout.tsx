import './globals.css';

export const metadata = {
    title: 'Decision Log',
    description: 'A thinking accountability system.',
    openGraph: {
        title: 'Decision Log',
        description: 'A thinking accountability system.',
        type: 'website',
        url: 'https://decision-log.vercel.app', // Placeholder or user-provided
        siteName: 'Decision Log',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Decision Log',
        description: 'A thinking accountability system.',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                <main>{children}</main>
            </body>
        </html>
    );
}
