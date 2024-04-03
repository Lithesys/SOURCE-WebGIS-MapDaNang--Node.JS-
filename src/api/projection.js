import { api } from 'boot/axios';
import { i18n } from "boot/i18n.js";
import {
  Dialog,
  Notify
} from "quasar"
const $t = i18n.global.t;


export const getProjectionByName = async (params) => {
  const response = await api.get(`projections/name/${params.name}`, params)
  return response.data
}

export const getProjection = async (params) => {
  const response = await api.get(`projections/${params.id}`, params)
  return response.data
}

export const getAllProjection = async (query) => {
  let queryURL = new URLSearchParams()
  if (query) {
    Object.entries(query).forEach((i) => {
      queryURL.append(i[0], i[1])  
    })
  }
  const response = await api.get(`projections`, {
    params: queryURL,
  })
  return response.data
}

export const updateProjection = async (params) => {
  try {
    const response = await api.put(`projections/${params.id}`, params)
    Notify.create({
      message:  $t('Success'),
      color: 'primary',
      icon: 'check_circle'
    })
    return response.data
  } catch (e) {
    Notify.create({
      message:  e?.message || $t('Error!'),
      color: 'red',
      icon: 'error_outline'
    })
    return null
  }
}

export const deleteProjection = (params, resolve) => {
  return Dialog.create({
    icon: 'delete',
    title: $t('Warning'),
    message: `${$t('Delete Projection')}  ${params.name}?`,
    ok: {
      push: true
    },
    cancel: {
      push: true,
      color: 'negative'
    },
    persistent: true
  }).onOk(async () => {
    const response = await api.delete(`projections/${params.id}`)
    resolve(response.data)
  }).onCancel(() => {
  }).onDismiss(() => {
  })
}

export const createProjection = async (params) => {
  try {
    const response = await api.post(`projections`, params)
    Notify.create({
      message:  $t('Success'),
      color: 'primary',
      icon: 'check_circle'
    })
    return response.data
  } catch (e) {
    Notify.create({
      message:  e?.message || $t('Error!'),
      color: 'red',
      icon: 'error_outline'
    })
    return null
  }
}

