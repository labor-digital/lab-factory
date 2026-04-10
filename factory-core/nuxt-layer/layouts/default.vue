<template>
  <div class="min-h-screen flex flex-col">
    <LayoutNavbar
      title="Factory"
      to="/"
      :items="navigationItems"
    />

    <main class="flex-1">
      <slot />
    </main>

    <LayoutFooter
      title="Factory"
      :items="footerNavigationItems"
    />
  </div>
</template>

<script setup lang="ts">
const { navigationItems, footerNavigationItems } = useFactoryNavigation()
</script>
