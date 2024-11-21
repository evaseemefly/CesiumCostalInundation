<template>
	<nav id="sub_nav_menu">
		<!-- sub-nav-menu -->
		<!-- <div class="nav_menu-item" v-for="menItem in menuList" :key="menItem.id">
			{{ menItem.title }}
		</div> -->
		<nav class="nav_item nav_item_icons">
			<div class="nav_item_icon fa-solid fa-house"></div>
		</nav>
		<el-tooltip class="item" effect="dark" content="标量场渲染方式" placement="top">
			<nav class="nav_item nav_item_icons">
				<div
					:class="[
						isShowRasterSwitchMenu ? 'activate' : 'un_activate',
						,
						'nav_item_icon',
					]"
					@click="isShowRasterSwitchMenu = !isShowRasterSwitchMenu"
				>
					<i class="fa-solid fa-tornado"></i>
				</div>
				<div class="hidden_box_switch" v-show="isShowRasterSwitchMenu">
					<el-switch v-model="isRasterShow" active-text="栅格" inactive-text="等值线">
					</el-switch>
				</div>
				<!-- <div class="nav_item_icon fa-solid fa-tornado"></div> -->
			</nav>
		</el-tooltip>
		<SubNavWaterLevelItem></SubNavWaterLevelItem>
		<SubNavForecastProductItem></SubNavForecastProductItem>
		<SubNavBtnItem title="预加载数据" @click="todoLoadingDataSource"></SubNavBtnItem>
		<SubNavBtnItem title="渲染"></SubNavBtnItem>
	</nav>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Mutation, Getter } from 'vuex-class'

import * as L from 'leaflet'
// store
import {
	SET_IS_SELECT_LOOP,
	SET_BOX_LOOP_RADIUS,
	GET_BOX_LOOP_LATLNG,
	GET_CURRENT_TY_FORECAST_DT,
	GET_DATE_STEP,
	SET_TO_FILTER_TY_SCATTER,
	SET_FILTER_TY_SCATTER_MENU_TYPE,
	SET_SHADE_NAV_TIME,
	GET_WAVE_PRODUCT_ISSUE_DATETIME,
	GET_WAVE_PRODUCT_LAYER_TYPE,
	SET_CURRENT_FORECAST_DT,
	GET_WAVE_PRODUCT_ISSUE_TIMESTAMP,
	SET_SHOW_TY_SEARCH_FORM,
	SET_SCALAR_SHOW_TYPE,
	SET_SURGE_TD_STEP,
	SET_TIMESPAN,
} from '@/store/types'
// 默认常量
import {
	DEFAULT_BOX_LOOP_RADIUS,
	DEFAULT_BOX_LOOP_RADIUS_UNIT,
	DEFAULT_DATE,
	DEFAULT_DATE_STEP,
	DEFAULT_TIMESTAMP,
	DEFAULT_TIME_SPAN,
	DEFAULT_TIME_SPAN_WD,
	DEFAULT_WD_TIME_SPAN,
} from '@/const/default'
import { MS_UNIT } from '@/const/unit'
import { FilterTyMidModel } from '@/middle_model/typhoon'
// 枚举
import { TyScatterMenuType } from '@/enum/menu'
import { FilterTypeEnum } from '@/enum/filter'
import { IHttpResponse } from '@/interface/common'

//
import { sortFilterTyList } from '@/util/sortUtil'
import moment from 'moment'
import wave from '@/store/modules/wave'
import { IExpandEnum, ScalarShowTypeEnum } from '@/enum/common'

import SubNavWaterLevelItem from '@/components/NavItems/WaterLevelItem.vue'
import SubNavForecastProductItem from '@/components/NavItems/ForecastProductItem.vue'
import SubNavBtnItem from '@/components/NavItems/CustomerBtnItem.vue'

// 引入事件总线
import { EventBus } from '@/bus/BUS'
import { TO_LOAD_DATASROUCE } from '@/bus/types'
/** + 22-10-14 副导航栏(布局:底部) */
@Component({
	components: { SubNavWaterLevelItem, SubNavForecastProductItem, SubNavBtnItem },
})
export default class NavMenuView extends Vue {
	/** 是否圈选 */
	checkedSelectLoop = false

	/** 筛选后的台风集合 */
	filterTyList: FilterTyMidModel[] = []
	filterTyCount = 0
	/** 是否在加载筛选后的台风集合 */
	isLoadingTyList = false

	get selectLoopCls(): string {
		return this.checkedSelectLoop ? 'activate' : 'un_activate'
	}

	forecastDt: Date = new Date()
	forecastEndDt: Date = new Date()

	/** 是否加载过滤后的台风散点(或热图) */
	isLoadFilterTyScatters = false

	/** 是否展开显示 标量场选项 */
	isShowRasterSwitchMenu = false
	isRasterShow = true

	/** 标量场展示形式 */
	scalarShowType: ScalarShowTypeEnum = ScalarShowTypeEnum.RASTER

	created() {
		this.forecastDt = new Date()
	}

	/** 时间间隔 */
	dateStep: number = DEFAULT_DATE_STEP

	/** 查询的起止时间间隔(单位:s) */
	timeSpan: number = DEFAULT_WD_TIME_SPAN

	/** 最大可提供的查询时间间隔(default:7d) */
	timeSpanMax: number = 60 * 60 * 24 * 7

	/** 增加的时间步长(1d) */
	timeStep: number = 60 * 60 * 24

	/** 1s=1000ms */
	MS = 1000

	// tdStep = 0

	tempTitle = '数据间隔'

	/** 发布时间戳集合 */
	issueTsList: number[] = []

	/** 预报时间戳集合 */
	forecastTsList: number[] = []

	todoLoadingDataSource(): void {
		console.log('navmenu do click')
		// TypeError: this.$root.$options.initLoadDataSource is not a function
		//@ts-ignore
		// this.$root.$options.initLoadDataSource()
		EventBus.$emit(TO_LOAD_DATASROUCE)
	}
}
</script>
<style lang="less">
@import '../../styles/btn.less';
.nav_item {
	// transition: all 0.5s;
	box-shadow: 0 0 5px 0px black;
}

.un_padding {
	padding: 0px !important;
}
.hidden_box_radius {
	width: 80px;
	margin-left: 10px;
	margin-right: 10px;
}
.hidden_box_switch {
	width: 140px;
	margin-left: 10px;
	margin-right: 10px;
}

#sub_nav_menu {
	display: flex;
	// flex-direction: column;
	// height: 100%;
	width: 100%;
	background: #34495e;
	color: white;
	border-radius: 8px;
	.nav_menu-item {
		background: #2c3e50;
	}
	.nav_item_icons {
		background: #233446;
		padding: 5px;
		margin: 5px;
		border-radius: 8px;
		display: flex;
		display: flex;
		justify-content: center;
		align-items: center;
		min-width: 36px;
		overflow: hidden;
		svg {
			margin-left: 5px;
			margin-right: 5px;
		}
	}
}
</style>
