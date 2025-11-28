import { AuthProvider } from '@/lib/auth/authContext';
import './globals.css';

export const metadata = {
  title: 'CiblOrgaSport',
  description: 'Plateforme de gestion d\'événements sportifs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}