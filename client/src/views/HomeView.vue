<template>
	<div class="home">
		<div class="layout-top">
			<div class="layout-left">
				<div
					id="cesiumContainer"
					ref="cesiumContainer"
					style="width: 100%; height: 100%; overflow: hidden"
				></div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import 'cesium/Build/Cesium/Widgets/widgets.css'
import { Component, Vue, Watch } from 'vue-property-decorator'
import { Getter, Mutation, State, namespace } from 'vuex-class'

import * as Cesium from 'cesium'
import { CESIUM_TOKEN } from '@/privacy/_keys'
import WaterPolygon from '@/plugins/waterPolygon'
import { filterSurgeColorScales } from '@/util/filter'

@Component({})
export default class HomeView extends Vue {
	/** cesium token */
	private cesiumToken = CESIUM_TOKEN
	name: 'CesiumViewer'
	loadUrl = 'http://128.5.9.79:82/images/GLOBAL/TEST/zmax_center.json'
	mounted() {
		Cesium.Ion.defaultAccessToken = CESIUM_TOKEN

		let viewer: Cesium.Viewer = new Cesium.Viewer('cesiumContainer')

		/**
		 * step1: 加载地形
		 * step2: 加载地形
		 * step3: 加载淹没栅格图层(线性色标渲染)
		 */

		// + 加载建筑物
		this.loadBuildings(viewer).then(() => {
			// + 加载地形
			this.loadTerrain(viewer)
			// this.loadGeoJson2Map(viewer, this.loadUrl)
			this.loadGeoJSON2MapbyColorScale(viewer, this.loadUrl, '_最大淹没深度(cm)', false)
			// this.loadGeoJson2MapbyWater(viewer, this.loadUrl)
			// this.loadGeoJson2MapbyWaterPolygon(viewer, this.loadUrl)
		})
	}

	/** 根据geojson加载多边形 */
	loadGeoJson2Map(viewer: Cesium.Viewer, url: string): void {
		Cesium.GeoJsonDataSource.load(url, {
			clampToGround: true,
			markerSymbol: '?', // 适用于点数据的符号
			markerColor: Cesium.Color.RED, // 点数据的颜色
			stroke: Cesium.Color.YELLOW, // 线数据的颜色
			fill: Cesium.Color.BLUE.withAlpha(0.5), // 面数据的填充颜色
			strokeWidth: 2, // 线宽
		})
			.then(function (dataSource) {
				viewer.dataSources.add(dataSource)
				viewer.zoomTo(dataSource)
			})
			.catch(function (error) {
				console.error('Error loading GeoJSON:', error)
			})
	}

	/** 按照属性名称加载对应的geojson并使用线性色标渲染 */
	loadGeoJSON2MapbyColorScale(
		viewer: Cesium.Viewer,
		url: string,
		propertyName: string,
		outline = true
	): void {
		// 加载 GeoJSON 数据
		Cesium.GeoJsonDataSource.load(url)
			.then(function (dataSource) {
				viewer.dataSources.add(dataSource)

				// 获取所有实体
				const entities = dataSource.entities.values

				// 遍历每个实体
				for (let i = 0; i < entities.length; i++) {
					const entity = entities[i]

					// 假设 GeoJSON 数据中有一个属性叫做 'property'，根据其值设置颜色
					const propertyValue = entity.properties[propertyName].getValue()

					// 根据属性值设置颜色
					let color: Cesium.Color = null
					let colorStr: string = filterSurgeColorScales(propertyValue)
					color = Cesium.Color.fromCssColorString(colorStr)
					// 为实体设置材质颜色
					if (entity != null && entity.polygon) {
						try {
							// Error loading GeoJSON: TypeError: Cannot read properties of null (reading 'withAlpha')
							//@ts-ignore
							entity.polygon.material = color.withAlpha(0.6) // 设置颜色和透明度
							if (!outline) {
								entity.polygon.outline = undefined
							}
						} catch (error) {
							console.error(`${error.message}}`)
						}
					}
				}

				// 缩放到数据范围
				viewer.zoomTo(dataSource)
			})
			.catch(function (error) {
				console.error('Error loading GeoJSON:', error)
			})
	}

	/**@deprecated
	 * 加载自定义水纹理 */
	loadGeoJson2MapbyWater(viewer: Cesium.Viewer, url: string): void {
		// 加载 GeoJSON 数据
		Cesium.GeoJsonDataSource.load(url).then(function (dataSource) {
			viewer.dataSources.add(dataSource)

			// 遍历每个实体，并应用水面效果
			const entities = dataSource.entities.values
			for (let i = 0; i < entities.length; i++) {
				const entity = entities[i]
				entity.polygon.material = new Cesium.ImageMaterialProperty({
					image: 'path/to/water-texture.png', // 使用水纹理图片
					transparent: true,
					repeat: new Cesium.Cartesian2(10, 10), // 设置重复，使纹理更自然
				})
			}

			viewer.zoomTo(dataSource)
		})
	}

	/** 根据geojson加载水的效果 */
	loadGeoJson2MapbyWaterPolygon(viewer: Cesium.Viewer, url: string): void {
		Cesium.GeoJsonDataSource.load(url).then((dataSource) => {
			let polygon = new WaterPolygon({
				geoJson: dataSource,
				waterColor: 'rgb(80, 131, 179)',
				alpha: 0.7,
			})
			viewer.scene.primitives.add(polygon.primitive)
		})
	}

	/** 加载地形数据 */
	loadTerrain(viewer: Cesium.Viewer): void {
		// 叠加地物效果
		const cesium_terrain = Cesium.Terrain.fromWorldTerrain({
			requestWaterMask: true, // 请求水体效果所需要的海岸线数据
			requestVertexNormals: true, // 请求地形照明数据
		})
		viewer.scene.globe.enableLighting = true
		viewer.scene.setTerrain(cesium_terrain)
	}

	/** 加载建筑物 */
	async loadBuildings(viewer: Cesium.Viewer): Promise<void> {
		const buildingsTileset = await Cesium.createOsmBuildingsAsync()
		viewer.scene.primitives.add(buildingsTileset)
	}
}
</script>

<style scoped lang="less">
@import '../styles/base';
.home {
	@center();
	flex-direction: column;
	.layout-top {
		height: 100%;
		// background: green;
		display: flex;
		flex-direction: row;
		.layout-left {
			margin: 5px;
			background: #34495e;
			border-radius: 8px;
			box-shadow: 0 0 10px 0px black;
		}
		.layout-right {
			margin-top: 5px;
			width: 100%;
			background: #34495e;
			border-radius: 8px;
			margin-right: 5px;
			margin-bottom: 5px;
			box-shadow: 0 0 10px 0px black;
			// 防止地图溢出
			overflow: hidden;
		}
	}
	.layout-bottom {
		height: 50px;
		// TODO:[-] 22-10-17 win 系统中的浏览器会出现垂直和水平的滚动条
		// width: 100%;
		background: #34495e;
		border-radius: 8px;
		margin: 5px;
		box-shadow: 0 0 10px 0px black;
		display: flex;
		align-content: center;
		justify-content: center;
	}
}
.test {
	background: rgb(80, 131, 179);
}
</style>
