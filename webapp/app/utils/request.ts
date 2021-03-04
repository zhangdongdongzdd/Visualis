/*
 * <<
 * Davinci
 * ==
 * Copyright (C) 2016 - 2017 EDP
 * ==
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * >>
 */

import axios, { AxiosRequestConfig, AxiosResponse, AxiosPromise } from 'axios'

axios.defaults.validateStatus = function (status) {
  return status < 400
}

// 设置全局超时时间为60min
axios.defaults.timeout = 1000 * 60 * 60

function parseJSON (response: AxiosResponse) {
  return response.data
}

function refreshToken (response: AxiosResponse) {
  const token = response.data.header && response.data.header.token
  if (token) {
    setToken(token)
  }
  return response
}

export function request (config: AxiosRequestConfig): AxiosPromise
export function request (url: string, options?: AxiosRequestConfig): AxiosPromise
export default function request (url: any, options?: AxiosRequestConfig): AxiosPromise {
  let tempUrl = url
  if (typeof url === 'string') {
    // GET类型的请求
    if (url.split('?').length > 1) {
      // 说明本身是有query的
      tempUrl += `&labelsRoute=${window.apiEnv}`
    } else {
      tempUrl += `?labelsRoute=${window.apiEnv}`
    }
  // } else if (typeof url === 'object' && url.method === 'delete') {
  } else if (typeof url === 'object') {
    if (url.method === 'get') {
      // GET类型的请求
      if (url.url.split('?').length > 1) {
        // 说明本身是有query的
        tempUrl.url += `&labelsRoute=${window.apiEnv}`
      } else {
        tempUrl.url += `?labelsRoute=${window.apiEnv}`
      }
    } else {
      if (url.data) {
        // 如果data是array的，则像get请求一样在query里加
        if (Array.isArray(url.data)) {
          if (url.url.split('?').length > 1) {
            // 说明本身是有query的
            tempUrl.url += `&labelsRoute=${window.apiEnv}`
          } else {
            tempUrl.url += `?labelsRoute=${window.apiEnv}`
          }
        } else {
          tempUrl.data.labels = { route: window.apiEnv }
        }
      } else {
        tempUrl.data = {
          labels: {
            route: window.apiEnv
          }
        }
      }
    }
  }
  return axios(tempUrl, options)
    .then(refreshToken)
    .then(parseJSON)
}

export function setToken (token: string) {
  window.addEventListener('storage', syncToken, false)
  localStorage.setItem('TOKEN', token)
  localStorage.setItem('TOKEN_EXPIRE', `${new Date().getTime() + 3600000}`)
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

function syncToken (e: StorageEvent) {
  const { key, newValue } = e
  if (key !== 'TOKEN') { return }
  if (!newValue) {
    delete axios.defaults.headers.common['Authorization']
  } else {
    axios.defaults.headers.common['Authorization'] = `Bearer ${newValue}`
  }
}

export function removeToken () {
  window.addEventListener('storage', syncToken)
  localStorage.removeItem('TOKEN')
  localStorage.removeItem('TOKEN_EXPIRE')
  delete axios.defaults.headers.common['Authorization']

}

export function getToken () {
  return axios.defaults.headers.common['Authorization']
}

interface IDavinciResponseHeader {
  code: number
  msg: string
  token: string
}

export interface IDavinciResponse<T> {
  header: IDavinciResponseHeader,
  payload: T
}
