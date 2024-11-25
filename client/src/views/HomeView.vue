<template>
	<div class="home" v-loading="loading" element-loading-background="rgba(28, 34, 52, 0.733)">
		<HeaderLogoView title="三门风暴潮漫滩预报系统"></HeaderLogoView>
		<div class="layout-top">
			<div
				class="main-map"
				id="cesiumContainer"
				ref="cesiumContainer"
				style="overflow: hidden"
			></div>
		</div>
		<div class="layout-bottom">
			<NavMenuView></NavMenuView>
		</div>
		<!-- <div class="layout-bottom">
			<div class="nav_item_timebar">
				<el-tooltip class="item" effect="dark" content="预报区域" placement="top">
					<div class="timebar_child">
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
					</div>
				</el-tooltip>
			</div>
			<div>
				<el-button type="primary" @click="perloadGeoJson">预加载</el-button>
				<el-button type="primary" @click="batchLoadPolygon2Map">预加载</el-button>
				<el-button type="primary" @click="submitTargetUrlDataSource">加载</el-button>
				<el-button type="danger" @click="clearAllDataSource">清除datasource</el-button>
				<el-button type="danger" @click="clearAllDataSource">扩展多边形</el-button>
			</div>
		</div> -->
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
import NavMenuView from '@/components/subNav/NavMenuView.vue'
import HeaderLogoView from '@/components/header/headerLogoView.vue'

// 引入事件总线
import { EventBus } from '@/bus/BUS'
import { TO_LOAD_DATASROUCE } from '@/bus/types'
import { GET_FloodLevelType, GET_RASTER_SHOW_TYPE } from '@/store/types'
import { FloodLevelType, RasterShowType } from '@/enum/selections'

@Component({ components: { NavMenuView, HeaderLogoView } })
export default class HomeView extends Vue {
	/** cesium token */
	private cesiumToken = CESIUM_TOKEN
	name: 'CesiumViewer'
	loading = false

	waterLevelOptions: { key: string; val: string }[] = [
		{
			key: 'lte150',
			val: '大于150',
		},
		{
			key: 'lte100',
			val: '大于100',
		},
	]

	waterLevelKey = 'lte100'
	// loadUrl = 'http://128.5.9.79:82/images/GLOBAL/TEST/zmax_center.json'
	// loadUrl = 'http://localhost:82/images/global_surge/coastal_data/zmax_lte_100_new.json'
	// loadUrl = 'http://localhost:82/images/global_surge/coastal_data/zmax_lte_desc_100_1114.json'

	// loadUrl =
	// 	'http://localhost:82/images/global_surge/coastal_data/zmax_lte_desc_smooth_100_b_10_1114.json'

	// loadUrl =
	// 	'http://localhost:82/images/global_surge/coastal_data/zmax_lte_desc_smooth_100_b_20_1114.json'
	/** 加载栅格图层的url */
	loadRasterUrl = 'http://128.5.9.79:82/images/GLOBAL/TEST/zmax_center.json'

	loadUrl = 'http://128.5.9.79:82/images/GLOBAL/TEST/zmax_lte_desc_smooth_100_b_50_1114.json'

	currentWaterLevelRasterUrl =
		'http://localhost:82/images/global_surge/coastal_data/zmax_lte_100.json'

	// loadUrl = 'http://localhost:82/images/global_surge/coastal_data/zmax_lte_desc_smooth_100_b_50_1114.json'

	/** 设置的动态水位 */
	waterLevel = 0
	dataSource = null
	viewer: Cesium.Viewer = null
	currentHeight = 0
	targetHeight = 10
	interval = 3000 // 3 seconds
	dataSources: Cesium.GeoJsonDataSource[] = []

	/** 当前加载的预报区域范围 */
	areaBox: Cesium.Rectangle = new Cesium.Rectangle(
		Cesium.Math.toRadians(121.4),
		Cesium.Math.toRadians(28.8),
		Cesium.Math.toRadians(121.8),
		Cesium.Math.toRadians(29.2)
	)

