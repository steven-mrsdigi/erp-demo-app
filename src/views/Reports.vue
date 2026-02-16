<template>
  <div>
    <h1 class="text-h5 text-sm-h4 mb-4">Reports</h1>

    <!-- 报表类型选择 -->
    <v-select
      v-model="selectedReport"
      :items="reportTypes"
      label="Select Report"
      density="comfortable"
      class="mb-4"
      @update:modelValue="loadReport"
    ></v-select>

    <!-- Dashboard 概览 -->
    <div v-if="selectedReport === 'dashboard' && reportData">
      <v-row class="mb-4">
        <v-col cols="6" md="3">
          <v-card color="primary" dark>
            <v-card-text class="pa-3">
              <div class="text-caption">Products</div>
              <div class="text-h5 font-weight-bold">{{ reportData.total_products }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card color="success" dark>
            <v-card-text class="pa-3">
              <div class="text-caption">Customers</div>
              <div class="text-h5 font-weight-bold">{{ reportData.total_customers }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card color="info" dark>
            <v-card-text class="pa-3">
              <div class="text-caption">Monthly Orders</div>
              <div class="text-h5 font-weight-bold">{{ reportData.monthly_orders }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card color="warning" dark>
            <v-card-text class="pa-3">
              <div class="text-caption">Monthly Revenue</div>
              <div class="text-h5 font-weight-bold">${{ formatNumber(reportData.monthly_revenue) }}</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- 低库存预警 -->
      <v-card v-if="reportData.low_stock?.length > 0" class="mb-4">
        <v-card-title class="text-subtitle-1">
          <v-icon color="error" class="mr-2">mdi-alert</v-icon>
          Low Stock Alert
        </v-card-title>
        <v-list>
          <v-list-item v-for="item in reportData.low_stock" :key="item.id">
            <v-list-item-title>{{ item.name }}</v-list-item-title>
            <template v-slot:append>
              <v-chip color="error" size="small">
                {{ item.stock_quantity }} left
              </v-chip>
            </template>
          </v-list-item>
        </v-list>
      </v-card>
    </div>

    <!-- 销售报表 -->
    <div v-else-if="selectedReport === 'sales' && reportData?.data">
      <v-card>
        <v-card-title class="text-subtitle-1">Daily Sales (Last 30 Days)</v-card-title>
        <v-data-table
          :headers="salesHeaders"
          :items="reportData.data"
          :loading="loading"
          density="comfortable"
          class="d-none d-md-block"
        >
          <template v-slot:item.total_sales="{ item }">
            ${{ formatNumber(item.total_sales) }}
          </template>
        </v-data-table>

        <!-- 移动端卡片 -->
        <v-list class="d-md-none">
          <v-list-item v-for="item in reportData.data" :key="item.date">
            <v-list-item-title>{{ formatDate(item.date) }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ item.order_count }} orders - ${{ formatNumber(item.total_sales) }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card>
    </div>

    <!-- 库存估值 -->
    <div v-else-if="selectedReport === 'inventory' && reportData?.data">
      <v-card>
        <v-card-title class="text-subtitle-1">Inventory Valuation by Category</v-card-title>
        <v-data-table
          :headers="inventoryHeaders"
          :items="reportData.data"
          :loading="loading"
          density="comfortable"
          class="d-none d-md-block"
        >
          <template v-slot:item.total_value="{ item }">
            ${{ formatNumber(item.total_value) }}
          </template>
        </v-data-table>

        <!-- 移动端卡片 -->
        <v-list class="d-md-none">
          <v-list-item v-for="item in reportData.data" :key="item.category">
            <v-list-item-title>{{ item.category || 'Uncategorized' }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ item.product_count }} products, {{ item.total_units }} units
            </v-list-item-subtitle>
            <template v-slot:append>
              <span class="font-weight-bold">${{ formatNumber(item.total_value) }}</span>
            </template>
          </v-list-item>
        </v-list>
      </v-card>
    </div>

    <!-- 热销产品 -->
    <div v-else-if="selectedReport === 'top-products' && reportData?.data">
      <v-card>
        <v-card-title class="text-subtitle-1">Top Selling Products (Last 30 Days)</v-card-title>
        <v-data-table
          :headers="topProductsHeaders"
          :items="reportData.data"
          :loading="loading"
          density="comfortable"
          class="d-none d-md-block"
        >
          <template v-slot:item.total_revenue="{ item }">
            ${{ formatNumber(item.total_revenue) }}
          </template>
        </v-data-table>

        <!-- 移动端卡片 -->
        <v-list class="d-md-none">
          <v-list-item v-for="(item, index) in reportData.data" :key="item.sku">
            <v-list-item-title>
              <v-chip size="x-small" color="primary" class="mr-2">#{{ index + 1 }}</v-chip>
              {{ item.name }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ item.total_sold }} sold - ${{ formatNumber(item.total_revenue) }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card>
    </div>

    <v-alert v-if="!reportData && !loading" type="info">
      Select a report to view data
    </v-alert>

    <v-progress-circular v-if="loading" indeterminate color="primary" class="ma-4"></v-progress-circular>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'

const { get, loading } = useApi()

const selectedReport = ref('dashboard')
const reportData = ref(null)

const reportTypes = [
  { title: 'Dashboard Overview', value: 'dashboard' },
  { title: 'Sales Report', value: 'sales' },
  { title: 'Inventory Valuation', value: 'inventory' },
  { title: 'Top Products', value: 'top-products' }
]

const salesHeaders = [
  { title: 'Date', key: 'date' },
  { title: 'Orders', key: 'order_count' },
  { title: 'Sales', key: 'total_sales' }
]

const inventoryHeaders = [
  { title: 'Category', key: 'category' },
  { title: 'Products', key: 'product_count' },
  { title: 'Total Units', key: 'total_units' },
  { title: 'Total Value', key: 'total_value' }
]

const topProductsHeaders = [
  { title: 'Product', key: 'name' },
  { title: 'SKU', key: 'sku' },
  { title: 'Sold', key: 'total_sold' },
  { title: 'Revenue', key: 'total_revenue' }
]

onMounted(() => {
  loadReport('dashboard')
})

async function loadReport(type) {
  reportData.value = null
  try {
    const res = await get(`/reports?type=${type}`)
    reportData.value = res
  } catch (error) {
    console.error('Failed to load report:', error)
  }
}

function formatNumber(num) {
  if (num === null || num === undefined) return '0'
  return parseFloat(num).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>
