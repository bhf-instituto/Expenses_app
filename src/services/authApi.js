import { API_PATHS } from '../config/api.js'
import { httpClient } from '../lib/httpClient.js'

function ensureOk(data) {
  if (data?.ok === false) {
    const message = data?.data?.message ?? data?.message ?? 'Request failed.'
    const error = new Error(message)
    error.response = { data }
    throw error
  }

  return data
}

export async function registerUser(payload) {
  const { data } = await httpClient.post(API_PATHS.register, payload)
  return ensureOk(data)
}

export async function loginUser(payload) {
  const { data } = await httpClient.post(API_PATHS.login, payload)
  return ensureOk(data)
}

export async function logoutUser() {
  const { data } = await httpClient.post(API_PATHS.logout, {})
  return ensureOk(data)
}

export async function getMe() {
  const { data } = await httpClient.get(API_PATHS.me)
  return ensureOk(data)
}

export async function getHealth() {
  const { data } = await httpClient.get(API_PATHS.health)
  return ensureOk(data)
}