	areaBoxPositions: Cesium.Cartesian3[] = [
		Cesium.Cartesian3.fromDegrees(121.4, 28.8, 0), // 顶点1
		Cesium.Cartesian3.fromDegrees(121.8, 28.8, 0), // 顶点2
		Cesium.Cartesian3.fromDegrees(121.8, 29.2, 0), // 顶点3
		Cesium.Cartesian3.fromDegrees(121.4, 29.2, 0), // 顶点4
		Cesium.Cartesian3.fromDegrees(121.4, 28.8, 0), // 回到顶点1，闭合四边形
	]
	// TODO:[-] 24-11-15 B 20 大于 150cm
	// loadUrl =
	// 	'http://localhost:82/images/global_surge/coastal_data/zmax_lte_desc_lte_150_smooth_100_b_20.json'
	mounted() {
		/** 定义全局方法 */
		//@ts-ignore
		this.$root.$options.initLoadDataSource = this.initLoadDataSource

		EventBus.$on(TO_LOAD_DATASROUCE, this.initLoadDataSource)

		Cesium.Ion.defaultAccessToken = CESIUM_TOKEN

		let viewer: Cesium.Viewer = new Cesium.Viewer('cesiumContainer', {
			timeline: false, // 取消底部时间栏
			animation: false, // 取消动画控制器
			fullscreenButton: false, // 取消全屏按钮
			creditContainer: null, // 不显示版权信息
			// showCreditsOnScreen: false, // 取消屏幕上的版权信息
		})
		// 设置恒定的环境光
		// viewer.scene.light = new Cesium.DirectionalLight({
		// 	direction: new Cesium.Cartesian3(0.0, 0.0, -1.0),
		// 	color: new Cesium.Color(1.0, 1.0, 1.0, 1.0),
		// })
		this.viewer = viewer
		// 定义目标位置的经纬度和高度
		const destination = Cesium.Cartesian3.fromDegrees(121.624, 28.99, 13000)
		this.initForecastArea(viewer, this.areaBoxPositions)
		// 使用 setView 方法
		viewer.camera.setView({
			destination: destination,
			orientation: {
				heading: Cesium.Math.toRadians(360.0), // 朝向角度
				pitch: Cesium.Math.toRadians(-60.0), // 俯仰角度
				roll: 0.0, // 滚动角度
			},
		})

		/**
		 * step1: 加载地形
		 * step2: 加载地形
		 * step3: 加载淹没栅格图层(线性色标渲染)
		 */

		// + 加载建筑物
		this.loadBuildings(this.viewer).then(() => {
			// + 加载地形
			this.loadTerrain(this.viewer)
			// this.loadGeoJson2Map(viewer, this.loadUrl)

			// this.loadGeoJson2MapbyGroundPrimitive(viewer, this.loadUrl)
			// this.loadGeoJsonMultiLine2Map(viewer, this.loadUrl)
			// this.loadGeoJSON2MapbyColorScale(viewer, this.loadRasterUrl, '_最大淹没深度(cm)', false)
			// this.loadGeoJson2MapbyWater(viewer, this.loadUrl)
			// this.loadGeoJson2MapbyWaterPolygon(viewer, this.loadUrl)
			// this.loadGeoJson2MapbyCube(viewer, this.loadRasterUrl, '_最大淹没深度(cm)', false)
			// this.loadWaterFlood(viewer, this.loadUrl)
			// this.loadGeoJson2Map(viewer, this.loadUrl)
			// this.loadGeoJson2MapbyTransition(this.viewer, this.loadUrl)

			// ---
			// 24-11-19 加入多个淹没范围的动态范围多边形动画效果
			// const lte150Url =
			// 	'http://localhost:82/images/global_surge/coastal_data/zmax_lte_desc_lte_100_smooth_100_b_20.json'
			// const lte100Url =
			// 	'http://localhost:82/images/global_surge/coastal_data/zmax_lte_desc_lte_150_smooth_100_b_20.json'
			// this.loadGeoJson2MapbyTransition(this.viewer, lte100Url, lte150Url)
		})
	}

	beforeDestroy() {
		EventBus.$off(TO_LOAD_DATASROUCE, this.initLoadDataSource)
	}

