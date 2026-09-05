import { registerRootComponent } from 'expo';
import { I18nManager } from 'react-native';

import App from './App';

// محتوای اپ فارسی است (مثل نسخه‌ی وب که dir="rtl" دارد)، پس چیدمان باید راست‌به‌چپ باشد.
// تغییر این پرچم فقط بعد از بستن و باز کردن دوباره‌ی کامل اپ روی چیدمان بومی اثر می‌کند.
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
