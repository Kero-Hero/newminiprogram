// app.js
App({
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    token: '',
    expires: '',
    baseUrl: 'http://localhost:5000'
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
    const expires = wx.getStorageSync('expires')
    
    if (token && expires) {
      // 检查token是否过期
      const currentTime = new Date().getTime()
      const expiresTime = new Date(expires).getTime()
      
      if (currentTime < expiresTime) {
        this.globalData.token = token
        this.globalData.expires = expires
        this.globalData.isLoggedIn = true
      } else {
        // token已过期，清除本地存储
        this.logout()
      }
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
    console.log('发送登录请求，code:', code)
    
    wx.request({
      url: `${this.globalData.baseUrl}/auth/wechat_login`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({
        code: code
      }),
      success: (res) => {
        console.log('登录响应状态码:', res.statusCode)
        console.log('登录响应数据:', res.data)
        console.log('登录响应头:', res.header)
        
        if (res.statusCode === 200) {
          // 检查响应数据结构
          const responseData = res.data
          
          if (responseData && responseData.token && responseData.expires) {
            this.globalData.token = responseData.token
            this.globalData.expires = responseData.expires
            this.globalData.isLoggedIn = true
            
            // 如果有用户信息也一并存储
            if (responseData.userInfo) {
              this.globalData.userInfo = responseData.userInfo
              wx.setStorageSync('userInfo', responseData.userInfo)
            }
            
            // 存储token和expires到本地存储
            wx.setStorageSync('token', responseData.token)
            wx.setStorageSync('expires', responseData.expires)
            
            console.log('登录成功，token已存储')
            callback && callback(true)
          } else {
            console.log('登录失败：响应数据格式不正确', responseData)
            console.log('期望的字段: token, expires')
            callback && callback(false)
          }
        } else {
          console.log('登录失败，HTTP状态码:', res.statusCode)
          console.log('错误信息:', res.data)
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
    this.globalData.expires = ''
    this.globalData.isLoggedIn = false
    this.globalData.userInfo = null
    
    wx.removeStorageSync('token')
    wx.removeStorageSync('expires')
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