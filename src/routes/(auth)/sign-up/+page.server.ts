import { superValidate } from 'sveltekit-superforms/server';
import type { Actions, PageServerLoad } from './$types';
import { signUpSchema } from './schema';
import { fail, redirect } from '@sveltejs/kit';
import { authUseCases } from '$usecases/auth-usecases';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (session) {
		throw redirect(301, '/admin');
	}
	const form = await superValidate(signUpSchema);
	return { form };
};

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event, signUpSchema);
		const { locals, request } = event;
		if (!form.valid) {
			return fail(400, {
				form
			});
		}
		try {
			console.log('event.request', JSON.stringify(request));
			await authUseCases.signUp(form.data);
			const session = await authUseCases.login(form.data, {
				platform: 'web',
				ip_address: '0.0.0.0'
			});
			locals.auth.setSession(session);
		} catch (e) {
			console.error(e);
			return { form };
		}
		throw redirect(301, '/admin');
	}
};
