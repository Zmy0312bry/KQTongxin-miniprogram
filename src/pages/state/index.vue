<template>
  <view class="state-container">
    <nut-tabs v-model="activeTab">
      <nut-tab-pane title="未处理" value="0"></nut-tab-pane>
      <nut-tab-pane title="处理中" value="1"></nut-tab-pane>
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

const activeTab = ref("0");
const formList = ref([]);
const currentPage = ref(1);
const totalPages = ref(1);
const isLoading = ref(false);
const PAGE_SIZE = 4;

const token = Taro.getStorageSync("token");

// 格式化时间戳
const formatTime = (timestamp) => {
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 获取表单列表
const fetchFormList = async (page = 1, replace = true) => {
  isLoading.value = true;
  if (replace) formList.value = [];

  try {
    const res = await Taro.request({
      url: "https://api.kuangqiaodongjie.cn/api/proceed/user_form",
      method: "GET",
      data: {
        page_size: PAGE_SIZE,
        page: page,
        finish: activeTab.value,
      },
      header: {
        Authorization: Taro.getStorageSync("token") || "",
        "Content-Type": "application/json",
      },
    });

    console.log("接口响应:", res);

    // ✅ token 过期处理
    if (res.statusCode === 401 || res.data?.code === 401) {
      Taro.removeStorageSync("token");
      Taro.removeStorageSync("nickName");
      Taro.removeStorageSync("avatarUrl");
      Taro.removeStorageSync("userId");

      Taro.showToast({ title: "登录过期，请重新登录", icon: "none" });
      setTimeout(() => {
        // 跳转到主页并切换到"我的"tab
        Taro.reLaunch({ url: "/pages/index/index?tab=2" });
      }, 1500);
      return;
    }

    if (res.statusCode === 200 && res.data.code === 200) {
      const { total_pages, results } = res.data.data || {};
      totalPages.value = total_pages || 1;

      if (Array.isArray(results)) {
        if (replace) {
          formList.value = results;
          if (results.length === 0) {
            Taro.showToast({ title: "暂无数据", icon: "none" });
          }
        } else {
          formList.value = [...formList.value, ...results];
        }
      } else {
        if (replace) formList.value = [];
        Taro.showToast({ title: "数据格式错误", icon: "none" });
      }
    } else {
      if (replace) formList.value = [];
      const msg = res.data?.message;
      if (msg?.includes("不存在") || msg?.includes("未找到")) {
        Taro.showToast({ title: "暂无数据", icon: "none" });
      } else {
        Taro.showToast({ title: msg || "加载失败", icon: "none" });
      }
    }
  } catch (error) {
    if (replace) formList.value = [];
    console.error("请求失败:", error);
    Taro.showToast({ title: "请求错误", icon: "none" });
  } finally {
    isLoading.value = false;
  }
};

// 加载更多
const loadMore = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchFormList(currentPage.value, false);
  }
};

// 表单项点击事件
const handleItemClick = (item) => {
  if (activeTab.value === "0") {
    Taro.showToast({
      title: "请等待工作人员处理",
      icon: "none",
    });
  } else {
    Taro.navigateTo({
      url: `/pages/details/index?id=${item.uuidx}`,
    });
  }
};

// 标签页切换监听
watch(activeTab, () => {
  currentPage.value = 1;
  fetchFormList(1, true);
});

// 初始加载
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
  align-items: center;
  gap: 16rpx;
  margin-top: 8rpx;
}

.form-type {
  color: #666;
  font-size: 24rpx;
}

.form-time {
  color: #999;
  font-size: 24rpx;
}

.load-more {
  display: flex;
  justify-content: center;
  padding: 20rpx 0;
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
