<template>
  <nut-list :list-data="safeDataList" @scroll-bottom="loadMore">
    <template #default="{ item }">
      <view
        @click="goToDetail(item)"
        style="background-color: #fef0f2; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); padding: 16px; margin: 16px 16px 0 16px; transition: transform 0.2s ease;"
        hover-class="card-hover"
      >
        <view style="font-size: 16px; font-weight: bold; color: #333; line-height: 1.4;">
          {{ item.title }}
        </view>
        <view style="font-size: 13px; color: #999; margin-top: 8px; text-align: right;">
          点击查看详情
        </view>
      </view>
    </template>
  </nut-list>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import Taro from '@tarojs/taro'

export default {
  name: 'TweetList',
  setup() {
    const dataList = ref([])
    const page = ref(1)
    const pageSize = 100
    const hasMore = ref(true)

    const safeDataList = computed(() => {
      return Array.isArray(dataList.value) ? dataList.value : []
    })

    const fetchData = async () => {
      if (!hasMore.value) return

      try {
        const res = await Taro.request({
          url: `https://api.kuangqiaodongjie.cn/api/community/tweet?page=${page.value}&page_size=${pageSize}`,
          method: 'GET'
        })

        if (res.data.code === 200) {
          const results = res.data?.data?.results
          const finalList = Array.isArray(results) ? results : []

          if (finalList.length < pageSize) {
            hasMore.value = false
          }

          dataList.value = dataList.value.concat(finalList)
          page.value += 1
        }
      } catch (err) {
        console.error('加载失败', err)
      }
    }

    const loadMore = () => {
      fetchData()
    }

    const goToDetail = (item) => {
      Taro.navigateTo({
        url: '/pages/content/index',
        success: function (res) {
          res.eventChannel.emit('acceptDataFromOpenerPage', {
            title: item.title,
            content: item.content
          })
        }
      })
    }

    onMounted(() => {
      fetchData()
    })

    return {
      safeDataList,
      loadMore,
      goToDetail
    }
  }
}
</script>

<style>
.card-hover {
  transform: scale(0.98);
  background-color: #fddde4 !important;
}
</style>
