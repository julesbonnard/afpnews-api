import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { Docs } from '../../src/api/docs'
import { mockFetch } from '../helpers/mockFetch'

function createAuthenticatedDocs() {
  const docs = new Docs()
  docs.token = {
    accessToken: 'test-token',
    refreshToken: 'test-refresh',
    tokenExpires: Date.now() + 60000,
    authType: 'anonymous'
  }
  return docs
}

describe('NotificationCenter (via Docs.notificationCenter)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('registerService', () => {
    it('should register a REST service and return uno', async () => {
      mockFetch({ response: { uno: 'service-123' } })

      const docs = createAuthenticatedDocs()
      const nc = docs.notificationCenter
      const uno = await nc.registerService({
        name: 'myService',
        type: 'rest',
        datas: { href: 'https://webhook.example.com/notify' }
      })

      expect(uno).toBe('service-123')
      const calledUrl = (fetch as Mock<typeof fetch>).mock.calls[0][0]
      expect(calledUrl).toContain('/notification/api/service/register')
    })

    it('should register a mail service', async () => {
      mockFetch({ response: { uno: 'mail-service-123' } })

      const docs = createAuthenticatedDocs()
      const nc = docs.notificationCenter
      const uno = await nc.registerService({
        name: 'mailService',
        type: 'mail',
        datas: { address: 'user@example.com' }
      })

      expect(uno).toBe('mail-service-123')
    })
  })

  describe('listServices', () => {
    it('should return a list of services', async () => {
      mockFetch({
        response: {
          services: [
            {
              serviceIdentifier: 'svc-1',
              serviceName: 'myService',
              serviceType: 'rest',
              createdDate: '2023-01-01T00:00:00Z',
              lastRegisteredDate: '2023-06-01T00:00:00Z',
              shared: false,
              serviceDatas: { href: 'https://webhook.example.com' }
            }
          ]
        }
      })

      const docs = createAuthenticatedDocs()
      const nc = docs.notificationCenter
      const services = await nc.listServices()

      expect(services).toHaveLength(1)
      expect(services[0].serviceName).toBe('myService')
      expect(services[0].serviceType).toBe('rest')
    })

    it('should return empty array when no services', async () => {
      mockFetch({ response: { services: [] } })

      const docs = createAuthenticatedDocs()
      const nc = docs.notificationCenter
      const services = await nc.listServices()

      expect(services).toHaveLength(0)
    })
  })

  describe('deleteService', () => {
    it('should delete a service and return uno', async () => {
      mockFetch({ response: { uno: 'deleted-123' } })

      const docs = createAuthenticatedDocs()
      const nc = docs.notificationCenter
      const uno = await nc.deleteService('myService')

      expect(uno).toBe('deleted-123')
      const calledUrl = (fetch as Mock<typeof fetch>).mock.calls[0][0]
      expect(calledUrl).toContain('/notification/api/service/delete')
      expect(calledUrl).toContain('service=myService')
    })
  })

  describe('addSubscription', () => {
    it('should add a subscription and return uno', async () => {
      mockFetch({ response: { uno: 'sub-123' } })

      const docs = createAuthenticatedDocs()
      const nc = docs.notificationCenter
      const uno = await nc.addSubscription('mySub', 'myService', {
        query: 'country:fra'
      })

      expect(uno).toBe('sub-123')
      const calledUrl = (fetch as Mock<typeof fetch>).mock.calls[0][0]
      expect(calledUrl).toContain('/notification/api/subscription/add')
      expect(calledUrl).toContain('name=mySub')
      expect(calledUrl).toContain('service=myService')
    })
  })

  describe('listSubscriptions', () => {
    it('should return a list of subscriptions', async () => {
      mockFetch({
        response: {
          subscriptions: [
            { name: 'sub1', identifier: 'id1' },
            { name: 'sub2', identifier: 'id2' }
          ]
        }
      })

      const docs = createAuthenticatedDocs()
      const nc = docs.notificationCenter
      const subs = await nc.listSubscriptions()

      expect(subs).toHaveLength(2)
      expect(subs[0].name).toBe('sub1')
      expect(subs[1].identifier).toBe('id2')
    })
  })

  describe('subscriptionsInService', () => {
    it('should list subscriptions for a service', async () => {
      mockFetch({
        response: {
          subscriptions: [
            { name: 'sub1', identifier: 'id1' },
            { name: 'sub2', identifier: 'id2' }
          ]
        }
      })

      const docs = createAuthenticatedDocs()
      const nc = docs.notificationCenter
      const subs = await nc.subscriptionsInService('myService')

      expect(subs).toHaveLength(2)
      const calledUrl = (fetch as Mock<typeof fetch>).mock.calls[0][0]
      expect(calledUrl).toContain('/notification/api/service/subscriptions')
      expect(calledUrl).toContain('service=myService')
    })

    it('should filter out _withoutcreditRate subscriptions', async () => {
      mockFetch({
        response: {
          subscriptions: [
            { name: 'sub1', identifier: 'id1' },
            { name: 'sub2_withoutcreditRate', identifier: 'id2' }
          ]
        }
      })

      const docs = createAuthenticatedDocs()
      const nc = docs.notificationCenter
      const subs = await nc.subscriptionsInService('myService')

      expect(subs).toHaveLength(1)
      expect(subs[0].name).toBe('sub1')
    })
  })

  describe('deleteSubscription', () => {
    it('should delete a subscription', async () => {
      mockFetch({ ok: true })

      const docs = createAuthenticatedDocs()
      const nc = docs.notificationCenter
      await nc.deleteSubscription('myService', 'mySub')

      const calledUrl = (fetch as Mock<typeof fetch>).mock.calls[0][0]
      expect(calledUrl).toContain('/notification/api/subscription/delete')
      expect(calledUrl).toContain('service=myService')
      expect(calledUrl).toContain('name=mySub')
    })
  })

  describe('removeSubscriptionsFromService', () => {
    it('should remove subscriptions and return results', async () => {
      mockFetch({
        response: {
          names: [
            { name: 'sub1', status: 'deleted' },
            { name: 'sub2', status: 'deleted' }
          ]
        }
      })

      const docs = createAuthenticatedDocs()
      const nc = docs.notificationCenter
      const result = await nc.removeSubscriptionsFromService('myService', ['sub1', 'sub2'])

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({ name: 'sub1', status: 'deleted' })

      const calledOptions = (fetch as Mock<typeof fetch>).mock.calls[0][1]!
      expect(calledOptions.method).toBe('DELETE')
      expect(calledOptions.body).toBe(JSON.stringify(['sub1', 'sub2']))
    })
  })
})
