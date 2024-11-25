<template>
	<div class="nav_item_timebar">
		<el-tooltip class="item" effect="dark" content="淹没等级" placement="top">
			<div class="timebar_child">
				<!-- <div class="nav_item_icon nav_icon_operator">-</div> -->
				<div id="issue_selecter_nav" class="nav_item_icon nav_icon_operator">
					<el-select
						v-model="waterLevelKey"
						placeholder="请选择"
						:popper-append-to-body="false"
					>
						<el-option
							v-for="item in waterLevelOptions"
							:key="item.key"
							:label="item.val"
							:value="item.key"
						>
						</el-option>
					</el-select>
				</div>
				<!-- <div class="nav_item_icon nav_icon_operator">+</div> -->
			</div>
		</el-tooltip>
	</div>
</template>
<script lang="ts">
import { DEFAULT_DATE } from '@/const/default'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
// 过滤器
import { fortmatData2YMDHM } from '@/util/filter'
import { Getter, Mutation } from 'vuex-class'
import {
	GET_WAVE_PRODUCT_ISSUE_DATETIME,
	SET_FloodLevelType,
	SET_ISSUE_TS,
	SET_TIMESPAN,
} from '@/store/types'
import { loadDistCoverageIssueTs } from '@/api/raster'
import { IHttpResponse } from '@/interface/common'
import { fortmatData2MDHM } from '@/util/filter'
import moment from 'moment'
import { FloodLevelType } from '@/enum/selections'
/** 发布时间组件 */
@Component({
	filters: {
		fortmatData2YMDHM,
	},
})
export default class SubNavWaterLevelItem extends Vue {
	waterLevelKey = FloodLevelType.LTE200

	waterLevelOptions: { key: FloodLevelType; val: string; label: string }[] = [
		{
			key: FloodLevelType.LTE100,
			label: '大于100',
			val: '大于100',
		},
		{
			key: FloodLevelType.LTE150,
			label: '大于150',
			val: '大于150',
		},
		// {
		// 	key: FloodLevelType.LTE200,
		// 	label: '大于200',
		// 	val: '大于200',
		// },
	]
	mounted() {
		// this.setForecastArea(this.selectedArea)
	}

	@Watch('waterLevelKey')
	onShowType(val: FloodLevelType): void {
		this.setFloodLevel(val)
	}

	/** 设置淹没深度 */
	@Mutation(SET_FloodLevelType, { namespace: 'menu' })
	setFloodLevel: (val: FloodLevelType) => void
}
</script>
<style scoped lang="less">
.nav_item_timebar {
	display: flex;
	align-items: center;
	background: #233446;
	// padding: 5px;
	margin: 5px;
	border-radius: 8px;
	box-shadow: 0 0 5px 0px black;
	.timebar_child {
		display: flex;
		margin-left: 5px;
		margin-right: 5px;
		font-weight: 500;
		height: 100%;
		align-items: center;
		div {
			height: 100%;
		}
		.nav_icon_operator {
			// width: 10px;
		}
		.nav_icon_operator:hover {
			// background: #16a085;
		}

		div:nth-child(2) {
			width: 60px;
			display: flex;
			align-items: center;
			justify-content: center;
		}
	}
}
// TODO:[*] 23-08-04 此处覆盖 element ui input 原样式有问题
.nav_item_timebar {
	.nav_icon_operator {
		.el-inupt_inner {
			background: #34495e;
			/* color: green; */
			overflow: hidden;
			border-radius: 2px;
			color: white;
		}
	}
}
#issue_selecter_nav {
	width: 140px;
	.el-select {
		.el-input {
			.el-inupt_inner {
				background: #34495e;
				/* color: green; */
				overflow: hidden;
				border-radius: 2px;
				color: white;
			}
		}
	}
}
.el-inupt_inner {
}
</style>
