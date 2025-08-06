
<template>
  <div style="padding: 20px;">
    <nut-list :list-data="data" @scroll-bottom="onScrollBottom">
      <template #default="{ index }">
        <div style="  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-bottom: 10px;
  height: 100px;
  background-color: #f4a8b6;
  border-radius: 10px;">
          {{ index }}
        </div>
      </template>
    </nut-list>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';

export default {
  setup() {
    const data = ref(new Array(100).fill(0));

    // 滚动到底部加载更多数据
    const onScrollBottom = () => {
      let arr = [];
      // 模拟异步请求
      setTimeout(() => {
        for (let i = 0; i < 10; i++) {
          arr.push(i);
        }
        data.value = [...data.value, ...arr];
      }, 500);
    };

    return {
      data,
      onScrollBottom
    };
  }
};
</script>