	/** 以线段的形式显示预报范围 */
	initForecastArea(viewer: Cesium.Viewer, areaBox: Cesium.Cartesian3[]): void {
		// 创建条纹材质，试图模拟中间透明，边缘渐变
		var stripeMaterial = new Cesium.StripeMaterialProperty({
			evenColor: Cesium.Color.TRANSPARENT, // 中间透明
			oddColor: Cesium.Color.RED.withAlpha(0.5), // 边缘颜色
			repeat: 20, // 重复次数，增加以细化效果
			orientation: Cesium.StripeOrientation.HORIZONTAL, // 条纹方向
		})

		// Cesium.Color.fromCssColorString('rgb(157, 193, 228)')
		// 方式1:覆盖多边形，会遮盖地物
		// viewer.entities.add({
		// 	rectangle: {
		// 		coordinates: this.areaBox,
		// 		material: stripeMaterial, // 半透明红色填充
		// 		outline: true, // 是否显示边框
		// 		outlineColor: Cesium.Color.BLACK, // 边框颜色
		// 		outlineWidth: 4,
		// 	},
		// })

		/**
		 * 线段样式参考:
		 * https://www.cnblogs.com/huqi-code/p/8378238.html
		 */

		var entity = viewer.entities.add({
			polyline: {
				positions: this.areaBoxPositions,
				width: 5,
				material: new Cesium.PolylineGlowMaterialProperty({
					glowPower: 0.2, // 发光强度
					color: Cesium.Color.fromCssColorString('rgb(26, 245, 245)'), // 线的颜色
				}),
				clampToGround: true, // 贴服地形
			},
		})
		viewer.zoomTo(entity)
	}

	clearAllDataSource() {
		if (this.viewer != null && this.viewer.dataSources != null) {
			this.viewer.dataSources.removeAll()
		}
	}

	submitTargetUrlDataSource() {
		this.clearAllDataSource()
		this.loadGeoJSON2MapbyColorScale(
			this.viewer,
			this.currentWaterLevelRasterUrl,
			'_最大淹没深度(cm)'
		)
	}

	@Watch('waterLevelKey')
	onWaterLevelKeyChanged(val: string) {
		let url = ''
		switch (val) {
			case 'lte150':
				url =
					'http://localhost:82/images/global_surge/coastal_data/zmax_output_lte_150.json'
				break
			case 'lte100':
				url =
					'http://localhost:82/images/global_surge/coastal_data/zmax_output_lte_100.json'
				break

			default:
				break
		}
		this.currentWaterLevelRasterUrl = url
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

	/** TODO:[-] 24-11-19 使用 GroupPrimitive 将多边形与地形进行切割 */
	loadGeoJson2MapbyGroundPrimitive(viewer: Cesium.Viewer, url: string): void {
		Cesium.GeoJsonDataSource.load(url, {
			clampToGround: true,
			// markerSymbol: '?', // 适用于点数据的符号
			// markerColor: Cesium.Color.RED, // 点数据的颜色
			// stroke: Cesium.Color.YELLOW, // 线数据的颜色
			// fill: Cesium.Color.BLUE.withAlpha(0.5), // 面数据的填充颜色
			// strokeWidth: 2, // 线宽
		})
			.then(function (dataSource) {
				viewer.dataSources.add(dataSource)
				viewer.zoomTo(dataSource)
				// 手动创建 GroundPrimitive
				const entities = dataSource.entities.values
				for (let i = 0; i < entities.length; i++) {
					const entity = entities[i]
					const hierarchy = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now())

					viewer.scene.groundPrimitives.add(
						new Cesium.GroundPrimitive({
							geometryInstances: new Cesium.GeometryInstance({
								geometry: new Cesium.PolygonGeometry({
									polygonHierarchy: hierarchy,
									vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
								}),
								attributes: {
									color: Cesium.ColorGeometryInstanceAttribute.fromColor(
										Cesium.Color.RED.withAlpha(0.5)
									),
								},
							}),
						})
					)
				}
			})
			.catch(function (error) {
				console.error('Error loading GeoJSON:', error)
			})
	}

	/** TODO:[-] 24-11-20 根据urls进行预加载 */
	perloadGeoJson(): void {
		const that = this
		const urls: string[] = [
			'http://localhost:82/images/global_surge/coastal_data/zmax_output_lte_150.json',
			'http://localhost:82/images/global_surge/coastal_data/zmax_output_lte_100.json',
		]
		let geoJsonList: Promise<Cesium.GeoJsonDataSource>[] = []
		urls.map((url) => {
			const tempGeoJson: Promise<Cesium.GeoJsonDataSource> =
				Cesium.GeoJsonDataSource.load(url)
			geoJsonList.push(tempGeoJson)
		})

		// 等待geojson加载全部完成
		Promise.all([...geoJsonList]).then((ds) => {
			const listCount: number = ds.length
			that.dataSources = ds
		})
	}

