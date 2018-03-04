import FormData from 'form-data'
import axios from 'axios'

export async function get (uri, { params, headers }) {
  try {
    const response = await axios.get(uri, {
      params,
      headers
    })

    return response.data
  } catch (e) {
    return Promise.reject(e)
  }
}

export async function post (uri, { formData, headers }) {
  try {
    const form = new FormData()
    for (const item in formData) {
      form.append(item, formData[item])
    }

    const response = await axios.post(uri, form, {
      headers
    })

    return response.data
  } catch (e) {
    return Promise.reject(e)
  }
}
