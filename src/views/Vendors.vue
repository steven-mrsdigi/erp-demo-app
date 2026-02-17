<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4">
      <h1 class="text-h5 text-sm-h4">Vendors</h1>
      <v-btn 
        color="primary" 
        :size="isMobile ? 'small' : 'default'"
        @click="showAddDialog = true"
        prepend-icon="mdi-plus"
      >
        <span class="d-none d-sm-inline">Add Vendor</span>
        <span class="d-sm-none">{{ $t("common.add") }}</span>
      </v-btn>
    </div>

    <!-- 桌面端：数据表格 -->
    <v-data-table
      :headers="headers"
      :items="vendors"
      :loading="loading"
      v-model:sort-by="sortBy"
      @update:sort-by="handleSort"
      class="elevation-1 d-none d-md-block"
      density="comfortable"
    >
      <template v-slot:item.actions="{ item }">
        <v-btn icon size="small" variant="text" @click="editVendor(item)">
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
        <v-btn icon size="small" variant="text" color="error" @click="deleteVendor(item)">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </template>
    </v-data-table>

    <!-- 移动端：卡片列表 -->
    <div class="d-md-none">
      <v-row>
        <v-col v-for="vendor in vendors" :key="vendor.id" cols="12">
          <v-card class="mb-2" elevation="2">
            <v-card-title class="text-subtitle-1 pb-1">
              {{ vendor.name }}
            </v-card-title>
            <v-card-subtitle class="text-caption">
              {{ vendor.contact_person || 'No contact' }}
            </v-card-subtitle>
            <v-card-text class="py-2">
              <div class="d-flex align-center mb-1">
                <v-icon size="small" class="mr-2 text-grey">mdi-email</v-icon>
                <span>{{ vendor.email || 'N/A' }}</span>
              </div>
              <div class="d-flex align-center mb-1">
                <v-icon size="small" class="mr-2 text-grey">mdi-phone</v-icon>
                <span>{{ vendor.phone || 'N/A' }}</span>
              </div>
              <div class="d-flex align-center">
                <v-icon size="small" class="mr-2 text-grey">mdi-cash-clock</v-icon>
                <span>{{ vendor.payment_terms || 'N/A' }}</span>
              </div>
            </v-card-text>
            <v-card-actions>
              <v-btn size="small" variant="text" @click="editVendor(vendor)">
                <v-icon size="small" class="mr-1">mdi-pencil</v-icon>
                Edit
              </v-btn>
              <v-btn size="small" variant="text" color="error" @click="deleteVendor(vendor)">
                <v-icon size="small" class="mr-1">mdi-delete</v-icon>
                Delete
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <v-alert v-if="!loading && vendors.length === 0" type="info" class="mt-4">
      No vendors found. Click "Add Vendor" to create one.
    </v-alert>

    <!-- Add Vendor Dialog -->
    <v-dialog v-model="showAddDialog" max-width="600" :fullscreen="isMobile">
      <v-card>
        <v-card-title class="text-h6">
          {{ editingVendor ? 'Edit Vendor' : 'Add Vendor' }}
        </v-card-title>
        <v-card-text>
          <v-text-field v-model="form.name" label="Vendor Name" required density="comfortable"></v-text-field>
          <v-text-field v-model="form.contact_person" label="Contact Person" density="comfortable"></v-text-field>
          <v-text-field v-model="form.email" label="Email" density="comfortable"></v-text-field>
          <v-text-field v-model="form.phone" label="Phone" density="comfortable"></v-text-field>
          <v-textarea v-model="form.address" label="Address" rows="2" density="comfortable"></v-textarea>
          <v-text-field v-model="form.tax_id" label="Tax ID" density="comfortable"></v-text-field>
          <v-text-field v-model="form.payment_terms" label="Payment Terms" density="comfortable" placeholder="e.g., Net 30"></v-text-field>
          <v-textarea v-model="form.notes" label="Notes" rows="2" density="comfortable"></v-textarea>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn text @click="closeDialog">{{ $t("common.cancel") }}</v-btn>
          <v-btn color="primary" @click="saveVendor" :loading="saving">
            {{ editingVendor ? 'Update' : 'Save' }}
          </v-btn>
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

const vendors = ref([])
const showAddDialog = ref(false)
const editingVendor = ref(null)
const saving = ref(false)
const loading = ref(true)
const sortBy = ref([{ key: 'name', order: 'asc' }])

const form = ref({
  name: '',
  contact_person: '',
  email: '',
  phone: '',
  address: '',
  tax_id: '',
  payment_terms: '',
  notes: ''
})

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Contact', key: 'contact_person', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Phone', key: 'phone', sortable: true },
  { title: 'Payment Terms', key: 'payment_terms', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, width: '100px' }
]

onMounted(async () => {
  await loadVendors()
})

async function loadVendors() {
  loading.value = true
  const sort = sortBy.value[0]?.key || 'name'
  const order = sortBy.value[0]?.order === 'asc' ? 'asc' : 'desc'
  const res = await get(`/vendors?sort=${sort}&order=${order}`)
  vendors.value = res.data || []
  loading.value = false
}

function handleSort(sort) {
  sortBy.value = sort
  loadVendors()
}

function editVendor(vendor) {
  editingVendor.value = vendor
  form.value = { ...vendor }
  showAddDialog.value = true
}

function closeDialog() {
  showAddDialog.value = false
  editingVendor.value = null
  form.value = {
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    tax_id: '',
    payment_terms: '',
    notes: ''
  }
}

async function saveVendor() {
  saving.value = true
  try {
    await post('/vendors', form.value)
    await loadVendors()
    closeDialog()
  } catch (error) {
    console.error('Failed to save vendor:', error)
  } finally {
    saving.value = false
  }
}

function deleteVendor(vendor) {
  console.log('Delete vendor:', vendor)
}
</script>
