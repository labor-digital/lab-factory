// Register Ce components globally via app.component() for nuxt-typo3's
// resolveDynamicComponent(). Nuxt auto-imports don't make components available
// to Vue's resolveDynamicComponent — only app.component() does.
import FactoryAccordion from '../components/T3/Ce/FactoryAccordion.vue'
import FactoryBlogposts from '../components/T3/Ce/FactoryBlogposts.vue'
import FactoryButtongroup from '../components/T3/Ce/FactoryButtongroup.vue'
import FactoryCarousel from '../components/T3/Ce/FactoryCarousel.vue'
import FactoryHeader from '../components/T3/Ce/FactoryHeader.vue'
import FactoryPagecontact from '../components/T3/Ce/FactoryPagecontact.vue'
import FactoryPagecta from '../components/T3/Ce/FactoryPagecta.vue'
import FactoryPagefeature from '../components/T3/Ce/FactoryPagefeature.vue'
import FactoryPagegrid from '../components/T3/Ce/FactoryPagegrid.vue'
import FactoryPagehero from '../components/T3/Ce/FactoryPagehero.vue'
import FactoryPagelogos from '../components/T3/Ce/FactoryPagelogos.vue'
import FactoryPagesection from '../components/T3/Ce/FactoryPagesection.vue'
import FactorySeparator from '../components/T3/Ce/FactorySeparator.vue'
import FactoryTable from '../components/T3/Ce/FactoryTable.vue'
import FactoryText from '../components/T3/Ce/FactoryText.vue'

const components: Record<string, any> = {
  FactoryAccordion,
  FactoryBlogposts,
  FactoryButtongroup,
  FactoryCarousel,
  FactoryHeader,
  FactoryPagecontact,
  FactoryPagecta,
  FactoryPagefeature,
  FactoryPagegrid,
  FactoryPagehero,
  FactoryPagelogos,
  FactoryPagesection,
  FactorySeparator,
  FactoryTable,
  FactoryText,
}

export default defineNuxtPlugin((nuxtApp) => {
  for (const [name, comp] of Object.entries(components)) {
    nuxtApp.vueApp.component(`T3Ce${name}`, comp)
    nuxtApp.vueApp.component(`LazyT3Ce${name}`, comp)
  }
})
