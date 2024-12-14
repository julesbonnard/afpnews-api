import { type ApiCore } from '..'
import { SearchQueryParams } from '../types'
import { del, get, post } from '../utils/request'
import { z } from 'zod'

const httpServiceData = z.object({
  href: z.string(),
  user: z.string().optional(),
  password: z.string().optional()
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      serviceIdentifier: z.string(),
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

    /**
     * Register a new mail, rest, sqs or jms service to get notifications
     * @param service - An object containing the service type and parameters
     * @returns A unique identifier for the service
     */
    registerService: async (service: z.infer<typeof registerService>) => {
      await this.authenticate()
      const data = await post(`${baseNotificationUrl}/service/register`, service, {
        headers: this.authorizationBearerHeaders
      })

      return serviceRegisterSchema.parse(data).response.uno
    },

    /**
     * List existing services link to the current user
     * @returns List of objects containing the service name, type and parameters
     */
    listServices: async () => {
      await this.authenticate()
      const data = await get(`${baseNotificationUrl}/service/list`, {
        headers: this.authorizationBearerHeaders
      })

      return serviceListSchema.parse(data).response.services
    },

    /**
     * Delete a service
     * @param service - The name of the service to delete
     * @returns A unique identifier for the deleted service
     */
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

    /**
     * Add a subscription to an existing service
     * @param name - The name of the subcription
     * @param service - The name of the subscription service
     * @param params - An object containing the search parameters to subscribe to
     * @returns A unique identifier for the subscription
     */
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

    /**
     * List all existing subscriptions
     * @returns An array with the name and identifier of the subscriptions
     */
    listSubscriptions: async () => {
      await this.authenticate()
      const data = await get(`${baseNotificationUrl}/subscription/list`, {
        headers: this.authorizationBearerHeaders
      })

      return subscriptionListSchema.parse(data).response.subscriptions
    },

    /**
     * List existing subscriptions in a service
     * @param service - The name of the subscription service
     * @returns The list of active subscriptions
     */
    subscriptionsInService: async (service: string) => {
      await this.authenticate()

      const data = await get(`${baseNotificationUrl}/service/subscriptions`, {
        headers: this.authorizationBearerHeaders,
        params: {
          service: service
        }
      })

      return subscriptionListSchema.parse(data).response.subscriptions.filter(subscription => ! subscription.name.endsWith('_withoutcreditRate'))
    },

    /**
     * Delete existing subscription
     * @param service - The name of the subscription service
     * @param name - The name of the subscription to delete
     * @returns The name of the deleted subscription
     */
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

    /**
     * Delete some subscriptions from a service
     * @param service - The name of the subscription service
     * @param subscriptions - The names of the subscriptions to delete
     * @returns The list of deleted subscriptions
     */
    removeSubscriptionsFromService: async (service: string, subscriptions: string[]) => {
      await this.authenticate()
      const data = await del(`${baseNotificationUrl}/service/remove`, {
        headers: this.authorizationBearerHeaders,
        params: {
          service
        }
      }, subscriptions)

      return subscriptionDeleteSchema.parse(data).response.names
    }
  }
}
