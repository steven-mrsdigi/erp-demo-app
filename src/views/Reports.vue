<template>
  <div>
    <h1 class="text-h5 text-sm-h4 mb-4">{{ $t('reports.title') }}</h1>

    <!-- 报表类型选择 -->
    <v-select
      v-model="selectedReport"
      :items="reportTypes"
      :label="$t('reports.selectReport')"
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
              <div class="text-caption">{{ $t('reports.products') }}</div>
              <div class="text-h5 font-weight-bold">{{ reportData.total_products }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card color="success" dark>
            <v-card-text class="pa-3">
              <div class="text-caption">{{ $t('reports.customers') }}</div>
              <div class="text-h5 font-weight-bold">{{ reportData.total_customers }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card color="info" dark>
            <v-card-text class="pa-3">
              <div class="text-caption">{{ $t('reports.orderCount') }}</div>
              <div class="text-h5 font-weight-bold">{{ reportData.monthly_orders }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card color="warning" dark>
            <v-card-text class="pa-3">
              <div class="text-caption">{{ $t('reports.revenue') }}</div>
              <div class="text-h5 font-weight-bold">${{ formatNumber(reportData.monthly_revenue) }}</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- 低库存预警 -->
      <v-card v-if="reportData.low_stock?.length > 0" class="mb-4">
        <v-card-title class="text-subtitle-1">
          <v-icon color="error" class="mr-2">mdi-alert</v-icon>
          {{ $t('reports.lowStockAlert') }}
        </v-card-title>
        <v-list>
          <v-list-item v-for="item in reportData.low_stock" :key="item.id">
            <v-list-item-title>{{ item.name }}</v-list-item-title>
            <template v-slot:append>
              <v-chip color="error" size="small">
                {{ item.stock_quantity }} {{ $t('common.left') }}
              </v-chip>
            </template>
          </v-list-item>
        </v-list>
      </v-card>
    </div>

    <!-- 销售报表 -->
    <div v-else-if="selectedReport === 'sales' && reportData?.data">
      <v-card>
        <v-card-title class="text-subtitle-1">{{ $t('reports.dailySales') }}</v-card-title>
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
              {{ item.order_count }} {{ $t('common.orders') }} - ${{ formatNumber(item.total_sales) }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card>
    </div>

    <!-- 库存估值 -->
    <div v-else-if="selectedReport === 'inventory' && reportData?.data">
      <v-card>
        <v-card-title class="text-subtitle-1">{{ $t('reports.inventoryByCategory') }}</v-card-title>
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
            <v-list-item-title>{{ item.category || $t('common.uncategorized') }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ item.product_count }} {{ $t('common.products') }}, {{ item.total_units }} {{ $t('common.units') }}
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
        <v-card-title class="text-subtitle-1">{{ $t('reports.topSellingProducts') }}</v-card-title>
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
              {{ item.total_sold }} {{ $t('common.sold') }} - ${{ formatNumber(item.total_revenue) }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card>
    </div>

    <v-alert v-if="!reportData && !loading" type="info">
      {{ $t('reports.selectReportToView') }}
    </v-alert>

    <v-progress-circular v-if="loading" indeterminate color="primary" class="ma-4"></v-progress-circular>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useApi } from '@/composables/useApi'
import { useI18n } from 'vue-i18n'

const { get, loading } = useApi()
const { t } = useI18n()

const selectedReport = ref('dashboard')
const reportData = ref(null)

const reportTypes = computed(() => [
  { title: t('reports.dashboardOverview'), value: 'dashboard' },
  { title: t('reports.salesReport'), value: 'sales' },
  { title: t('reports.inventoryValuation'), value: 'inventory' },
  { title: t('reports.topProducts'), value: 'top-products' }
])

const salesHeaders = computed(() => [
  { title: t('common.date'), key: 'date' },
  { title: t('reports.orderCount'), key: 'order_count' },
  { title: t('reports.totalSales'), key: 'total_sales' }
])

const inventoryHeaders = computed(() => [
  { title: t('common.category'), key: 'category' },
  { title: t('reports.productCount'), key: 'product_count' },
  { title: t('reports.totalUnits'), key: 'total_units' },
  { title: t('reports.totalValue'), key: 'total_value' }
])

const topProductsHeaders = computed(() => [
  { title: t('common.product'), key: 'name' },
  { title: 'SKU', key: 'sku' },
  { title: t('common.sold'), key: 'total_sold' },
  { title: t('reports.revenue'), key: 'total_revenue' }
])

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
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
</script>
