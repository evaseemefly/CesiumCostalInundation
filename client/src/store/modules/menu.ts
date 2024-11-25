import { FloodLevelType, RasterShowType } from '@/enum/selections'
import {
	SET_RASTER_SHOW_TYPE,
	GET_RASTER_SHOW_TYPE,
	GET_FloodLevelType,
	SET_FloodLevelType,
} from '../types'

interface Common {
	rasterShowType: RasterShowType
	floodLevelType: FloodLevelType
}

const state: Common = {
	rasterShowType: RasterShowType.UN_SELECT,
	floodLevelType: FloodLevelType.LTE100,
}
const getters = {
	[GET_RASTER_SHOW_TYPE](state: Common): RasterShowType {
		return state.rasterShowType
	},
	[GET_FloodLevelType](state: Common): FloodLevelType {
		return state.floodLevelType
	},
}
// 使用dispatch调用
const actions = {}
// 使用commit调用
const mutations = {
	[SET_RASTER_SHOW_TYPE](state: Common, val: RasterShowType): void {
		state.rasterShowType = val
	},
	[SET_FloodLevelType](state: Common, val: FloodLevelType): void {
		state.floodLevelType = val
	},
}

export default {
	namespaced: true,
	state: state,
	mutations,
	actions,
	getters,
}
