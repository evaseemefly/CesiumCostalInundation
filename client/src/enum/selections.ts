/**
 * 菜单种类——淹没深度
 *
 * @enum {number}
 */
enum FloodLevelType {
	// 实测
	LTE100 = 10100,
	// 预报
	LTE150 = 10101,
	// 实测加预报
	LTE200 = 10102,
}

/**
 * 栅格显示类型
 */
enum RasterShowType {
	/** 栅格图层 */
	RASTER,
	/** 多边形 */
	POLYGON,
	/**对变形立方体 */
	POLYGON_CUBE,
	/** 水面-波光粼粼 */
	WATER_SURFACE,
	UN_SELECT,
}

export { FloodLevelType, RasterShowType }
