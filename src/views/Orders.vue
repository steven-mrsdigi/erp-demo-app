<template>
  <div>
    <!-- 页面标题 -->
    <div class="d-flex align-center justify-space-between mb-4">
      <h1 class="text-h5 text-sm-h4">Orders</h1>
      <v-btn 
        color="primary" 
        :size="isMobile ? 'small' : 'default'"
        @click="showAddDialog = true"
        prepend-icon="mdi-plus"
      >
        <span class="d-none d-sm-inline">Create Order</span>
        <span class="d-sm-none">Create</span>
      </v-btn>
    </div>

    <!-- 桌面端：数据表格 -->
    <v-data-table
      :headers="headers"
      :items="orders"
      :loading="loading"
      class="elevation-1 d-none d-md-block"
      density="comfortable"
    >
      <template v-slot:item.total_amount="{ item }">
        ${{ item.total_amount }}
      </template>
      
      <template v-slot:item.status="{ item }">
        <v-chip :color="getStatusColor(item.status)" size="small">
          {{ item.status }}
        </v-chip>
      </template>
      
      <template v-slot:item.payment_status="{ item }">
        <v-chip :color="item.payment_status === 'paid' ? 'success' : 'warning'" size="small">
          {{ item.payment_status }}
        </v-chip>
      </template>
      
      <template v-slot:item.actions="{ item }">
        <v-btn icon size="small" variant="text" @click="viewItem(item)">
          <v-icon>mdi-eye</v-icon>
        </v-btn>
        <v-btn icon size="small" variant="text" color="error" @click="deleteItem(item)">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </template>
    </v-data-table>

    <!-- 移动端：卡片列表 -->
    <div class="d-md-none">
      <v-row>
        <v-col v-for="order in orders" :key="order.id" cols="12">
          <v-card class="mb-2" elevation="2">
            <v-card-title class="text-subtitle-1 pb-1 d-flex justify-space-between">
              <span>{{ order.order_number }}</span>
              <v-chip size="x-small" :color="getStatusColor(order.status)">
                {{ order.status }}
              </v-chip>
            </v-card-title>
            <v-card-subtitle class="text-caption">
              {{ order.customer_name || 'Unknown Customer' }}
            </v-card-subtitle>
            <v-card-text class="py-2">
              <div class="d-flex justify-space-between align-center">
                <span class="text-h6 font-weight-bold">${{ order.total_amount }}</span>
                <v-chip size="small" :color="order.payment_status === 'paid' ? 'success' : 'warning'">
                  {{ order.payment_status }}
                </v-chip>
              </div>
              <div class="text-caption text-grey mt-1">{{ order.order_date }}</div>
            </v-card-text>
            <v-card-actions>
              <v-btn size="small" variant="text" @click="viewItem(order)">
                <v-icon size="small" class="mr-1">mdi-eye</v-icon>
                View
              </v-btn>
              <v-btn size="small" variant="text" color="error" @click="deleteItem(order)">
                <v-icon size="small" class="mr-1">mdi-delete</v-icon>
                Delete
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- 空状态 -->
    <v-alert v-if="!loading && orders.length === 0" type="info" class="mt-4">
      No orders found. Click "Create Order" to create one.
    </v-alert>

    <!-- Create Order Dialog -->
    <v-dialog v-model="showAddDialog" max-width="800" :fullscreen="isMobile">
      <v-card>
        <v-card-title class="text-h6 d-flex align-center">
          Create Order
          <v-spacer></v-spacer>
          <v-btn icon @click="showAddDialog = false" class="d-md-none">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-select
            v-model="newOrder.customer_id"
            :items="customers"
            item-title="name"
            item-value="id"
            label="Select Customer"
            required
            density="comfortable"
          ></v-select>
          
          <v-divider class="my-4"></v-divider>
          
          <div class="text-subtitle-2 mb-2">Order Items</div>
          
          <div v-for="(item, index) in newOrder.items" :key="index" class="mb-4 pa-2 bg-grey-lighten-4 rounded">
            <div class="d-flex flex-column flex-sm-row gap-2">
              <v-select
                v-model="item.product_id"
                :items="products"
                item-title="name"
                item-value="id"
                label="Product"
                density="comfortable"
                class="flex-grow-1"
                @update:modelValue="updateItemPrice(item)"
              ></v-select>
              <div class="d-flex gap-2">
                <v-text-field
                  v-model="item.quantity"
                  label="Qty"
                  type="number"
                  density="comfortable"
                  style="width: 80px"
                  @update:modelValue="updateItemTotal(item)"
                ></v-text-field>
                <v-text-field
                  v-model="item.unit_price"
                  label="Price"
                  type="number"
                  prefix="$"
                  density="comfortable"
                  style="width: 100px"
                  @update:modelValue="updateItemTotal(item)"
                ></v-text-field>
              </div>
            </div>
            <div class="d-flex justify-space-between align-center mt-2">
              <span class="font-weight-bold">Subtotal: ${{ item.total_price }}</span>
              <v-btn icon size="small" color="error" variant="text" @click="removeItem(index)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </div>
          </div>
          
          <v-btn text color="primary" @click="addItem" size="small">
            <v-icon size="small" class="mr-1">mdi-plus</v-icon>
            Add Item
          </v-btn>
          
          <v-divider class="my-4"></v-divider>
          
          <div class="d-flex justify-end">
            <div class="text-h6">Total: ${{ calculateTotal() }}</div>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn text @click="showAddDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveOrder">Create Order</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useApi } from '@/composables/useApi'
