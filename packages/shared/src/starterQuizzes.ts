import type { QuizDefinition, QuizQuestion } from './types'

/**
 * Kuis contoh SD kelas 1–6, disusun dari buku siswa Kurikulum Merdeka (Kemendikdasmen)
 * di E:/website/permadi/books/sumber. Soal ditulis ulang dengan kalimat sendiri; fakta
 * mengikuti bab yang disebut di deskripsi tiap kuis.
 *
 * Dimasukkan ke database oleh server web (seedStarterQuizzes) satu kali per id: kuis yang
 * sudah pernah dimasukkan lalu dihapus admin tidak dimunculkan lagi.
 */

type Draft = Omit<QuizQuestion, 'order'>

const OX = [
	{ id: 'o', text: 'Benar' },
	{ id: 'x', text: 'Salah' }
]
const LETTERS = ['a', 'b', 'c', 'd']

function mc(id: string, prompt: string, options: string[], correct: number, hint?: string): Draft {
	return {
		id,
		type: 'multiple',
		prompt,
		options: options.map((text, i) => ({ id: LETTERS[i]!, text })),
		answer: [LETTERS[correct]!],
		hint: hint ? { type: 'text', value: hint } : undefined,
		timeLimitS: 30,
		points: 100
	}
}

function ox(id: string, prompt: string, isTrue: boolean, hint?: string): Draft {
	return {
		id,
		type: 'ox',
		prompt,
		options: OX,
		answer: [isTrue ? 'o' : 'x'],
		hint: hint ? { type: 'text', value: hint } : undefined,
		timeLimitS: 20,
		points: 100
	}
}

function isian(id: string, prompt: string, accepted: string[], hint?: string): Draft {
	return {
		id,
		type: 'subjective',
		prompt,
		options: [],
		answer: accepted,
		ignoreSpaces: true,
		hint: hint ? { type: 'text', value: hint } : undefined,
		timeLimitS: 35,
		points: 120
	}
}

const CREATED = '2026-11-12T00:00:00.000Z'

function quiz(
	base: Pick<QuizDefinition, 'id' | 'title' | 'description' | 'gradeLabel' | 'subject' | 'mapId' | 'mode'>,
	questions: Draft[]
): QuizDefinition {
	return {
		...base,
		ownerName: 'Tim Petakuis',
		schoolLevel: 'sd',
		visibility: 'public',
		settings: {
			isAllowPass: true,
			showIncorrectAnswer: true,
			answerRevealMode: 'always',
			shuffleQuestions: base.mode !== 'linear',
			shuffleOptions: false
		},
		questions: questions.map((q, i) => ({ ...q, order: i + 1 })),
		createdAt: CREATED,
		updatedAt: CREATED
	}
}

