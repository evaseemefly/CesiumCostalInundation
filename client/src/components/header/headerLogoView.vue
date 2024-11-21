<template>
	<div id="top-menu">
		<div class="menu-bar">
			<!-- TODO:[-] 22-02-24 curd 栏新的样式1 -->
		</div>
		<div class="top-logo">
			<div class="logos">
				<div class="logo">
					<img src="../../assets/nmefclog.png" />
				</div>
				<div class="logo loop">
					<img src="/static/icons/ocean_flow/of_earth_bold.png" />
					<div class="flash"></div>
				</div>
			</div>

			<div class="title">
				<h2>{{ title }}</h2>
			</div>
		</div>
	</div>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
@Component({})
export default class HeaderLogoView extends Vue {
	@Prop({ default: '风暴潮', type: String })
	title
}
</script>
<style scoped lang="less">
#top-menu {
	display: flex;
	flex-direction: column;
	z-index: 1500;
	flex-direction: row;
	flex-direction: row;
	justify-content: flex-start;
	align-items: center;
	// padding: 5px;
	.menu-icon {
		margin: 2px;
	}
	.menu-title {
		margin: 2px;
		color: white;
		font-weight: 700 !important;
	}
	.menu-bar {
		// width: 1200px;
		backdrop-filter: blur(4px);
		background: linear-gradient(
			to right,
			#34495e 40%,
			rgba(74, 145, 148, 0.726),
			rgba(77, 142, 124, 0.739)
		);
		box-shadow: 2px 5px 15px 0px black;
		.el-menu {
			// background: #115368ef;
			// 去掉element ui 导航栏的底部的bottom的dash边框
			border-bottom: 0px;

			// background-color: '#283958' !important;
		}
		ul.el-menu-demo.el-menu--horizontal.el-menu {
			width: 360px;
		}
	}
	// 顶部的带logo的父级div
	.top-logo {
		position: absolute;
		top: 10px;
		left: 50px;
		// background: red;
		display: flex;
		color: white;
		.logos {
			display: flex;
		}
		.logo {
			margin-left: 10px;
			margin-right: 10px;
			border-radius: 50%;
			height: 47px;
			width: 47px;
			box-shadow: 3px 3px 7px 0px black;
			img {
				height: 60px;
				padding: -5px;
				margin: -6px;
			}
		}
		.title {
			display: flex;
			flex-direction: column;
			align-content: baseline;
			justify-content: center; // 22-03-31 标题纵向居中
			h2 {
				font-family: Arial, Helvetica, sans-serif;
				text-shadow: 2px 2px 10px #000;
				display: flex;
				font-size: 1.5rem;
				margin: 0px;
				line-height: 1.1;
				margin-bottom: 5px;
			}
			img {
				height: 20px;
			}
			h4 {
				font-size: medium;
				font-family: Arial, Helvetica, sans-serif;
				text-shadow: 2px 2px 10px #000;
				// font-size: 1.3rem;
				margin: 0px;
				line-height: 1.5;
				display: flex;
				// flex-direction: column;
				justify-content: center;
				// + 22-01-10 修改后改为 主标题与副标题均为横置
				align-items: center;
				height: 30px;
				flex-direction: row;
			}
			h3 {
				background: linear-gradient(
					to right,
					rgb(255, 255, 217),
					rgb(237, 248, 177),
					rgb(199, 233, 180),
					rgb(127, 205, 187),
					rgb(65, 182, 196),
					rgb(29, 145, 192),
					rgb(34, 94, 168)
				);
				-webkit-text-fill-color: transparent;
				-webkit-background-clip: text;
				font-weight: 600;
				text-shadow: 4px 3px 19px #7c7c739e;
				font-size: 1.5rem;
			}
			span {
				font-size: 0.7rem;
			}
		}
	}
}
.loop {
	position: relative;
	img {
		position: absolute;
		left: 0px;
		height: 55px !important;
	}
}
.flash {
	width: 48px;
	height: 48px;
	position: absolute;
	// color: red;
	// background: red;
	border-radius: 50%;
	animation: light 2.5s linear;
	-webkit-animation: light 2.5s linear;
	animation-iteration-count: infinite;
	-webkit-animation-iteration-count: infinite;
}
@keyframes light {
	0% {
		box-shadow: 0px 0px 4px #00968798;
	}
	50% {
		box-shadow: 0px 0px 16px #00968798;
	}
	100% {
		box-shadow: 0px 0px 4px #00968798;
	}
	// from {
	//     box-shadow: 0px 0px 4px #00968798;
	// }
	// to {
	//     box-shadow: 0px 0px 16px #00968798;
	// }
}
</style>
