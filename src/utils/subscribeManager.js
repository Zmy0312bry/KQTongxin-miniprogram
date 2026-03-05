/**
 * 订阅消息管理工具
 * 封装微信小程序长期订阅消息的正确实践
 *
 * 长期订阅消息核心说明：
 * 1. 用户同意一次后，服务端即可长期下发消息
 * 2. 只使用永久模板 ID（不能与一次性模板混用）
 * 3. 使用 wx.requestSubscribeMessage API
 * 4. 用户勾选"总是保持以上选择，不再询问"后，下次调用不会再弹窗
 * 5. requestSubscribeMessage 必须在用户点击事件的同步链路中尽早调用
 *
 * 参考文档：
 * https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/subscribe-message.html
 * https://developers.weixin.qq.com/miniprogram/dev/api/open-api/subscribe-message/wx.requestSubscribeMessage.html
 */

import Taro from "@tarojs/taro";

// 长期订阅消息模板ID（永久模板，需在微信公众平台申请审核通过）
const LONG_TERM_TEMPLATE_ID = "QSW5PvhHb9ENbmhHgQCCEC72XuZoYU-uz7uaHsMkZcQ";

/**
 * 订阅状态枚举
 *
 * requestSubscribeMessage 回调中 res[templateId] 的可能值：
 * - accept:          用户同意订阅（长期订阅只要 accept 即代表永久授权）
 * - reject:          用户拒绝订阅
 * - ban:             已被后台封禁，或用户累计拒绝超过5次
 * - filter:          模板标题同名被过滤
 *
 * wx.getSetting subscriptionsSetting.itemSettings[templateId] 的可能值：
 * - accept:          用户勾选"总是接受"（已长期订阅，下次不弹窗）
 * - reject:          用户勾选"总是拒绝"（已长期拒绝，下次不弹窗）
 * - acceptWithAlert: 用户勾选"接受并添加提醒"（长期订阅+横幅通知）
 * - acceptWithAudio: 用户勾选"接受并开启语音提醒"（仅特定模板支持）
 */
export const SubscribeStatus = {
  ACCEPT: "accept",
  REJECT: "reject",
  BAN: "ban",
  FILTER: "filter",
  ACCEPT_WITH_AUDIO: "acceptWithAudio",
  ACCEPT_WITH_ALERT: "acceptWithAlert",
};

/**
 * 请求订阅消息（核心方法）
 *
 * 关键行为：
 * - 必须在用户点击事件的同步调用链中调用，不能放在异步回调之后太久
 * - 如果用户之前勾选了"总是保持以上选择，不再询问"，微信不会弹窗，直接返回之前的选择
 * - 对于长期订阅，accept 即代表授权成功，服务端可长期下发
 *
 * @param {string} templateId - 模板ID（对应长期/永久模板）
 * @returns {Promise<{success: boolean, status: string, error?: Error}>}
 */
export async function requestSubscribe(templateId = LONG_TERM_TEMPLATE_ID) {
  try {
    console.log("[订阅管理] 调用 requestSubscribeMessage, 模板ID:", templateId);

    if (!templateId) {
      return {
        success: false,
        status: "error",
        error: new Error("模板ID不能为空"),
      };
    }

    // 直接调用微信官方订阅消息面板
    const res = await Taro.requestSubscribeMessage({
      tmplIds: [templateId],
    });

    console.log("[订阅管理] 订阅面板结果:", JSON.stringify(res));

    const status = res[templateId];

    switch (status) {
      case SubscribeStatus.ACCEPT:
        console.log("[订阅管理] 用户同意订阅（长期授权生效）");
        break;
      case SubscribeStatus.ACCEPT_WITH_ALERT:
        console.log("[订阅管理] 用户同意订阅并添加提醒");
        break;
      case SubscribeStatus.ACCEPT_WITH_AUDIO:
        console.log("[订阅管理] 用户同意订阅并开启语音提醒");
        break;
      case SubscribeStatus.REJECT:
        console.log("[订阅管理] 用户拒绝订阅");
        break;
      case SubscribeStatus.BAN:
        console.warn("[订阅管理] 模板已被封禁或用户多次拒绝被封");
        break;
      case SubscribeStatus.FILTER:
        console.warn("[订阅管理] 模板标题同名被过滤");
        break;
      default:
        console.warn("[订阅管理] 未知订阅状态:", status);
    }

    // 对于长期订阅模板，accept / acceptWithAlert / acceptWithAudio 均表示订阅成功
    const success =
      status === SubscribeStatus.ACCEPT ||
      status === SubscribeStatus.ACCEPT_WITH_ALERT ||
      status === SubscribeStatus.ACCEPT_WITH_AUDIO;

    return { success, status };
  } catch (err) {
    console.error("[订阅管理] requestSubscribeMessage 失败:", err);

    const errMsg = err?.errMsg || err?.message || "订阅请求失败";
    const errCode = err?.errCode || null;

    let friendlyMsg = errMsg;
    if (errCode === 20004) friendlyMsg = "您已关闭订阅消息总开关";
    else if (errCode === 10005) friendlyMsg = "请在页面内操作订阅";
    else if (errCode === 20001) friendlyMsg = "模板ID不存在或类型不匹配";
    else if (errCode === 20002) friendlyMsg = "不能同时使用一次性和永久模板";

    return {
      success: false,
      status: "error",
      error: new Error(friendlyMsg),
      errCode,
    };
  }
}

