export function effect(fn, options?) {
	const _effect = new ReactiveEffect(fn, () => {
		_effect.run();
	})
	_effect.run();
	return _effect;
}

export let activeEffect;
class ReactiveEffect {
	public active = true;

	constructor(public fn, public scheduler) { }

	run() {
		if (!this.active) {
			return this.fn();
		}
		let lastEffect = activeEffect;
		try {
			activeEffect = this;
			return this.fn();
		} finally {
			activeEffect = lastEffect;
		}
	}
}