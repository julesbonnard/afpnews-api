import { describe, it, expect } from 'vitest'
import { parseShotList, timeToSeconds } from '../../src/utils/shotlist'

describe('timeToSeconds', () => {
  it('converts mm:ss to seconds', () => {
    expect(timeToSeconds('00:00')).toBe(0)
    expect(timeToSeconds('00:12')).toBe(12)
    expect(timeToSeconds('01:30')).toBe(90)
    expect(timeToSeconds('10:05')).toBe(605)
  })
})

describe('parseShotList', () => {
  it('parses a simple shot line', () => {
    const shots = parseShotList('1. 00:00-00:12 Vue aérienne de la ville')
    expect(shots).toHaveLength(1)
    expect(shots[0]).toMatchObject({
      numero: 1,
      start: '00:00',
      end: '00:12',
      startSec: 0,
      endSec: 12,
      description: 'Vue aérienne de la ville',
      citations: []
    })
  })

  it('parses several shots separated by newlines', () => {
    const input = [
      '1. 00:00-00:12 Vue aérienne de la ville',
      '2. 00:12-00:30 Plan rapproché sur le monument'
    ].join('\n')
    const shots = parseShotList(input)
    expect(shots).toHaveLength(2)
    expect(shots[1]).toMatchObject({ numero: 2, startSec: 12, endSec: 30 })
  })

  it('parses a SOUNDBITE shot and attaches its citation', () => {
    const input = [
      '1. 00:12-00:30 SOUNDBITE 1 - Jean Dupont, témoin',
      '"Tout a commencé très vite"'
    ].join('\n')
    const shots = parseShotList(input)
    expect(shots).toHaveLength(1)
    expect(shots[0]).toMatchObject({
      numero: 1,
      description: 'Jean Dupont, témoin',
      citations: [{ text: 'Tout a commencé très vite' }]
    })
  })

  it('parses a SONORE shot (case-insensitive)', () => {
    const shots = parseShotList('2. 00:30-00:45 sonore 2 - Marie Martin')
    expect(shots).toHaveLength(1)
    expect(shots[0]).toMatchObject({
      numero: 2,
      description: 'Marie Martin'
    })
  })

  it('ignores lines that do not match the shot format', () => {
    const input = [
      'Titre de la shot list',
      '1. 00:00-00:12 Premier plan',
      'note libre sans timecode'
    ].join('\n')
    const shots = parseShotList(input)
    expect(shots).toHaveLength(1)
    expect(shots[0]?.description).toBe('Premier plan')
  })

  it('returns an empty array for empty input', () => {
    expect(parseShotList('')).toEqual([])
  })
})
