<template>
  <div>
    <h1 class="text-h5 text-sm-h4 mb-4">{{ $t('dashboard.title') }}</h1>
    
    <!-- 统计卡片 -->
    <v-row>
      <v-col cols="6" md="3">
        <v-card color="primary" dark class="h-100">
          <v-card-text class="pa-3 pa-sm-4">
            <div class="text-caption text-sm-body-2 opacity-80">{{ $t('dashboard.products') }}</div>
            <div class="text-h5 text-sm-h3 font-weight-bold">{{ stats.products }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="6" md="3">
        <v-card color="success" dark class="h-100">
          <v-card-text class="pa-3 pa-sm-4">
            <div class="text-caption text-sm-body-2 opacity-80">{{ $t('dashboard.customers') }}</div>
            <div class="text-h5 text-sm-h3 font-weight-bold">{{ stats.customers }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="6" md="3">
        <v-card color="info" dark class="h-100">
          <v-card-text class="pa-3 pa-sm-4">
            <div class="text-caption text-sm-body-2 opacity-80">{{ $t('dashboard.orders') }}</div>
            <div class="text-h5 text-sm-h3 font-weight-bold">{{ stats.orders }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="6" md="3">
        <v-card color="warning" dark class="h-100">
          <v-card-text class="pa-3 pa-sm-4">
            <div class="text-caption text-sm-body-2 opacity-80">{{ $t('dashboard.revenue') }}</div>
            <div class="text-h5 text-sm-h3 font-weight-bold">${{ stats.revenue }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 图表区域 -->
    <v-row class="mt-4">
      <!-- 最近订单 -->
      <v-col cols="12" lg="6">
        <v-card>
          <v-card-title class="text-subtitle-1 text-sm-h6 py-3">
            <v-icon class="mr-2" size="small">mdi-cart</v-icon>
            {{ $t('dashboard.recentOrders') }}
          </v-card-title>
          <v-card-text class="pa-0">
            <!-- 桌面端列表 -->
            <v-list class="d-none d-sm-block">
              <v-list-item v-for="order in recentOrders.slice(0, 5)" :key="order.id" class="px-4">
                <v-list-item-title class="text-body-2">{{ order.order_number }}</v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  {{ order.customer_name }} - ${{ order.total_amount }}
                </v-list-item-subtitle>
                <template v-slot:append>
                  <v-chip :color="getStatusColor(order.status)" size="x-small" class="text-caption">
                    {{ order.status }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
            
            <!-- 移动端卡片 -->
            <div class="d-sm-none pa-2">
              <v-card v-for="order in recentOrders.slice(0, 3)" :key="order.id" 
                      class="mb-2" variant="outlined" density="compact">
                <v-card-text class="pa-2">
                  <div class="d-flex justify-space-between align-center">
                    <span class="font-weight-medium text-body-2">{{ order.order_number }}</span>
                    <v-chip :color="getStatusColor(order.status)" size="x-small">
                      {{ order.status }}
                    </v-chip>
                  </div>
                  <div class="text-caption text-grey">{{ order.customer_name }}</div>
                  <div class="text-body-2 font-weight-bold">${{ order.total_amount }}</div>
                </v-card-text>
              </v-card>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <!-- 低库存产品 -->
      <v-col cols="12" lg="6" class="mt-4 mt-lg-0">
        <v-card>
          <v-card-title class="text-subtitle-1 text-sm-h6 py-3">
            <v-icon class="mr-2" size="small" color="error">mdi-alert</v-icon>
            {{ $t('dashboard.lowStockAlert') }}
          </v-card-title>
          <v-card-text class="pa-0">
            <!-- 桌面端列表 -->
            <v-list class="d-none d-sm-block">
              <v-list-item v-for="product in lowStockProducts.slice(0, 5)" :key="product.id" class="px-4">
                <v-list-item-title class="text-body-2">{{ product.name }}</v-list-item-title>
                <v-list-item-subtitle class="text-caption">SKU: {{ product.sku }}</v-list-item-subtitle>
                <template v-slot:append>
                  <v-chip color="error" size="x-small" class="text-caption">
                    {{ product.stock_quantity }} {{ $t('common.left') }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
            
            <!-- 移动端卡片 -->
            <div class="d-sm-none pa-2">
              <v-card v-for="product in lowStockProducts.slice(0, 3)" :key="product.id" 
                      class="mb-2" variant="outlined" density="compact">
                <v-card-text class="pa-2">
                  <div class="d-flex justify-space-between align-center">
                    <span class="font-weight-medium text-body-2">{{ product.name }}</span>
                    <v-chip color="error" size="x-small">
                      {{ product.stock_quantity }} {{ $t('common.left') }}
                    </v-chip>
                  </div>
                  <div class="text-caption text-grey">SKU: {{ product.sku }}</div>
                </v-card-text>
              </v-card>
            </div>
            
            <v-alert v-if="lowStockProducts.length === 0" type="success" class="ma-2" density="compact">
              {{ $t('dashboard.allProductsSufficientStock') }}
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'

const { get } = useApi()

const stats = ref({
  products: 0,
  customers: 0,
  orders: 0,
  revenue: 0
})

const recentOrders = ref([])
const lowStockProducts = ref([])

onMounted(async () => {
  try {
    const ordersData = await get('/orders')
    const productsData = await get('/products')
    const customersData = await get('/customers')
    
    stats.value.orders = ordersData.data?.length || 0
    stats.value.products = productsData.data?.length || 0
    stats.value.customers = customersData.data?.length || 0
    
    // 计算总收入
    const totalRevenue = ordersData.data?.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0) || 0
    stats.value.revenue = totalRevenue.toFixed(0)
    
    recentOrders.value = ordersData.data?.slice(0, 5) || []
    lowStockProducts.value = productsData.data?.filter(p => p.stock_quantity < 20).slice(0, 5) || []
  } catch (error) {
    console.error('Failed to load dashboard:', error)
  }
})

function getStatusColor(status) {
  const colors = {
    'pending': 'warning',
    'processing': 'info',
    'completed': 'success',
    'cancelled': 'error'
  }
  return colors[status] || 'grey'
}
</script>
