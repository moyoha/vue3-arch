// 对节点元素的属性的操作，如 class style
import patchAttr from './modules/patchAttr';
import patchStyle from './modules/patchStyle';
import patchEvent from './modules/patchEvent';
import patchClass from "./modules/patchClass";

export default function patchProp(el, key, prevValue, nextValue) {
  if (key === 'class') {
    return patchClass(el, nextValue);
  } else if (key === 'style') {
    patchStyle(el, prevValue, nextValue);
  } else if (/^on[^a-z]/.test(key)) {
    patchEvent(el, key, nextValue);
  } else {
    // 普通属性
    patchAttr(el, key, nextValue);
  }
}
