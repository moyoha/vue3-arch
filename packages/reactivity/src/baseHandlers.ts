import { isObject } from "@vue/shared";
import { ReactiveFlags } from "./constans";
import { reactive } from "./reactive";
import { track, trigger } from "./reactiveEffect";


export const mutableHandlers: ProxyHandler<any> = {
  get(target: any, key: string, receiver: any) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }
    track(target, key);
    const res = Reflect.get(target, key, receiver);
    if (isObject(res)) { // 当取值时对象时，进行递归代理
      return reactive(res);
    }
    return res;
  },
  set(target: any, key: string, value: any, receiver: any) {
    let oldValue = target[key];
    let result = Reflect.set(target, key, value, receiver);
    if (oldValue !== value) {
      trigger(target, key, value, oldValue);
    }
    return result;
  }
};