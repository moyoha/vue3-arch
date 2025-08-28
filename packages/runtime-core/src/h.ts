//1.一个参数，参数是节点类型
//2.两个参数
//  2.1 第一个参数是节点类型，第二个参数可能是属性、虚拟节点 、文本
//  2.2 带有 __v_isVnode 属性则表明是一个虚拟节点
//  2.3 第二个参数是一个数组 -> 儿子
//  2.4 第二个参数是不是一个对象 -> 文本
//3.三个参数
//  3.1 第二个参数只能是属性
//  3.2 第三个参数是儿子

import { isArray, isObject, isString, ShapeFlags } from "@vue/shared";
import { createVNode, isVnode } from "./createVnode";

export function h(type, propsOrChildren?, children?) {
  const l = arguments.length;
  if (l === 2) {
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      if (isVnode(propsOrChildren)) {
        // h('div', h('span'))
        return createVNode(type, null, [propsOrChildren]);
      } else {
        // h('div', { class: 'a' })
        return createVNode(type, propsOrChildren);
      }
    }
    return createVNode(type, null, propsOrChildren);
  } else {
    if (l > 3) {
      children = Array.from(arguments).slice(2);
    }
    if (l === 3 && isVnode(children)) {
      children = [children];
    }
    return createVNode(type, propsOrChildren, children);
  }
}