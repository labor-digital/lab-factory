<script setup lang="ts">
import { computed } from 'vue'
import { parseButtons, parseFile, asBool } from '../../../utils/parseContent'
import { unwrapSelect } from '../../../utils/unwrapSelect'

const props = defineProps<{
  content: any
}>()

const parsedData = computed(() => {
  const data = props.content?.content || {}
  return {
    variant: unwrapSelect(data.variant, 'split') as 'split' | 'center-dark' | 'fullbleed-image' | 'inline-form',
    eyebrow: data.eyebrow || undefined,
    titleLight: data.title_light || undefined,
    titleBold: data.title_bold || undefined,
    body: data.body || undefined,
    backgroundImage: parseFile(data.background_image),
    showSecondary: asBool(data.show_secondary),
    buttons: parseButtons(data.buttons),
    form: {
      enabled: asBool(data.form_enabled),
      nameLabel: data.form_name_label || 'Name',
      mailLabel: data.form_mail_label || 'E-Mail',
      submitLabel: data.form_submit_label || 'Absenden',
      note: data.form_note || undefined
    }
  }
})
</script>

<template>
  <slot :uiProps="parsedData" />
</template>
