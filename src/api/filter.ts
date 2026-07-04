import type { ApiCore } from '../index.js'
import type { SearchQueryParams } from '../types.js'
import { get, post } from '../utils/request.js'

export function FilterCenter (this: ApiCore) {
  const baseFilterUrl = `${this.baseUrl}/v1/user/filter`

  return {

    /**
     * Add a new saved filter
     * @param name - The filter name
     * @param params - The search parameters for the filter
     * @returns The API response
     */
    add: async (name: string, params: SearchQueryParams) => {
      const body = this.prepareRequest(params)
      const data = await this.withAuth(() => post(`${baseFilterUrl}/add`, body, {
        headers: this.authorizationBearerHeaders,
        params: {
          name,
          wt: 'json'
        }
      }))

      return data
    },

    /**
     * Update an existing saved filter
     * @param name - The filter name
     * @param params - The new search parameters for the filter
     * @returns The API response
     */
    update: async (name: string, params: SearchQueryParams) => {
      const body = this.prepareRequest(params)
      const data = await this.withAuth(() => post(`${baseFilterUrl}/update`, body, {
        headers: this.authorizationBearerHeaders,
        params: {
          name,
          wt: 'json'
        }
      }))

      return data
    },

    /**
     * Get a saved filter by name
     * @param name - The filter name
     * @returns The filter data
     */
    get: async (name: string) => {
      const data = await this.withAuth(() => get(`${baseFilterUrl}/get`, {
        headers: this.authorizationBearerHeaders,
        params: {
          name,
          wt: 'json'
        }
      }))

      return data
    },

    /**
     * Delete a saved filter
     * @param name - The filter name
     * @returns The API response
     */
    delete: async (name: string) => {
      const data = await this.withAuth(() => get(`${baseFilterUrl}/delete`, {
        headers: this.authorizationBearerHeaders,
        params: {
          name,
          wt: 'json'
        }
      }))

      return data
    },

    /**
     * List all saved filters
     * @returns All filters
     */
    all: async () => {
      const data = await this.withAuth(() => get(`${baseFilterUrl}/all`, {
        headers: this.authorizationBearerHeaders,
        params: {
          wt: 'json'
        }
      }))

      return data
    }
  }
}
