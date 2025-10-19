"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSecurity } from "./security-provider"
import { Shield, AlertTriangle, CheckCircle, Clock, MessageSquare, Plus } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

const severityColors = {
  low: "bg-blue-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  critical: "bg-red-500",
}

const statusColors = {
  reported: "bg-yellow-500",
  investigating: "bg-blue-500",
  resolved: "bg-green-500",
  closed: "bg-gray-500",
}

export function SecurityDashboard() {
  const { incidents, alerts, updateIncident, addIncidentUpdate, createAlert, dismissAlert, getActiveAlerts } =
    useSecurity()
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null)
  const [updateMessage, setUpdateMessage] = useState("")
  const [newAlertData, setNewAlertData] = useState({
    title: "",
    message: "",
    type: "info" as const,
    venue: "",
  })

  const activeAlerts = getActiveAlerts()
  const activeIncidents = incidents.filter((i) => i.status !== "closed")
  const recentIncidents = incidents.slice(0, 10)

  const handleStatusUpdate = (incidentId: string, newStatus: string) => {
    updateIncident(incidentId, { status: newStatus as any })
  }

  const handleAddUpdate = (incidentId: string) => {
    if (updateMessage.trim()) {
      addIncidentUpdate(incidentId, updateMessage, "Security Admin")
      setUpdateMessage("")
    }
  }

  const handleCreateAlert = () => {
    if (newAlertData.title && newAlertData.message) {
      createAlert({
        ...newAlertData,
        isActive: true,
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
      })
      setNewAlertData({ title: "", message: "", type: "info", venue: "" })
    }
  }

  return (
    <div className="space-y-6">
      {/* Security Status Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Incidents</p>
                <p className="text-2xl font-bold">{activeIncidents.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold">{activeAlerts.length}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved Today</p>
                <p className="text-2xl font-bold">
                  {
                    incidents.filter(
                      (i) =>
                        i.status === "resolved" &&
                        i.resolvedAt &&
                        i.resolvedAt > new Date(Date.now() - 24 * 60 * 60 * 1000),
                    ).length
                  }
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Response Time</p>
                <p className="text-2xl font-bold">8m</p>
                <p className="text-xs text-muted-foreground">Average</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="incidents" className="space-y-6">
        <TabsList>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="alerts">Security Alerts</TabsTrigger>
          <TabsTrigger value="create-alert">Create Alert</TabsTrigger>
        </TabsList>

        <TabsContent value="incidents" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Incidents List */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Incidents</CardTitle>
                <CardDescription>Manage and track security incidents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentIncidents.map((incident) => (
                  <div
                    key={incident.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedIncident === incident.id ? "bg-muted" : "hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedIncident(incident.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{incident.title}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge className={`${severityColors[incident.severity]} text-white text-xs`}>
                          {incident.severity}
                        </Badge>
                        <Badge className={`${statusColors[incident.status]} text-white text-xs`}>
                          {incident.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{incident.location}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(incident.reportedAt, { addSuffix: true })} by {incident.reportedBy}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Incident Details */}
            {selectedIncident && (
              <Card>
                <CardHeader>
                  <CardTitle>Incident Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const incident = incidents.find((i) => i.id === selectedIncident)
                    if (!incident) return null

                    return (
                      <>
                        <div className="space-y-2">
                          <h4 className="font-medium">{incident.title}</h4>
                          <p className="text-sm text-muted-foreground">{incident.description}</p>
                          <div className="flex items-center space-x-4 text-sm">
                            <span>Type: {incident.type}</span>
                            <span>Location: {incident.location}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Status</label>
                          <Select
                            value={incident.status}
                            onValueChange={(value) => handleStatusUpdate(incident.id, value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="reported">Reported</SelectItem>
                              <SelectItem value="investigating">Investigating</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Add Update</label>
                          <Textarea
                            placeholder="Add status update or notes"
                            value={updateMessage}
                            onChange={(e) => setUpdateMessage(e.target.value)}
                          />
                          <Button onClick={() => handleAddUpdate(incident.id)} disabled={!updateMessage.trim()}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Add Update
                          </Button>
                        </div>

                        {incident.updates.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium">Updates</h5>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {incident.updates.map((update) => (
                                <div key={update.id} className="p-2 border rounded text-sm">
                                  <p>{update.message}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {formatDistanceToNow(update.timestamp, { addSuffix: true })} by {update.author}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Security Alerts</CardTitle>
              <CardDescription>Manage public security alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No active security alerts</p>
                </div>
              ) : (
                activeAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{alert.title}</h4>
                        <Badge
                          variant={
                            alert.type === "emergency"
                              ? "destructive"
                              : alert.type === "warning"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {alert.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">
                        Created {formatDistanceToNow(alert.createdAt, { addSuffix: true })}
                        {alert.venue && ` • ${alert.venue}`}
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => dismissAlert(alert.id)}>
                      Dismiss
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create-alert" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Create Security Alert</span>
              </CardTitle>
              <CardDescription>Send security alerts to users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Alert Type</label>
                  <Select
                    value={newAlertData.type}
                    onValueChange={(value) => setNewAlertData((prev) => ({ ...prev, type: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Information</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Venue (Optional)</label>
                  <Select
                    value={newAlertData.venue}
                    onValueChange={(value) => setNewAlertData((prev) => ({ ...prev, venue: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All venues" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All venues</SelectItem>
                      <SelectItem value="Centre Aquatique Olympique">Centre Aquatique Olympique</SelectItem>
                      <SelectItem value="Training Center">Training Center</SelectItem>
                      <SelectItem value="Fan Zone République">Fan Zone République</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Alert Title</label>
                <Input
                  placeholder="Brief alert title"
                  value={newAlertData.title}
                  onChange={(e) => setNewAlertData((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Alert Message</label>
                <Textarea
                  placeholder="Detailed alert message"
                  value={newAlertData.message}
                  onChange={(e) => setNewAlertData((prev) => ({ ...prev, message: e.target.value }))}
                  rows={4}
                />
              </div>

              <Button onClick={handleCreateAlert} className="w-full">
                <Shield className="h-4 w-4 mr-2" />
                Create Alert
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