/**
 * 检查用户在设置页中对该模板的订阅状态（getSetting）
 *
 * 说明：
 * - 用户勾选"总是保持以上选择，不再询问"后，状态才会出现在 subscriptionsSetting 中
 * - accept / acceptWithAlert / acceptWithAudio 均表示用户已长期同意（下次不弹窗）
 * - reject 表示用户已长期拒绝（下次不弹窗）
 * - 没有记录表示用户从未做出"总是保持"的选择
 *
 * @param {string} templateId
 * @returns {Promise<{hasChoice: boolean, isAccepted: boolean, isRejected: boolean, status: string|null}>}
 */
export async function checkSubscribeStatus(templateId = LONG_TERM_TEMPLATE_ID) {
  try {
    const settings = await Taro.getSetting();
    console.log("[订阅管理] getSetting 结果:", JSON.stringify(settings));

    const itemSetting =
      settings?.subscriptionsSetting?.itemSettings?.[templateId];
    console.log("[订阅管理] 模板设置状态:", itemSetting);

    // accept / acceptWithAlert / acceptWithAudio 均表示已长期同意
    const isAccepted =
      itemSetting === SubscribeStatus.ACCEPT ||
      itemSetting === SubscribeStatus.ACCEPT_WITH_ALERT ||
      itemSetting === SubscribeStatus.ACCEPT_WITH_AUDIO;

    const isRejected = itemSetting === SubscribeStatus.REJECT;

    return {
      hasChoice: !!itemSetting,
      isAccepted,
      isRejected,
      status: itemSetting || null,
    };
  } catch (err) {
    console.error("[订阅管理] getSetting 失败:", err);
    return { hasChoice: false, isAccepted: false, isRejected: false, status: null };
  }
}

/**
 * 生成本地缓存 key
 * 用于记录用户是否已对某模板同意过长期订阅
 */
function getCacheKey(templateId) {
  return `subscribe_accepted_${templateId}`;
}

/**
 * 完整订阅流程（推荐入口）
 *
 * 长期订阅最佳实践：
 * 1. 先检查本地缓存——用户曾经同意过，则直接返回，不再弹窗
 * 2. 未缓存时调用微信官方 requestSubscribeMessage 面板
 * 3. 用户同意后写入本地缓存，下次跳过弹窗
 * 4. 无论订阅结果如何均允许跳转目标页面（订阅是可选功能）
 *
 * @param {string} templateId
 * @param {object} options
 * @param {boolean} options.showTip - 首次订阅成功后是否 toast 提示，默认 false
 * @returns {Promise<{subscribed: boolean, status: string}>}
 */
export async function checkAndSubscribe(
  templateId = LONG_TERM_TEMPLATE_ID,
  options = {},
) {
  const { showTip = false } = options;

  const cacheKey = getCacheKey(templateId);

  // 步骤1：检查本地缓存，已同意过则直接跳过弹窗
  try {
    const cached = Taro.getStorageSync(cacheKey);
    if (cached === "accepted") {
      console.log("[订阅管理] 本地缓存显示用户已订阅，跳过弹窗");
      return { subscribed: true, status: "accept" };
    }
  } catch (e) {
    // 读缓存失败不影响流程
  }

  console.log("[订阅管理] 无订阅缓存，调用微信订阅面板");

  try {
    // 步骤2：调用微信官方订阅消息面板
    const result = await requestSubscribe(templateId);

    if (result.success) {
      console.log("[订阅管理] 订阅成功，状态:", result.status);

      // 步骤3：写入本地缓存，下次不再弹窗
      try {
        Taro.setStorageSync(cacheKey, "accepted");
      } catch (e) {
        // 写缓存失败不影响主流程
      }

      if (showTip) {
        Taro.showToast({ title: "订阅成功", icon: "success", duration: 1500 });
      }
      return { subscribed: true, status: result.status };
    } else {
      console.log("[订阅管理] 未订阅，状态:", result.status, result.error?.message);

      if (result.status === SubscribeStatus.BAN) {
        Taro.showToast({ title: "订阅消息已被禁用", icon: "none" });
      } else if (result.status === "error" && result.error) {
        Taro.showToast({ title: result.error.message, icon: "none" });
      }
      // 用户主动 reject 不额外提示，也不写缓存（下次仍会弹窗引导）

      return { subscribed: false, status: result.status || "reject" };
    }
  } catch (err) {
    console.error("[订阅管理] 订阅流程异常:", err);
    return { subscribed: false, status: "error" };
  }
}

/**
 * 引导用户前往设置页开启订阅权限（用于用户拒绝后的引导）
 */
export async function guideToSetting() {
  try {
    await Taro.openSetting();
  } catch (err) {
    console.error("[订阅管理] 打开设置失败:", err);
    Taro.showToast({ title: "打开设置失败", icon: "none" });
  }
}

export function getTemplateId() {
  return LONG_TERM_TEMPLATE_ID;
}

export { LONG_TERM_TEMPLATE_ID };
