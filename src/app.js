import { createApp } from "vue";
import { createPinia } from "pinia";

// NutUI 组件按需引入
import {
  Swiper,
  SwiperItem,
  Button,
  Cell,
  CellGroup,
  Row,
  Col,
  Noticebar,
  Divider,
  Form,
  FormItem,
  Radio,
  RadioGroup,
  Tabbar,
  TabbarItem,
  List,
  Avatar,
  Input,
  Textarea,
  Tabs,
  Rate,
  TabPane,
  Toast,
  Skeleton,
  ImagePreview,
  Popup,
  Grid,
  GridItem,
} from "@nutui/nutui-taro";

import "./app.css";
import "@nutui/nutui-taro/dist/style.css";

const App = createApp({
  onShow(options) {
    // console.log('App onShow.')
  },
  // 入口组件不需要实现 render 方法，即使实现了也会被 taro 所覆盖
});

// ✅ 注入 Pinia
App.use(createPinia());

// ✅ 注册组件
App.use(Swiper)
  .use(SwiperItem)
  .use(Button)
  .use(Cell)
  .use(CellGroup)
  .use(Row)
  .use(Col)
  .use(Noticebar)
  .use(Divider)
  .use(Form)
  .use(FormItem)
  .use(Radio)
  .use(RadioGroup)
  .use(Tabbar)
  .use(TabbarItem)
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
  .use(Rate);

export default App;
