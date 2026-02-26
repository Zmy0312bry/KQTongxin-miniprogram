<template>
  <view class="mydispatch-container">
    <!-- 派单列表内容 -->
    <view class="dispatch-list">
      <nut-list :list-data="dispatchList" @scroll-bottom="onScrollBottom">
        <template #default="{ item }">
          <nut-cell-group>
            <nut-cell
              :title="item.title"
              class="dispatch-item"
              is-link
              @click="handleItemClick(item)"
            >
              <template #desc>
                <view class="dispatch-info">
                  <text class="dispatch-type">{{
                    item.type || "派单详情"
                  }}</text>
                  <text class="dispatch-time">{{
                    formatTime(item.upload_time)
                  }}</text>
                </view>
              </template>
            </nut-cell>
          </nut-cell-group>
        </template>
      </nut-list>
    </view>

    <!-- 加载提示 -->
    <view v-if="isLoading" class="loading-state">
      <text>加载中...</text>
    </view>

    <!-- 空状态 -->
    <view v-if="!isLoading && dispatchList.length === 0" class="empty-state">
      <text>暂无派单数据</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from "vue";
import Taro from "@tarojs/taro";
import { API_BASE_URL } from "../../config/api";

const dispatchList = ref([]);
const currentPage = ref(1);
const hasMore = ref(true);
const isLoading = ref(false);
const PAGE_SIZE = 8;

const token = Taro.getStorageSync("token");

// 格式化时间戳
const formatTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 获取派单列表
const fetchDispatchList = async (page = 1) => {
  if (isLoading.value || !hasMore.value) return;

  isLoading.value = true;

  try {
    const res = await Taro.request({
      url: `${API_BASE_URL}/proceed/dispatch_order`,
      method: "GET",
      data: {
        page_size: PAGE_SIZE,
        page: page,
      },
      header: {
        Authorization: token || "",
        "Content-Type": "application/json",
      },
    });

    console.log("派单接口返回体:", res); // 先打印返回体

    // token 过期处理
    if (res.statusCode === 401 || res.data?.code === 401) {
      Taro.removeStorageSync("token");
      Taro.removeStorageSync("nickName");
      Taro.removeStorageSync("avatarUrl");
      Taro.removeStorageSync("userId");

      Taro.showToast({ title: "登录过期，请重新登录", icon: "none" });
      setTimeout(() => {
        Taro.reLaunch({ url: "/pages/index/index?tab=2" });
      }, 1500);
      return;
    }

    if (res.statusCode === 200 && res.data.code === 200) {
      const { total_pages, results } = res.data.data || {};

      if (Array.isArray(results)) {
        if (results.length < PAGE_SIZE) {
          hasMore.value = false;
        }
        dispatchList.value = [...dispatchList.value, ...results];
      } else {
        hasMore.value = false;
      }
    } else {
      const msg = res.data?.message;
      if (msg?.includes("不存在") || msg?.includes("未找到")) {
        hasMore.value = false;
      } else {
        Taro.showToast({ title: msg || "加载失败", icon: "none" });
      }
    }
  } catch (error) {
    console.error("请求失败:", error);
    Taro.showToast({ title: "请求错误", icon: "none" });
  } finally {
    isLoading.value = false;
  }
};

// 滚动到底部加载更多
const onScrollBottom = () => {
  if (!hasMore.value || isLoading.value) return;
  currentPage.value++;
  fetchDispatchList(currentPage.value);
};

// 派单项点击事件
const handleItemClick = (item) => {
  console.log("点击的派单项:", item);
  console.log("uuidx:", item.form_uuid);
  Taro.navigateTo({
    url: `/pages/managedetails/index?id=${item.form_uuid}`,
  });
};

// 初始加载
onMounted(() => {
  fetchDispatchList(1);
});
</script>

<style scoped>
.mydispatch-container {
  padding: 20rpx;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.dispatch-list {
  margin-top: 20rpx;
}

.dispatch-item {
  margin-bottom: 16rpx;
  border-radius: 12rpx;
  overflow: hidden;
  background-color: #ffffff;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.dispatch-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 8rpx;
}

.dispatch-type {
  color: #666;
  font-size: 24rpx;
}

.dispatch-time {
  color: #999;
  font-size: 24rpx;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 20rpx 0;
  color: #999;
  font-size: 28rpx;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200rpx;
  color: #999;
  font-size: 28rpx;
}
</style>
