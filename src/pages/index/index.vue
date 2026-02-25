<template>
  <!-- 根据 active 值动态显示不同组件 -->
  <component
    :is="currentComponent"
    :refresh-trigger="refreshTrigger"
    :reset-trigger="resetTrigger"
  />

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
import { ref, h, watch, computed, onMounted } from "vue";
import Taro from "@tarojs/taro";
import { Home, Find, My } from "@nutui/icons-vue-taro";
import Cover from "../components/User/Cover.vue";
import Styles from "../components/User/Styles.vue";
import Mypanel from "../components/User/Mypanel.vue";

export default {
  components: {
    Cover,
    Styles,
    Mypanel,
  },
  setup() {
    // 使用 ref 包装，防止被意外改为 null
    const List = ref([
      { title: "首页", icon: h(Home) },
      { title: "风采", icon: h(Find) },
      { title: "我的", icon: h(My) },
    ]);

    // 防御性处理 tab 项数组，避免 null 遍历崩溃
    const safeTabList = computed(() => {
      return Array.isArray(List.value) ? List.value : [];
    });

    const active = ref(0);
    const refreshTrigger = ref(0);
    const resetTrigger = ref(0);

    // 页面加载时读取 URL 参数中的 tab 值
    onMounted(() => {
      const pages = Taro.getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const options = currentPage.options || {};

      if (options.tab !== undefined) {
        const tabValue = parseInt(options.tab);
        if (!isNaN(tabValue) && tabValue >= 0 && tabValue <= 2) {
          active.value = tabValue;

          // 如果切换到"我的"tab，触发刷新和重置
          if (tabValue === 2) {
            refreshTrigger.value++;
            resetTrigger.value++;
            console.log("[index] 跳转到'我的'tab，触发刷新和重置");
          }
        }
      }
    });

    const currentComponent = computed(() => {
      switch (active.value) {
        case 0:
          return "Cover";
        case 1:
          return "Styles";
        case 2:
          return "Mypanel";
        default:
          return "Cover";
      }
    });

    watch(active, (newValue) => {
      const titles = ["矿桥东街社区", "社区风采", "个人中心"];
      Taro.setNavigationBarTitle({
        title: titles[newValue] || titles[0],
      });

      // 当切换到"我的"页面时，触发刷新
      if (newValue === 2) {
        refreshTrigger.value++;
      }
    });

    return {
      List,
      active,
      currentComponent,
      safeTabList,
      refreshTrigger,
      resetTrigger,
    };
  },
};
</script>
