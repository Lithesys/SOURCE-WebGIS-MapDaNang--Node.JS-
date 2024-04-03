import { api } from 'boot/axios';
import { i18n } from "boot/i18n.js";
import {
  Notify,
  Dialog,
} from "quasar"
const $t = i18n.global.t;

export const addLocaction = async (params) => {
  try {
    const response = await api.post(`locations`, params)
    Notify.create({
      message:  $t('Success'),
      color: 'primary',
      icon: 'check_circle'
    })
    return response
  } catch (e) {
    Notify.create({
      type: "negative", 
      message:  e?.message || $t('Error!'),
    })
    return null
  }
}

export const updateLocation = async (params) => {
  try {
    const response = await api.put(`locations/${params.id}`, params)
    Notify.create({
      message:  $t('Success'),
      color: 'primary',
      icon: 'check_circle'
    })
    return response.data
  } catch (e) {
    Notify.create({
      type: "negative", 
      message:  e?.message || $t('Error!'),
     })
    return null
  }
}

export const getLocation = async (params) => {
  const response = await api.get(`locations/${params.id}`, params)
  return response.data
}

export const deleteLocation = (params, resolve) => {
  return Dialog.create({
    icon: 'delete',
    class: 'deleteWarningClass',
    title: $t('Warning'),
    message: `${$t('Delete location')}  ${params.name}?`,
    ok: {
      push: true
    },
    cancel: {
      push: true,
      color: 'negative'
    },
    persistent: true
  }).onOk(async () => {
    try {
      const response = await api.delete(`locations/${params.id}`)
      resolve(response.data)
    } catch (e){
      Notify.create({
      type: "negative", 
      message:  e?.message || $t('Error!'),
     })
    }
  }).onCancel(() => {
  }).onDismiss(() => {
  })
}

export const getAllLocation = async (query) => {
  const queryURL = new URLSearchParams()
  Object.entries(query).forEach((i) => {
    queryURL.append(i[0], i[1])  
  })
  const response = await api.get('locations', {
    params: queryURL
  })
  return response.data
}

export const deleteMapLayer = async (params) => {
  const response = await api.delete('locations', params)
  return response
}