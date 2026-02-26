<template>
  <view class="details-container">
    <view class="details-content" v-if="!loadError && formData">
      <!-- 回访总结输入（仅“待回访”时显示） -->
      <view v-if="fromTab === '1'" class="content-card">
        <view class="card-title">回访总结</view>
        <nut-textarea
          v-model="feedbackSummary"
          placeholder="请输入回访总结"
          maxlength="500"
        />
        <nut-button
          type="primary"
          block
          class="submit-btn"
          @click="submitFeedback"
        >
          提交总结
        </nut-button>
      </view>

      <!-- 上半部分：表单详情 -->
      <nut-cell-group>
        <nut-cell title="标题" :desc="formData.title"></nut-cell>
        <nut-cell
          title="时间"
          :desc="formatDate(formData.upload_time)"
        ></nut-cell>
        <nut-cell title="姓名" :desc="formData.name"></nut-cell>
        <nut-cell title="联系方式" :desc="formData.phone"></nut-cell>
        <nut-cell title="地址" :desc="formData.address"></nut-cell>
        <nut-cell
          title="是否需要回访"
          :desc="formData.feedback_need ? '是' : '否'"
        ></nut-cell>
      </nut-cell-group>

      <view class="content-card" v-if="formData.content">
        <view class="card-title">诉求内容</view>
        <view class="card-body">{{ formData.content }}</view>
      </view>

      <view v-if="formData.images?.length">
        <nut-divider content-position="left" class="custom-divider"
          >用户图片</nut-divider
        >
        <view class="image-grid">
          <view
            class="image-item"
            v-for="(img, index) in formData.images"
            :key="index"
            @click="previewImage(index)"
          >
            <image
              :src="getImageUrl(img.image)"
              mode="aspectFill"
              class="grid-image"
            />
          </view>
        </view>
      </view>

      <!-- 下半部分：处理结果展示 -->
      <nut-cell-group>
        <nut-cell
          title="处理人"
          :desc="formData.admin_name || '暂无'"
        ></nut-cell>
        <nut-cell
          title="联系方式"
          :desc="formData.admin_phone || '暂无'"
        ></nut-cell>
        <nut-cell
          title="处理方式"
          :desc="formData.admin_way || '暂无'"
        ></nut-cell>
      </nut-cell-group>

      <view class="content-card" v-if="formData.admin_content">
        <view class="card-title">处理内容</view>
        <view class="card-body">{{ formData.admin_content }}</view>
      </view>

      <view v-if="formData.handle_images?.length">
        <nut-divider content-position="left" class="custom-divider"
          >处理图片</nut-divider
        >
        <view class="image-grid">
          <view
            class="image-item"
            v-for="(img, index) in formData.handle_images"
            :key="index"
            @click="previewHandleImage(index)"
          >
            <image
              :src="getImageUrl(img.image)"
              mode="aspectFill"
              class="grid-image"
            />
          </view>
        </view>
      </view>
    </view>

    <view v-if="loadError && !loading" class="empty-fallback">
      表单数据加载失败
    </view>

    <view class="loading-overlay" v-if="loading">
      <view class="loading-text">加载中...</view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from "vue";
import Taro from "@tarojs/taro";
import { API_BASE_URL, IMAGE_BASE_URL } from "../../config/api";

const formData = ref(null);
const previewImages = ref([]);
const loading = ref(true);
const loadError = ref(false);

const feedbackSummary = ref("");
const fromTab = ref("");
const uuid = ref("");

const getImageUrl = (path) => {
  if (!path) return "";
  return path.startsWith("http") ? path : `${IMAGE_BASE_URL}${path}`;
};

