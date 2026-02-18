<template>
  <div>
    <!-- 页面标题 -->
    <div class="d-flex align-center justify-space-between mb-4">
      <h1 class="text-h5 text-sm-h4">{{ $t('customers.title') }}</h1>
      <v-btn
        color="primary"
        :size="isMobile ? 'small' : 'default'"
        @click="openAddDialog"
        prepend-icon="mdi-plus"
      >
        <span class="d-none d-sm-inline">{{ $t('customers.addCustomer') }}</span>
        <span class="d-sm-none">{{ $t("common.add") }}</span>
      </v-btn>
    </div>

    <!-- 桌面端：数据表格 -->
    <v-data-table
      :headers="headers"
      :items="customers"
      :loading="loading"
      v-model:sort-by="sortBy"
      @update:sort-by="handleSort"
      class="elevation-1 d-none d-md-block"
      density="comfortable"
    >
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
        <v-col v-for="customer in customers" :key="customer.id" cols="12" sm="6">
          <v-card class="mb-2" elevation="2">
            <v-card-title class="text-subtitle-1 pb-1">
              {{ customer.name }}
              <v-chip size="x-small" :color="customer.status === 'active' ? 'success' : 'grey'" class="ml-2">
                {{ customer.status }}
              </v-chip>
            </v-card-title>
            <v-card-subtitle class="text-caption">
              {{ customer.company || $t('common.noCompany') }}
            </v-card-subtitle>
            <v-card-text class="py-2">
              <div class="d-flex align-center mb-1">
                <v-icon size="small" class="mr-2">mdi-email</v-icon>
                <span class="text-body-2">{{ customer.email || $t('common.noEmail') }}</span>
              </div>
              <div class="d-flex align-center">
                <v-icon size="small" class="mr-2">mdi-phone</v-icon>
                <span class="text-body-2">{{ customer.phone || $t('common.noPhone') }}</span>
              </div>
            </v-card-text>
            <v-card-actions>
              <v-btn size="small" variant="text" @click="editItem(customer)">
                <v-icon size="small" class="mr-1">mdi-pencil</v-icon>
                {{ $t('common.edit') }}
              </v-btn>
              <v-btn size="small" variant="text" color="error" @click="deleteItem(customer)">
                <v-icon size="small" class="mr-1">mdi-delete</v-icon>
                {{ $t('common.delete') }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- 空状态 -->
    <v-alert v-if="!loading && customers.length === 0" type="info" class="mt-4">
      {{ $t('customers.noCustomers') }}
    </v-alert>

    <!-- Add/Edit Customer Dialog -->
    <v-dialog v-model="showAddDialog" max-width="600" :fullscreen="isMobile">
      <v-card>
        <v-card-title class="text-h6">
          {{ isEditing ? $t('customers.editCustomer') : $t('customers.addCustomer') }}
          <v-spacer></v-spacer>
          <v-btn icon @click="showAddDialog = false" class="d-md-none">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-text-field v-model="newCustomer.name" :label="$t('common.name')" required density="comfortable"></v-text-field>
          <v-text-field v-model="newCustomer.email" :label="$t('customers.email')" type="email" density="comfortable"></v-text-field>
          <v-text-field v-model="newCustomer.phone" :label="$t('customers.phone')" density="comfortable"></v-text-field>
          <v-text-field v-model="newCustomer.company" :label="$t('customers.company')" density="comfortable"></v-text-field>
          <v-textarea v-model="newCustomer.address" :label="$t('customers.address')" rows="2" density="comfortable"></v-textarea>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn text @click="showAddDialog = false">{{ $t("common.cancel") }}</v-btn>
          <v-btn color="primary" @click="saveCustomer">{{ isEditing ? $t('common.update') : $t('common.save') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useApi } from '@/composables/useApi'
import { useDisplay } from 'vuetify'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { get, post, patch, loading } = useApi()
const { mdAndUp } = useDisplay()

const isMobile = computed(() => !mdAndUp.value)

const customers = ref([])
const showAddDialog = ref(false)
const isEditing = ref(false)
const editingCustomerId = ref(null)
const sortBy = ref([{ key: 'name', order: 'asc' }])

const newCustomer = ref({
  name: '',
  email: '',
  phone: '',
  company: '',
  address: ''
})

const headers = computed(() => [
  { title: t('common.name'), key: 'name', sortable: true },
  { title: t('customers.email'), key: 'email', sortable: true },
  { title: t('customers.phone'), key: 'phone', sortable: true },
  { title: t('customers.company'), key: 'company', sortable: true },
  { title: t('common.status'), key: 'status', sortable: true, width: '100px' },
  { title: t('common.actions'), key: 'actions', sortable: false, width: '100px' }
])

onMounted(async () => {
  await loadData()
})

async function loadData() {
  try {
    const sort = sortBy.value[0]?.key || 'name'
    const order = sortBy.value[0]?.order === 'asc' ? 'asc' : 'desc'
    const response = await get(`/customers?sort=${sort}&order=${order}`)
    customers.value = response.data || []
  } catch (error) {
    console.error('Failed to load customers:', error)
  }
}

function handleSort(sort) {
  sortBy.value = sort
  loadData()
}

async function saveCustomer() {
  try {
    if (isEditing.value) {
      // Update existing customer
      await patch('/customers', { id: editingCustomerId.value, ...newCustomer.value })
    } else {
      // Create new customer
      await post('/customers', newCustomer.value)
    }
    showAddDialog.value = false
    await loadData()
    newCustomer.value = { name: '', email: '', phone: '', company: '', address: '' }
    isEditing.value = false
    editingCustomerId.value = null
  } catch (error) {
    console.error('Failed to save customer:', error)
  }
}

function openAddDialog() {
  isEditing.value = false
  editingCustomerId.value = null
  newCustomer.value = { name: '', email: '', phone: '', company: '', address: '' }
  showAddDialog.value = true
}

function editItem(item) {
  isEditing.value = true
  editingCustomerId.value = item.id
  newCustomer.value = {
    name: item.name || '',
    email: item.email || '',
    phone: item.phone || '',
    company: item.company || '',
    address: item.address || ''
  }
  showAddDialog.value = true
}

function deleteItem(item) {
  console.log('Delete:', item)
}
</script>
