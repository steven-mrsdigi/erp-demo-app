<template>
  <v-menu>
    <template v-slot:activator="{ props }">
      <v-btn
        v-bind="props"
        icon
        size="small"
        variant="text"
      >
        <v-icon>mdi-translate</v-icon>
      </v-btn>
    </template>
    <v-list density="compact">
      <v-list-subheader>{{ $t('language.title') }}</v-list-subheader>
      <v-list-item
        v-for="lang in languages"
        :key="lang.code"
        @click="changeLanguage(lang.code)"
        :active="currentLocale === lang.code"
      >
        <v-list-item-title>{{ lang.name }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>

  <v-btn
    icon
    size="small"
    variant="text"
    @click="toggleTheme"
  >
    <v-icon>{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
  </v-btn>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme } from 'vuetify'

const { locale } = useI18n()
const theme = useTheme()

const currentLocale = computed(() => locale.value)
const isDark = computed(() => theme.global.current.value.dark)

const languages = [
  { code: 'en', name: 'English' },
  { code: 'zh-CN', name: '简体中文' },
  { code: 'zh-TW', name: '繁體中文' },
  { code: 'fr', name: 'Français' },
]

function changeLanguage(code) {
  locale.value = code
  localStorage.setItem('erp-language', code)
}

function toggleTheme() {
  const newTheme = isDark.value ? 'light' : 'dark'
  theme.global.name.value = newTheme
  localStorage.setItem('erp-theme', newTheme)
}
</script>
