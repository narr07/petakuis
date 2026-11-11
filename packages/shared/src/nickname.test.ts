import { describe, expect, test } from 'bun:test'
import { isNicknameOffensive, tidyNickname } from './nickname'

describe('isNicknameOffensive', () => {
	test.each([
		'anjing', 'ANJING', 'Anjiiiing', '4nj1ng', 'a n j i n g', 'a.n.j.i.n.g', 'si_k0nt0l', 'bangsat123',
		'Asu', 'asu lu', 'babi', 'ajg', 'Kntl', 'f u c k', 'Dika Goblok'
	])('menolak %p', (name) => {
		expect(isNicknameOffensive(name)).toBe(true)
	})

	test.each([
		'Asuka', 'Hasudungan', 'Babinsa', 'Taufik', 'Siti Aisyah', 'Budi', 'Rafa 7B', 'Dimas_08',
		'Kasur', 'Tolong', 'Sekar', 'Cokro', 'Ajeng', 'Putri Sasa', 'Bagas'
	])('menerima %p', (name) => {
		expect(isNicknameOffensive(name)).toBe(false)
	})
})

describe('tidyNickname', () => {
	test('merapikan spasi dan memotong 20 karakter', () => {
		expect(tidyNickname('  Budi   Santoso  ')).toBe('Budi Santoso')
		expect(tidyNickname('a'.repeat(30))).toHaveLength(20)
	})
})
