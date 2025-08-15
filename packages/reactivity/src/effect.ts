export function effect(fn, options?) {
	const _effect = new ReactiveEffect(fn, () => {
		_effect.run();
	});
	_effect.run();
	return _effect;
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
	_trackId = 0; // 用于记录当前 effect 执行的次数
	deps = [];
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
			preCleanEffect(this);
			return this.fn();
		} finally {
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
		dep.set(effect, effect._trackId); // 更新 id
		let oldDep = effect.deps[effect._depsLength];
		if (oldDep !== dep) {
			if (oldDep) {
				cleanDepEffect(oldDep, effect);
			}
			// 换成新的
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