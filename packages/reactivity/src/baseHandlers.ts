import { ReactiveFlags } from "./constans";
import { track, trigger } from "./reactiveEffect";


export const mutableHandlers: ProxyHandler<any> = {
  get(target: any, key: string, receiver: any) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }
    track(target, key);
    return Reflect.get(target, key, receiver);
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