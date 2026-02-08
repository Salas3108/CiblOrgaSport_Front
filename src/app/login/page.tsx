export const metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre compte CiblOrgaSport"
}

import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4" aria-label="Page de connexion">
      <h1 className="sr-only">Page de connexion</h1>
      <LoginForm />
    </main>
  )
}
