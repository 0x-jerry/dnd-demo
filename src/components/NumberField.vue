<script lang="ts" setup>
const props = defineProps<{
  name: string
  modelValue: number
  min?: number
  max?: number
}>()

defineEmits<{
  (type: 'update:modelValue', value: number): void
}>()

const value = useVModel(props)

const hasRange = computed(() => {
  return typeof props.min === 'number' && typeof props.max === 'number'
})
</script>

<template>
  <div class="field flex">
    <span class="w-80px">{{ name }}</span>
    <input type="number" v-model="value" />
    <!-- <input v-if="hasRange" type="range" v-model="value" :min="min" :max="max" /> -->
  </div>
</template>

<style lang="less"></style>
