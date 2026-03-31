<template>
  <div>
    <UHeader title="Factory" to="/" mode="drawer">
      <UNavigationMenu :items="navigationItems" />

      <template #body>
        <UNavigationMenu
          orientation="vertical"
          :items="navigationItems"
        />
      </template>
    </UHeader>

    <main>
      <slot />
    </main>

    <UFooter>
      <template #left>
        <span class="text-sm text-(--ui-text-muted)">
          &copy; {{ new Date().getFullYear() }} Factory
        </span>
      </template>

      <UNavigationMenu :items="footerNavigationItems" />
    </UFooter>
  </div>
</template>

<script setup lang="ts">
const { navigationItems, footerNavigationItems } = useFactoryNavigation()
</script>
