import { isObject } from "@vue/shared";
import { ReactiveFlags } from "./constans";

const mutableHandlers: ProxyHandler<any> = {
  get(target: any, key: string, receiver: any) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }
    return target[key];
  },
  set(target: any, key: string, value: any, receiver: any) {
    target[key] = value;
    return true;
  }
};

const reactiveMap = new WeakMap<any, any>();

export function reactive(target: any) {
  return createReactiveObject(target);
}

// 创建 Proxy
function createReactiveObject(target: any) {
  if (!isObject(target)) {
    return target;
  }
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target;
  }

  const existingProxy = reactiveMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }
  const proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy);
  return proxy;
}