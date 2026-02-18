<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4">
      <h1 class="text-h5 text-sm-h4">{{ $t('taxRates.title') }}</h1>
      <v-btn 
        color="primary" 
        :size="isMobile ? 'small' : 'default'"
        @click="openAddDialog"
        prepend-icon="mdi-plus"
      >
        <span class="d-none d-sm-inline">{{ $t('taxRates.addTaxRate') }}</span>
        <span class="d-sm-none">{{ $t("common.add") }}</span>
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
          {{ item.is_default ? $t('taxRates.default') : $t('taxRates.no') }}
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
              <div class="text-body-2">{{ rate.description || $t('common.noDescription') }}</div>
            </v-card-text>
            <v-card-actions>
              <v-btn size="small" variant="text" @click="editItem(rate)">
                <v-icon size="small" class="mr-1">mdi-pencil</v-icon>
                {{ $t('common.edit') }}
              </v-btn>
              <v-btn size="small" variant="text" color="error" @click="deleteItem(rate)">
                <v-icon size="small" class="mr-1">mdi-delete</v-icon>
                {{ $t('common.delete') }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Empty State -->
    <v-alert v-if="!loading && taxRates.length === 0" type="info" class="mt-4">
      {{ $t('taxRates.noTaxRates') }}
    </v-alert>

    <!-- Add/Edit Dialog -->
    <v-dialog v-model="showDialog" max-width="500" :fullscreen="isMobile">
      <v-card>
        <v-card-title class="text-h6">
          {{ isEditing ? $t('taxRates.editTaxRate') : $t('taxRates.addTaxRate') }}
          <v-spacer></v-spacer>
          <v-btn icon @click="showDialog = false" class="d-md-none">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-text-field v-model="form.name" :label="$t('taxRates.taxName')" required density="comfortable"></v-text-field>
          <v-text-field v-model="form.rate" :label="$t('taxRates.rate')" type="number" suffix="%" required density="comfortable"></v-text-field>
          <v-textarea v-model="form.description" :label="$t('common.description')" rows="2" density="comfortable"></v-textarea>
          <v-switch v-model="form.is_default" :label="$t('taxRates.setAsDefault')" density="comfortable"></v-switch>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn text @click="showDialog = false">{{ $t("common.cancel") }}</v-btn>
          <v-btn color="primary" @click="saveTaxRate">{{ isEditing ? $t('common.update') : $t('common.save') }}</v-btn>
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

const { get, post, patch, del, loading: apiLoading } = useApi()
const { mdAndUp } = useDisplay()
const { t } = useI18n()

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

const headers = computed(() => [
  { title: t('common.name'), key: 'name', sortable: true },
  { title: t('taxRates.rate'), key: 'rate', sortable: true, width: '100px' },
  { title: t('common.description'), key: 'description', sortable: true },
  { title: t('taxRates.isDefault'), key: 'is_default', sortable: true, width: '100px' },
  { title: t('common.actions'), key: 'actions', sortable: false, width: '100px' }
])

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
  }
}

async function deleteItem(item) {
  if (!confirm(t('taxRates.deleteConfirm', { name: item.name }))) return
  try {
    await del(`/tax-rates?id=${item.id}`)
    await loadData()
  } catch (error) {
    console.error('Failed to delete:', error)
  }
}
</script>
