import { listAllMaps } from '../utils/store'

export default defineEventHandler(() => {
	return {
		maps: listAllMaps()
	}
})
