<template>
  <nut-row>
    <!-- 用户基本信息区域 -->
    <nut-col :span="20" :offset="2">
        <div style="justify-content: left; align-items: center; display: flex; flex-direction: row;">
          <!-- 头像 -->
          <nut-avatar size="large" class="user-avatar">
            <img
              src="https://img12.360buyimg.com/imagetools/jfs/t1/196430/38/8105/14329/60c806a4Ed506298a/e6de9fb7b8490f38.png"
              alt="用户头像"
            />
          </nut-avatar>
          <nut-divider direction="vertical" />
          <!-- 用户名和基本信息 -->
          <div style="text-align: center; height: 50px;">
            <h3>{{ userData.name }}</h3>
            <p style="  font-size: 14px;color: #999;margin: 5px 0;">ID: {{ userData.id }}</p>
          </div>
        </div>
    </nut-col>
    <nut-divider/>
    <!-- 功能区域 -->
    <nut-row>
      <nut-col :span="24">
          <nut-cell-group title="我的功能">
            <nut-cell
              v-for="(item, index) in functionList"
              :key="index"
              :title="item.title"
              :desc="item.desc"
              :icon="item.icon"
              is-link
              @click="handleFunctionClick(item)"
            />
          </nut-cell-group>
          <nut-cell-group title="社区相关">
          <nut-cell title="关于我们" is-link @click="navigateToAbout" />
          <nut-cell title="社区公众号" is-link @click="navigateToAbout" />
          </nut-cell-group>
      </nut-col>
    </nut-row>

  </nut-row>
</template>

<script>
import { ref, reactive,h } from 'vue';
import Taro from '@tarojs/taro';
import {My} from '@nutui/icons-vue-taro';

export default {
  name: 'Panel',

  setup() {
    // 用户数据 - 直接在组件内部定义固定数据
    const userData = reactive({
      name: '社区用户',
      id: '10086',
      avatar: ''
    });

    // 功能列表
    const functionList = ref([
      {
        id: 'feedback',
        title: '我的反馈',
        desc: '查看投诉/建议的处理情况',
        icon: h(My),
        path: '/pages/feedback/index'
      },
      {
        id: 'collection',
        title: '我的收藏',
        desc: '查看收藏的社区信息',
        icon: 'star',
        path: '/pages/collection/index'
      },
      {
        id: 'manager',
        title: '社区管理',
        desc: '管理社区信息',
        icon: "",
        path: '/pages/manapanel/index'
      }
    ]);

    // 处理功能点击
    const handleFunctionClick = (item) => {
      if (item.path) {
        Taro.navigateTo({
          url: item.path
        });
      }
    };

    // 导航到设置页面
    const navigateToSettings = () => {
      Taro.navigateTo({
        url: '/pages/settings/index'
      });
    };

    // 导航到关于我们页面
    const navigateToAbout = () => {
      Taro.navigateTo({
        url: '/pages/about/index'
      });
    };

    // 退出登录
    const logout = () => {
      Taro.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            // 执行退出登录逻辑
            userData.name = '未登录';
            userData.id = '----';
            // 跳转到登录页
            Taro.navigateTo({
              url: '/pages/login/index'
            });
          }
        }
      });
    };

    return {
      userData,
      functionList,
      handleFunctionClick,
      navigateToSettings,
      navigateToAbout,
      logout
    };
  }
};
</script>
