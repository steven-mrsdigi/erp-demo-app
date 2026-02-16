<template>
  <div>
    <!-- 页面标题 -->
    <div class="d-flex align-center justify-space-between mb-4">
      <h1 class="text-h5 text-sm-h4">Products</h1>
      <v-btn 
        color="primary" 
        size="small"
        :size="isMobile ? 'small' : 'default'"
        @click="openAddDialog"
        prepend-icon="mdi-plus"
      >
        <span class="d-none d-sm-inline">Add Product</span>
        <span class="d-sm-none">Add</span>
      </v-btn>
    </div>

    <!-- 桌面端：数据表格 -->
    <v-data-table
      :headers="headers"
      :items="products"
      :loading="loading"
      v-model:sort-by="sortBy"
      @update:sort-by="handleSort"
      class="elevation-1 d-none d-md-block"
      density="comfortable"
    >
      <template v-slot:item.price="{ item }">
        ${{ item.price }}
      </template>
      
      <template v-slot:item.stock_quantity="{ item }">
        <div class="d-flex flex-column">
          <v-chip :color="(item.onhand_qty ?? item.stock_quantity) < 20 ? 'error' : 'success'" size="small" class="mb-1">
            On Hand: {{ item.onhand_qty ?? item.stock_quantity }}
          </v-chip>
          <span class="text-caption">Available: {{ item.available_qty ?? item.stock_quantity }}</span>
        </div>
      </template>
      
      <template v-slot:item.status="{ item }">
        <v-chip :color="item.status === 'active' ? 'success' : 'grey'" size="small">
          {{ item.status }}
        </v-chip>
      </template>
      
      <template v-slot:item.actions="{ item }">
        <v-btn icon size="small" variant="text" @click="editItem(item)">
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
        <v-col v-for="product in products" :key="product.id" cols="12" sm="6">
          <v-card class="mb-2" elevation="2">
            <v-card-title class="text-subtitle-1 pb-1">
              {{ product.name }}
              <v-chip size="x-small" :color="product.status === 'active' ? 'success' : 'grey'" class="ml-2">
                {{ product.status }}
              </v-chip>
            </v-card-title>
            <v-card-subtitle class="text-caption">
              SKU: {{ product.sku }}
            </v-card-subtitle>
            <v-card-text class="py-2">
              <div class="d-flex justify-space-between align-center">
                <span class="text-h6 font-weight-bold">${{ product.price }}</span>
                <div class="text-right">
                  <v-chip size="small" :color="(product.onhand_qty ?? product.stock_quantity) < 20 ? 'error' : 'success'">
                    On Hand: {{ product.onhand_qty ?? product.stock_quantity }}
                  </v-chip>
                  <div class="text-caption mt-1">
                    Avail: {{ product.available_qty ?? product.stock_quantity }}
                  </div>
                </div>
              </div>
              <div class="text-caption text-grey mt-1">{{ product.category }}</div>
            </v-card-text>
            <v-card-actions>
              <v-btn size="small" variant="text" @click="editItem(product)">
                <v-icon size="small" class="mr-1">mdi-pencil</v-icon>
                Edit
              </v-btn>
              <v-btn size="small" variant="text" color="error" @click="deleteItem(product)">
                <v-icon size="small" class="mr-1">mdi-delete</v-icon>
                Delete
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- 空状态 -->
    <v-alert v-if="!loading && products.length === 0" type="info" class="mt-4">
      No products found. Click "Add Product" to create one.
    </v-alert>

    <!-- Add Product Dialog -->
    <v-dialog v-model="showAddDialog" max-width="600" :fullscreen="isMobile">
      <v-card>
        <v-card-title class="text-h6">
          {{ isEditing ? 'Edit Product' : 'Add Product' }}
          <v-spacer></v-spacer>
          <v-btn icon @click="showAddDialog = false" class="d-md-none">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-text-field v-model="newProduct.name" label="Product Name" required density="comfortable"></v-text-field>
          <v-text-field v-model="newProduct.sku" label="SKU" required density="comfortable"></v-text-field>
          <v-textarea v-model="newProduct.description" label="Description" rows="2" density="comfortable"></v-textarea>
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field v-model="newProduct.price" label="Price" type="number" prefix="$" density="comfortable"></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                v-model="newProduct.tax_rate_id"
                :items="taxRates"
                item-title="name"
                item-value="id"
                label="Tax Rate"
                density="comfortable"
                clearable
              ></v-select>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field v-model="newProduct.stock_quantity" label="Stock Quantity" type="number" density="comfortable"></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-select v-model="newProduct.category" label="Category" :items="categories" density="comfortable"></v-select>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn text @click="showAddDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveProduct">{{ isEditing ? 'Update' : 'Save' }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">
          <v-icon color="error" class="mr-2">mdi-alert</v-icon>
          Confirm Delete
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete product "<strong>{{ productToDelete?.name }}</strong>"?<br>
          <span class="text-caption text-grey">SKU: {{ productToDelete?.sku }}</span>
          <v-alert v-if="deleteError" type="error" class="mt-3" density="compact">
            {{ deleteError }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn text @click="showDeleteDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="confirmDelete" :loading="deleting">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useApi } from '@/composables/useApi'
import { useDisplay } from 'vuetify'

const { get, post, patch, del, loading } = useApi()
const { mdAndUp } = useDisplay()

const isMobile = computed(() => !mdAndUp.value)

const products = ref([])
const taxRates = ref([])
const showAddDialog = ref(false)
const showDeleteDialog = ref(false)
const isEditing = ref(false)
const editingProductId = ref(null)
const productToDelete = ref(null)
const deleteError = ref('')
const deleting = ref(false)
const sortBy = ref([{ key: 'created_at', order: 'desc' }])
const categories = ['Electronics', 'Accessories', 'Software', 'Services']

const newProduct = ref({
  name: '',
  sku: '',
  description: '',
  price: 0,
  tax_rate_id: null,
  stock_quantity: 0,
  category: ''
})

const headers = [
  { title: 'SKU', key: 'sku', sortable: true, width: '120px' },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Price', key: 'price', sortable: true, width: '100px' },
  { title: 'Stock', key: 'stock_quantity', sortable: true, width: '100px' },
  { title: 'Category', key: 'category', sortable: true, width: '120px' },
  { title: 'Status', key: 'status', sortable: true, width: '100px' },
  { title: 'Actions', key: 'actions', sortable: false, width: '100px' }
]

onMounted(async () => {
  await loadData()
})

async function loadData() {
  try {
    const sort = sortBy.value[0]?.key || 'created_at'
    const order = sortBy.value[0]?.order === 'asc' ? 'asc' : 'desc'
    const [productsRes, taxRatesRes] = await Promise.all([
      get(`/products?sort=${sort}&order=${order}`),
      get('/tax-rates')
    ])
    products.value = productsRes.data || []
    taxRates.value = taxRatesRes.data || []
  } catch (error) {
    console.error('Failed to load data:', error)
  }
}

function handleSort(sort) {
  sortBy.value = sort
  loadData()
}

async function saveProduct() {
  try {
    if (isEditing.value) {
      // Update existing product
      await patch('/products', { id: editingProductId.value, ...newProduct.value })
    } else {
      // Create new product
      await post('/products', newProduct.value)
    }
    showAddDialog.value = false
    await loadData()
    newProduct.value = { name: '', sku: '', description: '', price: 0, tax_rate_id: null, stock_quantity: 0, category: '' }
    isEditing.value = false
    editingProductId.value = null
  } catch (error) {
    console.error('Failed to save product:', error)
  }
}

function openAddDialog() {
  isEditing.value = false
  editingProductId.value = null
  newProduct.value = { name: '', sku: '', description: '', price: 0, tax_rate_id: null, stock_quantity: 0, category: '' }
  showAddDialog.value = true
}

function editItem(item) {
  isEditing.value = true
  editingProductId.value = item.id
  newProduct.value = {
    name: item.name || '',
    sku: item.sku || '',
    description: item.description || '',
    price: item.price || 0,
    tax_rate_id: item.tax_rate_id || null,
    stock_quantity: item.stock_quantity || 0,
    category: item.category || ''
  }
  showAddDialog.value = true
}

function deleteItem(item) {
  productToDelete.value = item
  deleteError.value = ''
  showDeleteDialog.value = true
}

async function confirmDelete() {
  if (!productToDelete.value) return
  
  deleting.value = true
  deleteError.value = ''
  
  try {
    await del(`/products?id=${productToDelete.value.id}`)
    showDeleteDialog.value = false
    productToDelete.value = null
    await loadData()
  } catch (error) {
    console.error('Failed to delete product:', error)
    deleteError.value = error.message || 'Failed to delete product. It may be used in existing orders.'
  } finally {
    deleting.value = false
  }
}
</script>
