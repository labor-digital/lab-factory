import type { NavigationMenuItem } from '@nuxt/ui'

interface T3NavItem {
  link: string
  title: string
  children?: T3NavItem[]
}

function mapNavItems(items: T3NavItem[]): NavigationMenuItem[] {
  return items.map((item) => ({
    label: item.title,
    to: item.link,
    ...(item.children?.length
      ? { children: mapNavItems(item.children) }
      : {}),
  }))
}

export function useFactoryNavigation() {
  const { initialData } = useT3Api()

  const navigationItems = computed<NavigationMenuItem[]>(() => {
    const raw = initialData.value?.navigation?.[0]?.children
    if (!raw) return []
    return mapNavItems(raw)
  })

  const footerNavigationItems = computed<NavigationMenuItem[]>(() => {
    const raw = initialData.value?.footerNavigation
    if (!raw?.length) return []
    return mapNavItems(raw)
  })

  return { navigationItems, footerNavigationItems }
}
