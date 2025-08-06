<template>
  <view class="details-container">
    <view class="details-content" v-if="!loadError && formData">
      <nut-cell-group>
        <nut-cell title="处理人" :desc="formData.admin_name || '暂无'"></nut-cell>
        <nut-cell title="联系方式" :desc="formData.admin_phone || '暂无'"></nut-cell>
        <nut-cell title="处理方式" :desc="formData.admin_way || '暂无'"></nut-cell>
      </nut-cell-group>

      <!-- 处理内容卡片 -->
      <view class="content-card" v-if="formData.admin_content">
        <view class="card-title">处理内容</view>
        <view class="card-body">{{ formData.admin_content }}</view>
      </view>

      <!-- 图片九宫格 -->
      <view v-if="formData.handle_images?.length">
        <nut-divider content-position="left" class="custom-divider">图片展示</nut-divider>
        <view class="image-grid">
          <view
            class="image-item"
            v-for="(img, index) in formData.handle_images"
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

      <!-- 评分模块（handle === 2 且未评分） -->
      <view
        class="rating-section"
        v-if="formData.handle === 2 && !formData.evaluation_or_not"
      >
        <nut-divider content-position="left">满意度评分</nut-divider>
        <nut-rate
          :model-value="rating"
          :count="5"
          size="24"
          active-color="#fa2c19"
          @change="onRatingChange"
        />
        <nut-button
          type="primary"
          block
          style="margin-top: 20rpx;"
          @click="submitRating"
        >
          提交评分
        </nut-button>
      </view>

      <!-- 已评分（handle === 2 且已评分） -->
      <view
        class="rating-section"
        v-else-if="formData.handle === 2 && formData.evaluation_or_not"
      >
        <nut-divider content-position="left">您已评分</nut-divider>
        <nut-rate
          :model-value="formData.evaluation_info"
          :count="5"
          size="24"
          readonly
        />
      </view>
    </view>

    <!-- 加载失败 -->
    <view v-if="loadError && !loading" class="empty-fallback">
      表单数据加载失败
    </view>

    <!-- Loading提示 -->
    <view class="loading-overlay" v-if="loading">
      <view class="loading-text">加载中...</view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Taro from '@tarojs/taro';

const formData = ref(null);
const previewImages = ref([]);
const loading = ref(true);
const loadError = ref(false);
const rating = ref(0);

const getImageUrl = (path) => {
  if (!path) return '';
  return path.startsWith('http')
    ? path
    : `https://api.kuangqiaodongjie.cn${path}`;
};

const onRatingChange = (val) => {
  rating.value = val;
};

const submitRating = async () => {
  if (rating.value < 1 || rating.value > 5) {
    Taro.showToast({ title: '请先选择评分', icon: 'none' });
    return;
  }

  try {
    const uuid = formData.value?.uuidx;
    const token = Taro.getStorageSync('token') || '';

    const res = await Taro.request({
      url: `https://api.kuangqiaodongjie.cn/api/proceed/user_form?uuid=${uuid}`,
      method: 'PATCH',
      header: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      data: { evaluation_info: rating.value },
    });

    if (res.statusCode === 200 && res.data.code === 200) {
      Taro.showToast({ title: '评分成功', icon: 'success' });
      // 直接更新本地数据，防止重复提交
      formData.value.evaluation_or_not = true;
      formData.value.evaluation_info = rating.value;
    } else {
      throw new Error(res.data.message || '提交失败');
    }
  } catch (err) {
    console.error('评分失败:', err);
    Taro.showToast({ title: err.message || '评分失败', icon: 'none' });
  }
};

const fetchFormDetail = async (uuid) => {
  loading.value = true;
  loadError.value = false;
  try {
    const res = await Taro.request({
      url: 'https://api.kuangqiaodongjie.cn/api/proceed/user_form',
      method: 'GET',
      data: { uuid },
      header: {
        Authorization: Taro.getStorageSync('token'),
        'Content-Type': 'application/json',
      },
    });

    if (res.statusCode === 200) {
      const code = res.data.code;
      if (code === 200) {
        const detail = res.data.data;
        formData.value = Array.isArray(detail) ? detail[0] : detail;
        formData.value.handle = Number(formData.value.handle); // 确保是数字
        if (formData.value?.handle_images?.length) {
          previewImages.value = formData.value.handle_images.map((img) =>
            getImageUrl(img.image)
          );
        }
        // 如果后端返回了评分，就同步到 rating
        if (formData.value.evaluation_info) {
          rating.value = formData.value.evaluation_info;
        }
      } else if (code === 400) {
        Taro.showToast({ title: '暂无数据', icon: 'none' });
        loadError.value = true;
      } else if (code === 401) {
        Taro.showToast({ title: '登录过期，请重新登录', icon: 'none' });
        setTimeout(() => {
          Taro.navigateTo({ url: '/pages/manapanel/index' });
        }, 1500);
        return;
      } else {
        Taro.showToast({
          title: res.data.message || '加载失败',
          icon: 'none',
        });
        loadError.value = true;
      }
    } else {
      Taro.showToast({ title: '请求错误', icon: 'none' });
      loadError.value = true;
    }
  } catch (error) {
    console.error('请求失败:', error);
    Taro.showToast({ title: '请求失败', icon: 'none' });
    loadError.value = true;
  } finally {
    loading.value = false;
  }
};

const previewImage = (index) => {
  if (!previewImages.value || !previewImages.value.length) {
    Taro.showToast({ title: '暂无图片', icon: 'none' });
    return;
  }
  Taro.previewImage({
    current: previewImages.value[index] || previewImages.value[0],
    urls: previewImages.value,
  });
};

onMounted(() => {
  const params = Taro.getCurrentInstance().router.params;
  if (params.id) {
    fetchFormDetail(params.id);
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

.rating-section {
  margin-top: 32rpx;
  padding: 20rpx;
  background-color: #ffffff;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.05);
}
</style>
