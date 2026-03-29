"use client"

import React, { useEffect, useState, useRef } from 'react'
import { getMe } from '@/src/api/authService'
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ViePriveePage() {
  const [data, setData] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  async function exportPdf() {
    try {
      const jspdfModule = await import('jspdf')
      const jsPDFClass = (jspdfModule && (jspdfModule.jsPDF ?? jspdfModule.default ?? jspdfModule))
      if (!jsPDFClass) throw new Error('jspdf not found')

      const pdf = new jsPDFClass('p', 'mm', 'a4')
      const margin = 15
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      let y = 20

      pdf.setFontSize(14)
      pdf.text('Vie privée — informations du compte', margin, y)
      y += 10
      pdf.setFontSize(11)

      const preferredLocal = [
        'username', 'nom', 'prenom', 'email', 'id', 'role', 'validated',
        'createdAt', 'updatedAt', 'dateNaissance', 'pays', 'sexe', 'docs', 'documents'
      ]

      const entriesLocal = Object.entries(data || {})
      entriesLocal.sort((a, b) => {
        const ai = preferredLocal.indexOf(a[0])
        const bi = preferredLocal.indexOf(b[0])
        if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
        return a[0].localeCompare(b[0])
      })

      for (const [key, value] of entriesLocal) {
        if (key === 'password') continue

        // prepare text for this field
        let label = `${key}: `
        let text = ''

        if (Array.isArray(value)) {
          text = value.map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join('\n')
        } else if (typeof value === 'object' && value !== null) {
          text = JSON.stringify(value)
        } else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          try { text = new Date(value).toLocaleString() } catch { text = String(value) }
        } else {
          text = value == null ? '' : String(value)
        }

        const lines = pdf.splitTextToSize(label + text, pageWidth - margin * 2)

        for (const line of lines) {
          if (y > pageHeight - margin) {
            pdf.addPage()
            y = margin
          }
          pdf.text(line, margin, y)
          y += 7
        }
        y += 3
      }

      pdf.save('vie-privee.pdf')
    } catch (e) {
      console.error('PDF export failed', e)
      setError('Export PDF échoué — vérifiez que jspdf est installé')
    }
  }

  useEffect(() => {
    let mounted = true
    setLoading(true)
    getMe()
      .then((res) => {
        if (!mounted) return
        // Never expose password on the client
        if (res && typeof res === 'object') delete (res as any).password
        setData(res)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err?.message || 'Erreur lors de la récupération des informations')
      })
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [])

  if (loading) return <div>Chargement des informations de compte…</div>
  if (error) return <div className="text-red-600">{error}</div>
  if (!data) return <div>Aucune information disponible.</div>

  // preferred order for display
  const preferred = [
    'username', 'nom', 'prenom', 'email', 'id', 'role', 'validated',
    'createdAt', 'updatedAt', 'dateNaissance', 'pays', 'sexe', 'docs', 'documents'
  ]

  const entries = Object.entries(data)
  // sort: preferred first (in order), then others alphabetically
  entries.sort((a, b) => {
    const ai = preferred.indexOf(a[0])
    const bi = preferred.indexOf(b[0])
    if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    return a[0].localeCompare(b[0])
  })

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Vie privée — informations du compte</CardTitle>
          <CardDescription>Liste des informations connues pour votre compte</CardDescription>
        </CardHeader>

        <CardContent ref={containerRef}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {entries.map(([key, value]) => {
          if (key === 'password') return null
          // render documents / docs arrays specially
          if (Array.isArray(value) && value.length > 0 && (key.toLowerCase().includes('doc') || key.toLowerCase().includes('documents'))) {
            return (
              <div key={key} className="mb-3">
                <div className="text-sm text-gray-500">{key}</div>
                <ul className="list-disc pl-5">
                  {value.map((d: any, i: number) => (
                    <li key={i}>
                      {typeof d === 'string' && d.startsWith('http') ? (
                        <a href={d} target="_blank" rel="noreferrer" className="text-blue-600 underline">Télécharger / Voir</a>
                      ) : (
                        <span>{String(d)}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )
          }

          // format dates
          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
            try {
              const dt = new Date(value)
              return (
                <div key={key} className="mb-3">
                  <div className="text-sm text-gray-500">{key}</div>
                  <div>{dt.toLocaleString()}</div>
                </div>
              )
            } catch {
              // fallthrough
            }
          }

          return (
            <div key={key} className="mb-3">
              <div className="text-sm text-gray-500">{key}</div>
              <div>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</div>
            </div>
          )
        })}
          </div>
        </CardContent>

        <CardFooter className="justify-end">
          <Button onClick={exportPdf} size="sm">Exporter en PDF</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
