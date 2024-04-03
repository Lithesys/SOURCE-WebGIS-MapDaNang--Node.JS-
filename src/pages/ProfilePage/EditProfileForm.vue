<template>
  <q-card class="myCardClass" flat bordered>
      <q-card-section horizontal>
        <q-card-section class="q-pt-xs inputClass" style="width: 800px;">
          <div class="text-h4">{{$t("Profile")}}</div>
          <div class="text-h6">{{$t("Basic information")}}</div>
          <q-card-section horizontal>
            <q-input :label="$t('First Name')" v-model="userProfile.given_name" />
            <q-input :label="$t('Last Name')"  v-model="userProfile.family_name" />
            <q-input :label="$t('Date of Birth')"  v-model="userProfile.birthday" />
            <q-input :label="$t('Gender')" v-model="userProfile.gender" />
          </q-card-section>
          <div class="text-h6">{{$t("Communicate information")}}</div>
          <q-card-section horizontal>
            <q-input :label="$t('Email')" v-model="userProfile.email" />
            <q-input :label="$t('Phone Number')" v-model="userProfile.phone_number" />
          </q-card-section>
          <q-card-section horizontal>
            <q-input :label="$t('Address')" v-model="userProfile.address" />
            <q-input :label="$t('Current Location')" v-model="userProfile.current_location" />
          </q-card-section>
        </q-card-section>
        <q-separator vertical />
        <q-card-section class="col-5 flex flex-center">
          <q-img
            class="rounded-borders"
            :src="userProfile.picture"
            style="width: 50vh; height: 50vh; border-radius: 50%;"
          />
        </q-card-section>
      </q-card-section>

      <q-separator />

      <q-card-actions class="justify-center">
        <q-btn flat color="primary" style="width: 100%;" @click="submit">
          {{$t("Submit")}}
        </q-btn>
      </q-card-actions>
    </q-card>
</template>
<script>
import {
  defineComponent,
  ref,
  unref,
  onMounted,
  getCurrentInstance,
} from "vue";
import { useUserStore } from "stores/user";
import { updateProfile } from 'src/api/profile'
import _isEqual from 'lodash/isEqual'
import _cloneDeep from 'lodash/cloneDeep'
export default defineComponent({
  name: "EditProfileForm",
  setup() {
    const userstore = useUserStore();
    const user = userstore.getUser;
    const userProfile = ref(_cloneDeep(user.profile));
    const submit = async () => {
      if (!_isEqual(unref(userProfile), userstore.getUser.profile)) {
        try {
          const response = await updateProfile({id: user.id , profile: unref(userProfile)})
          userstore.setProfile(response)
        } catch (e) {
          console.log(e)
        }
      }
    };
    return {
      userProfile,
      submit,
    };
  },
});
</script>
<style lang="scss" scoped>
.inputClass {
  .q-card__section--horiz {
    gap: 50px;
    margin-bottom: 5px;
  }
}
</style>
