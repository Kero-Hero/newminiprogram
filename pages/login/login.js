const app = getApp()

Page({
  data: {
    loginLoading: false
  },

  onLoad() {
    // 如果已经登录，直接跳转到首页
    if (app.globalData.isLoggedIn) {
      wx.switchTab({
        url: '/pages/index/index'
      })
    }
  },

  // 处理微信登录
  handleWeChatLogin() {
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
        
        // 登录成功后跳转到首页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }, 1500)
      } else {
        wx.showToast({
          title: '登录失败，请重试',
          icon: 'none'
        })
      }
    })
  },

  // 显示隐私政策
  showPrivacy() {
    wx.showModal({
      title: '隐私政策',
      content: '这里是隐私政策的内容...',
      showCancel: false
    })
  },

  // 显示服务条款
  showTerms() {
    wx.showModal({
      title: '服务条款',
      content: '这里是服务条款的内容...',
      showCancel: false
    })
  }
}) 