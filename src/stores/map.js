import { defineStore } from 'pinia'
import _isFunction from 'lodash/isFunction'
export const useMapStore = defineStore('map', {
  state: () => ({
    location: {},
    projections: {},
    selectedFeature: {
      layer: null,
      feature: null,
    }
  }),

  getters: {
    getLocation (state) {
      return state.location;
    },
    getProjections (state) {
      return state.projections;
    },
    getSelectedFeature (state) {
      return state.selectedFeature;
    },
  },

  actions: {
    setLocation({ location, resolve }) {
      this.location = location;
      if (_isFunction(resolve)) resolve()
    },
    setProjection({ projection, resolve }) {
      Object.assign(this.projections, {...this.projections, ...projection})
      if (_isFunction(resolve)) resolve()
    },
    setSelectedFeature({ layer, feature, resolve }) {
      this.selectedFeature = {
        layer,
        feature,
      }
      if (_isFunction(resolve)) resolve()
    }
  }
})