	/** TODO:[-] 24-11-20 将this.dataSources中的多边形以线性色标栅格的方式加载至map中 */
	async batchLoadPolygon2Map(): Promise<void> {
		const propertyName = '_最大淹没深度(cm)'
		const outline = true
		// const count = this.dataSources.length
		const count = 1
		for (let i = 0; i < count; i++) {
			const tempDs = this.dataSources[i]
			this.viewer.dataSources.add(tempDs)

			// 获取所有实体
			const entities = tempDs.entities.values

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
		}
		await this.sleep(3000)
	}

	/** 通过动态过渡的形式加载多边形 */
	loadGeoJson2MapbyTransition(viewer, url1: string, url2: string): void {
		// 加载两个GeoJSON文件
		const geoJson1 = Cesium.GeoJsonDataSource.load(url1)
		const geoJson2 = Cesium.GeoJsonDataSource.load(url2)

		Promise.all([geoJson1, geoJson2])
			.then((dataSources) => {
				const dataSource1 = dataSources[0]
				const dataSource2 = dataSources[1]

				viewer.dataSources.add(dataSource1)
				// viewer.dataSources.add(dataSource2)

				// 提取多边形顶点
				const polygons1 = dataSource1.entities.values.map(
					(entity) => entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions
				)
				const polygons2 = dataSource2.entities.values.map(
					(entity) => entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions
				)

				// 确保两组多边形的数量相同
				const polygonCount = Math.min(polygons1.length, polygons2.length)

				const currentPolygons = new Array(polygonCount).fill(null).map(() => [])

				let t = 0
				const step = 0.01 // 每次更新的步长

				// 插值函数
				function interpolatePositions(pos1, pos2, t) {
					return Cesium.Cartesian3.lerp(pos1, pos2, t, new Cesium.Cartesian3())
				}

				// 匹配顶点数量并进行插值
				function matchAndInterpolateVertices(poly1, poly2, t) {
					const maxLength = Math.max(poly1.length, poly2.length)
					const interpolatedPoly1 = interpolateVertices(poly1, maxLength)
					const interpolatedPoly2 = interpolateVertices(poly2, maxLength)

					return interpolatedPoly1.map((pos, index) =>
						interpolatePositions(pos, interpolatedPoly2[index], t)
					)
				}

				// 插值顶点以匹配目标长度
				function interpolateVertices(vertices, targetLength) {
					const interpolated = []
					const step = vertices.length / targetLength
					for (let i = 0; i < targetLength; i++) {
						const index = i * step
						const lowerIndex = Math.floor(index)
						const upperIndex = Math.ceil(index) % vertices.length

						if (lowerIndex === upperIndex) {
							interpolated.push(vertices[lowerIndex])
						} else {
							const frac = index - lowerIndex
							interpolated.push(
								interpolatePositions(
									vertices[lowerIndex],
									vertices[upperIndex],
									frac
								)
							)
						}
					}
					return interpolated
				}

				// 动画更新函数
				function update() {
					if (t < 1) {
						t += step
						for (let i = 0; i < polygonCount; i++) {
							currentPolygons[i] = matchAndInterpolateVertices(
								polygons1[i],
								polygons2[i],
								t
							)
						}
						requestAnimationFrame(update)
					}
				}

				// 创建动态多边形
				// currentPolygons.forEach((positions, index) => {
				// 	viewer.entities.add({
				// 		polygon: {
				// 			hierarchy: new Cesium.CallbackProperty(() => {
				// 				return new Cesium.PolygonHierarchy(currentPolygons[index])
				// 			}, false),
				// 			material: Cesium.Color.RED.withAlpha(0.5),
				// 		},
				// 	})
				// })

				// // 开始动画
				// update()
			})
			.catch((error) => {
				console.error('Error loading GeoJSON:', error)
			})
	}

