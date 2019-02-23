export function normalize (query: string | undefined): string {
  if (typeof query !== 'string') {
    throw new Error('The query must be a string')
  }

  return query
    .toLowerCase()
    .trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}
