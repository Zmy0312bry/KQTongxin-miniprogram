<template>
  <view class="mypanel">
    <!-- 顶部用户信息 -->
    <nut-row @click="handleUserTap" style="padding: 20px">
      <nut-col :span="4">
        <nut-avatar size="large">
          <img :src="userData.avatar || defaultAvatar" @error="onImgError" />
        </nut-avatar>
      </nut-col>
      <nut-col
        :span="20"
        style="display: flex; flex-direction: column; justify-content: center"
      >
        <view style="display: flex; align-items: center; gap: 8px">
          <text style="font-weight: bold; font-size: 18px">{{
            userData.name
          }}</text>
          <view
            v-if="isLogin && permissionTag"
            :style="{
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '12px',
              color: '#fff',
              backgroundColor: permissionTag.color,
            }"
          >
            {{ permissionTag.label }}
          </view>
        </view>
        <text v-if="isLogin" style="color: #888">已登录</text>
        <text v-else style="color: #ccc">点击登录</text>
      </nut-col>
    </nut-row>

    <nut-divider />

    <!-- 功能区 -->
    <template v-if="safeFunctionList.length > 0">
      <nut-cell-group title="我的功能">
        <nut-cell
          v-for="(item, index) in safeFunctionList"
          :key="index"
          :title="item.title"
          :desc="item.desc"
          :icon="item.icon"
          is-link
          @click="handleFunctionClick(item)"
        />
      </nut-cell-group>
    </template>

    <!-- 社区相关 -->
    <nut-cell-group title="社区相关">
      <nut-cell title="关于我们" is-link @click="navigateToAbout" />
      <nut-cell title="社区公众号" is-link @click="navigateToCommunity" />
    </nut-cell-group>

    <!-- 编辑用户信息弹窗（优化版） -->
    <nut-popup
      v-model:visible="showInfoEditor"
      :z-index="999"
      position="bottom"
      round
      class="popup-editor"
      :overlay="true"
      :closeOnClickOverlay="true"
      :style="{ alignItems: 'flex-start' }"
    >
      <view class="edit-popup-body">
        <!-- 弹窗标题 -->
        <view class="popup-header">编辑个人信息</view>

        <!-- 头像 + 上传 -->
        <view class="avatar-upload">
          <nut-avatar size="large" class="edit-avatar">
            <image :src="editForm.avatar || defaultAvatar" mode="aspectFit" />
          </nut-avatar>
          <nut-button size="small" type="primary" plain @click="chooseImage">
            上传头像
          </nut-button>
        </view>

        <!-- 昵称输入 -->
        <nut-input
          v-model="editForm.name"
          placeholder="请输入昵称"
          clearable
          class="nickname-input"
        /><nut-input
          v-model="editForm.phone"
          placeholder="请输入手机号"
          clearable
          class="nickname-input"
        />

        <!-- 操作按钮 -->
        <view class="popup-actions">
          <nut-button type="default" block @click="showInfoEditor = false"
            >取消</nut-button
          >
          <nut-button type="primary" block @click="submitUserInfo"
            >确认</nut-button
          >
        </view>
      </view>
    </nut-popup>

    <!-- 管理员申请弹窗 -->
    <nut-popup
      v-model:visible="showApplyPopup"
      position="center"
      round
      style="width: 80%; padding: 20px"
    >
      <view style="display: flex; flex-direction: column; gap: 20px">
        <nut-textarea
          v-model="applyReason"
          placeholder="请输入申请说明，如申请理由、职责等"
          rows="4"
          maxlength="100"
          show-word-limit
        />
        <nut-button type="primary" block @click="submitApplyReason"
          >提交申请</nut-button
        >
        <nut-button type="default" block @click="showApplyPopup = false"
          >取消</nut-button
        >
      </view>
    </nut-popup>
  </view>
</template>

<script setup>
import { ref, reactive, computed, watchEffect, onMounted, watch } from "vue";
import { useUserStore } from "../../../store/user";
import Taro, { useDidShow } from "@tarojs/taro";
import { h } from "vue";
import { My } from "@nutui/icons-vue-taro";
import { API_BASE_URL, IMAGE_BASE_URL } from "../../../config/api";

const DEFAULT_AVATAR =
  "https://img12.360buyimg.com/imagetools/jfs/t1/196430/38/8105/14329/60c806a4Ed506298a/e6de9fb7b8490f38.png";

