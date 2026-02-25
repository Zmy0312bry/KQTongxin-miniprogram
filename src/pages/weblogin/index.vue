<template>
  <view class="login-page">
    <!-- 主内容区 -->
    <view class="content-wrapper">
      <!-- 状态图标 -->
      <view class="icon-container">
        <text v-if="loading" class="status-icon loading">⏳</text>
        <text v-else-if="status === 'success'" class="status-icon success"
          >✓</text
        >
        <text v-else class="status-icon error">✕</text>
      </view>

      <!-- 标题 -->
      <text class="title">{{ title }}</text>

      <!-- 消息 -->
      <text class="message">{{ message }}</text>

      <!-- 调试模式提示 -->
      <view v-if="isDebugMode" class="debug-hint">
        <text>调试模式</text>
      </view>

      <!-- 调试模式 - salt 输入框 -->
      <view v-if="isDebugMode && !loading" class="debug-input-box">
        <input
          v-model="customSalt"
          type="text"
          placeholder="输入自定义 salt"
          class="debug-input"
        />
      </view>

      <!-- 操作按钮 -->
      <view class="action-box">
        <!-- 加载中显示提示 -->
        <text v-if="loading" class="loading-hint">正在处理登录请求...</text>

        <!-- 登录失败或调试模式显示重试按钮 -->
        <button
          v-if="!loading && status !== 'success'"
          @click="handleLoginClick"
          class="action-btn"
        >
          {{ isDebugMode ? "使用测试 Salt 登录" : "重新登录" }}
        </button>

        <!-- 登录成功显示跳转按钮 -->
        <button
          v-if="status === 'success' && !loading"
          @click="navigateToHome"
          class="action-btn success"
        >
          进入主页
        </button>
      </view>
    </view>
  </view>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import Taro from "@tarojs/taro";

