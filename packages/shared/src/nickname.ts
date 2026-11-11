/**
 * Penyaring nama panggilan siswa. Dipakai di halaman masuk (umpan balik langsung) dan di game
 * server (penjaga terakhir, karena klien bisa diakali).
 *
 * Teks dinormalkan dulu: huruf kecil, aksen dibuang, angka/simbol pengganti huruf (4→a, 0→o,
 * 1→i, 3→e, 5→s, 7→t, @→a, $→s), dan huruf yang diulang dirapatkan (anjiiing → anjing).
 */

/** Dicari di mana pun dalam nama, termasuk bila dipisah spasi/titik ("a n j i n g"). */
const BLOCKED_ANYWHERE = [
	'anjing', 'anjeng', 'bangsat', 'bajingan', 'goblok', 'goblog', 'tolol', 'kontol', 'memek',
	'ngentot', 'ngewe', 'jancok', 'jancuk', 'pepek', 'lonte', 'pelacur', 'jembut', 'bencong',
	'kampang', 'keparat', 'brengsek', 'fuck', 'shit', 'bitch', 'asshole', 'pussy', 'nigga', 'nigger'
]

/** Hanya bila berdiri sebagai kata utuh, supaya nama seperti "Asuka" atau "Babinsa" tidak kena. */
const BLOCKED_WORDS = [
	'asu', 'babi', 'tai', 'taik', 'kampret', 'bego', 'dungu', 'idiot', 'ajg', 'anjg', 'anj', 'kntl',
	'mmk', 'bgst', 'bgsd', 'tll', 'gblk', 'jnck', 'sex', 'seks', 'porn', 'dick', 'cok', 'jamput'
]

const LEET: Record<string, string> = {
	'4': 'a', '@': 'a', '8': 'b', '3': 'e', '6': 'g', '9': 'g', '1': 'i', '!': 'i', '|': 'i',
	'0': 'o', '5': 's', '$': 's', '7': 't', '2': 'z'
}

function normalize(raw: string): string {
	return raw
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[48@3691!|0572$]/g, c => LEET[c] ?? c)
		.replace(/(.)\1+/g, '$1')
}

/** True bila nama panggilan mengandung kata kasar. */
export function isNicknameOffensive(raw: string): boolean {
	const text = normalize(raw)
	const lettersOnly = text.replace(/[^a-z]/g, '')
	if (BLOCKED_ANYWHERE.some(w => lettersOnly.includes(w))) return true

	const words = text.split(/[^a-z]+/).filter(Boolean)
	return words.some(w => BLOCKED_WORDS.includes(w))
}

export const NICKNAME_MAX_LENGTH = 20

/** Merapikan spasi dan memotong panjang nama panggilan. */
export function tidyNickname(raw: string): string {
	return raw.trim().replace(/\s+/g, ' ').slice(0, NICKNAME_MAX_LENGTH)
}
