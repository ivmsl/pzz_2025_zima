import "./globals.css";

export const metadata = {
    title: "MeetEase - Planuj, Twórz, Zapraszaj",
    description: "Webowa aplikacja, która ułatwia planowanie wspólnych spotkań, projektów i wydarzeń",
};

export default function RootLayout({ children }) {
    return (
        <html lang="pl">
        <body>{children}</body>
        </html>
    );
}
