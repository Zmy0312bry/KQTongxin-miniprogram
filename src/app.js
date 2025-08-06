import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue' // ✅ 确保存在 App.vue

// NutUI 组件按需引入
import {
  Swiper, SwiperItem, Button, Cell, CellGroup, Row, Col,
  Noticebar, Divider, Form, FormItem, Radio, RadioGroup,
  Tabbar, TabbarItem, List, Avatar, Input, Textarea, Tabs,Rate,
  TabPane, Toast, Skeleton, ImagePreview, Popup, Grid, GridItem
} from '@nutui/nutui-taro'

import './app.css'
import "@nutui/nutui-taro/dist/style.css"

const app = createApp(App)

// ✅ 注入 Pinia
app.use(createPinia())

// ✅ 注册组件
app
  .use(Swiper).use(SwiperItem)
  .use(Button)
  .use(Cell).use(CellGroup)
  .use(Row).use(Col)
  .use(Noticebar)
  .use(Divider)
  .use(Form).use(FormItem)
  .use(Radio).use(RadioGroup)
  .use(Tabbar).use(TabbarItem)
  .use(List)
  .use(Avatar)
  .use(Input)
  .use(Textarea)
  .use(Tabs)
  .use(TabPane)
  .use(Toast)
  .use(ImagePreview)
  .use(Popup)
  .use(Grid)
  .use(GridItem)
  .use(Skeleton)
  .use(Rate)

export default app