const formatDate = (timestamp) => {
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fetchFormDetail = async (id) => {
  loading.value = true;
  loadError.value = false;
  try {
    const res = await Taro.request({
      url: `${API_BASE_URL}/proceed/user_form`,
      method: "GET",
      data: { uuid: id },
      header: {
        Authorization: Taro.getStorageSync("token"),
        "Content-Type": "application/json",
      },
    });

    if (res.statusCode === 200 && res.data.code === 200) {
      const detail = Array.isArray(res.data.data)
        ? res.data.data[0]
        : res.data.data;
      formData.value = detail;
      uuid.value = detail.uuidx;
      console.log("表单详情数据 formData:", formData.value);

      if (detail.handle_images?.length) {
        previewImages.value = detail.handle_images.map((img) =>
          getImageUrl(img.image),
        );
      }
    } else {
      Taro.showToast({ title: res.data.message || "加载失败", icon: "none" });
      loadError.value = true;
    }
  } catch (err) {
    console.error("请求失败:", err);
    Taro.showToast({ title: "请求失败", icon: "none" });
    loadError.value = true;
  } finally {
    loading.value = false;
  }
};

const submitFeedback = async () => {
  if (!feedbackSummary.value.trim()) {
    Taro.showToast({ title: "请输入回访总结", icon: "none" });
    return;
  }

  try {
    const res = await Taro.request({
      url: `${API_BASE_URL}/proceed/admin_handle?uuid=${uuid.value}`,
      method: "PUT",
      data: {
        feedback_summary: feedbackSummary.value.trim(),
      },
      header: {
        Authorization: Taro.getStorageSync("token"),
        "Content-Type": "application/json",
      },
    });

    console.log("提交反馈接口返回：", res);

    if (res.statusCode === 200 && res.data.code === 200) {
      Taro.showToast({
        title: "提交成功",
        icon: "success",
        duration: 1000,
      });
      setTimeout(() => {
        Taro.reLaunch({
          url: "/pages/managestate/index",
        });
      }, 1000);
    } else {
      throw new Error(res.data.message || "提交失败");
    }
  } catch (err) {
    console.error("提交失败:", err);
    Taro.showToast({ title: err.message || "提交失败", icon: "none" });
  } finally {
    Taro.hideLoading();
  }
};

const previewImage = (index) => {
  const urls = formData.value.images.map((img) => getImageUrl(img.image));
  Taro.previewImage({ current: urls[index], urls });
};

const previewHandleImage = (index) => {
  const urls = formData.value.handle_images.map((img) =>
    getImageUrl(img.image),
  );
  Taro.previewImage({ current: urls[index], urls });
};

onMounted(() => {
  const params = Taro.getCurrentInstance().router.params;
  if (params.id) {
    fetchFormDetail(params.id);
  }
  if (params.from) {
    fromTab.value = params.from;
  }
});
</script>

<style>
.details-container {
  padding: 20rpx;
  min-height: 100vh;
  background-color: #f5f5f5;
  position: relative;
}

.details-content {
  background-color: #ffffff;
  border-radius: 12rpx;
  padding: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.custom-divider {
  padding-left: 32rpx;
  text-align: left !important;
  font-size: 28rpx;
  color: #333;
}

.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 20rpx;
}

.image-item {
  width: calc(33.33% - 10rpx);
  height: 200rpx;
  border-radius: 8rpx;
  overflow: hidden;
  background-color: #f0f0f0;
}

.grid-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 8rpx;
}

.content-card {
  margin: 20rpx 0;
  padding: 20rpx;
  background-color: #f9f9f9;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.05);
}

.card-title {
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 12rpx;
  color: #333;
}

.card-body {
  font-size: 26rpx;
  line-height: 1.6;
  color: #666;
  white-space: pre-wrap;
}

.submit-btn {
  margin-top: 24rpx;
}

.loading-overlay {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 40rpx;
  border-radius: 16rpx;
}

.loading-text {
  font-size: 28rpx;
  color: #666;
  margin-top: 16rpx;
}

.empty-fallback {
  padding: 40rpx;
  font-size: 28rpx;
  color: #999;
  text-align: center;
}
</style>