// 权限级别常量
const PERMISSION_CHOICES = [
  { value: 0, label: "普通用户", color: "#909399" },
  { value: 1, label: "管理员", color: "#409EFF" },
  { value: 2, label: "超级管理员", color: "#E6A23C" },
  { value: 3, label: "网格员", color: "#67C23A" },
  { value: 4, label: "物业人员", color: "#F56C6C" },
];

const userStore = useUserStore();

const editForm = reactive({
  name: "",
  avatar: "",
  phone: "",
});

const showInfoEditor = ref(false);
const showApplyPopup = ref(false);
const applyReason = ref("");

// 默认头像（用于模板中的 defaultAvatar 引用）
const defaultAvatar = DEFAULT_AVATAR;

const functionList = ref([
  {
    id: "feedback",
    title: "我的诉求",
    desc: "查看诉求的处理情况",
    icon: h(My),
    path: "/pages/state/index",
  },
]);

const safeFunctionList = ref([]);

const props = defineProps({
  refreshTrigger: {
    type: Number,
    default: 0,
  },
  resetTrigger: {
    type: Number,
    default: 0,
  },
});

// 页面加载时自动刷新用户信息
onMounted(() => {
  refreshUserInfo();
});

// 监听 refreshTrigger，每次切换到"我的"tab时刷新信息
watch(
  () => props.refreshTrigger,
  () => {
    refreshUserInfo();
  },
);

watchEffect(() => {
  const base = [functionList.value[0]];
  const level = Number(userStore.permission_level);
  const list = [...base];

  // 社区管理：level为1, 2, 4时出现
  if (level === 1 || level === 2 || level === 4) {
    list.push({
      id: "community-manage",
      title: "社区管理",
      desc: "管理社区信息",
      icon: h(My),
      path: "/pages/managestate/index",
    });
  }

  // 查看我的派单：level为1, 2, 4时出现
  if (level === 1 || level === 2 || level === 4) {
    list.push({
      id: "my-dispatch",
      title: "查看我的派单",
      desc: "查看派单情况",
      icon: h(My),
      path: "/pages/mydispatch/index",
    });
  }

  // 权限申请：level不为1, 2时出现（即0, 3, 4）
  if (level !== 1 && level !== 2) {
    list.push({
      id: "permission-apply",
      title: "权限申请",
      desc: "提交信息申请权限",
      icon: h(My),
      path: "",
    });
  }

  safeFunctionList.value = list;
});

async function handleUserTap() {
  // 如果已登录，检查是否需要弹出编辑窗口
  if (userStore.isLogin()) {
    // 只有第一次登录（hasCompletedProfile 为空或 false）才弹出编辑窗口
    if (!userStore.hasCompletedProfile) {
      // 先刷新用户信息，获取最新数据
      await refreshUserInfo();
      // 预填表单
      editForm.name = userStore.name;
      editForm.avatar = userStore.avatar;
      editForm.phone = userStore.phone; // ✅ 预填手机号
      showInfoEditor.value = true;
    } else {
      // 已完善过个人信息，只刷新信息
      refreshUserInfo();
    }
    return;
  }

  // 未登录，先登录
  Taro.login({
    success: async (res) => {
      if (res.code) {
        try {
          const loginRes = await Taro.request({
            url: `${API_BASE_URL}/user/login`,
            method: "POST",
            header: { "Content-Type": "application/json" },
            data: { code: res.code },
          });

          const token = loginRes.data?.data?.token;
          if (token) {
            // 登录成功，设置完善标记为 false（第一次登录）
            userStore.setUser({
              token,
              name: "",
              avatar: "",
              userId: "",
              phone: "",
              permission_level: 0,
              hasCompletedProfile: false, // ✅ 标记为未完善个人信息
            });
            // 刷新用户信息，获取最新数据
            await refreshUserInfo();
            // 预填表单并弹出编辑弹窗
            editForm.name = userStore.name;
            editForm.avatar = userStore.avatar;
            editForm.phone = userStore.phone;
            showInfoEditor.value = true;
          } else {
            Taro.showToast({ title: "登录失败", icon: "none" });
          }
        } catch {
          Taro.showToast({ title: "登录异常", icon: "none" });
        }
      }
    },
  });
}

function chooseImage() {
  Taro.chooseImage({
    count: 1,
    success: (res) => {
      editForm.avatar = res.tempFilePaths[0];
    },
  });
}

