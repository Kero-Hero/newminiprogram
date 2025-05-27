const app = getApp()

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    deviceCount: 0,
    onlineDeviceCount: 0,
    alertCount: 0,
    recentLogs: []
  },

  onLoad() {
    this.checkLoginStatus()
    this.loadData()
  },

  onShow() {
    this.checkLoginStatus()
    this.loadData()
  },

  // 检查登录状态
  checkLoginStatus() {
    this.setData({
      isLoggedIn: app.globalData.isLoggedIn,
      userInfo: app.globalData.userInfo
    })
  },

  // 加载页面数据
  loadData() {
    this.loadSystemOverview()
    this.loadRecentLogs()
  },

  // 加载系统概览数据
  loadSystemOverview() {
    if (!app.globalData.isLoggedIn) {
      return
    }

    app.request({
      url: '/api/overview',
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          this.setData({
            deviceCount: res.data.data.deviceCount || 0,
            onlineDeviceCount: res.data.data.onlineDeviceCount || 0,
            alertCount: res.data.data.alertCount || 0
          })
        }
      },
      fail: () => {
        // 如果请求失败，使用模拟数据
        this.setData({
          deviceCount: 15,
          onlineDeviceCount: 12,
          alertCount: 3
        })
      }
    })
  },

  // 加载最新日志
  loadRecentLogs() {
    if (!app.globalData.isLoggedIn) {
      this.setData({
        recentLogs: []
      })
      return
    }

    app.request({
      url: '/api/logs/recent',
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          const logs = res.data.data.map(log => ({
            ...log,
            levelText: this.getLevelText(log.level)
          }))
          this.setData({
            recentLogs: logs
          })
        }
      },
      fail: () => {
        // 如果请求失败，使用模拟数据
        this.setData({
          recentLogs: [
            {
              id: 1,
              time: '10:30',
              content: '设备001连接成功',
              level: 'info',
              levelText: '信息'
            },
            {
              id: 2,
              time: '10:25',
              content: '设备002温度异常',
              level: 'warning',
              levelText: '警告'
            },
            {
              id: 3,
              time: '10:20',
              content: '数据备份完成',
              level: 'success',
              levelText: '成功'
            }
          ]
        })
      }
    })
  },

  // 获取日志级别文本
  getLevelText(level) {
    const levelMap = {
      'info': '信息',
      'warning': '警告',
      'error': '错误',
      'success': '成功'
    }
    return levelMap[level] || '未知'
  },

  // 导航到设备管理
  navigateToDevice() {
    wx.switchTab({
      url: '/pages/device/device'
    })
  },

  // 导航到数据管理
  navigateToData() {
    wx.switchTab({
      url: '/pages/data/data'
    })
  },

  // 导航到日志管理
  navigateToLog() {
    wx.switchTab({
      url: '/pages/log/log'
    })
  },

  // 导航到个人中心
  navigateToProfile() {
    wx.switchTab({
      url: '/pages/profile/profile'
    })
  }
}) 