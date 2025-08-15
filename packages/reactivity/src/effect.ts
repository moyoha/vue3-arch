export function effect(fn, options?) {
	const _effect = new ReactiveEffect(fn, () => {
		_effect.run();
	});
	_effect.run();
	return _effect;
}

export let activeEffect;
class ReactiveEffect {
	public active = true;  // 创建的 effect 是响应式的
	_trackId = 0; // 用于记录当前 effect 执行的次数
	_deps = [];
	_depsLength = 0;

	// fn 用户传入的函数
	// scheduler 调度函数，fn 中依赖的数据发生变化后需要重新调用 
	constructor(public fn, public scheduler) {}

	run() {
		if (!this.active) {
			// 不是响应式的则直接调用函数
			return this.fn();
		}
		// 使用局部变量 lastEffect 存储上一个 activeEffect
		let lastEffect = activeEffect;
		try {
			activeEffect = this;
			return this.fn();
		} finally {
			// 最后将 activeEffect 恢复为上一个 activeEffect
			activeEffect = lastEffect;
		}
	}
}

export function trackEffect(effect, dep) {
	dep.set(effect, effect._trackId);
	// 让 effect 和 dep 关联起来
	effect._deps[effect._depsLength++] = dep;
}

export function triggerEffects(dep) {
	for(const effect of dep.keys()) {
		if(effect.scheduler) {
			effect.scheduler();
		}
	}
}