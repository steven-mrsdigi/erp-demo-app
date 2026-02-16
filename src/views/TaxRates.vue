<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4">
      <h1 class="text-h5 text-sm-h4">Tax Rates</h1>
      <v-btn 
        color="primary" 
        :size="isMobile ? 'small' : 'default'"
        @click="openAddDialog"
        prepend-icon="mdi-plus"
      >
        <span class="d-none d-sm-inline">Add Tax Rate</span>
        <span class="d-sm-none">Add</span>
      </v-btn>
    </div>

    <!-- Tax Rates Table -->
    <v-data-table
      :headers="headers"
      :items="taxRates"
      :loading="loading"
      v-model:sort-by="sortBy"
      @update:sort-by="handleSort"
      class="elevation-1 d-none d-md-block"
      density="comfortable"
    >
      <template v-slot:item.rate="{ item }">
        {{ item.rate }}%
      </template>
      
      <template v-slot:item.is_default="{ item }">
        <v-chip :color="item.is_default ? 'success' : 'grey'" size="small">
          {{ item.is_default ? 'Default' : 'No' }}
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

    <!-- Mobile Cards -->
    <div class="d-md-none">
      <v-row>
        <v-col v-for="rate in taxRates" :key="rate.id" cols="12" sm="6">
          <v-card class="mb-2" elevation="2">
            <v-card-title class="text-subtitle-1 d-flex justify-space-between">
              {{ rate.name }}
              <v-chip size="x-small" :color="rate.is_default ? 'success' : 'grey'">
                {{ rate.rate }}%
              </v-chip>
            </v-card-title>
            <v-card-text>
              <div class="text-body-2">{{ rate.description || 'No description' }}</div>
            </v-card-text>
            <v-card-actions>
              <v-btn size="small" variant="text" @click="editItem(rate)">
                <v-icon size="small" class="mr-1">mdi-pencil</v-icon>
                Edit
              </v-btn>
              <v-btn size="small" variant="text" color="error" @click="deleteItem(rate)">
                <v-icon size="small" class="mr-1">mdi-delete</v-icon>
                Delete
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Empty State -->
    <v-alert v-if="!loading && taxRates.length === 0" type="info" class="mt-4">
      No tax rates found. Click "Add Tax Rate" to create one.
    </v-alert>

    <!-- Add/Edit Dialog -->
    <v-dialog v-model="showDialog" max-width="500" :fullscreen="isMobile">
      <v-card>
        <v-card-title class="text-h6">
          {{ isEditing ? 'Edit Tax Rate' : 'Add Tax Rate' }}
          <v-spacer></v-spacer>
          <v-btn icon @click="showDialog = false" class="d-md-none">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-text-field v-model="form.name" label="Tax Name" required density="comfortable" placeholder="e.g., GST 5%"></v-text-field>
          <v-text-field v-model="form.rate" label="Rate" type="number" suffix="%" required density="comfortable" placeholder="5"></v-text-field>
          <v-textarea v-model="form.description" label="Description" rows="2" density="comfortable"></v-textarea>
          <v-switch v-model="form.is_default" label="Set as default tax rate" density="comfortable"></v-switch>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn text @click="showDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveTaxRate">{{ isEditing ? 'Update' : 'Save' }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useApi } from '@/composables/useApi'
import { useDisplay } from 'vuetify'

const { get, post, patch, del, loading: apiLoading } = useApi()
const { mdAndUp } = useDisplay()

const isMobile = computed(() => !mdAndUp.value)

const taxRates = ref([])
const showDialog = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const loading = ref(false)
const sortBy = ref([{ key: 'name', order: 'asc' }])

const form = ref({
  name: '',
  rate: 0,
  description: '',
  is_default: false
})

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Rate', key: 'rate', sortable: true, width: '100px' },
  { title: 'Description', key: 'description', sortable: true },
  { title: 'Default', key: 'is_default', sortable: true, width: '100px' },
  { title: 'Actions', key: 'actions', sortable: false, width: '100px' }
]

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  try {
    const sort = sortBy.value[0]?.key || 'name'
    const order = sortBy.value[0]?.order === 'asc' ? 'asc' : 'desc'
    const response = await get(`/tax-rates?sort=${sort}&order=${order}`)
    taxRates.value = response.data || []
  } catch (error) {
    console.error('Failed to load tax rates:', error)
  } finally {
    loading.value = false
  }
}

function handleSort(sort) {
  sortBy.value = sort
  loadData()
}

function openAddDialog() {
  isEditing.value = false
  editingId.value = null
  form.value = { name: '', rate: 0, description: '', is_default: false }
  showDialog.value = true
}

function editItem(item) {
  isEditing.value = true
  editingId.value = item.id
  form.value = {
    name: item.name || '',
    rate: item.rate || 0,
    description: item.description || '',
    is_default: item.is_default || false
  }
  showDialog.value = true
}

async function saveTaxRate() {
  try {
    if (isEditing.value) {
      await patch('/tax-rates', { id: editingId.value, ...form.value })
    } else {
      await post('/tax-rates', form.value)
    }
    showDialog.value = false
    await loadData()
  } catch (error) {
    console.error('Failed to save tax rate:', error)
    alert('Failed to save: ' + (error.message || 'Unknown error'))
  }
}

async function deleteItem(item) {
  if (!confirm(`Delete "${item.name}"?`)) return
  try {
    await del(`/tax-rates?id=${item.id}`)
    await loadData()
  } catch (error) {
    console.error('Failed to delete:', error)
    alert('Failed to delete: ' + (error.message || 'Unknown error'))
  }
}
</script>