export const CURRICULUM_QUIZZES: QuizDefinition[] = [
	quiz({
		id: 'quiz-sd1-mtk-membilang',
		title: 'Membilang dan Penjumlahan sampai 10',
		description: 'Membilang, membandingkan, menghitung maju-mundur, pasangan bilangan, dan cerita penjumlahan. Sumber: Matematika untuk SD/MI Kelas I, Bab 1–2.',
		gradeLabel: 'Kelas 1',
		subject: 'Matematika',
		mapId: 'map-desa-ladang',
		mode: 'linear'
	}, [
		mc('q-1', 'Bu Tani punya 3 ayam dan 4 bebek. Berapa banyak hewan semuanya?', ['6', '7', '8', '9'], 1, 'Hitung ayam dulu, lalu lanjutkan menghitung bebek.'),
		mc('q-2', 'Bilangan yang lebih besar dari 8 adalah ...', ['5', '7', '9', '3'], 2),
		ox('q-3', '5 + 5 = 10', true),
		isian('q-4', '2 + 6 = ...', ['8', 'delapan']),
		mc('q-5', 'Hitung mundur: 10, 9, 8, ...', ['7', '6', '5', '9'], 0, 'Hitung mundur berarti bilangannya makin kecil satu-satu.'),
		mc('q-6', 'Pasangan bilangan yang jumlahnya 10 adalah ...', ['4 dan 6', '3 dan 5', '2 dan 7', '1 dan 8'], 0),
		ox('q-7', 'Bilangan 6 lebih kecil daripada 4.', false),
		isian('q-8', 'Dina punya 4 apel. Ibu memberi 3 apel lagi. Berapa apel Dina sekarang?', ['7', 'tujuh'], 'Gabungkan 4 apel dan 3 apel.')
	]),

	quiz({
		id: 'quiz-sd2-bindo-tanda-baca',
		title: 'Perasaanku, Huruf Kapital, dan Tanda Baca',
		description: 'Mengenali perasaan, memakai huruf kapital, serta tanda titik, koma, tanya, dan seru. Sumber: Bahasa Indonesia "Keluargaku Unik" untuk SD/MI Kelas II, Bab 1.',
		gradeLabel: 'Kelas 2',
		subject: 'Bahasa Indonesia',
		mapId: 'map-kampung-danau',
		mode: 'free'
	}, [
		mc('q-1', 'Huruf kapital dipakai di ...', ['awal kalimat', 'akhir kalimat', 'tengah kata', 'sesudah tanda koma'], 0),
		mc('q-2', 'Tanda baca di akhir kalimat tanya adalah ...', ['tanda titik (.)', 'tanda koma (,)', 'tanda tanya (?)', 'tanda seru (!)'], 2),
		mc('q-3', 'Penulisan nama orang yang benar adalah ...', ['mimi', 'Mimi', 'mIMI', 'MiMi'], 1, 'Huruf pertama nama orang ditulis dengan huruf kapital.'),
		ox('q-4', 'Tanda koma (,) dipakai untuk memisahkan pemerincian.', true),
		mc('q-5', 'Tanda seru (!) dipakai di akhir ...', ['kalimat tanya', 'seruan atau perintah', 'nama orang', 'pemerincian'], 1),
		mc('q-6', 'Kalimat yang ditulis dengan benar adalah ...', ['siapa namamu?', 'Siapa namamu?', 'Siapa namamu.', 'siapa Namamu?'], 1),
		mc('q-7', 'Dika jatuh dari sepeda dan lututnya luka. Perasaan Dika saat itu adalah ...', ['senang', 'sedih', 'bangga', 'gembira'], 1),
		isian('q-8', 'Tanda baca yang dipakai di akhir kalimat berita adalah tanda ...', ['titik', 'tanda titik'])
	]),

	quiz({
		id: 'quiz-sd3-ipas-siklus-hidup',
		title: 'Siklus Hidup yang Menakjubkan',
		description: 'Siklus hidup hewan dan tumbuhan, metamorfosis sempurna dan tidak sempurna, serta manfaat kupu-kupu. Sumber: IPAS untuk SD/MI Kelas III (Edisi Revisi), Bab 4.',
		gradeLabel: 'Kelas 3',
		subject: 'IPA (Sains)',
		mapId: 'map-desa-sunnyside',
		mode: 'free'
	}, [
		mc('q-1', 'Tahapan pertumbuhan makhluk hidup dari lahir hingga dewasa yang terjadi berulang disebut ...', ['siklus hidup', 'fotosintesis', 'penyerbukan', 'adaptasi'], 0),
		mc('q-2', 'Urutan siklus hidup kupu-kupu yang benar adalah ...', ['telur → ulat → kepompong (pupa) → kupu-kupu', 'telur → kepompong → ulat → kupu-kupu', 'ulat → telur → kepompong → kupu-kupu', 'telur → nimfa → kupu-kupu'], 0),
		isian('q-3', 'Anak katak yang hidup di air dan masih berekor disebut ...', ['berudu', 'kecebong'], 'Nama lainnya kecebong.'),
		ox('q-4', 'Pada metamorfosis tidak sempurna terdapat tahap pupa.', false, 'Tahap pupa hanya ada pada metamorfosis sempurna.'),
		mc('q-5', 'Hewan yang mengalami metamorfosis tidak sempurna (telur → nimfa → dewasa) adalah ...', ['kupu-kupu', 'ayam', 'jangkrik', 'kucing'], 2),
		mc('q-6', 'Masa diam sebelum berubah menjadi dewasa pada metamorfosis sempurna disebut ...', ['pupa', 'nimfa', 'berudu', 'embrio'], 0),
		ox('q-7', 'Siklus hidup tumbuhan dimulai dari biji.', true),
		mc('q-8', 'Kupu-kupu bermanfaat bagi tumbuhan karena ...', ['membantu penyerbukan bunga', 'memakan hama tikus', 'menggemburkan tanah', 'menyiram tanaman'], 0, 'Kupu-kupu membawa serbuk sari dari bunga ke bunga.')
	]),

	quiz({
		id: 'quiz-sd4-ipas-energi-fotosintesis',
		title: 'Mengubah Bentuk Energi dan Fotosintesis',
		description: 'Perubahan bentuk energi pada alat dan tubuh, panel surya, serta proses fotosintesis. Sumber: IPAS untuk SD/MI Kelas IV (Edisi Revisi), Bab 1.',
		gradeLabel: 'Kelas 4',
		subject: 'IPA (Sains)',
		mapId: 'map-dataran-angin',
		mode: 'free'
	}, [
		mc('q-1', 'Lampu mengubah energi listrik menjadi energi ...', ['cahaya', 'gerak', 'bunyi', 'kimia'], 0),
		mc('q-2', 'Saat kita bermain, tubuh mengubah energi kimia dari makanan menjadi energi ...', ['gerak', 'listrik', 'bunyi', 'cahaya'], 0),
		mc('q-3', 'Alat yang mengubah cahaya matahari menjadi energi listrik adalah ...', ['panel surya', 'kipas angin', 'setrika', 'radio'], 0),
		ox('q-4', 'Saat mobil berjalan, semua energi dari bensin berubah menjadi energi gerak.', false, 'Sebagian energinya berubah menjadi panas dan asap.'),
		mc('q-5', 'Proses tumbuhan membuat makanannya sendiri dengan bantuan cahaya matahari disebut ...', ['fotosintesis', 'pernapasan', 'penyerbukan', 'metamorfosis'], 0),
		mc('q-6', 'Zat hijau daun yang menangkap cahaya matahari bernama ...', ['klorofil', 'oksigen', 'glukosa', 'karbon'], 0),
		mc('q-7', 'Bahan yang diperlukan untuk fotosintesis adalah ...', ['cahaya matahari, air, dan karbon dioksida', 'oksigen, air, dan tanah', 'cahaya matahari, oksigen, dan gula', 'air, garam, dan karbon dioksida'], 0),
		ox('q-8', 'Fotosintesis menghasilkan gas oksigen yang kita hirup untuk bernapas.', true),
		isian('q-9', 'Gas yang diserap daun untuk fotosintesis, dan juga kita embuskan saat bernapas, adalah ...', ['karbon dioksida', 'karbondioksida', 'co2'])
	]),

	quiz({
		id: 'quiz-sd4-pancasila-aturan',
		title: 'Aturan, Gotong Royong, dan Lahirnya Pancasila',
		description: 'Aturan di rumah dan sekolah, gotong royong, Garuda Pancasila, serta sejarah perumusan Pancasila. Sumber: Pendidikan Pancasila untuk SD/MI Kelas IV, Bab 2–4.',
		gradeLabel: 'Kelas 4',
		subject: 'Pendidikan Pancasila (PPKn)',
		mapId: 'map-desa-tepi-sungai',
		mode: 'free'
	}, [
		mc('q-1', 'Ketentuan yang dibuat untuk mengatur perilaku atau perbuatan kita disebut ...', ['peraturan', 'hak', 'hobi', 'cita-cita'], 0),
		ox('q-2', 'Aturan di dalam keluarga biasanya tidak tertulis.', true),
		mc('q-3', 'Semboyan Bhinneka Tunggal Ika tertulis pada pita yang dicengkeram oleh ...', ['Burung Garuda Pancasila', 'Monumen Nasional', 'bendera Merah Putih', 'Tugu Proklamasi'], 0),
		mc('q-4', 'Ir. Sukarno mengusulkan Pancasila dalam sidang BPUPK pada tanggal ...', ['1 Juni 1945', '17 Agustus 1945', '28 Oktober 1928', '20 Mei 1908'], 0),
		mc('q-5', 'Sidang pertama BPUPK berlangsung pada tanggal ...', ['29 Mei – 1 Juni 1945', '17 – 18 Agustus 1945', '1 – 5 Juni 1945', '10 – 17 Juli 1945'], 0),
		mc('q-6', 'Panitia Sembilan diketuai oleh ...', ['Ir. Sukarno', 'Mohammad Hatta', 'Muhammad Yamin', 'Achmad Soebardjo'], 0),
		mc('q-7', 'Membersihkan selokan bersama warga satu RT adalah contoh sikap ...', ['gotong royong', 'egois', 'boros', 'malas'], 0),
		isian('q-8', 'Pancasila terdiri atas ... sila.', ['5', 'lima']),
		ox('q-9', 'Jika aturan tidak dilaksanakan, keteraturan dan ketertiban sulit terwujud.', true)
	]),

	quiz({
		id: 'quiz-sd5-ips-letak-indonesia',
		title: 'Di Mana Indonesia Berada?',
		description: 'Letak astronomis dan geografis, negara kepulauan, pulau besar dan kecil di Indonesia. Sumber: IPAS untuk SD/MI Kelas V (Edisi Revisi), Bab 1.',
		gradeLabel: 'Kelas 5',
		subject: 'IPS & Sosiologi',
		mapId: 'map-pesisir-karang',
		mode: 'free'
	}, [
		mc('q-1', 'Secara astronomis, Indonesia terletak di antara ...', ['6° LU – 11° LS dan 95° BT – 141° BT', '11° LU – 6° LS dan 95° BT – 141° BT', '6° LS – 11° LU dan 95° BB – 141° BB', '0° – 10° LU dan 100° BT – 120° BT'], 0),
		mc('q-2', 'Secara geografis, Indonesia terletak di antara dua benua dan dua samudra, yaitu ...', ['Benua Asia dan Australia; Samudra Hindia dan Pasifik', 'Benua Asia dan Afrika; Samudra Hindia dan Atlantik', 'Benua Eropa dan Asia; Samudra Pasifik dan Arktik', 'Benua Australia dan Amerika; Samudra Pasifik dan Atlantik'], 0),
		ox('q-3', 'Indonesia dilalui garis khatulistiwa.', true),
		isian('q-4', 'Area daratan yang dikelilingi air dan tetap berada di atas permukaan saat air pasang disebut ...', ['pulau']),
		mc('q-5', 'Pulau yang menjadi titik paling utara Indonesia adalah Pulau ...', ['Miangas', 'Rote', 'Weh', 'Simping'], 0),
		mc('q-6', 'Salah satu pulau terkecil di dunia yang berada di Indonesia adalah Pulau ...', ['Simping', 'Miangas', 'Rote', 'Weh'], 0, 'Luasnya hanya sekitar sepertiga lapangan sepak bola.'),
		mc('q-7', 'Pulau Simping berada di sisi pulau ...', ['Kalimantan', 'Sumatra', 'Jawa', 'Papua'], 0),
		mc('q-8', 'Menurut pandangan bangsa Indonesia, laut adalah ...', ['penghubung antarpulau', 'pemisah antarpulau', 'batas negara saja', 'wilayah yang tidak berguna'], 0),
		ox('q-9', 'Indonesia adalah negara kepulauan terbesar di dunia.', true)
	]),

	quiz({
		id: 'quiz-sd5-mtk-kpk-fpb',
		title: 'KPK dan FPB',
		description: 'Kelipatan, faktor, bilangan prima, KPK, FPB, dan soal cerita sehari-hari. Sumber: Matematika untuk SD/MI Kelas V, Bab 2.',
		gradeLabel: 'Kelas 5',
		subject: 'Matematika',
		mapId: 'map-kota-pasar',
		mode: 'free'
	}, [
		mc('q-1', 'KPK dari 4 dan 5 adalah ...', ['20', '9', '1', '40'], 0, 'Tulis kelipatan 4 dan kelipatan 5, cari yang sama paling kecil.'),
		mc('q-2', 'Faktor dari 12 adalah ...', ['1, 2, 3, 4, 6, 12', '1, 2, 4, 8, 12', '2, 3, 4, 6', '1, 3, 6, 9, 12'], 0),
		isian('q-3', 'FPB dari 12 dan 18 adalah ...', ['6', 'enam'], 'Cari faktor yang sama dari kedua bilangan, lalu ambil yang terbesar.'),
		mc('q-4', 'Nisa berlatih renang setiap 3 hari sekali dan Yohana setiap 4 hari sekali. Hari ini mereka berlatih bersama. Mereka akan berlatih bersama lagi setelah ... hari.', ['12', '7', '1', '24'], 0),
		ox('q-5', 'Bilangan prima hanya mempunyai dua faktor, yaitu 1 dan bilangan itu sendiri.', true),
		mc('q-6', 'Bilangan berikut yang merupakan bilangan prima adalah ...', ['9', '15', '13', '21'], 2),
		mc('q-7', 'Kelipatan persekutuan terkecil dari 2 dan 3 adalah ...', ['6', '5', '1', '12'], 0),
		mc('q-8', 'Bu Guru punya 24 pensil dan 36 buku. Semuanya dibagikan sama banyak ke kelompok sebanyak-banyaknya. Banyak kelompok adalah ...', ['12', '6', '72', '4'], 0, 'Gunakan FPB dari 24 dan 36.'),
		ox('q-9', 'Bilangan 1 adalah faktor dari setiap bilangan asli.', true)
	]),

	quiz({
		id: 'quiz-sd5-koding-berpikir-komputasional',
		title: 'Berpikir Komputasional dan Teknologi Digital',
		description: 'Dekomposisi, pengenalan pola, abstraksi, algoritma, perangkat keras dan lunak, serta keamanan informasi pribadi. Sumber: Koding dan Kecerdasan Artifisial untuk SD/MI Kelas V, Bab 1–2.',
		gradeLabel: 'Kelas 5',
		subject: 'Informatika / TIK',
		mapId: 'map-kampus-modern',
		mode: 'free'
	}, [
		mc('q-1', 'Memecah masalah besar menjadi beberapa bagian kecil agar lebih mudah dikerjakan disebut ...', ['dekomposisi', 'abstraksi', 'algoritma', 'pengenalan pola'], 0),
		mc('q-2', 'Fokus pada hal penting dan mengabaikan hal yang tidak diperlukan disebut ...', ['abstraksi', 'dekomposisi', 'algoritma', 'pengenalan pola'], 0),
		mc('q-3', 'Urutan langkah-langkah untuk menyelesaikan suatu masalah disebut ...', ['algoritma', 'dekomposisi', 'perangkat keras', 'data'], 0),
		ox('q-4', 'Mengenali jadwal pelajaran yang berulang setiap minggu adalah contoh pengenalan pola.', true),
		mc('q-5', 'Contoh perangkat keras komputer adalah ...', ['papan ketik (keyboard)', 'aplikasi pengolah kata', 'sistem operasi', 'permainan daring'], 0, 'Perangkat keras bisa dilihat dan disentuh.'),
		mc('q-6', 'Program atau aplikasi di dalam komputer yang tidak bisa disentuh disebut ...', ['perangkat lunak', 'perangkat keras', 'kabel daya', 'tetikus'], 0),
		mc('q-7', 'Bagian komputer yang berfungsi seperti otak untuk memproses perintah adalah ...', ['CPU', 'layar', 'tetikus', 'pengeras suara'], 0),
		ox('q-8', 'Kata sandi akun boleh diberikan kepada teman baru yang kita kenal di internet.', false, 'Kata sandi seperti kunci rumah: jaga baik-baik.'),
		isian('q-9', 'Nama lengkap, alamat rumah, dan kata sandi termasuk informasi ... yang harus dijaga.', ['pribadi'])
	]),

	quiz({
		id: 'quiz-sd6-ipas-pencernaan',
		title: 'Sistem Pencernaan dan Makanan Bergizi',
		description: 'Organ pencernaan dan fungsinya, gerak peristaltik, Isi Piringku, serta gangguan pencernaan. Sumber: IPAS untuk SD/MI Kelas VI (Edisi Revisi), Bab 1.',
		gradeLabel: 'Kelas 6',
		subject: 'IPA (Sains)',
		mapId: 'map-kampung-danau',
		mode: 'free'
	}, [
		mc('q-1', 'Urutan organ pencernaan yang benar adalah ...', ['mulut → kerongkongan → lambung → usus halus → usus besar → anus', 'mulut → lambung → kerongkongan → usus besar → usus halus → anus', 'mulut → kerongkongan → usus halus → lambung → usus besar → anus', 'kerongkongan → mulut → lambung → usus halus → usus besar → anus'], 0),
		mc('q-2', 'Gerakan meremas dan mendorong makanan di kerongkongan menuju lambung disebut gerak ...', ['peristaltik', 'rotasi', 'refleks', 'revolusi'], 0),
		mc('q-3', 'Sari-sari makanan diserap oleh dinding ...', ['usus halus', 'usus besar', 'lambung', 'kerongkongan'], 0),
		mc('q-4', 'Di usus besar terjadi penyerapan ...', ['air', 'protein', 'lemak', 'enzim'], 0),
		ox('q-5', 'Usus halus adalah organ pencernaan terpanjang, kira-kira 6 meter.', true),
		mc('q-6', 'Pencernaan mekanis di mulut terjadi dengan bantuan ...', ['gigi', 'asam lambung', 'usus', 'empedu'], 0),
		ox('q-7', 'Lambung memerlukan waktu sekitar 2 sampai 4 jam untuk mengosongkan isinya.', true),
		isian('q-8', 'Pedoman makan bergizi seimbang yang menggambarkan porsi makanan dalam satu piring disebut ...', ['isi piringku'], 'Dua kata: "Isi ...".'),
		mc('q-9', 'Gangguan pencernaan yang ditandai buang air besar lebih sering dengan tinja cair adalah ...', ['diare', 'maag', 'sembelit', 'obesitas'], 0)
	]),

	quiz({
		id: 'quiz-sd6-inggris-vegetables-hygiene',
		title: 'Healthy Vegetables and Hygiene Habits',
		description: 'Nama, warna, dan bentuk sayuran serta kebiasaan menjaga kebersihan diri dalam bahasa Inggris. Sumber: English for Nusantara Kids untuk SD/MI Kelas VI, Chapter 1–2.',
		gradeLabel: 'Kelas 6',
		subject: 'Bahasa Inggris',
		mapId: 'map-desa-ladang',
		mode: 'free'
	}, [
		mc('q-1', 'Carrots are long and ...', ['orange', 'purple', 'blue', 'black'], 0),
		mc('q-2', 'Which vegetable is green and curly and has branches?', ['Broccoli', 'Carrot', 'Potato', 'Eggplant'], 0),
		mc('q-3', '"Bayam" in English is ...', ['spinach', 'cabbage', 'corn', 'peas'], 0),
		ox('q-4', 'Eggplants can be purple or green.', true),
		isian('q-5', 'Potatoes are ... in color. (Kentang berwarna cokelat.)', ['brown']),
		mc('q-6', '"Kangkung" in English is ...', ['water spinach', 'snake beans', 'bitter melon', 'cauliflower'], 0, 'It has long green leaves with hollow stems.'),
		mc('q-7', 'We should wash our hands with ...', ['soap and water', 'sand', 'oil', 'juice'], 0),
		mc('q-8', 'Complete the sentence: "I brush my teeth ... a day."', ['twice', 'never', 'zero', 'nothing'], 0),
		mc('q-9', 'Which one is a good hygiene habit?', ['I cut my nails every week.', 'I never take a bath.', 'I eat without washing my hands.', 'I share my toothbrush with friends.'], 0)
	])
]
