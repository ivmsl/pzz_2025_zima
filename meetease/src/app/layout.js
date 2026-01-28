/**
 * @brief Layout aplikacji MeetEase
 *
 * Layout aplikacji MeetEase, zawiera globalne style CSS i metadane strony.
 *
 * @returns {JSX.Element} Layout aplikacji MeetEase
 *
 * @details
 * - Plik zawiera style dla globalnych elementów HTML, takich jak body, div, itp.
 * - Plik zawiera style dla komponentów Shadcn UI, takich jak Button, Input, itp.
 * - Plik zawiera style dla komponentów Lucide, takich jak User, Calendar, itp.
 */

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
