import { api } from 'boot/axios';
import { Notify, Dialog } from "quasar";
import { i18n } from "boot/i18n.js";

const $t = i18n.global.t;

export const createLayer = async (params) => {
  const response = await api.post('mapLayers', params)
  return response
} 

export const getLayer = async (params) => {
  const response = await api.get('mapLayers', params)
  return response
}

export const updateLayer = async (params) => {
  const response = await api.put(`mapLayers/${params.id}`, params)
  return response.data
}

export const getLayerByLocation = async (params) => {
  const queryURL = new URLSearchParams()
  Object.entries(params).forEach((i) => {
    queryURL.append(i[0], i[1])  
  })
  const response = await api.get(`mapLayers/getbyLocation/${params.locationId}`, {
    params: queryURL
  })
  return response.data
}

export const deleteMapLayer = async (params, resolve) => {
  return Dialog.create({
    icon: "delete",
    title: $t("Warning"),
    message: `${$t("Delete layer")}  ${params.name}?`,
    ok: {
      push: true,
    },
    cancel: {
      push: true,
      color: "negative",
    },
    persistent: true,
  })
    .onOk(async () => {
      try {
        const response = await api.delete(`mapLayers/${params.id}`, params)
        Notify.create({
          message: $t("Success"),
          color: "primary",
          icon: "check_circle",
        });
        resolve();
      } catch (e) {
        Notify.create({
          message: e?.message || $t("Error!"),
          type: "negative",
        });
      }
    })
    .onCancel(() => {})
    .onDismiss(() => {});
}