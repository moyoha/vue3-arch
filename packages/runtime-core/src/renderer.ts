import { ShapeFlags } from "@vue/shared";
import { Fragment, isSameVnode, Text } from "./createVnode";
import { getSequence } from "./seq";
import { reactive, ReactiveEffect } from "@vue/reactivity";
import { queueJob } from "./scheduler";

export function createRenderer(renderOptions) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    patchProp: hostPatchProp,
  } = renderOptions;

  // 属性的更新
  const patchProps = (oldProps, newProps, el) => {
    for (let key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key]);
    }
    // 删除无用的旧属性
    for (let key in oldProps) {
      if (!(key in newProps)) {
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
  };

  const unmount = (vnode) => {
    if (vnode.type === Fragment) {
      unmountChildren(vnode.children);
    } else {
      hostRemove(vnode.el);
    }
  };

  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i]);
    }
  };

  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      patch(null, children[i], container);
    }
  };

  // 第一次挂载时调用，将虚拟节点转换为真实节点，并添加属性和内容挂载到容器
  const mountElement = (vnode, container, anchor = null) => {
    const { type, children, props, shapeFlag } = vnode;
    // 第一次渲染的时候让虚拟节点和真实的 dom 创建关联 vnode.el = 真实dom
    // 第二次渲染新的 vnode 和上一次的vnode做比对，之后更新对应的el元素，可以后续再复用这个dom元素
    let el = (vnode.el = hostCreateElement(type));
    if (props) {
      for (let key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    // 9 & 8 > 0 说明儿子是文本元素
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el);
    }
    hostInsert(el, container, anchor);
  };
  // vue3 中分为两种，全量diff(递归diff) 快速diff(靶向更新) --> 基于模板编译
  const patchKeyedChildren = (c1, c2, el) => {
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;
    let i = 0;
    // 确定比对开始位置
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      i++;
    }
    // 确定比对结束位置
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    if (i > e1) {
      // 特殊情况处理，新 children 相较于老 children 只是新增了一些节点，将新增的节点挂载即可
      if (i <= e2) {
        let nextPos = e2 + 1;
        let anchor = c2[nextPos]?.el;
        while (i <= e2) {
          patch(null, c2[i], el, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      // 特殊情况处理，新 children 相较于老 children 只是删除了一些节点，将删除的节点卸载即可
      while (i <= e1) {
        unmount(c1[i]);
        i++;
      }
    } else {
      const s1 = i;
      const s2 = i;

      const keyToNewIndexMap = new Map();
      let toBePatched = e2 - s2 + 1; // 要倒序插入的个数
      let newIndexToOldMapIndex = new Array(toBePatched).fill(0);
      for (let i = s2; i <= e2; i++) {
        const vnode = c2[i];
        keyToNewIndexMap.set(vnode.key, i);
      }

      for (let i = s1; i <= e1; i++) {
        const vnode = c1[i];
        const newIndex = keyToNewIndexMap.get(vnode.key);
        if (newIndex === undefined) {
          // 说明这个节点在新的数组中不存在，需要卸载
          unmount(vnode);
        } else {
          // 比较前后节点的差异，更新 children
          newIndexToOldMapIndex[newIndex - s2] = i + 1;
          patch(vnode, c2[newIndex], el);
        }
      }
      // 调整顺序
      // 按照新的队列倒序插入， 通过 insertBefore 在参照物往前面插入
      // 插入的过程中，可能新的元素的多，需要创建
      //先从索引为3的位置倒序插入

      let increasingSeq = getSequence(newIndexToOldMapIndex);
      let j = increasingSeq.length - 1;
      for (let i = toBePatched - 1; i >= 0; i--) {
        let newIndex = s2 + i; // 参照物的索引
        let anchor = c2[newIndex + 1]?.el;
        let vnode = c2[newIndex];
        if (!vnode.el) {
          // 新列表中新增的元素
          patch(null, vnode, el, anchor);
        } else {
          if (i === increasingSeq[j]) {
            j--; // diff 算法优化
          } else {
            hostInsert(vnode.el, el, anchor);// 接着倒序插入
          }
        }
      };
    }
  };

  const patchChildren = (n1, n2, el) => {
    // 1.新的是文本，老的是数组移除老的;
    // 2.新的是文本，老的也是文本，内容不相同替换
    // 3.老的是数组，新的是数组，全量 diff 算法
    // 4.老的是数组，新的不是数组，移除老的子节点
    // 5.老的是文本，新的是空
    // 6.老的是文本，新的是数组，移除老的文本，挂载新的数组
    const c1 = n1.children;
    const c2 = n2.children;

    const prevShapeFlag = n1.shapeFlag;
    const shapeFlag = n2.shapeFlag;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 感觉这个地方没必要做这个判断, 会直接被文本覆盖
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 新的是文本，老的是数组移除老的;
        unmountChildren(c1);
      }
      if (c2 !== c1) {
        // 新的是文本，老的也是文本，内容不相同替换
        hostSetElementText(el, c2);
      }
    } else {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 老的是数组，新的是数组，全量 diff 算法
          patchKeyedChildren(c1, c2, el);
        } else {
          // 老的是数组，新的不是数组，移除老的子节点
          unmountChildren(c1);
        }
      } else {
        // 老的是文本
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, '');
        }

        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el);
        }
      }
    }
  };
  const patchElement = (n1, n2) => {
    // 对比属性和元素的子节点
    const el = (n2.el = n1.el);
    const oldProps = n1.props || {};
    const newProps = n2.props || {};

    patchProps(oldProps, newProps, el);
    patchChildren(n1, n2, el);
  };
  const processElement = (n1, n2, container, anchor = null) => {
    if (n1 === null) {
      // 初始化操作
      mountElement(n2, container, anchor);
    } else {
      // 对比更新
      patchElement(n1, n2);
    }
  };

  const processText = (n1, n2, container) => {
    if (n1 === null) {
      n2.el = hostCreateText(n2.children);
      hostInsert(n2.el, container);
    } else {
      const el = (n2.el = n1.el);
      if (n2.children !== n1.children) {
        hostSetText(el, n2.children);
      }
    }
  };

  const processFragment = (n1, n2, container) => {
    if (n1 === null) {
      mountChildren(n2.children, container);
    } else {
      patchChildren(n1, n2, container);
    }
  };

  const mountComponent = (n2, container, anchor = null) => {
    const { data = () => {}, render } = n2.type;
    const state = reactive(data());

    const instance = {
      state,
      vnode: n2,
      isMounted: false,
      subTree: null,
      update: null,
    };

    const componentUpdate = () => {
      if (!instance.isMounted) {
        // 初始化
        const subTree = render.call(state, state);
        patch(null, subTree, container, anchor);
        instance.isMounted = true;
        instance.subTree = subTree;
      } else {
        // 更新
        const subTree = render.call(state, state);
        patch(instance.subTree, subTree, container, anchor);
        instance.subTree = subTree;
      }
    };
    const effect = new ReactiveEffect(componentUpdate, () => {
      queueJob(instance.update);
    });
    instance.update = () => effect.run();
    instance.update();
  };

  const processComponent = (n1, n2, container, anchor = null) => {
    if (n1 === null) {
      mountComponent(n2, container, anchor);
    } else {
      // patchComponent(n1, n2, container, anchor);
    }
  };

  // 通过虚拟节点挂载或更新 DOM 节点
  const patch = (n1, n2, container, anchor = null) => {
    if (n1 === n2) {
      // 两次渲染同一个元素直接跳过即可
      return;
    }
    // 移除旧节点，初始化新节点
    if (n1 && !isSameVnode(n1, n2)) {
      unmount(n1);
      n1 = null;
    }
    const { type, shapeFlag } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container);
        break;
      case Fragment:
        processFragment(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor);
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          processComponent(n1, n2, container, anchor);
        }
    }
  };

  const render = (vnode, container) => {
    if (vnode === null) {
      if (container._vnode) {
        unmount(container._vnode);
      }
      return;
    }
    patch(container._vnode || null, vnode, container);
    container._vnode = vnode;
  };
  return { render };
};