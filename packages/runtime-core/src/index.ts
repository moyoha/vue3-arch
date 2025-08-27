import { ShapeFlags } from "@vue/shared";

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

  // 渲染走这里，更新也走这里
  const patch = (n1, n2, container) => {
    if (n1 == n2) {
      // 两次渲染同一个元素直接跳过即可
      return;
    }
    if (n1 === null) {
      // 初始化操作
      mountElement(n2, container);
    }
  };
  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      patch(null, children[i], container);
    }
  };
  const mountElement = (vnode, container) => {
    const { type, children, props, shapeFlag } = vnode;
    let el = hostCreateElement(type);
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
    hostInsert(el, container);
  };
  const render = (vnode, container) => {
    patch(null, vnode, container);
  };
  return { render };
};