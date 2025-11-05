import "./globals.css";

export const metadata = {
    title: "My App",
    description: "Next.js fullstack starter",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
        <body>{children}</body>
        </html>
    );
}
