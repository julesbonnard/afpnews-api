import chai from 'chai'
import { normalize } from '../src/normalizer.js'

const expect = chai.expect

describe('AFP News Normalizer', () => {
  it('should lowercase value', async () => {
    expect(normalize('Cat')).to.be.equal('cat')
  })
  it('should remove accents', () => {
    expect(normalize('pépé')).to.be.equal('pepe')
  })
  it('should trim the string', () => {
    expect(normalize(' benalla')).to.be.equal('benalla')
  })
})
