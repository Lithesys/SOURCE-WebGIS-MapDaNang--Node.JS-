<template>
  <img src="~assets/background.jpg" class="wave" alt="login-wave" />
  <div class="row" style="height: 90vh">
    <div class="col-0 col-md-6 flex justify-center content-center"></div>
    <div
      v-bind:class="{
        'justify-center': $q.screen.md || $q.screen.sm || $q.screen.xs
      }"
      class="col-12 col-md-6 flex content-center"
    >
      <q-card v-bind:style="$q.screen.lt.sm ? { width: '80%' } : { width: '50%' }">
        <q-card-section class="row items-start justify-center q-mt-lg">
          <q-avatar size="103px" class="absolute-center shadow-10">
            <img src="~assets/bach-khoa.jpg" alt="Quasar logo" style="width: 80px; height: 80px" />
          </q-avatar>
        </q-card-section>
        <q-card-section>
          <div class="q-pt-lg">
            <div class="col text-h6 ellipsis flex justify-center">
              <h2 class="text-h4 text-uppercase q-my-none text-weight-regular">
                {{ $t('Register') }}
              </h2>
            </div>
          </div>
        </q-card-section>
        <q-card-section>
          <q-form class="q-gutter-md" @submit.prevent="onSubmit">
            <q-input
              outlined
              v-model="username"
              name="username"
              :label="$t('Username')"
              :rules="rules.username"
              lazy-rules
            ></q-input>
            <q-input
              outlined
              v-model="password"
              type="password"
              name="password"
              autocomplete="on"
              :label="$t('Password')"
              :rules="rules.password"
              lazy-rules
            />
            <q-input
              outlined
              v-model="confirmPassword"
              type="password"
              name="password"
              autocomplete="on"
              :label="$t('Confirm Password')"
              :rules="rules.confirmPassword"
              lazy-rules
            />
            <div class="googleSection">
              <router-link class="text-primary" to="/login">{{ $t('Login here') }}</router-link>
              <q-btn class="full-width" color="primary" :label="$t('Register')" type="submit" rounded></q-btn>
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, unref } from 'vue';
import { useUserStore } from 'stores/user';
import { findByEmail } from 'src/api/user';
import { useRoute, useRouter } from 'vue-router';
export default defineComponent({
  name: 'RegisterPage',
  setup() {
    const router = useRouter();
    const store = useUserStore();

    const form = {
      valid: true
    };
    const username = ref('');
    const password = ref('');
    const confirmPassword = ref('');
    const rules = {
      username: [(val) => !!val || '* Required', (val) => /^(.+)@(.+)$/.test(val) || 'Invalid email address'],
      password: [(val) => !!val || '* Required', (val) => /^(?=.*\d).{6,}$/.test(val) || 'Minimum six characters'],
      confirmPassword: [(val) => val === unref(password) || 'Password not match']
    };
    const onSubmit = async () => {
      const responseFindUser = await findByEmail({
        email: unref(username)
      });
      if (responseFindUser.data !== null) {
        console.log('Already have user');
        return;
      }

      const response = await store.registerUser({
        email: unref(username),
        password: unref(password)
      });

      if (response) {
        router.push({ name: 'HomePage' });
      }
    };
    return {
      form,
      username,
      password,
      confirmPassword,
      rules,
      onSubmit
    };
  }
});
</script>
<style lang="scss" scoped>
.wave {
  position: fixed;
  height: 100%;
  left: 0;
  bottom: 0;
  z-index: -1;
}
.googleSection {
  align-items: center;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
