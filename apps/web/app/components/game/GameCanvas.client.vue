<script setup lang="ts">
	import {
		AVATAR_COLORWAYS,
		findTilePathBFS,
		getNpcCharacter,
		isFootBoxWalkable,
		slideMovePlayer,
		snapToNearestWalkableTile,
		type AssignedMapObject,
		type AvatarColorway,
		type CompactPlayerTuple,
		type Direction,
		type MapTemplate
	} from '@petakuis/shared'

	const props = defineProps<{
		mapConfig: MapTemplate
		myX: number
		myY: number
		myNickname: string
		myColorway: AvatarColorway
		assignedObjects: AssignedMapObject[]
		nearbyPlayers: CompactPlayerTuple[]
		nextTargetObject: AssignedMapObject | null
		disabled?: boolean
	}>()

	const emit = defineEmits<{
		move: [x: number, y: number, dir: Direction]
		openObject: [objectId: string]
	}>()

	const viewportEl = ref<HTMLDivElement | null>(null)
	const viewportW = ref(1280)
	const viewportH = ref(720)

	const tilePx = computed(
		() => props.mapConfig.tileSizePx * props.mapConfig.renderScale
	)
	const mapW = computed(() => props.mapConfig.widthTiles * tilePx.value)
	const mapH = computed(() => props.mapConfig.heightTiles * tilePx.value)

	function ensureWalkableWorldPos(rawX: number, rawY: number): {
		x: number
		y: number
	} {
		if (isFootBoxWalkable(props.mapConfig, rawX, rawY)) {
			return { x: rawX, y: rawY }
		}
		const snapped = snapToNearestWalkableTile(
			props.mapConfig,
			Math.floor(rawX / tilePx.value),
			Math.floor(rawY / tilePx.value)
		)
		return {
			x: snapped.tileX * tilePx.value + tilePx.value / 2,
			y: snapped.tileY * tilePx.value + tilePx.value / 2
		}
	}

	const initialSafePos = ensureWalkableWorldPos(
		props.myX || props.mapConfig.playerSpawn.tileX * tilePx.value + tilePx.value / 2,
		props.myY || props.mapConfig.playerSpawn.tileY * tilePx.value + tilePx.value / 2
	)

	const localX = ref(initialSafePos.x)
	const localY = ref(initialSafePos.y)
	const localDir = ref<Direction>('down')
	const isMoving = ref(false)
	const walkStepTick = ref(0)
	const walkWaypoints = ref<Array<{ x: number; y: number }>>([])
	const targetWalkPos = computed(() =>
		walkWaypoints.value.length > 0
			? walkWaypoints.value[walkWaypoints.value.length - 1]!
			: null
	)
	const pressedKeys = new Set<string>()

	const camX = computed(() =>
		Math.round(localX.value - viewportW.value / 2)
	)
	const camY = computed(() =>
		Math.round(localY.value - viewportH.value / 2)
	)

	const navigatorHud = computed(() => {
		const target = props.nextTargetObject
		if (!target) {
			return {
				visible: false,
				steps: 0,
				angleRad: 0,
				label: ''
			}
		}
		const tx = target.tileX * tilePx.value + tilePx.value / 2
		const ty = target.tileY * tilePx.value + tilePx.value / 2
		const dx = tx - localX.value
		const dy = ty - localY.value
		const distPx = Math.hypot(dx, dy)
		return {
			visible: true,
			steps: Math.max(1, Math.round(distPx / tilePx.value)),
			angleRad: Math.atan2(dy, dx),
			label: `Soal #${target.orderIndex} · ${getNpcCharacter(target.npcId).label}`
		}
	})

	watch(
		() => props.mapConfig.id,
		() => {
			const tp = props.mapConfig.tileSizePx * props.mapConfig.renderScale
			const safe = ensureWalkableWorldPos(
				props.mapConfig.playerSpawn.tileX * tp + tp / 2,
				props.mapConfig.playerSpawn.tileY * tp + tp / 2
			)
			localX.value = safe.x
			localY.value = safe.y
			walkWaypoints.value = []
		}
	)

	watch(
		() => [props.myX, props.myY],
		([nx, ny]) => {
			if (
				typeof nx === 'number' &&
				typeof ny === 'number' &&
				Math.hypot(nx - localX.value, ny - localY.value) > 120
			) {
				const safe = ensureWalkableWorldPos(nx, ny)
				localX.value = safe.x
				localY.value = safe.y
				walkWaypoints.value = []
			}
		}
	)

	function getYDepth(worldY: number, boost = 0): number {
		const ratio = Math.max(0, Math.min(1, worldY / (mapH.value || 1)))
		return Math.min(80, Math.max(2, Math.round(ratio * 70) + boost))
	}

	function getTrainerPreset(id: AvatarColorway) {
		return (
			AVATAR_COLORWAYS.find((c) => c.id === id) || AVATAR_COLORWAYS[0]!
		)
	}

	function getGbaSpriteFrame(
		dir: Direction,
		moving: boolean,
		stepPhase: number
	): {
		frameIdx: number
		flipX: boolean
	} {
		if (dir === 'down') {
			if (!moving || stepPhase % 2 === 0) return { frameIdx: 0, flipX: false }
			return { frameIdx: stepPhase === 1 ? 3 : 4, flipX: false }
		}
		if (dir === 'up') {
			if (!moving || stepPhase % 2 === 0) return { frameIdx: 1, flipX: false }
			return { frameIdx: stepPhase === 1 ? 5 : 6, flipX: false }
		}
		const flipX = dir === 'right'
		if (!moving || stepPhase % 2 === 0) return { frameIdx: 2, flipX }
		return { frameIdx: stepPhase === 1 ? 7 : 8, flipX }
	}

	const mySpriteFrame = computed(() =>
		getGbaSpriteFrame(localDir.value, isMoving.value, walkStepTick.value)
	)

	function planWalkTo(goalX: number, goalY: number) {
		const path = findTilePathBFS(
			props.mapConfig,
			localX.value,
			localY.value,
			goalX,
			goalY
		)
		if (path.length > 0) {
			walkWaypoints.value = path
		} else {
			const safeGoal = ensureWalkableWorldPos(goalX, goalY)
			walkWaypoints.value = [safeGoal]
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (props.disabled) return
		const key = e.key.toLowerCase()
		if (
			[
				'w',
				'a',
				's',
				'd',
				'arrowup',
				'arrowdown',
				'arrowleft',
				'arrowright'
			].includes(key)
		) {
			pressedKeys.add(key)
			walkWaypoints.value = []
		}
		if (key === ' ' || key === 'e' || key === 'f' || key === 'enter') {
			tryInteractNearest()
		}
	}

	function handleKeyUp(e: KeyboardEvent) {
		pressedKeys.delete(e.key.toLowerCase())
	}

	function tryInteractNearest() {
		if (props.disabled) return
		for (const obj of props.assignedObjects) {
			if (obj.answered) continue
			const ox = obj.tileX * tilePx.value + tilePx.value / 2
			const oy = obj.tileY * tilePx.value + tilePx.value / 2
			if (Math.hypot(ox - localX.value, oy - localY.value) <= 96) {
				emit('openObject', obj.objectId)
				return
			}
		}
	}

	function handleObjectClick(obj: AssignedMapObject) {
		if (props.disabled || obj.answered) return
		const ox = obj.tileX * tilePx.value + tilePx.value / 2
		const oy = obj.tileY * tilePx.value + tilePx.value / 2
		if (Math.hypot(localX.value - ox, localY.value - oy) <= 96) {
			emit('openObject', obj.objectId)
		} else {
			planWalkTo(ox, oy)
		}
	}

	function handleViewportPointerDown(e: PointerEvent) {
		if (props.disabled || !viewportEl.value) return
		const rect = viewportEl.value.getBoundingClientRect()
		const clickScreenX = e.clientX - rect.left
		const clickScreenY = e.clientY - rect.top
		const worldX = clickScreenX + camX.value
		const worldY = clickScreenY + camY.value

		for (const obj of props.assignedObjects) {
			if (obj.answered) continue
			const ox = obj.tileX * tilePx.value + tilePx.value / 2
			const oy = obj.tileY * tilePx.value + tilePx.value / 2
			if (Math.hypot(worldX - ox, worldY - oy) <= 42) {
				handleObjectClick(obj)
				return
			}
		}

		planWalkTo(worldX, worldY)
	}

	function stepDpad(dir: Direction) {
		if (props.disabled) return
		const step = tilePx.value
		let tx = localX.value
		let ty = localY.value
		if (dir === 'up') ty -= step
		if (dir === 'down') ty += step
		if (dir === 'left') tx -= step
		if (dir === 'right') tx += step
		localDir.value = dir
		const slid = slideMovePlayer(
			props.mapConfig,
			localX.value,
			localY.value,
			tx - localX.value,
			ty - localY.value
		)
		walkWaypoints.value = [{ x: slid.x, y: slid.y }]
	}

	let loopTimerId: ReturnType<typeof setInterval> | null = null
	let lastFrameTime = 0
	let lastNetSyncTime = 0

	function tick(nowMs: number) {
		const dt = lastFrameTime
			? Math.min(0.05, (nowMs - lastFrameTime) / 1000)
			: 0.016
		lastFrameTime = nowMs

		if (viewportEl.value) {
			const cw = viewportEl.value.clientWidth || window.innerWidth || 1280
			const ch = viewportEl.value.clientHeight || window.innerHeight || 720
			if (viewportW.value !== cw) viewportW.value = cw
			if (viewportH.value !== ch) viewportH.value = ch
		}

		const speed = 220
		let vx = 0
		let vy = 0
		if (!props.disabled) {
			if (pressedKeys.has('w') || pressedKeys.has('arrowup')) vy -= 1
			if (pressedKeys.has('s') || pressedKeys.has('arrowdown')) vy += 1
			if (pressedKeys.has('a') || pressedKeys.has('arrowleft')) vx -= 1
			if (pressedKeys.has('d') || pressedKeys.has('arrowright')) vx += 1

			if (vx === 0 && vy === 0 && walkWaypoints.value.length > 0) {
				const wp = walkWaypoints.value[0]!
				const dx = wp.x - localX.value
				const dy = wp.y - localY.value
				const dist = Math.hypot(dx, dy)
				if (dist > 6) {
					vx = dx / dist
					vy = dy / dist
				} else {
					walkWaypoints.value.shift()
				}
			}
		}

		const movingInput = vx !== 0 || vy !== 0
		if (movingInput) {
			const len = Math.hypot(vx, vy) || 1
			const nx = vx / len
			const ny = vy / len

			if (Math.abs(nx) > Math.abs(ny)) {
				localDir.value = nx < 0 ? 'left' : 'right'
			} else {
				localDir.value = ny < 0 ? 'up' : 'down'
			}

			const stepDist = speed * dt
			const slid = slideMovePlayer(
				props.mapConfig,
				localX.value,
				localY.value,
				nx * stepDist,
				ny * stepDist
			)

			const movedDist = Math.hypot(
				slid.x - localX.value,
				slid.y - localY.value
			)
			localX.value = slid.x
			localY.value = slid.y

			if (movedDist > 0.25) {
				isMoving.value = true
				walkStepTick.value = Math.floor(nowMs / 150) % 4
				if (nowMs - lastNetSyncTime >= 66) {
					lastNetSyncTime = nowMs
					emit('move', localX.value, localY.value, localDir.value)
				}
			} else {
				isMoving.value = false
				walkStepTick.value = 0
				if (walkWaypoints.value.length > 0) {
					walkWaypoints.value.shift()
				}
			}
		} else {
			isMoving.value = false
			walkStepTick.value = 0
		}
	}

	onMounted(() => {
		const safe = ensureWalkableWorldPos(localX.value, localY.value)
		localX.value = safe.x
		localY.value = safe.y
		window.addEventListener('keydown', handleKeyDown)
		window.addEventListener('keyup', handleKeyUp)
		tick(performance.now())
		loopTimerId = setInterval(() => {
			tick(performance.now())
		}, 33)
	})

	onBeforeUnmount(() => {
		window.removeEventListener('keydown', handleKeyDown)
		window.removeEventListener('keyup', handleKeyUp)
		if (loopTimerId) clearInterval(loopTimerId)
	})
</script>

<template>
	<div
		ref="viewportEl"
		class="relative isolate z-0 h-full w-full cursor-pointer select-none overflow-hidden bg-[#183018]"
		:class="{ 'pointer-events-none': disabled }"
		style="isolation: isolate; z-index: 0"
		@pointerdown="handleViewportPointerDown"
	>
		<!-- GBA / ZEP World Camera Container -->
		<div
			class="absolute"
			:style="{
				width: `${mapW}px`,
				height: `${mapH}px`,
				left: `${-camX}px`,
				top: `${-camY}px`
			}"
		>
			<!-- Gambar peta -->
			<img
				:src="mapConfig.mapImageUrl"
				:alt="mapConfig.name"
				class="pointer-events-none absolute inset-0 h-full w-full select-none"
				style="image-rendering: pixelated"
			>

			<!-- Tap-to-move Target Ring -->
			<div
				v-if="targetWalkPos && !disabled"
				class="pointer-events-none absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-3 border-[#fde047] bg-[#fde047]/20"
				:style="{
					left: `${targetWalkPos.x}px`,
					top: `${targetWalkPos.y}px`
				}"
			/>

			<!-- Karakter pemberi soal: kaki berpijak sedikit di bawah tengah tile -->
			<div
				v-for="obj in assignedObjects"
				:key="obj.objectId"
				class="absolute flex -translate-x-1/2 -translate-y-full flex-col items-center"
				:style="{
					left: `${obj.tileX * tilePx + tilePx / 2}px`,
					top: `${obj.tileY * tilePx + tilePx / 2 + 16}px`,
					zIndex: getYDepth(obj.tileY * tilePx + tilePx / 2)
				}"
				@pointerdown.stop="handleObjectClick(obj)"
			>
				<div
					v-if="obj.answered"
					v-show="!disabled"
					class="mb-1 rounded border-2 border-[#4ade80] bg-[#14532d]/95 px-1.5 py-0.5 font-mono-num text-[10px] font-extrabold text-[#fef08a] shadow"
				>
					✓ #{{ obj.orderIndex }}
				</div>
				<div
					v-else
					v-show="!disabled"
					class="mb-1 whitespace-nowrap rounded border-2 border-[#16211b] px-1.5 py-0.5 font-mono-num text-[11px] font-extrabold text-[#16211b] shadow-[2px_2px_0px_#16211b]"
					:class="
						nextTargetObject?.objectId === obj.objectId
							? 'bg-[#facc15]'
							: 'bg-white'
					"
				>
					? #{{ obj.orderIndex }}
				</div>
				<GameNpcSprite
					:npc-id="obj.npcId"
					:scale="3"
					:animated="!obj.answered"
					:flip="localX < obj.tileX * tilePx + tilePx / 2"
					:class="obj.answered ? 'opacity-60' : ''"
				/>
			</div>

			<!-- Other Nearby Trainers -->
			<div
				v-for="p in nearbyPlayers"
				v-show="!disabled"
				:key="p[0]"
				class="pointer-events-none absolute -translate-x-1/2 -translate-y-[65%] flex flex-col items-center"
				:style="{
					left: `${p[1]}px`,
					top: `${p[2]}px`,
					zIndex: getYDepth(p[2], 1)
				}"
			>
				<div class="relative h-16 w-8 overflow-hidden">
					<img
						:src="getTrainerPreset(p[5]).spriteUrl"
						:alt="p[4]"
						class="absolute top-0 h-16 max-w-none"
						:style="{
							imageRendering: 'pixelated',
							width: '288px',
							left: `-${getGbaSpriteFrame(p[3], false, 0).frameIdx * 32}px`,
							transform: getGbaSpriteFrame(p[3], false, 0).flipX
								? 'scaleX(-1)'
								: 'none'
						}"
					>
				</div>
				<span
					class="mt-0.5 rounded border border-white bg-[#16211b]/90 px-2 py-0.5 text-[11px] font-bold text-white shadow"
				>
					{{ p[4] }}
				</span>
			</div>

			<!-- Local Player GBA Trainer (Foot-Anchored at localX, localY) -->
			<div
				v-show="!disabled"
				class="pointer-events-none absolute -translate-x-1/2 -translate-y-[65%] flex flex-col items-center"
				:style="{
					left: `${localX}px`,
					top: `${localY}px`,
					zIndex: getYDepth(localY, 2)
				}"
			>
				<!-- Golden Player Arrow -->
				<span
					class="mb-0.5 text-xs font-extrabold text-[#fde047] drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]"
				>
					▼
				</span>

				<!-- 16x32 GBA Trainer Frame Scaled 2.5x -> 40x80 px -->
				<div
					class="relative h-20 w-10 overflow-hidden"
					:style="{
						transform: mySpriteFrame.flipX ? 'scaleX(-1)' : 'none'
					}"
				>
					<img
						:src="getTrainerPreset(myColorway).spriteUrl"
						:alt="myNickname"
						class="absolute top-0 h-20 max-w-none"
						:style="{
							imageRendering: 'pixelated',
							width: '360px',
							left: `-${mySpriteFrame.frameIdx * 40}px`
						}"
					>
				</div>

				<!-- Player Nameplate -->
				<span
					class="mt-0.5 whitespace-nowrap rounded border-2 border-[#fde047] bg-[#14532d] px-2.5 py-0.5 text-xs font-extrabold text-white shadow"
				>
					{{ myNickname }}
				</span>
			</div>
		</div>

		<!-- Navigator Compass Pill -->
		<div
			v-if="navigatorHud.visible && !disabled"
			class="pointer-events-none absolute left-1/2 top-16 z-20 -translate-x-1/2 flex items-center gap-2.5 rounded-full border-2 border-[#16211b] bg-[#fef08a] px-4 py-1.5 text-xs font-extrabold text-[#16211b] shadow-[3px_3px_0px_#16211b]"
		>
			<span
				class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#dc2626] text-white"
				:style="{ transform: `rotate(${navigatorHud.angleRad}rad)` }"
			>
				➜
			</span>
			<span>
				Arah {{ navigatorHud.label }} ·
				<strong class="font-mono-num">{{ navigatorHud.steps }} langkah</strong>
			</span>
		</div>

		<!-- Mobile GBA D-Pad Controls -->
		<div
			class="absolute bottom-5 left-5 z-20 grid grid-cols-3 gap-1.5 sm:hidden"
			aria-label="Kontrol Arah GBA"
			@pointerdown.stop
		>
			<div />
			<button
				type="button"
				class="pixel-btn flex h-12 w-12 items-center justify-center rounded-lg bg-white/95 font-bold text-[#16211b]"
				aria-label="Gerak Atas"
				@click="stepDpad('up')"
			>
				▲
			</button>
			<div />
			<button
				type="button"
				class="pixel-btn flex h-12 w-12 items-center justify-center rounded-lg bg-white/95 font-bold text-[#16211b]"
				aria-label="Gerak Kiri"
				@click="stepDpad('left')"
			>
				◀
			</button>
			<button
				type="button"
				class="pixel-btn flex h-12 w-12 items-center justify-center rounded-lg bg-white/95 font-bold text-[#16211b]"
				aria-label="Gerak Bawah"
				@click="stepDpad('down')"
			>
				▼
			</button>
			<button
				type="button"
				class="pixel-btn flex h-12 w-12 items-center justify-center rounded-lg bg-white/95 font-bold text-[#16211b]"
				aria-label="Gerak Kanan"
				@click="stepDpad('right')"
			>
				▶
			</button>
		</div>
	</div>
</template>
