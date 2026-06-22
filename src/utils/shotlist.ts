/**
 * Parse la shot list d'une vidéo AFP à partir d'un texte brut (gère SONORE et SOUNDBITE).
 * Tolère les erreurs de format et extrait les durées de chaque plan.
 */

export interface Citation {
  text: string
}

export interface Shot {
  numero: number
  start: string
  end: string
  startSec: number
  endSec: number
  description: string
  citations: Citation[]
}

export function timeToSeconds (time: string): number {
  const [minutes = 0, seconds = 0] = time.split(':').map(Number)
  return minutes * 60 + seconds
}

export function parseShotList (input: string): Shot[] {
  const lines = input.split('\n').map(line => line.trim())
  const shots: Shot[] = []

  const shotRegex = /^(\d+)\.\s+(\d{2}:\d{2})-(\d{2}:\d{2})\s+(.*)$/
  const soundbiteRegex =
    /^(\d+)\.\s+(\d{2}:\d{2})-(\d{2}:\d{2})\s+(?:SONORE|SOUNDBITE) \d+ - (.*)$/i

  let currentShot: Shot | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (!line) continue

    const matchSoundbite = line.match(soundbiteRegex)
    if (matchSoundbite) {
      const [, numero = '', start = '', end = '', description = ''] =
        matchSoundbite
      currentShot = {
        numero: parseInt(numero || '0', 10),
        start: start || '00:00',
        end: end || '00:00',
        startSec: timeToSeconds(start || '00:00'),
        endSec: timeToSeconds(end || '00:00'),
        description: description || '',
        citations: []
      }
      shots.push(currentShot)
      continue
    }

    const matchShot = line.match(shotRegex)
    if (matchShot && !line.includes('SOUNDBITE') && !line.includes('SONORE')) {
      const [, numero = '', start = '', end = '', description = ''] = matchShot
      currentShot = {
        numero: parseInt(numero || '0', 10),
        start: start || '00:00',
        end: end || '00:00',
        startSec: timeToSeconds(start || '00:00'),
        endSec: timeToSeconds(end || '00:00'),
        description: description || '',
        citations: []
      }
      shots.push(currentShot)
      continue
    }

    // Traiter les citations s'il y a un plan courant
    if (currentShot && line.startsWith('"') && line.endsWith('"')) {
      const citationText = line.slice(1, -1)
      currentShot.citations.push({ text: citationText })
      continue
    }

    // Gestion des erreurs de format
    if (
      currentShot &&
      currentShot.description.startsWith('SOUNDBITE') &&
      line &&
      !line.startsWith('"')
    ) {
      // Peut être un début de citation oubliant les guillemets
      currentShot.citations.push({ text: line })
    }
  }

  return shots
}
