import { defineStore } from 'pinia'

export const useLocationStore = defineStore('location', {
  state: () => ({
    location: [],
    startLocation: [],
    isLocated: false,
  }),
  persist: true,

  getters: {
    getLocation (state) {
      return state.location;
    },
    getIsLocated (state) {
      return state.isLocated;
    },
    getStartLocation(state) {
      return state.startLocation;
    },
  },

  actions: {
    setLocation (location) {
      this.location = location;
      this.isLocated = false;
      this.setStartLocation(this.location);
    },
    setStartLocation(location = this.location) {
      this.startLocation = location;
    },
    clearLocation() {
      this.location = []
      this.isLocated = false;
    },
  }
})
