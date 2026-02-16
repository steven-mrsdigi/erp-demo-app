<template>
  <v-app>
    <!-- 顶部导航栏 -->
    <v-app-bar 
      app 
      color="primary" 
      dark
      :elevation="2"
      density="compact"
    >
      <!-- 手机端汉堡菜单 -->
      <template v-if="isMobile">
        <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      </template>
      
      <v-toolbar-title class="text-h6 font-weight-bold">
        ERP System
      </v-toolbar-title>
      
      <v-spacer></v-spacer>
      
      <!-- 桌面端导航 -->
      <template v-if="!isMobile">
        <v-btn 
          v-for="item in menuItems" 
          :key="item.path"
          :to="item.path"
          variant="text"
          class="mx-1 text-none"
          :prepend-icon="item.icon"
          size="small"
        >
          {{ item.title }}
        </v-btn>
      </template>
    </v-app-bar>

    <!-- 手机端侧边栏 -->
    <v-navigation-drawer 
      v-if="isMobile"
      v-model="drawer" 
      location="left"
      temporary
    >
      <v-list>
        <v-list-subheader>Menu</v-list-subheader>
        <v-list-item 
          v-for="item in menuItems" 
          :key="item.path"
          :to="item.path"
          :prepend-icon="item.icon"
          @click="drawer = false"
        >
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- 主内容区 -->
    <v-main :style="{ paddingBottom: isMobile ? '64px' : '0' }">
      <v-container fluid class="pa-2 pa-sm-4">
        <router-view></router-view>
      </v-container>
    </v-main>

    <!-- 手机端底部导航栏 -->
    <v-bottom-navigation
      v-if="isMobile"
      v-model="bottomNav"
      app
      color="primary"
      grow
      density="comfortable"
    >
      <v-btn 
        v-for="(item, index) in menuItems" 
        :key="item.path"
        :value="index"
        :to="item.path"
        size="small"
      >
        <v-icon size="20">{{ item.icon }}</v-icon>
        <span class="text-caption mt-1">{{ item.title }}</span>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const drawer = ref(false)
const bottomNav = ref(0)
const windowWidth = ref(window.innerWidth)

// 实时检测窗口宽度
const isMobile = computed(() => windowWidth.value < 960)

const updateWidth = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', updateWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWidth)
})

const menuItems = [
  { title: 'Dashboard', path: '/', icon: 'mdi-view-dashboard' },
  { title: 'Products', path: '/products', icon: 'mdi-package' },
  { title: 'Customers', path: '/customers', icon: 'mdi-account-group' },
  { title: 'Orders', path: '/orders', icon: 'mdi-cart' },
]

// 同步底部导航与当前路由
watch(() => route.path, (newPath) => {
  const index = menuItems.findIndex(item => item.path === newPath)
  if (index !== -1) {
    bottomNav.value = index
  }
}, { immediate: true })
</script>
