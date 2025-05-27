// pages/log/log.js
const app = getApp()

Page({
  data: {
    loading: false,
    activeTab: 'user', // 'user' 或 'device'
    
    // 日志数据
    userLogs: [],
    deviceLogs: [],
    filteredLogs: [],
    
    // 筛选条件
    searchKeyword: '',
    filterDate: '',
    selectedLogLevel: { value: '', label: '所有级别' },
    logLevels: [
      { value: '', label: '所有级别' },
      { value: 'info', label: '信息' },
      { value: 'warning', label: '警告' },
      { value: 'error', label: '错误' },
      { value: 'debug', label: '调试' }
    ],
    
    // 统计数据
    totalLogs: 0,
    errorLogs: 0,
    warningLogs: 0,
    infoLogs: 0,
    userLogCount: 0,
    deviceLogCount: 0,
    
    // 分页
    currentPage: 1,
    pageSize: 20,
    hasMore: true,
    
    // 详情弹窗
    showLogDetail: false,
    selectedLog: null
  },

  onLoad() {
    this.checkLoginAndLoadLogs()
  },

  onShow() {
    this.checkLoginAndLoadLogs()
  },

  // 检查登录状态并加载日志
  checkLoginAndLoadLogs() {
    if (!app.globalData.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再查看日志信息',
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
    this.loadLogs()
  },

  // 切换日志类型标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ 
      activeTab: tab,
      currentPage: 1
    })
    this.loadLogs()
  },

  // 加载日志数据
  loadLogs(append = false) {
    if (!append) {
      this.setData({ 
        loading: true,
        currentPage: 1 
      })
    }

    const url = this.data.activeTab === 'user' ? '/logs/my_logs/' : '/logs/device/'
    
    app.request({
      url: url,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          const logs = res.data.data || []
          this.processLogData(logs, append)
        } else {
          console.log('加载日志失败', res.data)
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

  // 处理日志数据
  processLogData(logs, append = false) {
    const processedLogs = logs.map(log => ({
      ...log,
      formattedTime: this.formatTime(log.timestamp || log.createdAt),
      levelText: this.getLevelText(log.level)
    }))

    const targetLogs = this.data.activeTab === 'user' ? 'userLogs' : 'deviceLogs'
    const currentLogs = append ? this.data[targetLogs] : []
    const newLogs = append ? [...currentLogs, ...processedLogs] : processedLogs

    this.setData({
      [targetLogs]: newLogs,
      hasMore: logs.length >= this.data.pageSize
    })

    this.updateStatistics()
    this.applyFilters()
  },

  // 显示模拟数据
  showMockData(append = false) {
    const mockUserLogs = [
      {
        id: 1,
        level: 'info',
        message: '用户登录成功',
        source: '微信小程序',
        ip: '192.168.1.100',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        userId: 'user123',
        details: '用户通过微信授权方式登录'
      },
      {
        id: 2,
        level: 'warning',
        message: '修改个人信息',
        source: '个人中心',
        ip: '192.168.1.100',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        userId: 'user123',
        details: '用户更新了头像和昵称'
      },
      {
        id: 3,
        level: 'error',
        message: '绑定设备失败',
        source: '设备管理',
        ip: '192.168.1.100',
        timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        userId: 'user123',
        details: '设备ID不存在或已被其他用户绑定'
      }
    ]

    const mockDeviceLogs = [
      {
        id: 1,
        level: 'info',
        action: '设备上线',
        deviceName: '客厅温度传感器',
        deviceId: 'device001',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        details: '设备成功连接到网络'
      },
      {
        id: 2,
        level: 'warning',
        action: '数据异常',
        deviceName: '厨房烟雾报警器',
        deviceId: 'device002',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        details: '检测到烟雾浓度超出正常范围'
      },
      {
        id: 3,
        level: 'error',
        action: '设备离线',
        deviceName: '卧室智能灯',
        deviceId: 'device003',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        details: '设备连续5分钟未响应，判定为离线'
      },
      {
        id: 4,
        level: 'info',
        action: '数据上报',
        deviceName: '客厅光照传感器',
        deviceId: 'device004',
        timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        details: '上报光照强度数据: 350 lux'
      }
    ]

    const mockData = this.data.activeTab === 'user' ? mockUserLogs : mockDeviceLogs
    this.processLogData(mockData, append)
  },

  // 更新统计数据
  updateStatistics() {
    const allLogs = [...this.data.userLogs, ...this.data.deviceLogs]
    
    const errorLogs = allLogs.filter(log => log.level === 'error').length
    const warningLogs = allLogs.filter(log => log.level === 'warning').length
    const infoLogs = allLogs.filter(log => log.level === 'info').length

    this.setData({
      totalLogs: allLogs.length,
      errorLogs: errorLogs,
      warningLogs: warningLogs,
      infoLogs: infoLogs,
      userLogCount: this.data.userLogs.length,
      deviceLogCount: this.data.deviceLogs.length
    })
  },

  // 应用筛选条件
  applyFilters() {
    const currentLogs = this.data.activeTab === 'user' ? this.data.userLogs : this.data.deviceLogs
    let filtered = [...currentLogs]

    // 级别筛选
    if (this.data.selectedLogLevel.value) {
      filtered = filtered.filter(log => log.level === this.data.selectedLogLevel.value)
    }

    // 日期筛选
    if (this.data.filterDate) {
      filtered = filtered.filter(log => {
        const logDate = new Date(log.timestamp).toDateString()
        const filterDate = new Date(this.data.filterDate).toDateString()
        return logDate === filterDate
      })
    }

    // 关键词搜索
    if (this.data.searchKeyword) {
      const keyword = this.data.searchKeyword.toLowerCase()
      filtered = filtered.filter(log => {
        return (log.message && log.message.toLowerCase().includes(keyword)) ||
               (log.action && log.action.toLowerCase().includes(keyword)) ||
               (log.source && log.source.toLowerCase().includes(keyword)) ||
               (log.deviceName && log.deviceName.toLowerCase().includes(keyword)) ||
               (log.details && log.details.toLowerCase().includes(keyword))
      })
    }

    this.setData({ filteredLogs: filtered })
  },

  // 日志级别选择
  onLogLevelChange(e) {
    const index = e.detail.value
    this.setData({ selectedLogLevel: this.data.logLevels[index] })
    this.applyFilters()
  },

  // 日期选择
  onDateChange(e) {
    this.setData({ filterDate: e.detail.value })
    this.applyFilters()
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
    this.applyFilters()
  },

  // 查看日志详情
  viewLogDetail(e) {
    const log = e.currentTarget.dataset.log
    this.setData({
      selectedLog: log,
      showLogDetail: true
    })
  },

  // 隐藏日志详情
  hideLogDetail() {
    this.setData({
      showLogDetail: false,
      selectedLog: null
    })
  },

  // 加载更多日志
  loadMoreLogs() {
    if (!this.data.hasMore || this.data.loading) return
    
    this.setData({
      currentPage: this.data.currentPage + 1
    })
    this.loadLogs(true)
  },

  // 获取级别文本
  getLevelText(level) {
    const levelMap = {
      'info': '信息',
      'warning': '警告',
      'error': '错误',
      'debug': '调试'
    }
    return levelMap[level] || '未知'
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
    this.loadLogs()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  // 上拉加载更多
  onReachBottom() {
    this.loadMoreLogs()
  }
}) 