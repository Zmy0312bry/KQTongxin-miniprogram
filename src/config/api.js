/**
 * API配置文件
 * 统一管理API请求地址和图片资源地址
 */

// 当前环境：development（开发） | production（生产）
const ENV = process.env.NODE_ENV || 'development';

// API基础地址（用于API请求，带/api路径）
// 开发环境：本地测试地址 http://localhost:8051/api
// 生产环境：线上地址 https://api.kuangqiaodongjie.cn/api
const API_BASE_URL = ENV === 'development'
  ? 'http://localhost:8051/api'
  : 'https://api.kuangqiaodongjie.cn/api';

// 图片基础地址（用于图片/媒体资源，不带/api路径）
// 开发环境：本地测试地址 http://localhost:8051
// 生产环境：线上地址 https://api.kuangqiaodongjie.cn
const IMAGE_BASE_URL = ENV === 'development'
  ? 'http://localhost:8051'
  : 'https://api.kuangqiaodongjie.cn';

export {
  API_BASE_URL,
  IMAGE_BASE_URL,
  ENV
};

// 默认导出
export default {
  API_BASE_URL,
  IMAGE_BASE_URL,
  ENV
};
