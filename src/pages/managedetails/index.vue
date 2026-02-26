<template>
  <view class="details-container">
    <view class="details-content" v-if="!loadError && formData">
      <!-- 表单详情 -->
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

      <!-- 内容展示 -->
      <view class="content-card" v-if="formData.content">
        <view class="card-title">诉求内容</view>
        <view class="card-body">{{ formData.content }}</view>
      </view>

      <!-- 图片展示 -->
      <view v-if="formData.images?.length">
        <nut-divider content-position="left" class="custom-divider"
          >图片展示</nut-divider
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

      <!-- 表单处理 -->
      <nut-divider content-position="left" class="custom-divider"
        >处理信息填写</nut-divider
      >
      <nut-form ref="formRef" :model-value="formModel">
        <nut-form-item
          label="处理人"
          prop="admin_name"
          required
          :rules="[{ required: true, message: '请填写处理人' }]"
        >
          <nut-input
            v-model="formModel.admin_name"
            placeholder="请输入处理人姓名"
          />
        </nut-form-item>

        <nut-form-item
          label="联系方式"
          prop="admin_phone"
          required
          :rules="[
            { required: true, message: '请填写联系方式' },
            { pattern: /^[1][3-9][0-9]{9}$/, message: '手机号格式不正确' },
          ]"
        >
          <nut-input
            v-model="formModel.admin_phone"
            placeholder="请输入手机号"
            maxlength="11"
          />
        </nut-form-item>

        <nut-form-item
          label="处理方式"
          prop="admin_way"
          required
          :rules="[{ required: true, message: '请填写处理方式' }]"
        >
          <nut-input
            v-model="formModel.admin_way"
            placeholder="请输入处理方式"
          />
        </nut-form-item>

        <nut-form-item
          label="处理详情"
          prop="admin_content"
          required
          :rules="[{ required: true, message: '请填写处理详情' }]"
        >
          <nut-textarea
            v-model="formModel.admin_content"
            placeholder="请输入处理详情"
            maxlength="500"
          />
        </nut-form-item>

        <!-- 上传图片 -->
        <nut-form-item label="上传图片">
          <view class="image-grid">
            <view
              class="image-item"
              v-for="(image, index) in formModel.handle_images"
              :key="index"
            >
              <image :src="image" mode="aspectFill" class="grid-image" />
              <view class="delete-icon-wrapper" @click="removeImage(index)">
                <view class="delete-icon">×</view>
              </view>
            </view>
            <view
              v-if="formModel.handle_images.length < 9"
              class="image-item add-btn"
              @click="chooseImage"
            >
              <text class="plus-inner">+</text>
            </view>
          </view>
        </nut-form-item>

        <nut-button type="primary" block class="submit-btn" @click="submitForm"
          >提交处理</nut-button
        >
      </nut-form>
    </view>

    <!-- 异常或加载中状态 -->
    <view v-if="loadError && !loading" class="empty-fallback"
      >表单数据加载失败</view
    >
    <view class="loading-overlay" v-if="loading">
      <view class="loading-text">加载中...</view>
    </view>
  </view>
</template>
<script setup>
import { ref, reactive, onMounted } from "vue";
import Taro from "@tarojs/taro";
import { useUserStore } from "../../store/user"; // ✅ 根据你的目录结构，正确引入
import { API_BASE_URL, IMAGE_BASE_URL } from "../../config/api";

const formData = ref(null);
const previewImages = ref([]);
const loading = ref(true);
const loadError = ref(false);
const uuid = ref("");

const formRef = ref(null);
const formModel = reactive({
  admin_name: "",
  admin_phone: "",
  admin_way: "",
  admin_content: "",
  handle_images: [],
});

const userStore = useUserStore(); // ✅ 实例化

const getImageUrl = (path) => {
  if (!path) return "";
  return path.startsWith("http") ? path : `${IMAGE_BASE_URL}/${path}`;
};

