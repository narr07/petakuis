/** Pengguna yang sedang masuk beserta peran efektifnya, atau `user: null`. */
export default defineEventHandler(async (event) => {
	return { user: await getCurrentUser(event) }
})
