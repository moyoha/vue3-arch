import { ReactiveFlags } from "./constans";
import { activeEffect } from "./effect";
import { track } from "./reactiveEffect";


export const mutableHandlers: ProxyHandler<any> = {
  get(target: any, key: string, receiver: any) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }
    track(target, key);
    console.log(key, activeEffect);
    return Reflect.get(target, key, receiver);
  },
  set(target: any, key: string, value: any, receiver: any) {
    return Reflect.set(target, key, value, receiver);
  }
};