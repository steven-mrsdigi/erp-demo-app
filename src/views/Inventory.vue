<template>
  <div>
    <h1 class="text-h5 text-sm-h4 mb-4">Inventory</h1>

    <!-- 库存统计 -->
    <v-row class="mb-4">
      <v-col cols="6" md="3">
        <v-card color="primary" dark>
          <v-card-text class="pa-3">
            <div class="text-caption">Total Products</div>
            <div class="text-h5 font-weight-bold">{{ stockData.length }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card color="warning" dark>
          <v-card-text class="pa-3">
            <div class="text-caption">Low Stock</div>
            <div class="text-h5 font-weight-bold">{{ lowStockCount }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card color="success" dark>
          <v-card-text class="pa-3">
            <div class="text-caption">Total In</div>
            <div class="text-h5 font-weight-bold">{{ totalIn }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card color="error" dark>
          <v-card-text class="pa-3">
            <div class="text-caption">Total Out</div>
            <div class="text-h5 font-weight-bold">{{ totalOut }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-btn 
      color="primary" 
      class="mb-4"
      :size="isMobile ? 'small' : 'default'"
      @click="showMovementDialog = true"
      prepend-icon="mdi-swap-horizontal"
    >
      Record Movement
    </v-btn>

    <!-- 当前库存（桌面端表格） -->
    <v-card class="mb-4">
      <v-card-title class="text-subtitle-1">Current Stock Levels</v-card-title>
      <v-data-table
        :headers="stockHeaders"
        :items="stockData"
        :loading="loading"
        class="d-none d-md-block"
        density="compact"
      >
        <template v-slot:item.stock_quantity="{ item }">
          <v-chip 
            :color="item.stock_quantity < 10 ? 'error' : 'success'"
            size="small"
          >
            {{ item.stock_quantity }}
          </v-chip>
        </template>
      </v-data-table>

      <!-- 移动端卡片 -->
      <v-list class="d-md-none">
        <v-list-item v-for="item in stockData" :key="item.id">
          <v-list-item-title>{{ item.name }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ item.sku }} | On Hand: {{ item.stock_quantity }} | Available: {{ item.available_qty }}
          </v-list-item-subtitle>
          <template v-slot:append>
            <v-chip 
              :color="item.available_qty < 10 ? 'error' : 'success'"
              size="small"
            >
              {{ item.available_qty }}
            </v-chip>
          </template>
        </v-list-item>
      </v-list>
    </v-card>

    <!-- 最近库存变动 -->
    <v-card>
      <v-card-title class="text-subtitle-1">Recent Movements</v-card-title>
      <v-data-table
        :headers="movementHeaders"
        :items="movements"
        :loading="loading"
        class="d-none d-md-block"
        density="compact"
      >
        <template v-slot:item.type="{ item }">
          <v-chip 
            :color="item.type === 'in' ? 'success' : item.type === 'out' ? 'error' : 'warning'"
            size="small"
          >
            {{ item.type.toUpperCase() }}
          </v-chip>
        </template>
      </v-data-table>

      <!-- 移动端卡片 -->
      <v-list class="d-md-none">
        <v-list-item v-for="item in movements" :key="item.id">
          <v-list-item-title>{{ item.product_name }}</v-list-item-title>
          <v-list-item-subtitle>
            <v-chip 
              :color="item.type === 'in' ? 'success' : item.type === 'out' ? 'error' : 'warning'"
              size="x-small"
              class="mr-2"
            >
              {{ item.type.toUpperCase() }}
            </v-chip>
            {{ item.quantity }} units
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-card>

    <!-- Record Movement Dialog -->
    <v-dialog v-model="showMovementDialog" max-width="500" :fullscreen="isMobile">
      <v-card>
        <v-card-title class="text-h6">Record Inventory Movement</v-card-title>
        <v-card-text>
          <v-select
            v-model="movementForm.product_id"
            :items="products"
            item-title="name"
            item-value="id"
            label="Select Product"
            required
            density="comfortable"
          ></v-select>
          
          <v-select
            v-model="movementForm.type"
            :items="movementTypes"
            label="Movement Type"
            required
            density="comfortable"
          ></v-select>
          
          <v-text-field
            v-model="movementForm.quantity"
            label="Quantity"
            type="number"
            required
            density="comfortable"
          ></v-text-field>
          
          <v-text-field
            v-model="movementForm.unit_cost"
            label="Unit Cost"
            type="number"
            prefix="$"
            density="comfortable"
          ></v-text-field>
          
          <v-textarea
            v-model="movementForm.notes"
            label="Notes"
            rows="2"
            density="comfortable"
          ></v-textarea>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn text @click="showMovementDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveMovement" :loading="saving">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useApi } from '@/composables/useApi'
import { useDisplay } from 'vuetify'

const { get, post, loading: apiLoading } = useApi()
const { mdAndUp } = useDisplay()

const isMobile = computed(() => !mdAndUp.value)

const stockData = ref([])
const movements = ref([])
const products = ref([])
const loading = ref(true)
const showMovementDialog = ref(false)
const saving = ref(false)

const movementForm = ref({
  product_id: null,
  type: 'in',
  quantity: 1,
  unit_cost: 0,
  notes: ''
})

const movementTypes = [
  { title: 'Stock In (Purchase)', value: 'in' },
  { title: 'Stock Out (Sale)', value: 'out' },
  { title: 'Adjustment', value: 'adjustment' }
]

const stockHeaders = [
  { title: 'Product', key: 'name' },
  { title: 'SKU', key: 'sku' },
  { title: 'On Hand', key: 'stock_quantity' },
  { title: 'Allocated', key: 'allocated_qty' },
  { title: 'Available', key: 'available_qty' }
]

const movementHeaders = [
  { title: 'Date', key: 'created_at' },
  { title: 'Product', key: 'product_name' },
  { title: 'Type', key: 'type' },
  { title: 'Qty', key: 'quantity' },
  { title: 'Notes', key: 'notes' }
]

const lowStockCount = computed(() => 
  stockData.value.filter(item => item.stock_quantity < 10).length
)

const totalIn = computed(() =>
  stockData.value.reduce((sum, item) => sum + parseInt(item.total_in || 0), 0)
)

const totalOut = computed(() =>
  stockData.value.reduce((sum, item) => sum + parseInt(item.total_out || 0), 0)
)

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  try {
    const [inventoryRes, productsRes] = await Promise.all([
      get('/inventory'),
      get('/products')
    ])
    stockData.value = inventoryRes.stock || []
    movements.value = inventoryRes.movements || []
    products.value = productsRes.data || []
  } catch (error) {
    console.error('Failed to load inventory:', error)
  } finally {
    loading.value = false
  }
}

async function saveMovement() {
  saving.value = true
  try {
    await post('/inventory', movementForm.value)
    await loadData()
    showMovementDialog.value = false
    movementForm.value = {
      product_id: null,
      type: 'in',
      quantity: 1,
      unit_cost: 0,
      notes: ''
    }
  } catch (error) {
    console.error('Failed to save movement:', error)
  } finally {
    saving.value = false
  }
}
</script>
