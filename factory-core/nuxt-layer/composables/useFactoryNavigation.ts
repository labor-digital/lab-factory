export interface FactoryNavItem {
  label: string
  to: string
  children?: FactoryNavItem[]
}

interface T3NavItem {
  link: string
  title: string
  children?: T3NavItem[]
}

function mapNavItems(items: T3NavItem[]): FactoryNavItem[] {
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

  const navigationItems = computed<FactoryNavItem[]>(() => {
    const raw = initialData.value?.navigation?.[0]?.children
    if (!raw) return []
    return mapNavItems(raw)
  })

  const footerNavigationItems = computed<FactoryNavItem[]>(() => {
    const raw = initialData.value?.footerNavigation
    if (!raw?.length) return []
    return mapNavItems(raw)
  })

  return { navigationItems, footerNavigationItems }
}
