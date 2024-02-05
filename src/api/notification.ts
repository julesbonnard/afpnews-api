import type ApiCore from '../'
import { SearchQueryParams } from '../types'
import { del, get, post } from '../utils/request'
import { z } from 'zod'

const httpServiceData = z.object({
  href: z.string(),
  user: z.string(),
  password: z.string()
})

const mailServiceData = z.object({
  address: z.string()
})

const activeMQServiceData = z.object({
  url: z.string(),
  type: z.string(),
  queueName: z.string(),
  username: z.string(),
  password: z.string(),
  ttlInSeconds: z.string(),
  qosEnabled: z.string(),
  deliveryMode: z.string()
})

const sQSServiceData = z.object({
  accessKey: z.string(),
  secretKey: z.string(),
  region: z.string(),
  queue: z.string(),
  ownerId: z.string()
})

const serviceData = z.union([httpServiceData, mailServiceData, activeMQServiceData, sQSServiceData])
const serviceType = z.enum(['mail', 'rest', 'sqs', 'jms'])

const registerService = z.object({
  datas: serviceData,
  name: z.string(),
  type: serviceType
})

const serviceRegisterSchema = z.object({
  response: z.object({
    uno: z.string()
  })
})

const serviceListSchema = z.object({
  response: z.object({
    services: z.object({
      serviceName: z.string(),
      serviceType: serviceType,
      createdDate: z.coerce.date(),
      lastRegisteredDate: z.coerce.date(),
      shared: z.boolean(),
      serviceDatas: serviceData
    }).array().default([])
  })
})

const subscriptionListSchema = z.object({
  response: z.object({
    subscriptions: z.object({
      name: z.string(),
      identifier: z.string()
    }).array().default([])
  })
})

const subscriptionDeleteSchema = z.object({
  response: z.object({
    names: z.object({
      name: z.string(),
      status: z.string()
    }).array().default([])
  })
})

export function NotificationCenter (this: ApiCore) {
  const baseNotificationUrl = `${this.baseUrl}/notification/api`

  return {
    registerService: async (service: z.infer<typeof registerService>) => {
      await this.authenticate()
      const data = await post(`${baseNotificationUrl}/service/register`, service, {
        headers: this.authorizationBearerHeaders
      })

      return serviceRegisterSchema.parse(data).response.uno
    },
    listServices: async () => {
      await this.authenticate()
      const data = await get(`${baseNotificationUrl}/service/list`, {
        headers: this.authorizationBearerHeaders
      })

      return serviceListSchema.parse(data).response.services
    },
    deleteService: async (service: string) => {
      await this.authenticate()
      const data = await del(`${baseNotificationUrl}/service/delete`, {
        headers: this.authorizationBearerHeaders,
        params: {
          service
        }
      })

      return serviceRegisterSchema.parse(data).response.uno
    },
    addSubscription: async (name: string, service: string, params: SearchQueryParams) => {
      await this.authenticate()
      const query = this.prepareRequest(params).query
      const data = await post(`${baseNotificationUrl}/subscription/add`, { query }, {
        headers: this.authorizationBearerHeaders,
        params: {
          name,
          service
        }
      })

      return serviceRegisterSchema.parse(data).response.uno
    },
    listSubscriptions: async () => {
      await this.authenticate()
      const data = await get(`${baseNotificationUrl}/subscription/list`, {
        headers: this.authorizationBearerHeaders
      })

      return subscriptionListSchema.parse(data).response.subscriptions
    },
    deleteSubscription: async (service: string, name: string) => {
      await this.authenticate()
      const data = await del(`${baseNotificationUrl}/subscription/delete`, {
        headers: this.authorizationBearerHeaders,
        params: {
          service,
          name
        }
      })

      return data
    },
    removeSubscriptionsFromService: async (service: string, subscriptions: string[]) => {
      await this.authenticate()
      const data = await del(`${baseNotificationUrl}/service/remove`, {
        headers: this.authorizationBearerHeaders,
        params: {
          service
        }
      }, subscriptions)

      return subscriptionDeleteSchema.parse(data).response.names
    },
    subscriptionsInService: async (service: string) => {
      await this.authenticate()

      const data = await get(`${baseNotificationUrl}/service/subscriptions`, {
        headers: this.authorizationBearerHeaders,
        params: {
          service: service
        }
      })

      return subscriptionListSchema.parse(data).response.subscriptions.filter(subscription => ! subscription.name.endsWith('_withoutcreditRate'))
    }
  }
}
