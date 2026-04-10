<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  content: any
}>()

const parsedData = computed(() => {
  const data = props.content?.content || {}

  // Parse contact items
  const contactItems = (data.contact_items || []).map((item: any) => {
    const itemData = item.content || item
    return {
      icon: itemData.icon,
      label: itemData.label,
      value: itemData.value,
      type: unwrapSelect(itemData.type, 'generic')
    }
  })

  // Parse form fields
  const formFields = (data.form_fields || []).map((field: any) => {
    const fieldData = field.content || field
    return {
      label: fieldData.label,
      name: fieldData.name,
      type: unwrapSelect(fieldData.type, 'text'),
      required: fieldData.required === '1' || fieldData.required === 1 || fieldData.required === true,
      placeholder: fieldData.placeholder,
      colSpan: unwrapSelect(fieldData.col_span, '2')
    }
  })

  return {
    headline: data.headline,
    title: data.title,
    description: data.description,
    contactItems: contactItems.length > 0 ? contactItems : undefined,
    formFields: formFields.length > 0 ? formFields : undefined,
    submitLabel: data.submit_label || 'Submit',
    orientation: unwrapSelect(data.orientation, 'horizontal')
  }
})
</script>

<template>
  <slot :uiProps="parsedData" />
</template>
