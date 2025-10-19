"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useResults } from "./results-provider"
import { Trophy, Medal, Clock, Flag } from "lucide-react"

const medalColors = {
  1: "text-yellow-500",
  2: "text-gray-400",
  3: "text-amber-600",
}

const recordColors = {
  WR: "bg-red-500",
  ER: "bg-blue-500",
  CR: "bg-green-500",
  NR: "bg-purple-500",
  PB: "bg-orange-500",
}

export function LiveResultsBoard() {
  const { events } = useResults()

  const liveEvents = events.filter((e) => e.status === "in-progress" || e.status === "completed")
  const completedEvents = events.filter((e) => e.status === "completed" && e.results.length > 0)

  return (
    <div className="space-y-6">
      {/* Live Events */}
      {liveEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5" />
              <span>Live Events</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {liveEvents.map((event) => (
              <div key={event.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{event.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {event.stage} • {event.scheduledTime} • {event.venue}
                    </p>
                  </div>
                  <Badge variant={event.status === "in-progress" ? "default" : "secondary"}>
                    {event.status === "in-progress" ? "LIVE" : event.status}
                  </Badge>
                </div>

                {event.results.length > 0 ? (
                  <div className="space-y-2">
                    {event.results
                      .sort((a, b) => a.position - b.position)
                      .slice(0, 8)
                      .map((result) => (
                        <div key={result.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 text-center">
                              {result.position <= 3 ? (
                                <Medal
                                  className={`h-4 w-4 ${medalColors[result.position as keyof typeof medalColors]}`}
                                />
                              ) : (
                                <span className="text-sm font-medium">{result.position}</span>
                              )}
                            </div>
                            <div>
                              <div className="font-medium">
                                {result.athleteName}
                                <Flag className="inline h-3 w-3 ml-1" />
                                <span className="text-xs ml-1">{result.country}</span>
                              </div>
                              {result.lane && <div className="text-xs text-muted-foreground">Lane {result.lane}</div>}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold">{result.time}</div>
                            <div className="flex items-center space-x-1">
                              {result.isRecord && (
                                <Badge className={`text-xs ${recordColors[result.isRecord]} text-white`}>
                                  {result.isRecord}
                                </Badge>
                              )}
                              <Badge
                                variant={result.status === "official" ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {result.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Clock className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Waiting for results...</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Results */}
      {completedEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {completedEvents.slice(0, 3).map((event) => {
              const topResults = event.results.sort((a, b) => a.position - b.position).slice(0, 3)
              return (
                <div key={event.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{event.name}</h3>
                      <p className="text-sm text-muted-foreground">{event.stage} • Final Results</p>
                    </div>
                    <Badge variant="outline">Completed</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {topResults.map((result, index) => (
                      <div key={result.id} className="text-center p-3 border rounded">
                        <Medal
                          className={`h-6 w-6 mx-auto mb-2 ${medalColors[(index + 1) as keyof typeof medalColors]}`}
                        />
                        <div className="font-medium text-sm">{result.athleteName}</div>
                        <div className="text-xs text-muted-foreground">{result.country}</div>
                        <div className="font-mono font-bold mt-1">{result.time}</div>
                        {result.isRecord && (
                          <Badge className={`text-xs mt-1 ${recordColors[result.isRecord]} text-white`}>
                            {result.isRecord}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {liveEvents.length === 0 && completedEvents.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Results Available</h3>
            <p className="text-muted-foreground">Results will appear here as events are completed</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
