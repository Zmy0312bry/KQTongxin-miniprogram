import { defineStore } from "pinia";
import Taro from "@tarojs/taro";

export const useUserStore = defineStore("user", {
  state: () => ({
    token: Taro.getStorageSync("token") || "",
    name: Taro.getStorageSync("nickName") || "",
    avatar: Taro.getStorageSync("avatarUrl") || "",
    phone: Taro.getStorageSync("phone") || "", // ✅ 新增手机号
    userId: Taro.getStorageSync("userId") || "",
    permission_level: Taro.getStorageSync("permission_level") ?? 0,
    hasCompletedProfile: Taro.getStorageSync("hasCompletedProfile") || false, // ✅ 是否完善过个人信息
  }),
  actions: {
    setUser({
      token,
      name,
      avatar,
      phone = "",
      userId,
      permission_level = 0,
      hasCompletedProfile = false,
    }) {
      this.token = token;
      this.name = name;
      this.avatar = avatar;
      this.phone = phone; // ✅ 新增手机号
      this.userId = userId;
      this.permission_level = permission_level;
      this.hasCompletedProfile = hasCompletedProfile; // ✅ 是否完善过个人信息

      Taro.setStorageSync("token", token);
      Taro.setStorageSync("nickName", name);
      Taro.setStorageSync("avatarUrl", avatar);
      Taro.setStorageSync("phone", phone); // ✅ 存手机号
      Taro.setStorageSync("userId", userId);
      Taro.setStorageSync("permission_level", permission_level);
      Taro.setStorageSync("hasCompletedProfile", hasCompletedProfile); // ✅ 存完善信息标记
    },
    clearUser() {
      this.token = "";
      this.name = "";
      this.avatar = "";
      this.phone = ""; // ✅ 清除手机号
      this.userId = "";
      this.permission_level = 0;
      this.hasCompletedProfile = false; // ✅ 清除完善信息标记

      Taro.clearStorage();
    },
    isLogin() {
      return !!this.token;
    },
  },
});
