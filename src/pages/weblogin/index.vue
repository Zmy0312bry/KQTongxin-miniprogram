<template>
  <view class="login-page">
    <view v-if="loading" class="loading-text">正在登录...</view>
    <view v-else class="result-box">
      <view :class="['result-message', status]">
        {{ message }}
      </view>
      <button @click="tryLogin" class="retry-button">登录</button>
    </view>
  </view>
</template>

<script>
import Taro from '@tarojs/taro'

export default {
  name: 'LoginPage',

  data() {
    return {
      loading: true,
      status: 'success', // success or error
      message: '登录成功',
      salt: ''
    }
  },

  methods: {
    tryLogin() {
      if (!this.salt) {
        Taro.showToast({ title: '请点击登录', icon: 'none' })
        this.loading = false
        this.status = 'error'
        this.message = ''
        return
      }

      this.loading = true
      Taro.showLoading({ title: '正在登录...' })

      Taro.login({
        success: async (res) => {
          if (res.code) {
            try {
              const encodedSalt = encodeURIComponent(this.salt)
              const r = await Taro.request({
                url: `https://api.kuangqiaodongjie.cn/api/user/web_login?salt=${encodedSalt}`,
                method: 'POST',
                data: { code: res.code }
              })

              if (r.statusCode === 200 && r.data.code === 200) {
                this.status = 'success'
                this.message = '登录成功'
              } else {
                this.status = 'error'
                this.message = r.data.message || '登录失败'
              }
            } catch (err) {
              console.error('网络异常:', err)
              this.status = 'error'
              this.message = '网络异常'
            } finally {
              this.loading = false
              Taro.hideLoading()
            }
          } else {
            Taro.showToast({ title: '获取 code 失败', icon: 'error' })
            this.loading = false
            this.status = 'error'
            this.message = '登录失败'
            Taro.hideLoading()
          }
        },
        fail: () => {
          this.loading = false
          this.status = 'error'
          this.message = '调用登录失败'
          Taro.hideLoading()
        }
      })
    },

    parseSaltFromScene(scene) {
      try {
        const decoded = decodeURIComponent(scene)
        const params = new URLSearchParams(decoded)
        return params.get('salt') || ''
      } catch (e) {
        console.warn('scene 解码失败:', e)
        return ''
      }
    }
  },

  onLoad(options) {
    if (options.salt) {
      this.salt = options.salt
      console.log('从 URL 获取 salt:', this.salt)
    } else if (options.scene) {
      this.salt = this.parseSaltFromScene(options.scene)
      console.log('从 scene 解析 salt:', this.salt)
    } else {
      console.warn('未接收到 salt 参数')
    }
  },

  mounted() {
    this.tryLogin()
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  min-height: 100vh;
}
.loading-text {
  font-size: 18px;
  color: #888;
}
.result-box {
  width: 100%;
  text-align: center;
}
.result-message {
  font-size: 20px;
  margin-bottom: 20px;
}
.result-message.success {
  color: #07c160;
}
.result-message.error {
  color: #fa2c19;
}
.retry-button {
  background-color: #1989fa;
  color: #fff;
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
}
</style>
