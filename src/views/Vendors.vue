<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4">
      <h1 class="text-h5 text-sm-h4">{{ $t('vendors.title') }}</h1>
      <v-btn 
        color="primary" 
        :size="isMobile ? 'small' : 'default'"
        @click="showAddDialog = true"
        prepend-icon="mdi-plus"
      >
        <span class="d-none d-sm-inline">{{ $t('vendors.addVendor') }}</span>
        <span class="d-sm-none">{{ $t("common.add") }}</span>
      </v-btn>
    </div>
    <!-- Desktop data table -->
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
    <!-- Mobile card list -->
    <div class="d-md-none">
      <v-row>
        <v-col v-for="vendor in vendors" :key="vendor.id" cols="12">
          <v-card class="mb-2" elevation="2">
            <v-card-title class="text-subtitle-1 pb-1">
              {{ vendor.name }}
            </v-card-title>
            <v-card-subtitle class="text-caption">
              {{ vendor.contact_person || $t('vendors.noContact') }}
            </v-card-subtitle>
            <v-card-text class="py-2">
              <div class="d-flex align-center mb-1">
                <v-icon size="small" class="mr-2 text-grey">mdi-email</v-icon>
                <span>{{ vendor.email || $t('vendors.na') }}</span>
              </div>
              <div class="d-flex align-center mb-1">
                <v-icon size="small" class="mr-2 text-grey">mdi-phone</v-icon>
                <span>{{ vendor.phone || $t('vendors.na') }}</span>
              </div>
              <div class="d-flex align-center">
                <v-icon size="small" class="mr-2 text-grey">mdi-cash-clock</v-icon>
                <span>{{ vendor.payment_terms || $t('vendors.na') }}</span>
              </div>
            </v-card-text>
            <v-card-actions>
              <v-btn size="small" variant="text" @click="editVendor(vendor)">
                <v-icon size="small" class="mr-1">mdi-pencil</v-icon>
                {{ $t('common.edit') }}
              </v-btn>
              <v-btn size="small" variant="text" color="error" @click="deleteVendor(vendor)">
                <v-icon size="small" class="mr-1">mdi-delete</v-icon>
                {{ $t('common.delete') }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>
    <v-alert v-if="!loading && vendors.length === 0" type="info" class="mt-4">
      {{ $t('vendors.noVendors') }}
    </v-alert>
    <!-- Add Vendor Dialog -->
    <v-dialog v-model="showAddDialog" max-width="600" :fullscreen="isMobile">
      <v-card>
        <v-card-title class="text-h6">
          {{ editingVendor ? $t('vendors.editVendor') : $t('vendors.addVendor') }}
        </v-card-title>
        <v-card-text>
          <v-text-field v-model="form.name" :label="$t('vendors.vendorName')" required density="comfortable"></v-text-field>
          <v-text-field v-model="form.contact_person" :label="$t('vendors.contactPerson')" density="comfortable"></v-text-field>
          <v-text-field v-model="form.email" :label="$t('vendors.email')" density="comfortable"></v-text-field>
          <v-text-field v-model="form.phone" :label="$t('vendors.phone')" density="comfortable"></v-text-field>
          <v-textarea v-model="form.address" :label="$t('vendors.address')" rows="2" density="comfortable"></v-textarea>
          <v-text-field v-model="form.tax_id" :label="$t('vendors.taxId')" density="comfortable"></v-text-field>
          <v-text-field v-model="form.payment_terms" :label="$t('vendors.paymentTerms')" density="comfortable" :placeholder="$t('vendors.paymentTermsPlaceholder')"></v-text-field>
          <v-textarea v-model="form.notes" :label="$t('vendors.notes')" rows="2" density="comfortable"></v-textarea>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeDialog">{{ $t("common.cancel") }}</v-btn>
          <v-btn color="primary" @click="saveVendor" :loading="saving">
            {{ editingVendor ? $t('common.update') : $t('common.save') }}
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
import { useI18n } from 'vue-i18n'

const { get, post, loading: apiLoading } = useApi()
const { mdAndUp } = useDisplay()
const { t } = useI18n()

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

const headers = computed(() => [
  { title: t('common.name'), key: 'name', sortable: true },
  { title: t('vendors.contactPerson'), key: 'contact_person', sortable: true },
  { title: t('vendors.email'), key: 'email', sortable: true },
  { title: t('vendors.phone'), key: 'phone', sortable: true },
  { title: t('vendors.paymentTerms'), key: 'payment_terms', sortable: true },
  { title: t('common.actions'), key: 'actions', sortable: false, width: '100px' }
])

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
    if (editingVendor.value) {
      await post('/vendors', { id: editingVendor.value.id, ...form.value })
    } else {
      await post('/vendors', form.value)
    }
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