export default {
  name: "LoginPage",

  setup() {
    // 响应式数据
    const loading = ref(true);
    const status = ref("error");
    const message = ref("请稍候...");
    const salt = ref("");
    const title = ref("网页登录");
    const isDebugMode = ref(false);
    const customSalt = ref("");

    // 计算属性
    const statusClass = computed(() => {
      if (loading.value) return "loading";
      if (status.value === "success") return "success";
      return "error";
    });

    const effectiveSalt = computed(() => {
      return isDebugMode.value && customSalt.value
        ? customSalt.value
        : salt.value;
    });

    // 检查是否是调试模式
    const checkDebugMode = (saltValue) => {
      return saltValue && saltValue.startsWith("dev_test");
    };

    // 解析 scene 中的 salt
    const parseSaltFromScene = (scene) => {
      try {
        const decoded = decodeURIComponent(scene);
        const params = new URLSearchParams(decoded);
        return params.get("salt") || "";
      } catch (e) {
        console.warn("scene 解码失败:", e);
        return "";
      }
    };

    // 处理登录点击
    const handleLoginClick = () => {
      if (isDebugMode.value && customSalt.value) {
        salt.value = customSalt.value;
      }
      tryLogin();
    };

    // 尝试登录
    const tryLogin = () => {
      if (!effectiveSalt.value) {
        if (isDebugMode.value) {
          Taro.showToast({
            title: "调试模式：请输入或使用默认 salt",
            icon: "none",
          });
          loading.value = false;
          status.value = "error";
          message.value = "请输入有效的 salt 参数";
          title.value = "调试模式";
        } else {
          Taro.showToast({ title: "参数错误", icon: "none" });
          loading.value = false;
          status.value = "error";
          message.value = "缺少必要参数";
          title.value = "登录失败";
        }
        return;
      }

      loading.value = true;
      title.value = "正在登录";
      message.value = isDebugMode.value
        ? `测试 salt: ${effectiveSalt.value.substring(0, 10)}...`
        : "请稍候...";

      Taro.showLoading({ title: "正在登录..." });

      Taro.login({
        success: async (res) => {
          if (res.code) {
            try {
              const encodedSalt = encodeURIComponent(effectiveSalt.value);
              const r = await Taro.request({
                url: `https://api.kuangqiaodongjie.cn/api/user/web_login?salt=${encodedSalt}`,
                method: "POST",
                data: { code: res.code },
              });

              if (r.statusCode === 200 && r.data.code === 200) {
                status.value = "success";
                message.value = "登录成功！";
                title.value = isDebugMode.value
                  ? "调试模式 - 验证通过"
                  : "验证通过";
              } else {
                status.value = "error";
                message.value = r.data.message || "登录失败";
                title.value = isDebugMode.value
                  ? "调试模式 - 登录失败"
                  : "登录失败";

                if (isDebugMode.value) {
                  console.log("[调试模式] 登录响应:", r.data);
                }
              }
            } catch (err) {
              console.error("网络异常:", err);
              status.value = "error";
              message.value = "网络异常，请稍后重试";
              title.value = isDebugMode.value
                ? "调试模式 - 网络错误"
                : "网络错误";

              if (isDebugMode.value) {
                console.log("[调试模式] 网络异常:", err);
              }
            } finally {
              loading.value = false;
              Taro.hideLoading();
            }
          } else {
            Taro.showToast({ title: "获取 code 失败", icon: "error" });
            loading.value = false;
            status.value = "error";
            message.value = "系统错误";
            title.value = "登录失败";
            Taro.hideLoading();
          }
        },
        fail: () => {
          loading.value = false;
          status.value = "error";
          message.value = "调用登录失败";
          title.value = "系统错误";
          Taro.hideLoading();
        },
      });
    };

    // 跳转到主页
    const navigateToHome = () => {
      Taro.reLaunch({
        url: "/pages/index/index",
      });
    };

    // 获取页面参数并初始化
    const initPage = () => {
      try {
        const instance = Taro.getCurrentInstance();
        const router = instance.router;
        const params = router?.params || {};

        console.log("[weblogin] 页面参数:", params);

        let receivedSalt = "";

        if (params.salt) {
          receivedSalt = params.salt;
          console.log("从 URL 获取 salt:", receivedSalt);
        } else if (params.scene) {
          receivedSalt = parseSaltFromScene(params.scene);
          console.log("从 scene 解析 salt:", receivedSalt);
        }

        salt.value = receivedSalt;
        isDebugMode.value = checkDebugMode(receivedSalt);

        if (isDebugMode.value) {
          console.log("[调试模式] 已启用");
          title.value = "调试模式";
          message.value = "使用测试 salt 进行登录";
          customSalt.value = receivedSalt;
          loading.value = false;
          status.value = "error";
        } else if (!receivedSalt) {
          console.warn("未接收到 salt 参数");
          loading.value = false;
          status.value = "error";
          message.value = "未接收到 salt 参数，请从调试入口进入";
          title.value = "参数缺失";
        } else {
          // 非调试模式自动登录
          tryLogin();
        }
      } catch (err) {
        console.error("[initPage 错误]:", err);
        loading.value = false;
        status.value = "error";
        message.value = "页面初始化失败";
        title.value = "错误";
      }
    };

    // 页面加载时执行
    onMounted(() => {
      initPage();
    });

    return {
      loading,
      status,
      message,
      salt,
      title,
      isDebugMode,
      customSalt,
      statusClass,
      effectiveSalt,
      handleLoginClick,
      tryLogin,
      navigateToHome,
    };
  },
};
</script>

<style>
.login-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 40px 20px;
  background-color: #ffffff;
}

.content-wrapper {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.icon-container {
  margin-bottom: 8px;
}

.status-icon {
  font-size: 80px;
  font-weight: bold;
}

.status-icon.loading {
  color: #999999;
  animation: pulse 1.5s ease-in-out infinite;
}

.status-icon.success {
  color: #07c160;
}

.status-icon.error {
  color: #ff6b6b;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.title {
  font-size: 28px;
  font-weight: bold;
  color: #333333;
}

.message {
  font-size: 18px;
  color: #666666;
  text-align: center;
}

.debug-hint {
  padding: 6px 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-size: 14px;
  color: #999999;
}

.debug-input-box {
  width: 100%;
}

.debug-input {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border: 1px solid #dddddd;
  border-radius: 8px;
  font-size: 16px;
  background: #f8f8f8;
  box-sizing: border-box;
}

.debug-input:focus {
  border-color: #07c160;
  background: #ffffff;
  outline: none;
}

.loading-hint {
  font-size: 16px;
  color: #999999;
}

.action-box {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.action-btn {
  width: 100%;
  height: 50px;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 500;
  border: none;
  background-color: #07c160;
  color: #ffffff;
}

.action-btn.success {
  background-color: #07c160;
}

.action-btn:active {
  opacity: 0.8;
}
</style>
