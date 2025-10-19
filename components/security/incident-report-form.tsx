"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSecurity } from "./security-provider"
import { useAuth } from "@/components/auth/auth-provider"
import { AlertTriangle, Shield, Phone } from "lucide-react"

export function IncidentReportForm() {
  const { addIncident } = useSecurity()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    severity: "",
    location: "",
    venue: "",
    affectedAudience: "venue-specific" as const,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      addIncident({
        ...formData,
        type: formData.type as any,
        severity: formData.severity as any,
        status: "reported",
        reportedBy: user?.name || "Anonymous",
      })

      setSubmitted(true)
      setFormData({
        title: "",
        description: "",
        type: "",
        severity: "",
        location: "",
        venue: "",
        affectedAudience: "venue-specific",
      })
    } catch (error) {
      console.error("Failed to submit incident:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Shield className="h-12 w-12 mx-auto text-green-500" />
            <div>
              <h3 className="text-lg font-semibold">Incident Reported</h3>
              <p className="text-muted-foreground">
                Your incident report has been submitted and security teams have been notified.
              </p>
            </div>
            <Button onClick={() => setSubmitted(false)}>Report Another Incident</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5" />
          <span>Report Incident</span>
        </CardTitle>
        <CardDescription>Report security, medical, or operational incidents</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <Phone className="h-4 w-4" />
          <AlertDescription>
            <strong>Emergency:</strong> For immediate emergencies, call security at <strong>112</strong> or use
            emergency phones located throughout the venue.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Incident Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="security">Security Issue</SelectItem>
                  <SelectItem value="medical">Medical Emergency</SelectItem>
                  <SelectItem value="technical">Technical Problem</SelectItem>
                  <SelectItem value="weather">Weather Related</SelectItem>
                  <SelectItem value="crowd">Crowd Control</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Severity Level</Label>
              <Select
                value={formData.severity}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, severity: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Minor issue</SelectItem>
                  <SelectItem value="medium">Medium - Requires attention</SelectItem>
                  <SelectItem value="high">High - Urgent response needed</SelectItem>
                  <SelectItem value="critical">Critical - Immediate action required</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Incident Title</Label>
            <Input
              placeholder="Brief description of the incident"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Detailed Description</Label>
            <Textarea
              placeholder="Provide detailed information about what happened, when, and any other relevant details"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              required
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="venue">Venue</Label>
              <Select
                value={formData.venue}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, venue: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select venue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Centre Aquatique Olympique">Centre Aquatique Olympique</SelectItem>
                  <SelectItem value="Training Center">Training Center</SelectItem>
                  <SelectItem value="Fan Zone République">Fan Zone République</SelectItem>
                  <SelectItem value="Fan Zone Bastille">Fan Zone Bastille</SelectItem>
                  <SelectItem value="Other">Other Location</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Specific Location</Label>
              <Input
                placeholder="Section, row, room number, etc."
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="audience">Affected Audience</Label>
            <Select
              value={formData.affectedAudience}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, affectedAudience: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="venue-specific">This venue only</SelectItem>
                <SelectItem value="commissioners">Officials only</SelectItem>
                <SelectItem value="commissioners-athletes">Officials and athletes</SelectItem>
                <SelectItem value="all">All users</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Incident Report"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
