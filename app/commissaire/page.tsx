import { Header } from "@/components/header"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ClipboardCheck, Trophy, AlertTriangle, Clock, CheckCircle, XCircle, Edit } from "lucide-react"

export default function OfficialPage() {
  return (
    <ProtectedRoute allowedRoles={["official"]}>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
        </main>
      </div>
    </ProtectedRoute>
  )
}
