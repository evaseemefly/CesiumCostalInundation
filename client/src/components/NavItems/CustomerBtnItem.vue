<template>
	<div class="nav_item_timebar">
		<el-button type="primary" @click="click">{{ title }}</el-button>
	</div>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
// 过滤器
import { fortmatData2YMDHM } from '@/util/filter'

/** 发布时间组件 */
@Component({
	filters: {
		fortmatData2YMDHM,
	},
})
export default class SubNavBtnItem extends Vue {
	@Prop({ type: String, default: '默认' })
	title: string

	@Prop({ type: String, default: 'primary' })
	btnCls: string

	mounted() {}

	click(): void {
		console.log('customer btn do click')
		this.$emit('click')
	}
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
