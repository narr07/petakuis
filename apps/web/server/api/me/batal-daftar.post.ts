import { deleteUserAccount } from '../../utils/admin'

/**
 * Membatalkan pendaftaran: menghapus akun yang baru dibuat lewat Google dan belum memilih
 * peran, misalnya siswa yang tidak sengaja masuk dengan Google. Akun ini belum punya kuis
 * atau laporan. Akun yang sudah punya peran (termasuk admin) tidak bisa dihapus dari sini.
 */
export default defineEventHandler(async (event) => {
	const current = await requireUser(event)
	if (current.role) {
		throw createError({
			statusCode: 409,
			statusMessage: 'Akun ini sudah aktif. Untuk menghapusnya, ikuti langkah di halaman Hapus Akun.'
		})
	}
	await deleteUserAccount(current.id)
	return { ok: true }
})
