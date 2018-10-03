import chai from 'chai'
import { normalize } from '../src/normalizer.js'

const expect = chai.expect

describe('AFP News Normalizer', () => {
  it('should throw if query is not a string', () => {
    expect(() => normalize(['cat'])).to.throw()
  })
  it('should lowercase value', () => {
    expect(normalize('Cat')).to.be.equal('cat')
  })
  it('should remove accents', () => {
    expect(normalize('pépé')).to.be.equal('pepe')
  })
  it('should trim the string', () => {
    expect(normalize(' dog')).to.be.equal('dog')
  })
})
