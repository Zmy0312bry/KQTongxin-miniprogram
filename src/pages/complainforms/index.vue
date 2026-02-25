<template>
  <nut-cell-group title="投诉建议">
    <nut-form ref="formRef" :model-value="formData">
      <!-- 姓名 -->
      <nut-form-item
        label="姓名"
        prop="name"
        required
        :rules="[{ required: true, message: '请填写姓名' }]"
      >
        <nut-input
          v-model="formData.name"
          placeholder="请输入姓名"
          type="text"
        />
      </nut-form-item>

      <!-- 电话 -->
      <nut-form-item
        label="联系电话"
        prop="phone"
        required
        :rules="[
          { required: true, message: '请填写联系电话' },
          {
            pattern: /^[1][3,4,5,7,8,9][0-9]{9}$/,
            message: '手机号格式不正确',
          },
        ]"
      >
        <nut-input
          v-model="formData.phone"
          placeholder="请输入联系电话"
          type="text"
          maxlength="11"
        />
      </nut-form-item>

      <!-- 地址 -->
      <nut-form-item
        label="地址"
        prop="address"
        required
        :rules="[{ required: true, message: '请补全地址' }]"
      >
        <view style="display: flex; gap: 10rpx">
          <nut-input
            v-model="formData.address"
            placeholder="请输入地址"
            type="text"
            style="flex: 1"
          />
          <nut-button size="small" type="primary" @click="chooseLocation"
            >打开地图</nut-button
          >
        </view>
      </nut-form-item>

      <!-- 是否需要回访 -->
      <nut-form-item
        label="是否需要回访"
        prop="feedback_need"
        required
        :rules="[{ required: true, message: '请选择是否需要回访' }]"
      >
        <nut-radio-group v-model="formData.feedback_need">
          <nut-radio label="1">是</nut-radio>
          <nut-radio label="0">否</nut-radio>
        </nut-radio-group>
      </nut-form-item>

      <!-- 语音按钮 -->
      <div style="display: flex; justify-content: center; margin: 20px 0">
        <nut-button
          @touchstart="startRecording"
          @touchend="stopRecording"
          :type="recording ? 'danger' : 'primary'"
          style="width: 60vw; max-width: 300px"
        >
          {{ recording ? "录音中..." : "按住说话" }}
        </nut-button>
      </div>

      <!-- 内容 -->
      <nut-form-item
        label="反馈内容"
        prop="content"
        required
        :rules="[{ required: true, message: '请填写内容' }]"
      >
        <nut-textarea
          v-model="formData.content"
          placeholder="请输入反馈内容"
          maxlength="500"
        />
      </nut-form-item>

      <!-- 上传图片 -->
      <nut-form-item label="上传图片" prop="form_images">
        <view class="image-grid">
          <view
            class="image-item"
            v-for="(image, index) in formData.form_images"
            :key="index"
          >
            <image :src="image" mode="aspectFill" class="grid-image" />
            <view class="delete-icon-wrapper" @click="removeImage(index)">
              <view class="delete-icon">×</view>
            </view>
          </view>
          <view
            v-if="formData.form_images.length < 9"
            class="image-item add-btn"
            @click="chooseImage"
          >
            <text class="plus-inner">+</text>
          </view>
        </view>
      </nut-form-item>

      <!-- 提交按钮 -->
      <nut-form-item>
        <nut-button type="primary" block @click="submitForm">提交</nut-button>
      </nut-form-item>
    </nut-form>
  </nut-cell-group>
</template>

<script setup>
import { reactive, ref, onMounted, onBeforeUnmount } from "vue";
import Taro from "@tarojs/taro";
import { useUserStore } from "../../store/user"; // ✅ 导入
import { API_BASE_URL } from "../../config/api"; // ✅ 导入API配置

const formData = reactive({
  name: "",
  phone: "",
  address: "",
  content: "",
  feedback_need: "0",
  form_images: [],
  Latitude_Longitude: "",
});

const formRef = ref(null);
const recording = ref(false);
const manager = Taro.requirePlugin("WechatSI").getRecordRecognitionManager();
const userStore = useUserStore(); // ✅ 实例化

const initRecord = () => {
  manager.onStart = () => console.log("开始录音");
  manager.onStop = (res) => {
    if (res.result) {
      formData.content = res.result;
    }
  };
  manager.onError = (err) => {
    console.error("录音错误", err);
  };
};

const startRecording = () => {
  recording.value = true;
  manager.start({ lang: "zh_CN" });
};

