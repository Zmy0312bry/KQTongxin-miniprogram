<template>
  <!-- 根据 active 值动态显示不同组件 -->
  <component :is="currentComponent" />

  <!-- 底部 tabbar -->
  <nut-tabbar v-model="active" bottom safe-area-inset-bottom placeholder>
    <nut-tabbar-item
      v-for="(item, index) in safeTabList"
      :key="index"
      :tab-title="item.title"
      :icon="item.icon"
    />
  </nut-tabbar>
</template>


<script>
import { ref, h, watch, computed } from 'vue'
import Taro from '@tarojs/taro'
import { Home, Find, My } from '@nutui/icons-vue-taro'
import Cover from '../components/User/Cover.vue'
import Styles from '../components/User/Styles.vue'
import Mypanel from '../components/User/Mypanel.vue'

export default {
  components: {
    Cover,
    Styles,
    Mypanel
  },
  setup() {
    // 使用 ref 包装，防止被意外改为 null
    const List = ref([
      { title: '首页', icon: h(Home) },
      { title: '风采', icon: h(Find) },
      { title: '我的', icon: h(My) }
    ])

    // 防御性处理 tab 项数组，避免 null 遍历崩溃
    const safeTabList = computed(() => {
      return Array.isArray(List.value) ? List.value : []
    })

    const active = ref(0)

    const currentComponent = computed(() => {
      switch (active.value) {
        case 0:
          return 'Cover'
        case 1:
          return 'Styles'
        case 2:
          return 'Mypanel'
        default:
          return 'Cover'
      }
    })

    watch(active, (newValue) => {
      const titles = ['矿桥东街社区', '社区风采', '个人中心']
      Taro.setNavigationBarTitle({
        title: titles[newValue] || titles[0]
      })
    })

    return {
      List,
      active,
      currentComponent,
      safeTabList
    }
  }
}
</script>

