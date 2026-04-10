<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import BasePageContact from './BasePageContact.vue'

const props = defineProps<{
  content: any
}>()

const formState = reactive<Record<string, string>>({})

const parsedContent = computed(() => {
  const data = props.content?.content || {}
  const formFields = (data.form_fields || []).map((field: any) => {
    const fieldData = field.content || field
    return fieldData.name
  })
  return formFields
})

watch(parsedContent, (fieldNames) => {
  for (const name of fieldNames) {
    if (!(name in formState)) {
      formState[name] = ''
    }
  }
}, { immediate: true })

function getContactHref(item: { type: string; value: string }) {
  switch (item.type) {
    case 'phone':
      return `tel:${item.value.replace(/\s/g, '')}`
    case 'email':
      return `mailto:${item.value}`
    default:
      return undefined
  }
}
</script>

<template>
  <BasePageContact :content="content" v-slot="{ uiProps }">
    <section class="w-full py-16 sm:py-20 lg:py-24">
      <UContainer>
        <div
          :class="[
            uiProps.orientation === 'horizontal'
              ? 'grid gap-12 lg:gap-16 lg:grid-cols-2'
              : 'flex flex-col gap-10 max-w-2xl mx-auto'
          ]"
        >
          <!-- Contact Info -->
          <div class="flex flex-col gap-6">
            <span
              v-if="uiProps.headline"
              class="text-sm font-semibold uppercase tracking-wider text-(--ui-primary)"
            >
              {{ uiProps.headline }}
            </span>
            <h2
              v-if="uiProps.title"
              class="text-3xl sm:text-4xl font-bold tracking-tight text-default"
              v-html="uiProps.title"
            />
            <p
              v-if="uiProps.description"
              class="text-lg text-muted"
            >
              {{ uiProps.description }}
            </p>

            <dl
              v-if="uiProps.contactItems?.length"
              class="flex flex-col gap-4 mt-2"
            >
              <div
                v-for="item in uiProps.contactItems"
                :key="item.value"
                class="flex gap-3 items-start"
              >
                <dt>
                  <UIcon :name="item.icon" class="size-5 text-(--ui-primary)" />
                </dt>
                <dd class="text-sm text-muted">
                  <component
                    :is="getContactHref(item) ? 'a' : 'span'"
                    :href="getContactHref(item)"
                  >
                    {{ item.value }}
                  </component>
                </dd>
              </div>
            </dl>
          </div>

          <!-- Form -->
          <div v-if="uiProps.formFields?.length">
            <slot name="form" :state="formState" :fields="uiProps.formFields">
              <UForm :state="formState" class="flex flex-col gap-4">
                <div class="grid grid-cols-2 gap-4">
                  <UFormField
                    v-for="field in uiProps.formFields"
                    :key="field.name"
                    :label="field.label"
                    :name="field.name"
                    :required="field.required"
                    :class="field.colSpan === '2' ? 'col-span-2' : 'col-span-2 sm:col-span-1'"
                  >
                    <UTextarea
                      v-if="field.type === 'textarea'"
                      v-model="formState[field.name]"
                      :placeholder="field.placeholder"
                      :required="field.required"
                      :rows="4"
                      class="w-full"
                    />
                    <UInput
                      v-else
                      v-model="formState[field.name]"
                      :type="field.type"
                      :placeholder="field.placeholder"
                      :required="field.required"
                      class="w-full"
                    />
                  </UFormField>
                </div>

                <div class="pt-2">
                  <UButton
                    type="submit"
                    :label="uiProps.submitLabel"
                    color="primary"
                    size="lg"
                    block
                  />
                </div>
              </UForm>
            </slot>
          </div>
        </div>
      </UContainer>
    </section>
  </BasePageContact>
</template>