const formatDate = (timestamp) => {
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fetchFormDetail = async (id) => {
  loading.value = true;
  loadError.value = false;
  try {
    const res = await Taro.request({
      url: `${API_BASE_URL}/proceed/admin_form`,
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
      if (detail.images?.length) {
        previewImages.value = detail.images.map((img) =>
          getImageUrl(img.image),
        );
      }
      console.log("表单详情获取成功:", detail);
    } else {
      Taro.showToast({ title: res.data.message || "加载失败", icon: "none" });
      loadError.value = true;
    }
  } catch (e) {
    console.error("表单请求失败:", e);
    Taro.showToast({ title: "请求失败", icon: "none" });
    loadError.value = true;
  } finally {
    loading.value = false;
  }
};

const previewImage = (index) => {
  Taro.previewImage({
    current: previewImages.value[index],
    urls: previewImages.value,
  });
};

const chooseImage = () => {
  Taro.chooseImage({
    count: 9 - formModel.handle_images.length,
    success(res) {
      console.log("选择图片:", res.tempFilePaths);
      formModel.handle_images = formModel.handle_images.concat(
        res.tempFilePaths,
      );
    },
    fail() {
      Taro.showToast({ title: "图片选择失败", icon: "none" });
    },
  });
};

const removeImage = (index) => {
  formModel.handle_images.splice(index, 1);
  console.log("移除图片索引:", index);
};

const uploadImage = async (path, index) => {
  try {
    const uploadRes = await Taro.uploadFile({
      url: `${API_BASE_URL}/proceed/upload_image`,
      filePath: path,
      name: "file",
      header: {
        Authorization: Taro.getStorageSync("token") || "",
      },
    });

    console.log(`第 ${index + 1} 张上传原始返回:`, uploadRes);

    let result = JSON.parse(uploadRes.data);
    if (result.code === 200 && result.data?.path) {
      return {
        image: result.data.path,
        source: "admin",
        upload_time: Math.floor(Date.now() / 1000),
      };
    } else {
      throw new Error(
        `第 ${index + 1} 张上传失败：${result.message || "未知错误"}`,
      );
    }
  } catch (err) {
    throw new Error(`第 ${index + 1} 张上传失败：${err.message}`);
  }
};

const submitForm = async () => {
  try {
    const valid = await formRef.value.validate();
    if (!valid.valid) {
      const msg = valid.errors?.[0]?.message || "表单校验失败";
      Taro.showToast({ title: msg, icon: "none" });
      return;
    }

    Taro.showLoading({ title: "处理中...", mask: true });

    const imagePaths = [];
    for (let i = 0; i < formModel.handle_images.length; i++) {
      const imageInfo = await uploadImage(formModel.handle_images[i], i);
      imagePaths.push(imageInfo.image);
    }

    const requestBody = {
      name: formModel.admin_name,
      phone: formModel.admin_phone,
      way: formModel.admin_way,
      content: formModel.admin_content,
      handle_images: imagePaths,
    };

    console.log("最终提交数据:", requestBody);

    const res = await Taro.request({
      url: `${API_BASE_URL}/proceed/admin_form?uuid=${uuid.value}`,
      method: "PUT",
      data: requestBody,
      header: {
        Authorization: Taro.getStorageSync("token"),
        "Content-Type": "application/json",
      },
    });

    Taro.hideLoading();

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
    Taro.hideLoading();
    Taro.showToast({ title: err.message || "提交失败", icon: "none" });
  }
};

onMounted(() => {
  const params = Taro.getCurrentInstance().router.params;
  if (params.id) {
    console.log("获取参数 id:", params.id);
    fetchFormDetail(params.id);
  }

  // ✅ 页面加载时自动填充手机号
  if (userStore.phone) {
    formModel.admin_phone = userStore.phone;
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

/* 图片九宫格布局样式 */
.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 严格三列 */
  gap: 10rpx;
  margin-top: 20rpx;
}

.image-item {
  width: 100%; /* 由 grid 控制宽度 */
  aspect-ratio: 1 / 1;
  border-radius: 8rpx;
  overflow: hidden;
  background-color: #f0f0f0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.grid-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 8rpx;
}

.add-btn {
  border: 2rpx dashed #ccc;
}

.plus-inner {
  font-size: 64rpx;
  color: #999;
}

/* 删除按钮样式 */
.delete-icon-wrapper {
  position: absolute;
  top: 6rpx;
  right: 6rpx;
  width: 36rpx;
  height: 36rpx;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.delete-icon {
  color: #fff;
  font-size: 24rpx;
  font-weight: bold;
  line-height: 36rpx;
}

/* 内容卡片样式 */
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

/* Loading和错误提示 */
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

/* 表单按钮间距 */
.nut-button.submit-btn {
  margin-top: 40rpx;
}
</style>
