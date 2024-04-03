<template>
  <q-layout view="hHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title> GIS App </q-toolbar-title>
        <q-avatar>
          <img v-if="profile?.picture" :src="profile?.picture" />
          <img v-else src="~assets/account.jpg" />
        </q-avatar>
      </q-toolbar>
    </q-header>
    <q-drawer v-model="leftDrawerOpen" show-if-above elevated side="left" behavior="desktop">
      <q-list>
        <EssentialLink v-for="link in essentialLinks" :key="link.title" v-bind="link" />
        <q-separator />
        <EssentialLink v-for="link in adminInteraction" :key="link.title" v-bind="link" />
        <q-separator />
        <EssentialLink v-for="link in userIntecraction" :key="link.title" v-bind="link" />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import _debounce from 'lodash/debounce';
import { getCurrentInstance, defineComponent, ref, unref, computed, onBeforeMount } from 'vue';

import EssentialLink from 'components/EssentialLink.vue';
import { useI18n } from 'vue-i18n';
import { i18n } from 'boot/i18n.js';
import { useUserStore } from 'stores/user';
import { useRoute, useRouter } from 'vue-router';

export default defineComponent({
  name: 'MainLayout',

  components: {
    EssentialLink
  },

  setup() {
    const vm = getCurrentInstance().proxy;
    const $t = i18n.global.t;
    const router = useRouter();
    const route = useRoute();
    const userStore = useUserStore();
    const { role, profile } = userStore.getUser;
    const leftDrawerOpen = ref(true);
    const miniState = ref(true);
    const linksList = computed(() => [
      {
        title: $t('Map'),
        icon: 'fa-sharp fa-solid fa-map-location-dot',
        to: '/map'
      }
    ]);
    const adminInteraction = computed(() => [
      {
        title: $t('Users management'),
        icon: 'fa-solid fa-users',
        to: '/user-management',
        show: role === 'ADMIN'
      },
      {
        title: $t('Locations management'),
        icon: 'img:icons/location-management.png',
        to: '/location-management',
        show: role === 'ADMIN'
      },
      {
        title: $t('Projections management'),
        icon: 'img:icons/coordinate.png',
        to: '/projection-management',
        show: role === 'ADMIN'
      }
    ]);
    const userIntecraction = computed(() => [
      {
        title: $t('Profile'),
        icon: 'account_circle',
        to: '/profile'
      },
      {
        title: $t('Settings'),
        icon: 'settings'
      },
      {
        title: $t('Logout'),
        icon: 'logout',
        action: () => {
          userStore.clearUser();
          router.push({ name: 'LoginPage' });
        }
      }
    ]);

    onBeforeMount(() => {
      if (route.path === '/') {
        router.replace({ name: 'HomePage' });
      }
    });

    return {
      vm,
      essentialLinks: linksList,
      adminInteraction,
      userIntecraction,
      leftDrawerOpen,
      miniState,
      profile,
      toggleLeftDrawer() {
        leftDrawerOpen.value = !leftDrawerOpen.value;
      }
    };
  }
});
</script>
