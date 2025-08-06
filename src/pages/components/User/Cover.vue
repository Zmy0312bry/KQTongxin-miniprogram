<template>
  <nut-row>
    <nut-col :span="24">
      <view v-if="bannerLoading" style="padding: 8px 16px;">
        <nut-skeleton width="100%" height="200px" animated />
      </view>
      <view v-else style="height: 200px;">
        <nut-swiper
          :init-page="0"
          :pagination-visible="true"
          :height="200"
          auto-play="3000"
          effect="fade"
          pagination-color="#426543"
          pagination-unselected-color="#808080"
        >
          <nut-swiper-item
            v-for="(item, index) in safeBannerList"
            :key="index"
          >
            <img :src="item.imgUrl" style="height: 100%; width: 100%; object-fit: cover;" draggable="false" />
          </nut-swiper-item>
        </nut-swiper>
      </view>

      <nut-noticebar :text="text" scrollable="always" style="margin-bottom: 24px;" />
    </nut-col>

    <!-- 提交诉求按钮 -->
    <nut-row type="flex" justify="center" align="center" style="margin: 24px 0;">
      <nut-button
        type="primary"
        icon="warning"
        @click="navigateToTarget"
        style="height: 100px; width: 100px; border-radius: 50%; font-size: 16px; font-weight: bold; background: linear-gradient(135deg, #fa2c19 0%, #f56c6c 100%); box-shadow: 0 4px 12px rgba(250, 44, 25, 0.3); display: flex; flex-direction: column; align-items: center; justify-content: center;"
      >
        <view>提交</view>
        <view>诉求</view>
      </nut-button>
    </nut-row>

    <!-- 限行展示 -->
    <view style="display: flex; flex-direction: row; justify-content: space-between; padding: 0 16px; margin-bottom: 24px; box-sizing: border-box;">
      <view style="flex: 1; background-color: #fff5f5; border-radius: 12px; padding: 16px; margin-right: 8px; box-shadow: 0 2px 8px rgba(255, 0, 0, 0.05); text-align: center;">
        <view style="font-size: 16px; color: #333;">今日限行尾号</view>
        <view style="font-size: 32px; font-weight: bold; color: #fa2c19; margin: 8px 0;">
          {{ todayRestriction }}
        </view>
        <view style="font-size: 14px; color: #999;">{{ formatDate(today) }}</view>
      </view>

      <view style="flex: 1; background-color: #f2f9ff; border-radius: 12px; padding: 16px; margin-left: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); text-align: center;">
        <view style="font-size: 16px; color: #333;">明日限行尾号</view>
        <view style="font-size: 32px; font-weight: bold; color: #1989fa; margin: 8px 0;">
          {{ tomorrowRestriction }}
        </view>
        <view style="font-size: 14px; color: #999;">{{ formatDate(tomorrow) }}</view>
      </view>
    </view>

    <!-- 联系按钮 -->
    <nut-row type="flex" justify="center" align="center" style="margin: 24px 0;">
      <nut-button
        type="primary"
        icon="phone"
        style="font-size: 16px; padding: 12px 24px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);"
        @click="goToPhonePage"
      >
        联系矿桥东街社区
      </nut-button>
    </nut-row>
  </nut-row>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../../../store/user'
import Taro from '@tarojs/taro'

const userStore = useUserStore()

const bannerList = ref([])
const bannerLoading = ref(true)
const text = ref('')
const todayRestriction = ref('不限行')
const tomorrowRestriction = ref('不限行')
const today = ref(new Date())
const tomorrow = ref(new Date())
tomorrow.value.setDate(tomorrow.value.getDate() + 1)

const safeBannerList = computed(() => Array.isArray(bannerList.value) ? bannerList.value : [])
const isLogin = computed(() => userStore.isLogin())

const formatDate = (date) => {
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekDay = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()]
  return `${month}月${day}日 星期${weekDay}`
}

const navigateToTarget = () => {
  if (!userStore.isLogin()) {
    Taro.showToast({ title: '未登录，请先登录', icon: 'none' })
    return
  }
  Taro.navigateTo({ url: '/pages/complainforms/index' })
}

const goToPhonePage = () => {
  if (!userStore.isLogin()) {
    Taro.showToast({ title: '未登录，请先登录', icon: 'none' })
    return
  }
  Taro.navigateTo({ url: '/pages/phone/index' })
}

const fetchBannerList = async () => {
  try {
    const res = await Taro.request({
      url: 'https://api.kuangqiaodongjie.cn/api/community/banners',
      method: 'GET'
    })
    if (res.statusCode === 200 && res.data.code === 200) {
      const list = res.data?.data?.data
      bannerList.value = Array.isArray(list)
        ? list.map(item => ({
            imgUrl: `https://api.kuangqiaodongjie.cn${item.banner_image}`
          }))
        : []
    } else {
      bannerList.value = []
    }
  } catch (err) {
    console.error('获取轮播图失败', err)
    bannerList.value = []
  } finally {
    bannerLoading.value = false
  }
}

const fetchWarmNotice = async () => {
  try {
    const res = await Taro.request({
      url: 'https://api.kuangqiaodongjie.cn/api/community/warm_notice',
      method: 'GET'
    })
    if (res.statusCode === 200 && res.data.code === 200) {
      text.value = res.data.data.notice
    }
  } catch (err) {
    console.error('获取温馨提示失败', err)
  }
}

const fetchCarLimit = async () => {
  try {
    const res = await Taro.request({
      url: 'https://api.kuangqiaodongjie.cn/api/community/car_limit',
      method: 'GET'
    })
    if (res.statusCode === 200 && res.data.code === 200) {
      todayRestriction.value = res.data.data.today_limit
      tomorrowRestriction.value = res.data.data.tomorrow_limit
    }
  } catch (err) {
    console.error('获取限行信息失败', err)
  }
}

onMounted(() => {
  fetchBannerList()
  fetchWarmNotice()
  fetchCarLimit()
})
</script>
