const app = getApp()

Page({
  data: {
    loading: false,
    devices: [],
    filteredDevices: [],
    searchKeyword: '',
    totalDevices: 0,
    onlineDevices: 0,
    offlineDevices: 0,
    
    // 绑定设备相关
    showBindModal: false,
    bindDeviceId: '',
    bindLoading: false,
    
    // 设备菜单相关
    showDeviceMenu: false,
    selectedDevice: null
  },

  onLoad() {
    this.checkLoginAndLoadDevices()
  },

  onShow() {
    this.checkLoginAndLoadDevices()
  },

  // 检查登录状态并加载设备
  checkLoginAndLoadDevices() {
    if (!app.globalData.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再查看设备信息',
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
    this.loadDevices()
  },

  // 加载设备列表
  loadDevices() {
    this.setData({ loading: true })
    
    app.request({
      url: '/devices/my_devices',
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          const devices = res.data.data || []
          this.processDeviceData(devices)
        } else {
          console.log('加载设备列表失败', res.data)
          this.showMockData()
        }
      },
      fail: () => {
        console.log('网络请求失败，使用模拟数据')
        this.showMockData()
      },
      complete: () => {
        this.setData({ loading: false })
      }
    })
  },

  // 处理设备数据
  processDeviceData(devices) {
    // 数据处理和统计
    const onlineDevices = devices.filter(device => device.status === 'online').length
    const offlineDevices = devices.length - onlineDevices
    
    // 格式化设备数据
    const processedDevices = devices.map(device => ({
      ...device,
      lastSeen: this.formatTime(device.lastSeen || device.lastOnline)
    }))

    this.setData({
      devices: processedDevices,
      filteredDevices: processedDevices,
      totalDevices: devices.length,
      onlineDevices: onlineDevices,
      offlineDevices: offlineDevices
    })
  },

  // 显示模拟数据（用于演示和测试）
  showMockData() {
    const mockDevices = [
      {
        id: 'd6e73ea4-37f1-4475-9fd7-7713031382db',
        name: '客厅温度传感器',
        type: '温度传感器',
        status: 'online',
        lastSeen: '2024-01-15 10:30:00'
      },
      {
        id: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
        name: '卧室智能灯',
        type: '智能灯具',
        status: 'offline',
        lastSeen: '2024-01-14 22:15:00'
      },
      {
        id: 'f9e8d7c6-b5a4-3210-9876-543210fedcba',
        name: '厨房烟雾报警器',
        type: '安全设备',
        status: 'online',
        lastSeen: '2024-01-15 10:25:00'
      }
    ]
    this.processDeviceData(mockDevices)
  },

  // 搜索输入处理
  onSearchInput(e) {
    const keyword = e.detail.value.toLowerCase()
    this.setData({ searchKeyword: keyword })
    this.filterDevices(keyword)
  },

  // 过滤设备
  filterDevices(keyword) {
    if (!keyword) {
      this.setData({ filteredDevices: this.data.devices })
      return
    }

    const filtered = this.data.devices.filter(device => {
      return (device.name && device.name.toLowerCase().includes(keyword)) ||
             (device.id && device.id.toLowerCase().includes(keyword)) ||
             (device.type && device.type.toLowerCase().includes(keyword))
    })
    
    this.setData({ filteredDevices: filtered })
  },

  // 查看设备详情
  viewDeviceDetail(e) {
    const device = e.currentTarget.dataset.device
    if (!device) return

    this.hideDeviceMenu()
    
    app.request({
      url: `/devices/my_devices/${device.id}`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          // 跳转到设备详情页面
          wx.navigateTo({
            url: `/pages/device-detail/device-detail?device=${encodeURIComponent(JSON.stringify(res.data.data))}`
          })
        } else {
          // 使用简单的详情展示
          this.showDeviceDetailModal(device)
        }
      },
      fail: () => {
        this.showDeviceDetailModal(device)
      }
    })
  },

  // 显示设备详情弹窗
  showDeviceDetailModal(device) {
    const detailText = `设备名称：${device.name || '未命名'}
设备ID：${device.id}
设备类型：${device.type || '未知'}
状态：${device.status === 'online' ? '在线' : '离线'}
最后在线：${device.lastSeen || '未知'}`

    wx.showModal({
      title: '设备详情',
      content: detailText,
      showCancel: false
    })
  },

  // 显示绑定设备弹窗
  showBindModal() {
    this.setData({ 
      showBindModal: true,
      bindDeviceId: ''
    })
  },

  // 隐藏绑定设备弹窗
  hideBindModal() {
    this.setData({ 
      showBindModal: false,
      bindDeviceId: '',
      bindLoading: false
    })
  },

  // 绑定设备ID输入
  onBindDeviceIdInput(e) {
    this.setData({ bindDeviceId: e.detail.value })
  },

  // 绑定设备
  bindDevice() {
    if (!this.data.bindDeviceId.trim()) {
      wx.showToast({
        title: '请输入设备ID',
        icon: 'none'
      })
      return
    }

    this.setData({ bindLoading: true })

    app.request({
      url: `/devices/${this.data.bindDeviceId}/bind`,
      method: 'POST',
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          wx.showToast({
            title: '绑定成功',
            icon: 'success'
          })
          this.hideBindModal()
          this.loadDevices() // 重新加载设备列表
        } else {
          wx.showToast({
            title: res.data.message || '绑定失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        })
      },
      complete: () => {
        this.setData({ bindLoading: false })
      }
    })
  },

  // 显示设备菜单
  showDeviceMenu(e) {
    const device = e.currentTarget.dataset.device
    this.setData({
      showDeviceMenu: true,
      selectedDevice: device
    })
  },

  // 隐藏设备菜单
  hideDeviceMenu() {
    this.setData({
      showDeviceMenu: false,
      selectedDevice: null
    })
  },

  // 编辑设备
  editDevice(e) {
    const device = e.currentTarget.dataset.device || this.data.selectedDevice
    this.hideDeviceMenu()
    
    wx.showToast({
      title: '编辑功能开发中',
      icon: 'none'
    })
  },

  // 确认解绑设备
  confirmUnbindDevice(e) {
    const device = e.currentTarget.dataset.device || this.data.selectedDevice
    this.hideDeviceMenu()

    wx.showModal({
      title: '确认解绑',
      content: `确定要解绑设备"${device.name || device.id}"吗？解绑后将无法控制该设备。`,
      confirmText: '解绑',
      confirmColor: '#f5222d',
      success: (res) => {
        if (res.confirm) {
          this.unbindDevice(device)
        }
      }
    })
  },

  // 解绑设备
  unbindDevice(device) {
    wx.showLoading({ title: '解绑中...' })

    app.request({
      url: `/devices/${device.id}/unbind`,
      method: 'POST',
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          wx.showToast({
            title: '解绑成功',
            icon: 'success'
          })
          this.loadDevices() // 重新加载设备列表
        } else {
          wx.showToast({
            title: res.data.message || '解绑失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        })
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },

  // 格式化时间
  formatTime(timestamp) {
    if (!timestamp) return '未知'
    
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
    this.loadDevices()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  }
}) 