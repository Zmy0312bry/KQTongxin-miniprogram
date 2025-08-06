<template>
  <view class="mypanel">
    <!-- 顶部用户信息 -->
    <nut-row @click="handleUserTap" style="padding: 20px;">
      <nut-col :span="4">
        <nut-avatar size="large">
          <img :src="userData.avatar || defaultAvatar" @error="onImgError" />
        </nut-avatar>
      </nut-col>
      <nut-col :span="20" style="display: flex; flex-direction: column; justify-content: center;">
        <text style="font-weight: bold; font-size: 18px;">{{ userData.name }}</text>
        <text v-if="isLogin" style="color: #888;">已登录</text>
        <text v-else style="color: #ccc;">点击登录</text>
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
    <nut-popup v-model:visible="showInfoEditor"   :z-index="999" position="bottom" round class="popup-editor" :overlay="true"
 :closeOnClickOverlay="true"  :style="{ alignItems: 'flex-start' }" >
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
          <nut-button type="default" block @click="showInfoEditor = false">取消</nut-button>
          <nut-button type="primary" block @click="submitUserInfo">确认</nut-button>
        </view>
      </view>
    </nut-popup>

    <!-- 管理员申请弹窗 -->
    <nut-popup v-model:visible="showApplyPopup" position="center" round style="width: 80%; padding: 20px;">
      <view style="display: flex; flex-direction: column; gap: 20px;">
        <nut-textarea
          v-model="applyReason"
          placeholder="请输入申请说明，如申请理由、职责等"
          rows="4"
          maxlength="100"
          show-word-limit
        />
        <nut-button type="primary" block @click="submitApplyReason">提交申请</nut-button>
        <nut-button type="default" block @click="showApplyPopup = false">取消</nut-button>
      </view>
    </nut-popup>
  </view>
</template>


<script setup>
import { ref, reactive, computed, watchEffect } from 'vue'
import { useUserStore } from '../../../store/user'
import Taro, { useDidShow } from '@tarojs/taro'
import { h } from 'vue'
import { My } from '@nutui/icons-vue-taro'

const BASE_URL = 'https://api.kuangqiaodongjie.cn'
const DEFAULT_AVATAR = 'https://img12.360buyimg.com/imagetools/jfs/t1/196430/38/8105/14329/60c806a4Ed506298a/e6de9fb7b8490f38.png'

const userStore = useUserStore()

const showInfoEditor = ref(false)
const editForm = reactive({
  name: '',
  avatar: '',
  phone: ''
})

const showApplyPopup = ref(false)
const applyReason = ref('')

const functionList = ref([
  {
    id: 'feedback',
    title: '我的诉求',
    desc: '查看诉求的处理情况',
    icon: h(My),
    path: '/pages/state/index'
  }
])

const safeFunctionList = ref([])

watchEffect(() => {
  const base = [functionList.value[0]]
  const level = Number(userStore.permission_level)

  const permissionItem = {
    id: 'permission-entry',
    title: '',
    desc: '',
    icon: '',
    path: ''
  }

  if (level > 0) {
    permissionItem.title = '社区管理'
    permissionItem.desc = '管理社区信息'
    permissionItem.path = '/pages/managestate/index'
  } else {
    permissionItem.title = '管理员申请'
    permissionItem.desc = '提交信息申请权限'
    permissionItem.path = ''
  }

  safeFunctionList.value = [...base, permissionItem]
})

function handleUserTap() {
  if (userStore.isLogin()) {
    editForm.name = userStore.name
    editForm.avatar = userStore.avatar
    editForm.phone = userStore.phone  // ✅ 预填手机号
    showInfoEditor.value = true
    return
  }

  Taro.login({
    success: async (res) => {
      if (res.code) {
        try {
          const loginRes = await Taro.request({
            url: `${BASE_URL}/api/user/login`,
            method: 'POST',
            header: { 'Content-Type': 'application/json' },
            data: { code: res.code }
          })

          const token = loginRes.data?.data?.token
          if (token) {
            userStore.setUser({ token, name: '', avatar: '', userId: '', phone: '', permission_level: 0 })
            showInfoEditor.value = true
            refreshUserInfo()
          } else {
            Taro.showToast({ title: '登录失败', icon: 'none' })
          }
        } catch {
          Taro.showToast({ title: '登录异常', icon: 'none' })
        }
      }
    }
  })
}

function chooseImage() {
  Taro.chooseImage({
    count: 1,
    success: res => {
      editForm.avatar = res.tempFilePaths[0]
    }
  })
}

