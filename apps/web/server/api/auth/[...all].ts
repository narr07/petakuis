/** Semua endpoint Better Auth: /api/auth/sign-in/email, /api/auth/callback/google, dst. */
export default defineEventHandler(async (event) => {
	const auth = await useAuth()
	return auth.handler(toWebRequest(event))
})
