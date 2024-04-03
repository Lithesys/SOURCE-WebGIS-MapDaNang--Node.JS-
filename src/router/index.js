import { route } from 'quasar/wrappers'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import routes from './routes'

import { useUserStore } from 'src/stores/user';

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })

  Router.beforeEach((to, from, next) => {
    const userStore = useUserStore();
    const { role } = userStore.getUser
    if (to?.meta?.authRequired) {
      if (role === 'ADMIN') {
        next()
      } else {
        next({ name: 'HomePage' })
      }
    } else if (to?.meta?.public){
      next()
    }
    else {
      if (!userStore.getIsLogin) {
        next({ path: '/login' })
      } else next()
    }
});
  return Router
})
  