	loadGeoJson2MapByExtension(): void {
		const url1 = ''
		const url2 = ''
		const viewer = this.viewer
		// 加载两个GeoJSON文件
		const geoJson1 = Cesium.GeoJsonDataSource.load(url1)
		const geoJson2 = Cesium.GeoJsonDataSource.load(url2)

		Promise.all([geoJson1, geoJson2])
			.then((dataSources) => {
				const dataSource1 = dataSources[0]
				const dataSource2 = dataSources[1]

				viewer.dataSources.add(dataSource1)
				// viewer.dataSources.add(dataSource2)
			})
			.catch((error) => {
				console.error('Error loading GeoJSON:', error)
			})
	}

	updatePolygonHeights(height) {
		if (this.dataSource) {
			const entities = this.dataSource.entities.values
			for (let i = 0; i < entities.length; i++) {
				const entity = entities[i]
				const polygon = entity.polygon
				if (polygon) {
					polygon.extrudedHeight = new Cesium.ConstantProperty(height)
				}
			}
		}
	}
	animateHeight() {
		if (this.currentHeight < this.targetHeight) {
			setTimeout(() => {
				this.currentHeight += 1 // Increase height by 1 each step
				this.animateHeight()
			}, this.interval)
		}
	}

	loadGeoJsonMultiLine2Map(viewer: Cesium.Viewer, url: string): void {
		Cesium.GeoJsonDataSource.load(url, {
			clampToGround: true,
			markerSymbol: '?', // 适用于点数据的符号
			markerColor: Cesium.Color.RED, // 点数据的颜色
			stroke: Cesium.Color.YELLOW, // 线数据的颜色
			fill: Cesium.Color.BLUE.withAlpha(0.5), // 面数据的填充颜色
			strokeWidth: 2, // 线宽
		})
			.then((dataSource) => {
				viewer.dataSources.add(dataSource)

				// 缩放视图以适应加载的 GeoJSON 数据
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
		propertyName: string
		// outline = true
	): void {
		let outline = true
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
			.finally(() => {
				this.loading = false
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

	loadGeoJson2MapbyCube(
		viewer: Cesium.Viewer,
		url: string,
		propertyName: string
		// outline = true
	): void {
		let outline = true
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
						// 获取多边形的中心
						const positions = entity.polygon.hierarchy.getValue(
							Cesium.JulianDate.now()
						).positions
						// 计算多边形的边界框
						const boundingSphere = Cesium.BoundingSphere.fromPoints(positions)
						const center = Cesium.BoundingSphere.fromPoints(positions).center
						const cartographic = Cesium.Cartographic.fromCartesian(center)
						const longitude = cartographic.longitude
						const latitude = cartographic.latitude
						const dimensions = new Cesium.Cartesian3(
							boundingSphere.radius * 1.5, //宽度
							boundingSphere.radius * 1.5, //长度
							(propertyValue / 100) * 50 //高度
						)
						let color: Cesium.Color = null
						let colorStr: string = filterSurgeColorScales(propertyValue)
						// colorStr = 'rgb(80, 131, 179)'
						color = Cesium.Color.fromCssColorString(colorStr)

						// 创建立方体，尺寸与网格大小匹配
						const boxEntity = viewer.entities.add({
							position: Cesium.Cartesian3.fromRadians(
								longitude,
								latitude,
								dimensions.z / 2
							),
							box: {
								dimensions: dimensions, // 使用计算得到的尺寸
								material: color.withAlpha(0.8),
							},
						})
					}
				}

				// 缩放到数据范围
				viewer.zoomTo(dataSource)
			})
			.catch(function (error) {
				console.error('Error loading GeoJSON:', error)
			})
			.finally(() => {
				this.loading = false
			})
	}

	/** 根据geojson加载水的效果 */
	loadGeoJson2MapbyWaterPolygon(viewer: Cesium.Viewer, url: string, propertyName: string): void {
		Cesium.GeoJsonDataSource.load(url)
			.then((dataSource) => {
				let polygon = new WaterPolygon({
					geoJson: dataSource,
					waterColor: 'rgb(80, 131, 179)',
					alpha: 0.7,
					speed: 1.2,
					choppy: 6,
					height: 1,
					freq: 0.5,
				})
				// 缩放到数据范围
				viewer.zoomTo(dataSource)
				viewer.scene.primitives.add(polygon.primitive)
			})
			.finally(() => {
				this.loading = false
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

	loadWaterFlood(viewer: Cesium.Viewer, url: string): void {
		Cesium.GeoJsonDataSource.load(url).then(function (dataSource) {
			viewer.dataSources.add(dataSource)

			// Get the entities (polygons) from the data source
			const entities = dataSource.entities.values

			// Initial height
			let initialHeight = 0

			// Function to update the height of the polygons
			function updateHeight(deltaHeight) {
				for (let i = 0; i < entities.length; i++) {
					const entity = entities[i]
					const polygon = entity.polygon
					if (polygon) {
						// Update the polygon height
						const currentHeight = 0
						polygon.extrudedHeight = currentHeight + deltaHeight
						// console.log(polygon)
					}
				}
			}

			// Simulate water level rise over time
			viewer.clock.onTick.addEventListener(function (clock) {
				updateHeight(0.5) // Adjust the increment value for speed of rising
			})
		})
	}

	@Watch('waterLevel')
	onWaterLevelChanged(val: number) {
		this.updatePolygonHeights(val) //
	}

	/** 加载建筑物 */
	async loadBuildings(viewer: Cesium.Viewer): Promise<void> {
		const buildingsTileset = await Cesium.createOsmBuildingsAsync()
		viewer.scene.primitives.add(buildingsTileset)
	}

	//----- 通用
	sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}

	/** 全局方法: 预加载数据资源 */
	initLoadDataSource(): void {
		const viewer = this.viewer
		/** 此处为预加载数据逻辑 */
		console.log('initLoadDataSource')
		const rasterShowType = this.menuOpts.getRasterShowType
		const floodLevel = this.menuOpts.getFloodLevel
		let filename = ''
		const baseUrl = 'http://localhost:82/images/global_surge/coastal_data'

		this.loading = true
		/**
		 * 1 栅格图层
		 * 2 立方体
		 * 3 多边形范围生成水面
		 */
		switch (floodLevel) {
			case FloodLevelType.LTE100:
				filename = 'zmax_output_lte_100.json'
				break
			case FloodLevelType.LTE150:
				filename = 'zmax_output_lte_150.json'
				break
			default:
				break
		}

		let todoFunc = null
		switch (rasterShowType) {
			case RasterShowType.RASTER:
				todoFunc = this.loadGeoJSON2MapbyColorScale
				break
			case RasterShowType.POLYGON:
				break
			case RasterShowType.POLYGON_CUBE:
				todoFunc = this.loadGeoJson2MapbyCube
				break
			case RasterShowType.WATER_SURFACE:
				filename = 'zmax_lte_desc_smooth_100_b_50_1114.json'
				todoFunc = this.loadGeoJson2MapbyWaterPolygon
				break
			default:
				break
		}
		let url = `${baseUrl}/${filename}`
		todoFunc(viewer, url, '_最大淹没深度(cm)')
	}

	/** 获取栅格图层显示样式 */
	@Getter(GET_RASTER_SHOW_TYPE, { namespace: 'menu' })
	getRasterShowType: RasterShowType

	@Getter(GET_FloodLevelType, { namespace: 'menu' })
	getFloodLevel: FloodLevelType

	get menuOpts(): {
		getRasterShowType: RasterShowType
		getFloodLevel: FloodLevelType
	} {
		const { getRasterShowType, getFloodLevel } = this
		return { getRasterShowType, getFloodLevel }
	}

	@Watch('menuOpts')
	onMenuOpts(val: { getRasterShowType: RasterShowType; getFloodLevel: FloodLevelType }): void {
		console.log(
			`onMenuOpts发生变化,RasterShowType:${val.getRasterShowType},FloodLevelType:${val.getFloodLevel}`
		)
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
		width: 100%;
		// background: green;
		display: flex;
		flex-direction: row;
		.main-map {
			height: 100% !important;
			width: 100% !important;
			background: #34495e;
			border-radius: 8px;
		}
	}
	.layout-bottom {
		height: 50px;
		// TODO:[-] 22-10-17 win 系统中的浏览器会出现垂直和水平的滚动条
		// width: 100%;
		background: #34495e;
		border-radius: 8px;
		margin: 2px;
		box-shadow: 0 0 10px 0px black;
		display: flex;
		align-content: center;
		justify-content: center;

		/** 替换为绝对定位 */
		position: fixed;
		bottom: 10px;
		width: 100%;
		display: flex;
	}
}
.test {
	background: rgb(26, 245, 245);
}
#cesiumContainer {
	flex: 1; /* 占据剩余空间 */
}
</style>
