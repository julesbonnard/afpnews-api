import FormData from 'form-data'
import axios from 'axios'

export async function get (url, { params = {}, headers = {} }) {
  try {
    const response = await axios({
      method: 'get',
      url,
      params,
      headers
    })

    return response.data
  } catch (e) {
    return Promise.reject(e)
  }
}

export async function post (url, data = {}, { formData, headers }) {
  try {
    if (typeof formData === 'object') {
      const form = new FormData()
      for (const item in formData) {
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
