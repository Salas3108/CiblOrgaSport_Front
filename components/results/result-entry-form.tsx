"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useResults } from "./results-provider"
import { Trophy, Clock, AlertCircle } from "lucide-react"

export function ResultEntryForm() {
  const { events, addResult } = useResults()
  const [selectedEventId, setSelectedEventId] = useState("defaultEventId")
  const [formData, setFormData] = useState({
    athleteId: "",
    athleteName: "",
    country: "",
    time: "",
    position: "",
    lane: "",
    splits: "",
    record: "",
    status: "provisional" as const,
    notes: "",
  })

  const selectedEvent = events.find((e) => e.id === selectedEventId)
  const availableEvents = events.filter((e) => e.status === "in-progress" || e.status === "completed")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedEventId || !formData.athleteName || !formData.time || !formData.position) {
      return
    }

    addResult({
      eventId: selectedEventId,
      athleteId: formData.athleteId || `athlete-${Date.now()}`,
      athleteName: formData.athleteName,
      country: formData.country,
      time: formData.time,
      position: Number.parseInt(formData.position),
      lane: formData.lane ? Number.parseInt(formData.lane) : undefined,
      splits: formData.splits ? formData.splits.split(",").map((s) => s.trim()) : undefined,
      isRecord: (formData.record as any) || null,
      status: formData.status,
    })

    // Reset form
    setFormData({
      athleteId: "",
      athleteName: "",
      country: "",
      time: "",
      position: "",
      lane: "",
      splits: "",
      record: "",
      status: "provisional",
      notes: "",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Trophy className="h-5 w-5" />
          <span>Result Entry</span>
        </CardTitle>
        <CardDescription>Enter competition results manually</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Event Selection */}
          <div className="space-y-2">
            <Label htmlFor="event">Event</Label>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {availableEvents.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name} - {event.stage}
                    <Badge className="ml-2" variant={event.status === "in-progress" ? "default" : "secondary"}>
                      {event.status}
                    </Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedEvent && (
            <>
              {/* Athlete Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="athlete">Athlete</Label>
                  <Select
                    value={formData.athleteId}
                    onValueChange={(value) => {
                      const athlete = selectedEvent.athletes.find((a) => a.id === value)
                      if (athlete) {
                        setFormData((prev) => ({
                          ...prev,
                          athleteId: value,
                          athleteName: athlete.name,
                          country: athlete.country,
                          lane: athlete.lane?.toString() || "",
                        }))
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select athlete" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedEvent.athletes.map((athlete) => (
                        <SelectItem key={athlete.id} value={athlete.id}>
                          {athlete.name} ({athlete.country}) - Lane {athlete.lane}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-athlete">Or Enter Manually</Label>
                  <Input
                    placeholder="Athlete name"
                    value={formData.athleteName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, athleteName: e.target.value }))}
                  />
                </div>
              </div>

              {/* Result Details */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    placeholder="MM:SS.ms"
                    value={formData.time}
                    onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    type="number"
                    placeholder="1, 2, 3..."
                    value={formData.position}
                    onChange={(e) => setFormData((prev) => ({ ...prev, position: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lane">Lane</Label>
                  <Input
                    type="number"
                    placeholder="Lane number"
                    value={formData.lane}
                    onChange={(e) => setFormData((prev) => ({ ...prev, lane: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    placeholder="FRA, GBR, GER..."
                    value={formData.country}
                    onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="record">Record</Label>
                  <Select
                    value={formData.record}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, record: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No record" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No record</SelectItem>
                      <SelectItem value="WR">World Record</SelectItem>
                      <SelectItem value="ER">European Record</SelectItem>
                      <SelectItem value="CR">Championship Record</SelectItem>
                      <SelectItem value="NR">National Record</SelectItem>
                      <SelectItem value="PB">Personal Best</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Splits */}
              <div className="space-y-2">
                <Label htmlFor="splits">Split Times (optional)</Label>
                <Input
                  placeholder="25.32, 52.18, 1:18.45, 1:44.15"
                  value={formData.splits}
                  onChange={(e) => setFormData((prev) => ({ ...prev, splits: e.target.value }))}
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="provisional">Provisional</SelectItem>
                    <SelectItem value="official">Official</SelectItem>
                    <SelectItem value="disqualified">Disqualified</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  placeholder="Additional observations or comments"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <Button type="submit" className="w-full">
                <Clock className="h-4 w-4 mr-2" />
                Submit Result
              </Button>
            </>
          )}

          {!selectedEvent && (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Select an event to enter results</p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
