import { defineStore } from 'pinia'
import {login, loginGoogle, register} from 'src/api/user'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: {},
    isLogin: false,
  }),
  persist: true,

  getters: {
    getUser (state) {
      return state.user
    },
    getIsLogin (state) {
      return state.isLogin
    }
  },

  actions: {
    setProfile(profile) {
      this.user.profile = profile
    },
    setUser (user) {
      this.user = user
    },
    clearUser() {
      this.user = {}
      this.isLogin = false
    },
    async loginUser(userData) {
      try {
        const responseData = await login(userData)
        this.user = responseData
        this.isLogin = true
        return responseData
      } catch (e){
        this.user = {}
        this.isLogin = false
        return e
      }

    },
    async loginGoogleUser(userData) {
      try {
        const responseData = await loginGoogle({
          email: userData.email,
          password: userData.password,
          profile: userData,
        })
        this.user = responseData
        this.isLogin = true
       return responseData
      } catch {
        this.user = {}
        this.isLogin = false
        return {}
      }

    },

    async registerUser(userData) {
      try {
        const responseData = await register({
          email: userData.email,
          password: userData.password,
          profile: userData,
        })
        this.user = responseData
        this.isLogin = true
        return responseData
      } catch {
        this.user = {}
        this.isLogin = false
        return {}
      }

    },
  }
})
