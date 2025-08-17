export function effect(fn, options?) {
	const _effect = new ReactiveEffect(fn, () => {
		_effect.run();
	});
	_effect.run();
	// 让外界可以自己实现调度器
	if (options) {
		Object.assign(_effect, options);
	}
	const runner = _effect.run.bind(_effect);
	runner.effect = _effect;
	return runner; // 让外界可以自己 run
}

function preCleanEffect(effct) {
	effct._depsLength = 0;
	effct._trackId++;
}

function postCleanEffect(effect) {
	if (effect.deps.length > effect._depsLength) {
		for (let i = effect._depsLength; i < effect.deps.length; i++) {
			cleanDepEffect(effect.deps[i], effect);
		}
		effect.deps.length = effect._depsLength;
	}
}

export let activeEffect;
class ReactiveEffect {
	public active = true;  // 创建的 effect 是响应式的
	_trackId = 0; // 记录当前 effect 执行的次数
	deps = []; // 记录当前 effect 被那些属性依赖
	_depsLength = 0; // 记录当前 effect 被那些属性依赖的长度

	// fn 用户传入的函数
	// scheduler 调度函数，fn 中依赖的数据发生变化后需要重新调用 
	constructor(public fn, public scheduler) {}

	run() {
		if (!this.active) {
			// 不是响应式的则直接调用函数
			return this.fn();
		}
		// 使用局部变量 lastEffect 存储上一个 activeEffect
		// 解决 effect 嵌套导致 activeEffect 丢失的问题
		let lastEffect = activeEffect;
		try {
			activeEffect = this;
			// 每次执行都需要 diff 依赖
			// 因为内部可能存在条件语句，如 obj.flag ? obj.name : obj.age
			// 若 obj.flag 为 true 时，如果 obj.age 曾被依赖，
			// 则需要将 obj.age 对应的 effect 从 obj.age 的依赖中移除，反之亦然
			preCleanEffect(this);
			return this.fn();
		} finally {
			// preCleanEffect 清理完成后，如果上一轮的依赖比本次的依赖更多
			// 则还存在未被清理的依赖
			postCleanEffect(this);
			// 最后将 activeEffect 恢复为上一个 activeEffect
			activeEffect = lastEffect;
		}
	}
}

function cleanDepEffect(dep, effect) {
	dep.delete(effect);
	if (dep.size === 0) {
		dep.cleanup();
	}
}

export function trackEffect(effect, dep) {
	if (dep.get(effect) !== effect._trackId) {
		// 记录当前属性依赖的 effect
		dep.set(effect, effect._trackId); // 更新 id
		let oldDep = effect.deps[effect._depsLength];
		if (oldDep !== dep) {
			if (oldDep) {
				cleanDepEffect(oldDep, effect);
			}
			// 记录当前 effect 被那些属性依赖
			effect.deps[effect._depsLength++] = dep;
		} else {
			effect._depsLength++;
		}
	}
}

export function triggerEffects(dep) {
	for (const effect of dep.keys()) {
		if (effect.scheduler) {
			effect.scheduler();
		}
	}
}