async function submitUserInfo() {
  try {
    if (!editForm.avatar) {
      Taro.showToast({ title: "请选择头像", icon: "none" });
      return;
    }

    let avatarPath = editForm.avatar;

    const isLocalFile =
      avatarPath.startsWith("http://tmp/") ||
      avatarPath.startsWith("wxfile://");
    if (isLocalFile) {
      const uploadRes = await Taro.uploadFile({
        url: `${API_BASE_URL}/user/upload_image`,
        filePath: avatarPath,
        name: "file",
        header: {
          Authorization: userStore.token,
        },
      });

      const result = JSON.parse(uploadRes.data);
      if (result.code === 200 && result.data?.path) {
        avatarPath = `${BASE_URL}${result.data.path}`;
      } else {
        throw new Error(result.message || "头像上传失败");
      }
    }

    const res = await Taro.request({
      url: `${API_BASE_URL}/user/UserInfo`,
      method: "PUT",
      header: {
        Authorization: userStore.token,
        "Content-Type": "application/json",
      },
      data: {
        username: editForm.name,
        avatar: avatarPath,
        phone: editForm.phone,
      },
    });

    if (res.data.code === 200) {
      userStore.setUser({
        token: userStore.token,
        name: editForm.name,
        avatar: avatarPath,
        userId: userStore.userId,
        phone: editForm.phone, // ✅ 保存手机号
        permission_level: userStore.permission_level,
        hasCompletedProfile: true, // ✅ 标记为已完成个人信息
      });
      showInfoEditor.value = false;
      Taro.showToast({ title: "资料已更新", icon: "success" });
    } else {
      throw new Error(res.data.message || "更新失败");
    }
  } catch (err) {
    console.error("[提交用户信息失败]", err);
    Taro.showToast({ title: err.message || "上传失败", icon: "none" });
  }
}

function handleFunctionClick(item) {
  if (!userStore.isLogin()) {
    Taro.showToast({ title: "未登录，请先登录", icon: "none" });
    return;
  }

  if (item.id === "permission-apply") {
    showApplyPopup.value = true;
    return;
  }

  if (item.id === "my-dispatch") {
    handleMyDispatch();
    return;
  }

  if (item.path) {
    Taro.navigateTo({ url: item.path });
  }
}

async function handleMyDispatch() {
  try {
    // 检查是否已经订阅过
    const subscribedKey = `subscribed_dispatch_${userStore.userId}`;
    const hasSubscribed = Taro.getStorageSync(subscribedKey);

    if (!hasSubscribed) {
      // 未订阅，调用订阅消息接口
      const res = await Taro.requestSubscribeMessage({
        tmplIds: ["FVrAJnJauxtOwiEpxOW47zKiSICGIFvaq8iXUaHtY-g"],
      });

      if (
        res &&
        res["FVrAJnJauxtOwiEpxOW47zKiSICGIFvaq8iXUaHtY-g"] === "accept"
      ) {
        // 用户同意订阅
        Taro.setStorageSync(subscribedKey, true);
      } else {
        // 用户拒绝订阅，弹出订阅提醒界面
        Taro.navigateTo({
          url: "/pages/subscribe/index",
        });
        return;
      }
    }

    // 进入我的派单界面
    Taro.navigateTo({
      url: "/pages/mydispatch/index",
    });
  } catch (err) {
    console.error("[订阅消息失败]", err);
    // 处理订阅失败的情况，弹出订阅提醒界面
    Taro.navigateTo({
      url: "/pages/subscribe/index",
    });
  }
}

async function submitApplyReason() {
  if (!applyReason.value.trim()) {
    Taro.showToast({ title: "请输入申请说明", icon: "none" });
    return;
  }

  try {
    const res = await Taro.request({
      url: `${BASE_URL}/api/user/Changepermission`,
      method: "POST",
      header: {
        Authorization: userStore.token,
        "Content-Type": "application/json",
      },
      data: {
        code: applyReason.value,
      },
    });

    if (res.data.code === 200) {
      userStore.setUser({
        token: "",
        name: "",
        avatar: "",
        userId: "",
        phone: "", // ✅ 清空手机号
        permission_level: 0,
      });

      showApplyPopup.value = false;
      applyReason.value = "";
      Taro.showToast({ title: "请重新登录", icon: "none" });
    } else {
      throw new Error(res.data.message || "申请失败");
    }
  } catch (err) {
    Taro.showToast({ title: err.message || "提交失败", icon: "none" });
  }
}

function navigateToAbout() {
  Taro.showModal({ content: "城子街道矿桥东街社区" });
}

function navigateToCommunity() {
  const url = `${IMAGE_BASE_URL}/media/qr_code/qrcode.jpg`;
  Taro.previewImage({ current: url, urls: [url] });
}

function onImgError() {
  userStore.setUser({
    ...userStore,
    avatar: DEFAULT_AVATAR,
  });
}

