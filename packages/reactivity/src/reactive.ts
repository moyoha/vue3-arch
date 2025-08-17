import { isObject } from "@vue/shared";
import { ReactiveFlags } from "./constans";
import { mutableHandlers } from "./baseHandlers";

const reactiveMap = new WeakMap<any, any>();

export function reactive(target: any) {
  return createReactiveObject(target);
}

// 创建 Proxy
function createReactiveObject(target: any) {
  if (!isObject(target)) {
    return target;
  }
  // 是否已经是一个代理
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target;
  }
  // 是否代理的同一个对象
  const existingProxy = reactiveMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }
  const proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy);
  return proxy;
}

export function toReactive(value) {
  return isObject(value) ? reactive(value) : value;
}