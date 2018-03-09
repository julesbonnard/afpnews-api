import FormData from 'form-data'
import axios from 'axios'

export async function get (url, { params, headers }) {
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
    if (formData) {
      const form = new FormData()
      for (const item in formData) {
        form.append(item, formData[item])
      }

      data = Object.assign(data, form)

      if (typeof form.getHeaders === 'function') {
        headers = Object.assign({}, headers, form.getHeaders())
      }
    }

    const response = await axios({
      method: 'post',
      url,
      data,
      headers
    })

    return response.data
  } catch (e) {
    return Promise.reject(e)
  }
}
