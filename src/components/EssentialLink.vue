<template>
  <q-item v-if="to && show" clickable :to="to">
    <q-item-section v-if="icon" avatar>
      <q-icon :name="icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ title }}</q-item-label>
      <q-item-label caption>{{ caption }}</q-item-label>
    </q-item-section>
  </q-item>
  <q-item v-else-if="action && show" clickable @click="action">
    <q-item-section v-if="icon" avatar>
      <q-icon :name="icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ title }}</q-item-label>
      <q-item-label caption>{{ caption }}</q-item-label>
    </q-item-section>
  </q-item>
  <q-expansion-item
    v-else-if="show"
    dense
    class="settingsClass"
    :icon="icon"
    :label="title"
  >
    <q-card>
      <q-card-section>
        <q-select
          ref="languageRef"
          emit-value
          map-options
          options-dense
          style="min-width: 150px; padding: 0 10px"
          :label="$t('Language')"
          v-model="locale"
          :options="localeOptions"
          @popup-hide="blur"
        >
          <template v-slot:prepend>
            <q-icon name="translate" />
          </template>
        </q-select>
      </q-card-section>
    </q-card>
  </q-expansion-item>
</template>

<script>
import { defineComponent, ref, unref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { i18n } from "boot/i18n.js";

export default defineComponent({
  name: "EssentialLink",
  props: {
    title: {
      type: String,
      required: true,
    },

    caption: {
      type: String,
      default: "",
    },
    link: {
      type: String,
      default: null,
    },
    to: {
      type: String,
      default: "",
    },
    action: {
      type: Function,
      default: null,
    },
    show: {
      type: Boolean,
      default: true,
    },
    icon: {
      type: String,
      default: "",
    },
  },
  setup(props) {
    const { locale } = useI18n({ useScope: "global" });
    const $t = i18n.global.t;
    const leftDrawerOpen = ref(false);
    const localeOptions = computed(() => [
      { value: "en-US", label: $t("English") },
      { value: "vn-VN", label: $t("Vietnamese") },
    ]);
    const languageRef = ref(null);
    const blur = () => {
      unref(languageRef).blur();
    };
    return {
      languageRef,
      blur,
      locale,
      localeOptions,
    }
  }
});
</script>
<style lang="scss">
.q-expansion-item__container {
    .q-item.q-item-type.q-item--dense.q-item--clickable {
      min-height: 48px !important;
    }
}
</style>
