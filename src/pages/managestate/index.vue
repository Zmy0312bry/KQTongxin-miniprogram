<template>
  <view class="state-container">
    <nut-tabs v-model="activeTab">
      <nut-tab-pane title="未处理" value="0"></nut-tab-pane>
      <nut-tab-pane title="待回访" value="1"></nut-tab-pane>
      <nut-tab-pane title="已完成" value="2"></nut-tab-pane>
    </nut-tabs>

    <!-- 表单列表内容 -->
    <view class="form-list">
      <nut-cell-group>
        <nut-cell
          v-for="item in formList"
          :key="item.uuidx"
          :title="item.title"
          class="form-item"
          is-link
          @click="handleItemClick(item)"
        >
          <template #desc>
            <view class="form-info">
              <text class="form-type">{{
                item.type === "complaint" ? "投诉" : "建议"
              }}</text>
              <text class="form-time">{{ formatTime(item.upload_time) }}</text>
            </view>
          </template>
        </nut-cell>
      </nut-cell-group>
    </view>

    <!-- 加载更多 -->
    <view v-if="formList.length > 0" class="load-more">
      <nut-button
        v-if="currentPage < totalPages"
        size="small"
        type="primary"
        @click="loadMore"
      >
        加载更多
      </nut-button>
      <text v-else class="no-more"></text>
    </view>

    <!-- 空状态 -->
    <view v-if="!isLoading && formList.length === 0" class="empty-state">
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import Taro from "@tarojs/taro";
import { API_BASE_URL } from "../../config/api";

const activeTab = ref("0");
const formList = ref([]);
const currentPage = ref(1);
const totalPages = ref(1);
const isLoading = ref(false);
const PAGE_SIZE = 10;
const token = Taro.getStorageSync("token");

// 只展示年月日
const formatTime = (timestamp) => {
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fetchFormList = async (page = 1, replace = true) => {
  isLoading.value = true;
  if (replace) formList.value = [];

  try {
    const res = await Taro.request({
      url: `${API_BASE_URL}/proceed/admin_form`,
      method: "GET",
      data: {
        page_size: PAGE_SIZE,
        page: page,
        finish: activeTab.value,
      },
      header: {
        Authorization: token,
        "Content-Type": "application/json",
      },
    });

    // ✅ 补充401处理：不影响后续code判断
    if (res.statusCode === 401) {
      Taro.showToast({ title: "登录过期，请重新登录", icon: "none" });
      // 清除本地存储的 token
      Taro.removeStorageSync("token");
      setTimeout(() => {
        // 跳转到主页并切换到"我的"tab
        Taro.reLaunch({ url: "/pages/index/index?tab=2" });
      }, 1500);
      return;
    }

    // ✅ 原始逻辑不动
    if (res.statusCode === 200) {
      const code = res.data.code;

      if (code === 200) {
        const { results, total_pages } = res.data.data || {};
        totalPages.value = total_pages || 1;

        if (Array.isArray(results)) {
          if (results.length === 0 && replace) {
            Taro.showToast({ title: "暂无数据", icon: "none" });
          }
          formList.value = replace ? results : [...formList.value, ...results];
        } else {
          if (replace) formList.value = [];
          Taro.showToast({ title: "数据格式错误", icon: "none" });
        }
      } else if (code === 400) {
        if (replace) formList.value = [];
        Taro.showToast({ title: "暂无数据", icon: "none" });
      } else if (code === 401) {
        if (replace) formList.value = [];
        Taro.showToast({ title: "登录过期，请重新登录", icon: "none" });
        // 清除本地存储的 token
        Taro.removeStorageSync("token");
        setTimeout(() => {
          // 跳转到主页并切换到"我的"tab
          Taro.reLaunch({ url: "/pages/index/index?tab=2" });
        }, 1500);
      } else {
        if (replace) formList.value = [];
        Taro.showToast({ title: res.data.message || "加载失败", icon: "none" });
      }
    } else {
      if (replace) formList.value = [];
      Taro.showToast({ title: "网络异常", icon: "none" });
    }
  } catch (error) {
    if (replace) formList.value = [];
    console.error("请求失败:", error);
    Taro.showToast({ title: "请求错误", icon: "none" });
  } finally {
    isLoading.value = false;
  }
};

const loadMore = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchFormList(currentPage.value, false);
  }
};

const handleItemClick = (item) => {
  if (activeTab.value === "0") {
    Taro.navigateTo({
      url: `/pages/managedetails/index?id=${item.uuidx}`,
    });
  } else {
    Taro.navigateTo({
      url: `/pages/managedetailss/index?id=${item.uuidx}&from=${activeTab.value}`,
    });
  }
};

watch(activeTab, () => {
  currentPage.value = 1;
  fetchFormList(1, true);
});

onMounted(() => {
  fetchFormList();
});
</script>

<style scoped>
.state-container {
  padding: 20rpx;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.form-list {
  margin-top: 20rpx;
}

.form-item {
  margin-bottom: 16rpx;
  border-radius: 12rpx;
  overflow: hidden;
  background-color: #ffffff;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.form-info {
  display: flex;
  flex-direction: row;
  gap: 16rpx;
  margin-top: 8rpx;
}

.form-type,
.form-time {
  color: #666;
  font-size: 24rpx;
}

.load-more {
  display: flex;
  justify-content: center;
  padding: 32rpx 0 20rpx 0; /* 上方空出一个字高度 */
}

.no-more {
  color: #999;
  font-size: 26rpx;
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
