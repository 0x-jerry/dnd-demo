<script lang="ts" setup>
import { reactive } from 'vue'
import { useEventListener } from '@vueuse/core'
import NumberField from '@/components/NumberField.vue'

interface BoxItem {
  name: string
  x: number
  y: number
  w: number
  h: number
}

const data = reactive({
  items: [] as BoxItem[],
})

function boxStyle(item: BoxItem) {
  return {
    left: item.x + 'px',
    top: item.y + 'px',
    width: item.w + 'px',
    height: item.h + 'px',
  }
}

function addItem(name: string) {
  data.items.push({
    name,
    x: 0,
    y: 0,
    w: 100,
    h: 40,
  })
}

addItem('test-1')
addItem('test-2')

const drag = reactive({
  isDragging: false,
  target: null as null | Element,
  data: null as null | BoxItem,
})

function startDrag(item: BoxItem, e: MouseEvent) {
  drag.target = e.target as Element
  drag.data = item
  drag.isDragging = true

  drag.target?.classList.add('is-dragging')
}

useEventListener('mousemove', (e) => {
  if (!drag.isDragging || !drag.data) return

  const dx = e.movementX
  const dy = e.movementY

  drag.data.x += dx
  drag.data.y += dy
})

useEventListener('mouseup', () => {
  drag.isDragging = false
  drag.target?.classList.remove('is-dragging')
})
</script>

<template>
  <div class="flex h-screen">
    <div class="box-container flex-1">
      <div
        class="box"
        v-for="item in data.items"
        :style="boxStyle(item)"
        @mousedown="startDrag(item, $event)"
      >
        {{ item.name }}
      </div>
    </div>

    <div class="setting-panel">
      <div class="py-1 border-b border-gray-200 px-4 py-1">设置面板</div>
      <div v-if="drag.data" class="flex flex-col gap-4 px-4 py-2">
        <div class="flex">
          <span class="w-80px"> 名称: </span>
          {{ drag.data.name }}
        </div>
        <NumberField name="x" v-model="drag.data.x" :min="0" :max="200"></NumberField>
        <NumberField name="y" v-model="drag.data.y" :min="0" :max="200"></NumberField>
        <NumberField name="width" v-model="drag.data.w"></NumberField>
        <NumberField name="height" v-model="drag.data.h"></NumberField>
      </div>
    </div>
  </div>
</template>

<style lang="less">
.box-container {
  position: relative;

  .box {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgb(159, 198, 245);
    cursor: grab;
    background: white;

    &.is-dragging {
      cursor: grabbing;
      border-color: rgb(247, 138, 138);
    }
  }
}

.setting-panel {
  width: 400px;
  border-left: 1px solid #eee;
}
</style>