// 处理 Token 过期
function handleTokenExpired(errorMsg = "登录已过期，请重新登录") {
  console.log("[handleTokenExpired] Token已过期或无效，重置登录状态");
  // 提示用户重新登录
  Taro.showToast({ title: errorMsg, icon: "none" });

  // 重置登录状态，显示未登录状态
  userStore.setUser({
    token: "",
    name: "",
    avatar: "",
    userId: "",
    phone: "",
    permission_level: 0,
    hasCompletedProfile: false, // ✅ 清除完善标记
  });
}

async function refreshUserInfo() {
  try {
    console.log("[refreshUserInfo] 开始刷新用户信息");

    const res = await Taro.request({
      url: `${API_BASE_URL}/user/UserInfo`,

      method: "GET",

      header: { Authorization: userStore.token },
    });

    // 检查401错误（Token无效或已过期）

    if (res.data?.code === 401) {
      console.log("[refreshUserInfo] Token无效或已过期", res.data);

      handleTokenExpired();

      return;
    }

    const list = res.data?.data;

    if (!Array.isArray(list) || list.length === 0) {
      console.log("[refreshUserInfo] 返回数据为空或格式错误", res.data);

      return;
    }

    const user = list[0];

    let avatar = user.avatar || DEFAULT_AVATAR;

    if (avatar.startsWith("/")) avatar = `${BASE_URL}${avatar}`;

    console.log("[refreshUserInfo] 获取到用户信息", {
      username: user.username,

      phone: user.phone,

      permission_level: user.permission_level,

      avatar: avatar,
    });

    userStore.setUser({
      token: userStore.token,

      name: user.username || "未设置昵称",

      avatar,

      userId: user.id || "",

      phone: user.phone || "", // ✅ 同步手机号

      permission_level: Number(user.permission_level ?? 0),

      hasCompletedProfile: userStore.hasCompletedProfile, // ✅ 保持完善标记状态
    });

    console.log("[refreshUserInfo] 用户信息已更新到 store");
  } catch (err) {
    console.error("[refreshUserInfo 异常]", err);
  }
}

useDidShow(() => {
  // 每次显示"我的"页面时都刷新用户信息
  refreshUserInfo();
});

const userData = computed(() => ({
  name: userStore.name || "未登录",
  avatar: userStore.avatar || DEFAULT_AVATAR,
}));

const isLogin = computed(() => userStore.isLogin());

// 根据权限级别获取对应的标签和颜色
const permissionTag = computed(() => {
  const level = userStore.permission_level;
  return PERMISSION_CHOICES.find((item) => item.value === level);
});

// 辅助函数：检查用户是否需要完善个人信息（用于弹窗控制）
const needEditProfile = computed(() => {
  return !userStore.hasCompletedProfile && userStore.isLogin();
});
</script>

<style>
/* .mypanel {
  padding-bottom: 50px;
  background-color: #f8f9fb;
  min-height: 100vh;
} */

/* 必须：强制让弹窗内容顶部对齐 */
.nut-popup--bottom {
  align-items: flex-start !important;
}

/* 弹窗容器 */
.popup-editor {
  padding: 0 24rpx 36rpx;
  border-radius: 36rpx 36rpx 0 0;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: auto;
  max-height: 60vh;
  overflow-x: hidden;
}

.popup-header {
  font-size: 34rpx;
  font-weight: bold;
  text-align: center;
  width: 100%;
  padding-top: 8rpx;
}

.edit-popup-body {
  margin: 0;
  padding: 16rpx;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.nut-popup__content {
  padding: 0 !important;
}
/* 头像上传 */
.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.edit-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  overflow: hidden;
  background: #f2f2f2;
}

.edit-avatar image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

/* 输入框 */
.nickname-input {
  width: 60%;
}

/* 按钮组 */
.popup-actions {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  width: 80%;
}
.nut-popup--bottom {
  align-items: stretch !important;
  justify-content: flex-start !important;
}
.nut-popup__content {
  padding: 0 !important;
}
.nut-overlay {
  background-color: rgba(0, 0, 0, 0.5) !important;
}
/* 遮罩层样式修正 */
.nut-overlay {
  position: fixed !important;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5) !important;
  z-index: 998 !important;
}

/* 弹窗本体确保高于遮罩 */
.nut-popup {
  z-index: 999 !important;
  overflow-x: hidden !important;
}
.nut-overlay {
  border-radius: 0 !important;
}

/* 避免嵌套容器裁切弹窗/遮罩 */
.mypanel {
  overflow: visible !important;
  position: relative !important;
  overflow-x: hidden !important;
}
</style>
