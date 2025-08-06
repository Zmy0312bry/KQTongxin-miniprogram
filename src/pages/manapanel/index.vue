<template>
  <!-- 根据active值动态显示不同组件 -->
  <component :is="currentComponent" />

  <!-- 底部tabbar -->
  <nut-tabbar v-model="active" bottom safe-area-inset-bottom placeholder>
    <nut-tabbar-item v-for="(item, index) in List" :key="index" :tab-title="item.title" :icon="item.icon">
    </nut-tabbar-item>
  </nut-tabbar>
</template>

<script>
import { ref, h, watch, computed } from 'vue';
import Taro from '@tarojs/taro';
import { Tips, My,Comment } from '@nutui/icons-vue-taro';
import Suggestion from '../components/Manager/Suggestion.vue';
import Complain from '../components/Manager/Complain.vue';
import Panel from '../components/Manager/Panel.vue';

export default {
  components: {
    Suggestion,
    Complain,
    Panel
  },
  setup() {
    const List = [
      {
        title: '诉求',
        icon: h(Comment)
      },
      {
        title: '建议',
        icon: h(Tips)
      },
      {
        title: '我的',
        icon: h(My)
      }
    ]
    const active = ref(0)

    // 根据active值计算当前应该显示的组件
    const currentComponent = computed(() => {
      switch (active.value) {
        case 0:
          return 'Complain';
        case 1:
          return 'Suggestion';
        case 2:
          return 'Panel';
        default:
          return 'Complain';
      }
    });
    // 监听active值变化，动态修改页面标题
    watch(active, (newValue) => {
      let title = "";
      switch (newValue) {
        case 0:
          title = "社区诉求";
          break;
        case 1:
          title = "社区建议";
          break;
        case 2:
          title = "社区管理";
          break;
        default:
          title = "矿桥东街社区";
      }

      // 设置导航栏标题
      Taro.setNavigationBarTitle({
        title: title
      });
    });
    return {
      List,
      active,
      currentComponent
    };
  }
};
</script>
