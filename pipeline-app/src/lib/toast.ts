import { toast } from '@zerodevx/svelte-toast';

const BASE = {
	duration: 4000,
	pausable: true,
	dismissable: true
};

export function toastSuccess(msg: string) {
	toast.push(msg, {
		...BASE,
		theme: {
			'--toastBackground': 'rgba(22, 163, 74, 0.9)',
			'--toastColor': '#fff',
			'--toastBarBackground': '#15803d'
		}
	});
}

export function toastError(msg: string) {
	toast.push(msg, {
		...BASE,
		duration: 6000,
		theme: {
			'--toastBackground': 'rgba(220, 38, 38, 0.9)',
			'--toastColor': '#fff',
			'--toastBarBackground': '#991b1b'
		}
	});
}

export function toastInfo(msg: string) {
	toast.push(msg, {
		...BASE,
		theme: {
			'--toastBackground': 'rgba(39, 39, 42, 0.95)',
			'--toastColor': '#e4e4e7',
			'--toastBarBackground': '#06b6d4'
		}
	});
}