import { useDisplay } from 'vuetify'

const { get, post, loading } = useApi()
const { mdAndUp } = useDisplay()

const isMobile = computed(() => !mdAndUp.value)

const orders = ref([])
const customers = ref([])
const products = ref([])
const showAddDialog = ref(false)

const newOrder = ref({
  customer_id: null,
  items: [{ product_id: null, quantity: 1, unit_price: 0, total_price: 0 }]
})

const headers = [
  { title: 'Order #', key: 'order_number', width: '150px' },
  { title: 'Customer', key: 'customer_name' },
  { title: 'Total', key: 'total_amount', width: '100px' },
  { title: 'Status', key: 'status', width: '120px' },
  { title: 'Payment', key: 'payment_status', width: '100px' },
  { title: 'Date', key: 'order_date', width: '120px' },
  { title: 'Actions', key: 'actions', sortable: false, width: '100px' }
]

onMounted(async () => {
  try {
    const [ordersRes, customersRes, productsRes] = await Promise.all([
      get('/orders'),
      get('/customers'),
      get('/products')
    ])
    orders.value = ordersRes.data || []
    customers.value = customersRes.data || []
    products.value = productsRes.data || []
  } catch (error) {
    console.error('Failed to load data:', error)
  }
})

function addItem() {
  newOrder.value.items.push({ product_id: null, quantity: 1, unit_price: 0, total_price: 0 })
}

function removeItem(index) {
  newOrder.value.items.splice(index, 1)
}

function updateItemPrice(item) {
  const product = products.value.find(p => p.id === item.product_id)
  if (product) {
    item.unit_price = product.price
    updateItemTotal(item)
  }
}

function updateItemTotal(item) {
  item.total_price = (item.quantity || 0) * (item.unit_price || 0)
}

function calculateTotal() {
  return newOrder.value.items.reduce((sum, item) => sum + (item.total_price || 0), 0).toFixed(2)
}

async function saveOrder() {
  try {
    const orderData = {
      customer_id: newOrder.value.customer_id,
      items: newOrder.value.items,
      total_amount: parseFloat(calculateTotal())
    }
    await post('/orders', orderData)
    showAddDialog.value = false
    const response = await get('/orders')
    orders.value = response.data || []
    newOrder.value = { customer_id: null, items: [{ product_id: null, quantity: 1, unit_price: 0, total_price: 0 }] }
  } catch (error) {
    console.error('Failed to save order:', error)
  }
}

function getStatusColor(status) {
  const colors = {
    'pending': 'warning',
    'processing': 'info',
    'completed': 'success',
    'cancelled': 'error'
  }
  return colors[status] || 'grey'
}

function viewItem(item) {
  console.log('View:', item)
}

function deleteItem(item) {
  console.log('Delete:', item)
}
</script>
