<template>
  <view class="container">
    <nut-cell-group title="社区电话列表">
      <nut-cell
        v-for="item in phoneList"
        :key="item.id"
        class="phone-card"
        :title="item.phone_name"
        @click="makePhoneCall(item.phone_number)"
        is-link
      >
        <template #desc>
          <text class="number">{{ item.phone_number }}</text>
        </template>
      </nut-cell>
    </nut-cell-group>
  </view>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import Taro from '@tarojs/taro'

const phoneList = ref([])

const fetchPhoneList = async () => {
  const token = Taro.getStorageSync('token')

  try {
    const res = await Taro.request({
      url: 'https://api.kuangqiaodongjie.cn/api/community/phone_number',
      method: 'GET',
      header: {
        'Content-Type': 'application/json',
        Authorization: token
      }
    })

    // ✅ 检查 token 是否过期
    if (res.statusCode === 401 || res.data?.code === 401) {
      Taro.removeStorageSync('token')
      Taro.removeStorageSync('nickName')
      Taro.removeStorageSync('avatarUrl')
      Taro.removeStorageSync('userId')

      Taro.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
      setTimeout(() => {
        Taro.reLaunch({ url: '/pages/mypanel/index' }) // 替换为你的登录页路径
      }, 1500)
      return
    }

    if (res.statusCode === 200 && res.data.code === 200) {
      phoneList.value = res.data.data
    } else {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    }
  } catch (error) {
    console.error('请求失败:', error)
    Taro.showToast({ title: '请求错误', icon: 'none' })
  }
}

const makePhoneCall = (number) => {
  if (!number) return
  Taro.makePhoneCall({
    phoneNumber: number
  })
}

onMounted(() => {
  fetchPhoneList()
})
</script>


<style scoped>
.container {
  padding: 20rpx;
  background-color: #f5f5f5;
}

.phone-card {
  margin-bottom: 24rpx;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 16rpx rgba(0, 0, 0, 0.05);
  background-color: #fff;
}

/* 关键：强制覆盖 NutUI 默认的灰色 desc 样式 */
::v-deep(.nut-cell__desc) {
  color: #007aff !important;
  font-weight: bold;
  font-size: 30rpx;
  text-align: right;
}
</style>
