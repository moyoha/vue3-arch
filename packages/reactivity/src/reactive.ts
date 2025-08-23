import { isObject } from "@vue/shared";
import { ReactiveFlags } from "./constants";
import { mutableHandlers } from "./baseHandlers";

const reactiveMap = new WeakMap<any, any>();

// 创建 Proxy
function createReactiveObject(target: any) {
  if (!isObject(target)) {
    return target;
  }
  // 是否已经是一个 Reactive 代理
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

export function reactive(target: any) {
  return createReactiveObject(target);
}

export function toReactive(value) {
  return isObject(value) ? reactive(value) : value;
}

export function isReactive(value: unknown): boolean {
  return !!(value && value[ReactiveFlags.IS_REACTIVE]);
}