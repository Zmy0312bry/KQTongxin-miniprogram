<template>
  <view class="subscribe-container">
    <!-- 提示信息区域 -->
    <view class="tips-section">
      <view class="tips-title">订阅消息提醒</view>
      <view class="tips-desc">
        为了及时接收派单通知，您需要订阅消息推送服务。
      </view>
      <view class="tips-warning">
        <text class="warning-icon">⚠️</text>
        <text>订阅后可以实时获取派单状态更新</text>
      </view>
    </view>

    <!-- 订阅选项列表 -->
    <view class="subscribe-list">
      <nut-cell-group>
        <nut-cell title="派单通知" desc="当您有新派单时接收通知" is-link>
          <template #icon>
            <text class="subscribe-icon">📢</text>
          </template>
        </nut-cell>
        <nut-cell title="处理进度" desc="派单处理过程中的进度更新" is-link>
          <template #icon>
            <text class="subscribe-icon">📋</text>
          </template>
        </nut-cell>
        <nut-cell title="完成提醒" desc="派单完成后的通知" is-link>
          <template #icon>
            <text class="subscribe-icon">✅</text>
          </template>
        </nut-cell>
      </nut-cell-group>
    </view>

    <!-- 操作按钮 -->
    <view class="action-buttons">
      <nut-button type="primary" block @click="handleSubscribe">
        立即订阅
      </nut-button>
      <nut-button block @click="handleCancel" style="margin-top: 20rpx;">
        取消
      </nut-button>
    </view>
  </view>
</template>

<script setup>
import { ref } from "vue";
import Taro from "@tarojs/taro";

const templateId = "FVrAJnJauxtOwiEpxOW47zKiSICGIFvaq8iXUaHtY-g";

// 处理订阅
const handleSubscribe = async () => {
  try {
    const res = await Taro.requestSubscribeMessage({
      tmplIds: [templateId],
    });

    console.log("订阅结果:", res);

    if (res && res[templateId] === "accept") {
      // 用户同意订阅，标记已订阅
      const userId = Taro.getStorageSync("userId");
      const subscribedKey = `subscribed_dispatch_${userId}`;
      Taro.setStorageSync(subscribedKey, true);

      Taro.showToast({ title: "订阅成功", icon: "success" });

      // 跳转到我的派单页面
      setTimeout(() => {
        Taro.redirectTo({
          url: "/pages/mydispatch/index",
        });
      }, 1500);
    } else {
      // 用户拒绝订阅
      Taro.showToast({ title: "您已拒绝订阅", icon: "none" });
      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
    }
  } catch (err) {
    console.error("[订阅失败]", err);
    Taro.showToast({ title: "订阅失败，请重试", icon: "none" });
  }
};

// 取消订阅
const handleCancel = () => {
  Taro.navigateBack();
};
</script>

<style scoped>
.subscribe-container {
  padding: 20rpx;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.tips-section {
  background-color: #ffffff;
  border-radius: 12rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.tips-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.tips-desc {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  margin-bottom: 20rpx;
}

.tips-warning {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 20rpx;
  background-color: #fff7e6;
  border-radius: 8rpx;
  border-left: 4rpx solid #faad14;
}

.warning-icon {
  font-size: 28rpx;
}

.tips-warning text {
  font-size: 26rpx;
  color: #fa8c16;
}

.subscribe-list {
  margin-bottom: 40rpx;
}

.subscribe-icon {
  font-size: 36rpx;
  margin-right: 10rpx;
}

.action-buttons {
  padding: 0 20rpx;
}
</style>
