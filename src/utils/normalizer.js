export function normalize (query) {
  if (typeof query !== 'string')
    throw 'The query must be a string'

  return query
    .toLowerCase()
    .trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}