const stopRecording = () => {
  recording.value = false;
  manager.stop();
};

const chooseLocation = async () => {
  try {
    const res = await Taro.chooseLocation();
    const fullAddress =
      res.name && res.name !== res.address
        ? `${res.name} ${res.address}`
        : res.address;
    formData.address = fullAddress;

    if (res.latitude && res.longitude) {
      formData.Latitude_Longitude = `${res.latitude},${res.longitude}`;
    }
  } catch (err) {
    if (!/cancel/.test(err?.errMsg || "")) {
      console.error("地图选择失败", err);
      Taro.showToast({ title: "地址选择失败", icon: "none" });
    }
  }
};

const chooseImage = () => {
  Taro.chooseImage({
    count: 9 - formData.form_images.length,
    success(res) {
      formData.form_images = formData.form_images.concat(res.tempFilePaths);
    },
  });
};

const removeImage = (index) => {
  formData.form_images.splice(index, 1);
};

const uploadSingleImage = async (filePath, index) => {
  try {
    const uploadRes = await Taro.uploadFile({
      url: `${API_BASE_URL}/proceed/upload_image`,
      filePath,
      name: "file",
      header: {
        Authorization: Taro.getStorageSync("token") || "",
      },
    });

    let result;
    try {
      result = JSON.parse(uploadRes.data);
    } catch (parseErr) {
      throw new Error(
        `第 ${index + 1} 张返回不是 JSON 格式：${uploadRes.data}`,
      );
    }

    if (result.code === 200 && result.data?.path) {
      return result.data.path;
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
    if (!formRef.value) return;

    const res = await formRef.value.validate();
    if (!res.valid) {
      const errorMessage = res.errors?.[0]?.message || "表单验证失败";
      Taro.showToast({ title: errorMessage, icon: "none" });
      return;
    }

    Taro.showLoading({ title: "上传图片中...", mask: true });

    const uploadedPaths = [];
    for (let i = 0; i < formData.form_images.length; i++) {
      const path = await uploadSingleImage(formData.form_images[i], i);
      uploadedPaths.push(path);
    }

    Taro.showLoading({ title: "提交中...", mask: true });

    const requestData = {
      ...formData,
      feedback_need: formData.feedback_need === "1",
      form_images: uploadedPaths,
    };

    const token = Taro.getStorageSync("token");
    const response = await Taro.request({
      url: `${API_BASE_URL}/proceed/user_form`,
      method: "POST",
      data: requestData,
      header: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    Taro.hideLoading();

    if (response.statusCode === 401 || response.data?.code === 401) {
      Taro.clearStorage();
      Taro.showToast({ title: "登录已过期，请重新登录", icon: "none" });
      setTimeout(() => {
        Taro.reLaunch({ url: "/pages/mypanel/index" });
      }, 1500);
      return;
    }

    if (response.statusCode === 200) {
      Taro.showToast({
        title: "提交成功",
        icon: "success",
        duration: 1000,
      });

      // 清空表单
      Object.assign(formData, {
        name: "",
        phone: "",
        address: "",
        content: "",
        feedback_need: "0",
        form_images: [],
        Latitude_Longitude: "",
      });

      // 1秒后关闭所有页面并跳转到首页
      setTimeout(() => {
        Taro.reLaunch({
          url: "/pages/index/index",
        });
      }, 1000);
    } else {
      throw new Error("表单提交失败");
    }
  } catch (error) {
    console.error("提交失败：", error);
    Taro.hideLoading();
    Taro.showToast({
      title: error.message || "提交失败，请稍后再试",
      icon: "none",
    });
  }
};

onMounted(() => {
  initRecord();

  // ✅ 页面加载时自动填充手机号
  if (userStore.phone) {
    formData.phone = userStore.phone;
  }
});

onBeforeUnmount(() => {
  manager.stop();
});
</script>

<style>
.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 3列平分 */
  gap: 20rpx; /* 间距 */
}

.image-item {
  aspect-ratio: 1 / 1; /* 保持正方形 */
  border-radius: 12rpx;
  background-color: #f5f5f5;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.grid-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12rpx;
}

.add-btn {
  border: 2rpx dashed #ccc;
}

.plus-inner {
  font-size: 64rpx;
  color: #999;
}

.delete-icon-wrapper {
  position: absolute;
  top: 0;
  right: 0;
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  background-color: transparent;
}

.delete-icon {
  background-color: #000;
  color: #fff;
  font-size: 28rpx;
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  line-height: 36rpx;
  text-align: center;
  font-weight: bold;
}
</style>
