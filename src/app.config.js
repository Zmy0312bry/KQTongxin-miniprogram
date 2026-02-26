export default defineAppConfig({
  lazyCodeLoading: "requiredComponents",
  pages: [
    "pages/index/index",
    "pages/complainforms/index",
    "pages/manapanel/index",
    "pages/mycomplain/index",
    "pages/phone/index",
    "pages/state/index",
    "pages/details/index",
    "pages/web-view/index",
    "pages/content/index",
    "pages/weblogin/index",
    "pages/managestate/index",
    "pages/managedetails/index",
    "pages/managedetailss/index",
    "pages/mydispatch/index",
    "pages/subscribe/index",
  ],
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#fff",
    navigationBarTitleText: "WeChat",
    navigationBarTextStyle: "black",
  },
  plugins: {
    WechatSI: {
      version: "0.3.6",
      provider: "wx069ba97219f66d99",
    },
  },
});
