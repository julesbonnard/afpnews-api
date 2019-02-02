// @ts-ignore
import axios from 'axios'
// @ts-ignore
import FormData from 'form-data'
import { Form, Headers, Params, Query } from './types'

export async function get (
  url: string,
  {
    headers,
    params
  }: {
    params?: {
      grant_type: string
    },
    headers?: Headers
  } = {}) {
  try {
    const response = await axios({
      headers,
      method: 'get',
      params,
      url
    })

    return response.data
  } catch (e) {
    return Promise.reject(e)
  }
}

export async function post (
  url: string,
  data: {} | Query = {},
  {
    headers,
    formData
  }: {
    headers?: Headers,
    formData?: Form
  }) {
  try {
    if (typeof formData === 'object') {
      const form = new FormData()
      for (const item of Object.keys(formData)) {
        form.append(item, formData[item])
      }

      if (typeof form.getHeaders === 'function') {
        headers = Object.assign({}, headers, form.getHeaders())
      }

      const response = await axios.post(url, form, {
        headers
      })

      return response.data
    } else {
      const response = await axios.post(url, data, {
        headers
      })

      return response.data
    }
  } catch (e) {
    return Promise.reject(e)
  }
}
