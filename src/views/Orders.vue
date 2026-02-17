<template>
  <div>
    <!-- 页面标题 -->
    <div class="d-flex align-center justify-space-between mb-4">
      <h1 class="text-h5 text-sm-h4">{{ $t('orders.title') }}</h1>
      <v-btn 
        color="primary" 
        :size="isMobile ? 'small' : 'default'"
        @click="openCreateDialog"
        prepend-icon="mdi-plus"
      >
        <span class="d-none d-sm-inline">{{ $t('orders.createOrder') }}</span>
        <span class="d-sm-none">{{ $t('common.create') }}</span>
      </v-btn>
    </div>

    <!-- 桌面端：数据表格 -->
    <v-data-table
      :headers="headers"
      :items="orders"
      :loading="loading"
      v-model:sort-by="sortBy"
      @update:sort-by="handleSort"
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
        <v-btn 
          v-if="item.payment_status !== 'paid'" 
          icon size="small" variant="text" color="success" 
          @click="openPaymentDialog(item)"
        >
          <v-icon>mdi-cash-register</v-icon>
        </v-btn>
        <v-btn icon size="small" variant="text" color="primary" @click="editItem(item)">
          <v-icon>mdi-pencil</v-icon>
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
              <v-btn 
                v-if="order.payment_status !== 'paid'"
                size="small" variant="text" color="success" 
                @click="openPaymentDialog(order)"
              >
                <v-icon size="small" class="mr-1">mdi-cash-register</v-icon>
                Pay
              </v-btn>
              <v-btn size="small" variant="text" color="primary" @click="editItem(order)">
                <v-icon size="small" class="mr-1">mdi-pencil</v-icon>
                Edit
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
      No orders found. Click "{{ $t("orders.createOrder") }}" to create one.
    </v-alert>

    <!-- Payment Dialog -->
    <v-dialog v-model="showPaymentDialog" max-width="500" :fullscreen="isMobile">
      <v-card>
        <v-card-title class="text-h6">
          Process Payment
        </v-card-title>
        <v-card-text>
          <div class="text-subtitle-1 mb-4">
            Order: {{ paymentOrder?.order_number }}
          </div>
          <div class="text-h5 mb-4 text-primary">
            Total: ${{ paymentOrder?.total_amount }}
          </div>
          
          <v-select
            v-model="paymentData.method"
            :items="paymentMethods"
            item-title="label"
            item-value="value"
            label="Payment Method"
            required
            density="comfortable"
          ></v-select>
          
          <v-text-field
            v-model="paymentData.amount"
            label="Amount Paid"
            type="number"
            prefix="$"
            required
            density="comfortable"
          ></v-text-field>
          
          <v-text-field
            v-model="paymentData.reference"
            label="Reference Number (Optional)"
            density="comfortable"
          ></v-text-field>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn text @click="showPaymentDialog = false">{{ $t("common.cancel") }}</v-btn>
          <v-btn color="success" @click="processPayment">Confirm Payment</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Order Dialog (Create/Edit) -->
    <v-dialog v-model="showDialog" max-width="800" :fullscreen="isMobile">
      <v-card>
        <v-card-title class="text-h6 d-flex align-center">
          {{ isEditing ? $t('orders.editOrder') : $t('orders.createOrder') }}
          <v-spacer></v-spacer>
          <v-btn icon @click="showDialog = false" class="d-md-none">
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
          
          <div class="d-flex flex-column align-end">
            <div class="text-body-1">Subtotal: ${{ calculateSubtotal() }}</div>
            <div class="text-body-1">Tax ({{ calculateTotalTaxRate() }}%): ${{ calculateTax() }}</div>
            <div class="text-h6 mt-2">Total: ${{ calculateGrandTotal() }}</div>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn text @click="showDialog = false">{{ $t("common.cancel") }}</v-btn>
          <v-btn color="primary" @click="saveOrder">{{ isEditing ? $t('common.update') : $t('common.save') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useApi } from '@/composables/useApi'
import { useDisplay } from 'vuetify'

const { get, post, patch, loading } = useApi()
const { mdAndUp } = useDisplay()

const isMobile = computed(() => !mdAndUp.value)

const orders = ref([])
const customers = ref([])
const products = ref([])
const showDialog = ref(false)
const isEditing = ref(false)
const editingOrderId = ref(null)
const sortBy = ref([{ key: 'order_date', order: 'desc' }])

const newOrder = ref({
  customer_id: null,
  items: [{ product_id: null, quantity: 1, unit_price: 0, total_price: 0 }]
})

// Payment dialog data
const showPaymentDialog = ref(false)
const paymentOrder = ref(null)
const paymentData = ref({
  method: 'cash',
  amount: 0,
  reference: ''
})

const paymentMethods = [
  { label: 'Cash', value: 'cash' },
  { label: 'Credit Card', value: 'credit_card' },
  { label: 'Bank Transfer', value: 'bank_transfer' },
  { label: 'Check', value: 'check' }
]

const headers = [
  { title: 'Order #', key: 'order_number', sortable: true, width: '150px' },
  { title: 'Customer', key: 'customer_name', sortable: true },
  { title: 'Total', key: 'total_amount', sortable: true, width: '100px' },
  { title: 'Status', key: 'status', sortable: true, width: '120px' },
  { title: 'Payment', key: 'payment_status', sortable: true, width: '100px' },
  { title: 'Date', key: 'order_date', sortable: true, width: '120px' },
  { title: 'Actions', key: 'actions', sortable: false, width: '100px' }
]

onMounted(async () => {
  await loadData()
})

async function loadData() {
  try {
    const sort = sortBy.value[0]?.key || 'order_date'
    const order = sortBy.value[0]?.order === 'asc' ? 'asc' : 'desc'
    const [ordersRes, customersRes, productsRes] = await Promise.all([
      get(`/orders?sort=${sort}&order=${order}`),
      get('/customers'),
      get('/products')
    ])
    orders.value = ordersRes.data || []
    customers.value = customersRes.data || []
    products.value = productsRes.data || []
  } catch (error) {
    console.error('Failed to load data:', error)
  }
}

function handleSort(sort) {
  sortBy.value = sort
  loadData()
}

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

function calculateSubtotal() {
  return newOrder.value.items.reduce((sum, item) => {
    const qty = parseInt(item.quantity) || 0
    const price = parseFloat(item.unit_price) || 0
    return sum + (qty * price)
  }, 0).toFixed(2)
}

function calculateTax() {
  let tax = 0
  newOrder.value.items.forEach(item => {
    const product = products.value.find(p => p.id === item.product_id)
    if (product && product.tax_rate) {
      const qty = parseInt(item.quantity) || 0
      const price = parseFloat(item.unit_price) || 0
      tax += (qty * price) * (parseFloat(product.tax_rate) / 100)
    }
  })
  return tax.toFixed(2)
}

function calculateTotalTaxRate() {
  // Calculate weighted average tax rate
  let totalAmount = 0
  let totalTax = 0
  newOrder.value.items.forEach(item => {
    const product = products.value.find(p => p.id === item.product_id)
    const qty = parseInt(item.quantity) || 0
    const price = parseFloat(item.unit_price) || 0
    const itemAmount = qty * price
    totalAmount += itemAmount
    if (product && product.tax_rate) {
      totalTax += itemAmount * (parseFloat(product.tax_rate) / 100)
    }
  })
  return totalAmount > 0 ? ((totalTax / totalAmount) * 100).toFixed(1) : 0
}

function calculateGrandTotal() {
  const subtotal = parseFloat(calculateSubtotal())
  const tax = parseFloat(calculateTax())
  return (subtotal + tax).toFixed(2)
}

// Keep for backwards compatibility
function calculateTotal() {
  return calculateGrandTotal()
}

function openCreateDialog() {
  isEditing.value = false
  editingOrderId.value = null
  newOrder.value = {
    customer_id: null,
    items: [{ product_id: null, quantity: 1, unit_price: 0, total_price: 0 }]
  }
  showDialog.value = true
}

async function editItem(item) {
  isEditing.value = true
  editingOrderId.value = item.id
  
  // Fetch order items from separate endpoint
  try {
    const itemsRes = await get(`/order_items?order_id=eq.${item.id}`)
    const orderItems = itemsRes.data || []
    
    if (orderItems.length > 0) {
      newOrder.value = {
        customer_id: item.customer_id,
        items: orderItems.map(i => {
          const quantity = parseInt(i.quantity) || 1
          const unitPrice = parseFloat(i.unit_price) || 0
          return {
            product_id: i.product_id,
            quantity: quantity,
            unit_price: unitPrice,
            total_price: quantity * unitPrice
          }
        }),
        notes: item.notes || ''
      }
    } else {
      // Fallback if no items found
      newOrder.value = {
        customer_id: item.customer_id,
        items: [{ product_id: null, quantity: 1, unit_price: 0, total_price: 0 }],
        notes: item.notes || ''
      }
    }
  } catch (error) {
    console.error('Failed to fetch order items:', error)
    // Fallback
    newOrder.value = {
      customer_id: item.customer_id,
      items: [{ product_id: null, quantity: 1, unit_price: 0, total_price: 0 }],
      notes: item.notes || ''
    }
  }
  
  showDialog.value = true
}

async function saveOrder() {
  try {
    const orderData = {
      customer_id: newOrder.value.customer_id,
      items: newOrder.value.items,
      total_amount: parseFloat(calculateTotal()),
      notes: newOrder.value.notes || ''
    }
    
    if (isEditing.value) {
      // Update existing order
      await patch('/orders', {
        action: 'update',
        order_id: editingOrderId.value,
        ...orderData
      })
    } else {
      // Create new order
      await post('/orders', orderData)
    }
    
    showDialog.value = false
    await loadData()
    newOrder.value = { customer_id: null, items: [{ product_id: null, quantity: 1, unit_price: 0, total_price: 0 }], notes: '' }
    isEditing.value = false
    editingOrderId.value = null
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

function deleteItem(item) {
  console.log('Delete:', item)
}

function openPaymentDialog(order) {
  paymentOrder.value = order
  paymentData.value = {
    method: 'cash',
    amount: order.total_amount || 0,
    reference: ''
  }
  showPaymentDialog.value = true
}

async function processPayment() {
  try {
    console.log('Processing payment:', {
      order_id: paymentOrder.value.id,
      payment_method: paymentData.value.method,
      paid_amount: parseFloat(paymentData.value.amount),
      payment_reference: paymentData.value.reference
    })
    
    const result = await patch('/orders', {
      action: 'pay',
      order_id: paymentOrder.value.id,
      payment_method: paymentData.value.method,
      paid_amount: parseFloat(paymentData.value.amount),
      payment_reference: paymentData.value.reference
    })
    
    console.log('Payment result:', result)
    
    showPaymentDialog.value = false
    
    // Refresh orders and products
    await loadData()
    const productsRes = await get('/products')
    products.value = productsRes.data || []
    
    paymentOrder.value = null
    alert('Payment processed successfully!')
  } catch (error) {
    console.error('Failed to process payment:', error)
    alert('Payment failed: ' + (error.message || 'Unknown error'))
  }
}
</script>
