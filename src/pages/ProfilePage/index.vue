<template>
  <div class="content" style="padding: 20px">
    <div class="container-fluid">
      <div class="row">
        <div class="col-md-8">
          <edit-profile-form />
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import {
  defineComponent,
  ref,
  unref,
  onMounted,
  getCurrentInstance,
  h,
  render,
  createApp,
} from "vue";
  import EditProfileForm from './EditProfileForm.vue'
  export default defineComponent({
    name: "ProfilePage",
    components: {
    EditProfileForm,
  },
});
</script>
<style>

</style>