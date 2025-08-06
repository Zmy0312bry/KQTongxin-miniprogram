<template>
  <view style="padding: 20px;">
    <view style="font-size: 20px; font-weight: bold; margin-bottom: 20px;">
      {{ title }}
    </view>
    <rich-text :nodes="content" />
  </view>
</template>

<script>
import { ref, onMounted } from 'vue'
import Taro from '@tarojs/taro'

export default {
  name: 'ContentPage',
  setup() {
    const title = ref('')
    const content = ref('')

    onMounted(() => {
      const eventChannel = Taro.getCurrentInstance().page.getOpenerEventChannel()
      eventChannel.on('acceptDataFromOpenerPage', (data) => {
        title.value = data.title || ''
        // 替换掉代理前缀，解决图片加载失败
        content.value = (data.content || '').replace(/https:\/\/images\.weserv\.nl\/\?url=/g, '')
      })
    })

    return {
      title,
      content
    }
  }
}
</script>
