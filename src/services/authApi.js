import { API_PATHS } from '../config/api.js'
import { httpClient } from '../lib/httpClient.js'
import { ensureApiOk } from '../lib/apiResult.js'

export async function registerUser(payload) {
  const { data } = await httpClient.post(API_PATHS.register, payload)
  return ensureApiOk(data)
}

export async function loginUser(payload) {
  const { data } = await httpClient.post(API_PATHS.login, payload)
  return ensureApiOk(data)
}

export async function logoutUser() {
  const { data } = await httpClient.post(API_PATHS.logout, {})
  return ensureApiOk(data)
}

export async function getMe() {
  const { data } = await httpClient.get(API_PATHS.me)
  return ensureApiOk(data)
}

export async function getHealth() {
  const { data } = await httpClient.get(API_PATHS.health)
  return ensureApiOk(data)
}
