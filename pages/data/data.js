const app = getApp()

Page({
  data: {
    loading: false,
    dataList: [],
    filteredData: [],
    searchKeyword: '',
    
    // 时间筛选
    startDate: '',
    endDate: '',
    activeQuickFilter: '',
    
    // 统计数据
    totalRecords: 0,
    todayRecords: 0,
    activeDevices: 0,
    
    // 分页
    currentPage: 1,
    pageSize: 20,
    hasMore: true,
    
    // 详情弹窗
    showDataDetail: false,
    selectedData: null
  },

  onLoad() {
    this.checkLoginAndLoadData()
    this.initDefaultDate()
  },

  onShow() {
    this.checkLoginAndLoadData()
  },

  // 检查登录状态并加载数据
  checkLoginAndLoadData() {
    if (!app.globalData.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再查看数据信息',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({
              url: '/pages/profile/profile'
            })
          }
        }
      })
      return
    }
    this.loadData()
  },

  // 初始化默认日期（最近7天）
  initDefaultDate() {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 7)
    
    this.setData({
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate),
      activeQuickFilter: 'week'
    })
  },

  // 加载数据
  loadData(append = false) {
    if (!append) {
      this.setData({ 
        loading: true,
        currentPage: 1 
      })
    }

    const params = this.buildApiParams()
    
    app.request({
      url: `/data/my_data/${params}`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          const newData = res.data.data || []
          this.processDataList(newData, append)
          this.updateStatistics(newData)
        } else {
          console.log('加载数据失败', res.data)
          this.showMockData(append)
        }
      },
      fail: () => {
        console.log('网络请求失败，使用模拟数据')
        this.showMockData(append)
      },
      complete: () => {
        this.setData({ loading: false })
      }
    })
  },

  // 构建API参数
  buildApiParams() {
    let params = '?'
    if (this.data.startDate) {
      params += `after=${this.data.startDate}&`
    }
    if (this.data.endDate) {
      params += `before=${this.data.endDate}&`
    }
    params += `page=${this.data.currentPage}&limit=${this.data.pageSize}`
    return params
  },

  // 处理数据列表
  processDataList(newData, append = false) {
    const processedData = newData.map(item => ({
      ...item,
      formattedTime: this.formatTime(item.timestamp || item.createdAt),
      statusText: this.getStatusText(item.status),
      valueLabel: this.getValueLabel(item.dataType)
    }))

    const dataList = append ? [...this.data.dataList, ...processedData] : processedData
    
    this.setData({
      dataList: dataList,
      filteredData: dataList,
      hasMore: newData.length >= this.data.pageSize
    })

    // 应用搜索过滤
    if (this.data.searchKeyword) {
      this.filterData(this.data.searchKeyword)
    }
  },

  // 显示模拟数据
  showMockData(append = false) {
    const mockData = [
      {
        id: 1,
        deviceName: '客厅温度传感器',
        dataType: 'temperature',
        value: 23.5,
        unit: '°C',
        status: 'normal',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30分钟前
        metadata: 'Location: 客厅'
      },
      {
        id: 2,
        deviceName: '卧室湿度传感器',
        dataType: 'humidity',
        value: 65,
        unit: '%',
        status: 'normal',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1小时前
        metadata: 'Location: 卧室'
      },
      {
        id: 3,
        deviceName: '厨房烟雾报警器',
        dataType: 'smoke',
        value: 0.02,
        unit: 'ppm',
        status: 'warning',
        timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5小时前
        metadata: 'Location: 厨房, Alert: Low'
      },
      {
        id: 4,
        deviceName: '门锁传感器',
        dataType: 'security',
        value: 1,
        unit: '',
        status: 'normal',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2小时前
        metadata: 'Status: Locked'
      },
      {
        id: 5,
        deviceName: '客厅光照传感器',
        dataType: 'light',
        value: 350,
        unit: 'lux',
        status: 'normal',
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3小时前
        metadata: 'Location: 客厅'
      }
    ]
    
    this.processDataList(mockData, append)
    this.updateStatistics(mockData)
  },

  // 更新统计数据
  updateStatistics(data) {
    const today = new Date().toDateString()
    const todayRecords = data.filter(item => {
      const itemDate = new Date(item.timestamp || item.createdAt).toDateString()
      return itemDate === today
    }).length

    const deviceNames = [...new Set(data.map(item => item.deviceName))]
    
    this.setData({
      totalRecords: this.data.dataList.length,
      todayRecords: todayRecords,
      activeDevices: deviceNames.length
    })
  },

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      'normal': '正常',
      'warning': '警告',
      'error': '错误',
      'offline': '离线'
    }
    return statusMap[status] || '未知'
  },

  // 获取数值标签
  getValueLabel(dataType) {
    const labelMap = {
      'temperature': '温度',
      'humidity': '湿度',
      'smoke': '烟雾浓度',
      'security': '安全状态',
      'light': '光照强度',
      'pressure': '压力',
      'motion': '运动检测'
    }
    return labelMap[dataType] || '数值'
  },

  // 开始日期变化
  onStartDateChange(e) {
    this.setData({ 
      startDate: e.detail.value,
      activeQuickFilter: '' 
    })
    this.loadData()
  },

  // 结束日期变化
  onEndDateChange(e) {
    this.setData({ 
      endDate: e.detail.value,
      activeQuickFilter: '' 
    })
    this.loadData()
  },

  // 快速筛选
  setQuickFilter(e) {
    const type = e.currentTarget.dataset.type
    const endDate = new Date()
    let startDate = new Date()

    switch (type) {
      case 'today':
        startDate = new Date()
        break
      case 'week':
        startDate.setDate(endDate.getDate() - 7)
        break
      case 'month':
        startDate.setDate(endDate.getDate() - 30)
        break
    }

    this.setData({
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate),
      activeQuickFilter: type
    })
    this.loadData()
  },

  // 重置筛选
  resetFilter() {
    this.setData({
      startDate: '',
      endDate: '',
      activeQuickFilter: '',
      searchKeyword: ''
    })
    this.loadData()
  },

  // 搜索输入处理
  onSearchInput(e) {
    const keyword = e.detail.value.toLowerCase()
    this.setData({ searchKeyword: keyword })
    this.filterData(keyword)
  },

  // 过滤数据
  filterData(keyword) {
    if (!keyword) {
      this.setData({ filteredData: this.data.dataList })
      return
    }

    const filtered = this.data.dataList.filter(item => {
      return (item.deviceName && item.deviceName.toLowerCase().includes(keyword)) ||
             (item.dataType && item.dataType.toLowerCase().includes(keyword)) ||
             (item.value && item.value.toString().includes(keyword)) ||
             (item.metadata && item.metadata.toLowerCase().includes(keyword))
    })
    
    this.setData({ filteredData: filtered })
  },

  // 查看数据详情
  viewDataDetail(e) {
    const item = e.currentTarget.dataset.item
    this.setData({
      selectedData: item,
      showDataDetail: true
    })
  },

  // 隐藏数据详情
  hideDataDetail() {
    this.setData({
      showDataDetail: false,
      selectedData: null
    })
  },

  // 导出数据
  exportData() {
    wx.showToast({
      title: '导出功能开发中',
      icon: 'none'
    })
  },

  // 加载更多数据
  loadMoreData() {
    if (!this.data.hasMore || this.data.loading) return
    
    this.setData({
      currentPage: this.data.currentPage + 1
    })
    this.loadData(true)
  },

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  // 格式化时间
  formatTime(timestamp) {
    if (!timestamp) return '未知时间'
    
    try {
      const date = new Date(timestamp)
      const now = new Date()
      const diff = now - date

      if (diff < 60000) { // 1分钟内
        return '刚刚'
      } else if (diff < 3600000) { // 1小时内
        return `${Math.floor(diff / 60000)}分钟前`
      } else if (diff < 86400000) { // 24小时内
        return `${Math.floor(diff / 3600000)}小时前`
      } else {
        return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      }
    } catch (e) {
      return timestamp.toString()
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadData()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  // 上拉加载更多
  onReachBottom() {
    this.loadMoreData()
  }
}) 