import { api } from 'boot/axios';
import { i18n } from 'boot/i18n.js';
import { Notify, Dialog } from 'quasar';
const $t = i18n.global.t;

export const getFeaturesByLayer = async (query) => {
  const queryURL = new URLSearchParams();
  Object.entries(query).forEach((i) => {
    queryURL.append(i[0], i[1]);
  });
  const response = await api.get(`mapLayers/${query.layerId}/features`, {
    params: queryURL
  });
  return response.data;
};

export const getExternalFeaturesByLayer = async (query) => {
  const queryURL = new URLSearchParams();
  Object.entries(query).forEach((i) => {
    queryURL.append(i[0], i[1]);
  });
  const response = await api.get(`mapLayers/${query.layerId}/features/external`, {
    params: queryURL
  });
  return response.data;
};

export const getFeature = async (params) => {
  const response = await api.get(`features/${params.name}`, params);
  return response.data;
};

export const updateFeature = async (params) => {
  try {
    const response = await api.put(`features/${params.id}`, params);
    Notify.create({
      message: $t('Success'),
      color: 'primary',
      icon: 'check_circle'
    });
    return response.data;
  } catch (e) {
    Notify.create({
      type: 'negative',
      message: e?.message || $t('Error!')
    });
    return null;
  }
};

export const createFeature = async (params) => {
  try {
    const response = await api.post('features', params);
    Notify.create({
      message: $t('Success'),
      color: 'primary',
      icon: 'check_circle'
    });
    return response.data;
  } catch (e) {
    Notify.create({
      message: e?.message || $t('Error!'),
      type: 'negative'
    });
    return null;
  }
};

export const deleteFeature = async (params, resolve) => {
  return Dialog.create({
    icon: 'delete',
    title: $t('Warning'),
    message: `${$t('Delete feature')}  ${params.name}?`,
    ok: {
      push: true
    },
    cancel: {
      push: true,
      color: 'negative'
    },
    persistent: true
  })
    .onOk(async () => {
      try {
        const response = await api.delete(`features/${params.id}`);
        Notify.create({
          message: $t('Success'),
          color: 'primary',
          icon: 'check_circle'
        });
        resolve();
      } catch (e) {
        Notify.create({
          message: e?.message || $t('Error!'),
          type: 'negative'
        });
      }
    })
    .onCancel(() => {})
    .onDismiss(() => {});
};
