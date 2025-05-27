const app = getApp()

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    loginLoading: false
  },

  onLoad() {
    this.checkLoginStatus()
  },

  onShow() {
    this.checkLoginStatus()
  },

  // 检查登录状态
  checkLoginStatus() {
    this.setData({
      isLoggedIn: app.globalData.isLoggedIn,
      userInfo: app.globalData.userInfo
    })
  },

  // 处理登录
  handleLogin() {
    this.setData({
      loginLoading: true
    })

    app.login((success) => {
      this.setData({
        loginLoading: false
      })
      
      if (success) {
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })
        this.checkLoginStatus()
      } else {
        wx.showToast({
          title: '登录失败，请重试',
          icon: 'none'
        })
      }
    })
  },

  // 处理退出登录
  handleLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout()
          this.checkLoginStatus()
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
        }
      }
    })
  },

  // 导航到设置页面
  navigateToSetting() {
    wx.navigateTo({
      url: '/pages/setting/setting'
    })
  },

  // 导航到关于页面
  navigateToAbout() {
    wx.navigateTo({
      url: '/pages/about/about'
    })
  },

  // 导航到帮助页面
  navigateToHelp() {
    wx.navigateTo({
      url: '/pages/help/help'
    })
  },

  // 清理缓存
  clearCache() {
    wx.showModal({
      title: '清理缓存',
      content: '确定要清理缓存吗？这将删除所有本地数据',
      success: (res) => {
        if (res.confirm) {
          // 清理本地存储（除了登录信息）
          const token = wx.getStorageSync('token')
          const userInfo = wx.getStorageSync('userInfo')
          
          wx.clearStorageSync()
          
          // 恢复登录信息
          if (token) {
            wx.setStorageSync('token', token)
            wx.setStorageSync('userInfo', userInfo)
          }
          
          wx.showToast({
            title: '缓存清理完成',
            icon: 'success'
          })
        }
      }
    })
  },

  // 检查更新
  checkUpdate() {
    wx.showLoading({
      title: '检查中...'
    })

    // 模拟检查更新
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({
        title: '已是最新版本',
        icon: 'success'
      })
    }, 1500)
  }
}) 