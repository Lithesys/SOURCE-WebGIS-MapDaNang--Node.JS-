import { api } from 'boot/axios';
import { i18n } from "boot/i18n.js";
import {
  Notify,
  Dialog,
  Loading,
} from "quasar"
const $t = i18n.global.t;

export const syncWorkspace = async (params) => {
  try {
    Loading.show({
      message: 'Synchronizing...'
    })
    const response = await api.post(`workspaces/sync`, params)
    Loading.hide()
    Notify.create({
      message:  $t('Synchronized successfully!'),
      color: 'primary',
      icon: 'check_circle'
    })
    return response.data
  } catch (e) {
    Loading.hide()
    Notify.create({
      type: "negative",
      message:  e?.message || $t('Error!'),
    })
    return null
  }
}

export const getWorkspace= async (params) => {
  try {
    const response = await api.get(`workspaces`, params)
    return response.data
  } catch (e) {
    Notify.create({
      type: "negative",
      message:  e?.message || $t('Error!'),
    })
    return null
  }
}