async function submitUserInfo() {
  try {
    if (!editForm.avatar) {
      Taro.showToast({ title: '请选择头像', icon: 'none' })
      return
    }

    let avatarPath = editForm.avatar

    const isLocalFile = avatarPath.startsWith('http://tmp/') || avatarPath.startsWith('wxfile://')
    if (isLocalFile) {
      const uploadRes = await Taro.uploadFile({
        url: `${BASE_URL}/api/user/upload_image`,
        filePath: avatarPath,
        name: 'file',
        header: {
          Authorization: userStore.token
        }
      })

      const result = JSON.parse(uploadRes.data)
      if (result.code === 200 && result.data?.path) {
        avatarPath = `${BASE_URL}${result.data.path}`
      } else {
        throw new Error(result.message || '头像上传失败')
      }
    }

    const res = await Taro.request({
      url: `${BASE_URL}/api/user/Adminlist`,
      method: 'PUT',
      header: {
        Authorization: userStore.token,
        'Content-Type': 'application/json'
      },
      data: {
        username: editForm.name,
        avatar: avatarPath,
        phone: editForm.phone
      }
    })

    if (res.data.code === 200) {
      userStore.setUser({
        token: userStore.token,
        name: editForm.name,
        avatar: avatarPath,
        userId: userStore.userId,
        phone: editForm.phone,  // ✅ 保存手机号
        permission_level: userStore.permission_level
      })
      showInfoEditor.value = false
      Taro.showToast({ title: '资料已更新', icon: 'success' })
    } else {
      throw new Error(res.data.message || '更新失败')
    }
  } catch (err) {
    console.error('[提交用户信息失败]', err)
    Taro.showToast({ title: err.message || '上传失败', icon: 'none' })
  }
}

function handleFunctionClick(item) {
  if (!userStore.isLogin()) {
    Taro.showToast({ title: '未登录，请先登录', icon: 'none' })
    return
  }

  if (item.id === 'permission-entry') {
    if (Number(userStore.permission_level) === 0) {
      showApplyPopup.value = true
      return
    } else if (item.path) {
      Taro.navigateTo({ url: item.path })
      return
    }
  }

  if (item.path) {
    Taro.navigateTo({ url: item.path })
  }
}

async function submitApplyReason() {
  if (!applyReason.value.trim()) {
    Taro.showToast({ title: '请输入申请说明', icon: 'none' })
    return
  }

  try {
    const res = await Taro.request({
      url: `${BASE_URL}/api/user/Changepermission`,
      method: 'POST',
      header: {
        Authorization: userStore.token,
        'Content-Type': 'application/json'
      },
      data: {
        code: applyReason.value
      }
    })

    if (res.data.code === 200) {
      userStore.setUser({
        token: '',
        name: '',
        avatar: '',
        userId: '',
        phone: '',  // ✅ 清空手机号
        permission_level: 0
      })

      showApplyPopup.value = false
      applyReason.value = ''
      Taro.showToast({ title: '请重新登录', icon: 'none' })
    } else {
      throw new Error(res.data.message || '申请失败')
    }
  } catch (err) {
    Taro.showToast({ title: err.message || '提交失败', icon: 'none' })
  }
}

function navigateToAbout() {
  Taro.showModal({ content: '城子街道矿桥东街社区' })
}

function navigateToCommunity() {
  const url = 'https://api.kuangqiaodongjie.cn/media/qr_code/qrcode.jpg'
  Taro.previewImage({ current: url, urls: [url] })
}

function onImgError() {
  userStore.setUser({
    ...userStore,
    avatar: DEFAULT_AVATAR
  })
}

async function refreshUserInfo() {
  try {
    const res = await Taro.request({
      url: `${BASE_URL}/api/user/UserInfo`,
      method: 'GET',
      header: { Authorization: userStore.token }
    })

    const list = res.data?.data
    if (!Array.isArray(list) || list.length === 0) return

    const user = list[0]
    let avatar = user.avatar || DEFAULT_AVATAR
    if (avatar.startsWith('/')) avatar = `${BASE_URL}${avatar}`

    userStore.setUser({
      token: userStore.token,
      name: user.username || '未设置昵称',
      avatar,
      userId: user.id || '',
      phone: user.phone || '',  // ✅ 同步手机号
      permission_level: Number(user.permission_level ?? 0)
    })
  } catch (err) {
    console.warn('[refreshUserInfo 异常]', err)
  }
}

useDidShow(() => {
  if (userStore.isLogin()) {
    refreshUserInfo()
  }
})

const userData = computed(() => ({
  name: userStore.name || '未登录',
  avatar: userStore.avatar || DEFAULT_AVATAR
}))

const isLogin = computed(() => userStore.isLogin())
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
