// app.js
App({
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    token: '',
    baseUrl: 'http://127.0.0.1:5000'
  },

  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 检查登录状态
    this.checkLoginStatus()
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.token = token
      this.globalData.isLoggedIn = true
    }
  },

  // 登录方法
  login(callback) {
    wx.login({
      success: (res) => {
        if (res.code) {
          // 发送 res.code 到后台换取 openId, sessionKey, unionId
          this.requestLogin(res.code, callback)
        } else {
          console.log('登录失败！' + res.errMsg)
          callback && callback(false)
        }
      }
    })
  },

  // 请求登录接口
  requestLogin(code, callback) {
    wx.request({
      url: `${this.globalData.baseUrl}/auth/wechat_login`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        code: code
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          this.globalData.token = res.data.token
          this.globalData.isLoggedIn = true
          this.globalData.userInfo = res.data.userInfo
          
          // 存储到本地
          wx.setStorageSync('token', res.data.token)
          wx.setStorageSync('userInfo', res.data.userInfo)
          
          callback && callback(true)
        } else {
          console.log('登录失败', res.data)
          callback && callback(false)
        }
      },
      fail: (err) => {
        console.log('登录请求失败', err)
        callback && callback(false)
      }
    })
  },

  // 退出登录
  logout() {
    this.globalData.token = ''
    this.globalData.isLoggedIn = false
    this.globalData.userInfo = null
    
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
  },

  // 通用请求方法
  request(options) {
    const { url, method = 'GET', data = {}, header = {}, success, fail } = options
    
    // 添加token到请求头
    if (this.globalData.token) {
      header.Authorization = `Bearer ${this.globalData.token}`
    }

    wx.request({
      url: `${this.globalData.baseUrl}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...header
      },
      success: (res) => {
        if (res.statusCode === 401) {
          // token过期，需要重新登录
          this.logout()
          wx.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none'
          })
          wx.switchTab({
            url: '/pages/profile/profile'
          })
        } else {
          success && success(res)
        }
      },
      fail: fail || function(err) {
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        })
      }
    })
  }
}) 