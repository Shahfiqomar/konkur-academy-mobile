// آدرس بک‌اند برای اپ موبایل، برخلاف وب، باید کامل و مطلق باشد
// (پروکسی نسبی «/api» که Vite در فرانت‌اند وب فراهم می‌کند اینجا وجود ندارد).
//
// برای تغییر آدرس، متغیر EXPO_PUBLIC_API_BASE_URL را در یک فایل .env در همین
// پوشه (frontend/mobile/.env) تنظیم کنید، مثلاً:
//   EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:4000
//
// نکات مهم:
// - شبیه‌ساز iOS: http://localhost:4000 معمولاً کار می‌کند.
// - شبیه‌ساز Android: باید از http://10.0.2.2:4000 استفاده کنید (localhost خودِ شبیه‌ساز است).
// - گوشی واقعی (Expo Go): باید آی‌پی محلی کامپیوترتان در همان وای‌فای را بگذارید،
//   نه localhost.
const DEFAULT_BASE_URL = 'http://localhost:4000';

export const API_ROOT = process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_BASE_URL;
export const API_BASE_URL = `${API_ROOT}/api`;

// برای تبدیل آدرس‌های نسبی که بک‌اند برمی‌گرداند (مثل «/uploads/xxx.mp4»
// برای ویدیوهای ذخیره‌شده روی دیسک) به آدرس کامل قابل‌پخش در اپ.
export function resolveMediaUrl(url) {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_ROOT}${url}`;
}
