<template>
  <div>
    <!-- 页面标题 -->
    <div class="d-flex align-center justify-space-between mb-4">
      <h1 class="text-h5 text-sm-h4">Products</h1>
      <v-btn 
        color="primary" 
        size="small"
        :size="isMobile ? 'small' : 'default'"
        @click="showAddDialog = true"
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
          Add Product
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
              <v-text-field v-model="newProduct.stock_quantity" label="Stock Quantity" type="number" density="comfortable"></v-text-field>
            </v-col>
          </v-row>
          <v-select v-model="newProduct.category" label="Category" :items="categories" density="comfortable"></v-select>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn text @click="showAddDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveProduct">Save</v-btn>
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

const products = ref([])
const showAddDialog = ref(false)
const categories = ['Electronics', 'Accessories', 'Software', 'Services']

const newProduct = ref({
  name: '',
  sku: '',
  description: '',
  price: 0,
  stock_quantity: 0,
  category: ''
})

const headers = [
  { title: 'SKU', key: 'sku', width: '120px' },
  { title: 'Name', key: 'name' },
  { title: 'Price', key: 'price', width: '100px' },
  { title: 'Stock', key: 'stock_quantity', width: '100px' },
  { title: 'Category', key: 'category', width: '120px' },
  { title: 'Status', key: 'status', width: '100px' },
  { title: 'Actions', key: 'actions', sortable: false, width: '100px' }
]

onMounted(async () => {
  try {
    const response = await get('/products')
    products.value = response.data || []
  } catch (error) {
    console.error('Failed to load products:', error)
  }
})

async function saveProduct() {
  try {
    await post('/products', newProduct.value)
    showAddDialog.value = false
    const response = await get('/products')
    products.value = response.data || []
    newProduct.value = { name: '', sku: '', description: '', price: 0, stock_quantity: 0, category: '' }
  } catch (error) {
    console.error('Failed to save product:', error)
  }
}

function editItem(item) {
  console.log('Edit:', item)
}

function deleteItem(item) {
  console.log('Delete:', item)
}
</script>
