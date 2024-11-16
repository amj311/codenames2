import axios from 'axios'

const baseURL = window.location.href.includes('localhost') ? 'http://localhost:3300/api' : '/api'

const api = axios.create({
  baseURL,
})

export default api;
