<template>
  <web-view :src="url"></web-view>
</template>

<script>
import { ref, onMounted } from 'vue';
import Taro from '@tarojs/taro';

export default {
  name: 'WebView',

  setup() {
    const url = ref('');

    onMounted(() => {
      const params = Taro.getCurrentInstance().router.params;
      if (params.url) {
        url.value = decodeURIComponent(params.url);
      } else {
        Taro.showToast({
          title: '链接无效',
          icon: 'none',
          duration: 2000
        });
        Taro.navigateBack();
      }
    });

    return {
      url
    };
  }
};
</script>
