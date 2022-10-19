<script lang="ts" setup>
import { reactive } from 'vue'
import { useEventListener } from '@vueuse/core'
import NumberField from '@/components/NumberField.vue'
import { createAutoIncrementGenerator } from '@0x-jerry/utils'

const nextId = createAutoIncrementGenerator()
const itemId = createAutoIncrementGenerator()

interface BoxItem {
  id: string
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

function addItem(name?: string, opt?: Partial<Omit<BoxItem, 'name'>>) {
  data.items.push({
    x: 0,
    y: 0,
    w: 100,
    h: 40,
    ...opt,
    name: name || 'test-' + nextId(),
    id: itemId(),
  })

  return data.items.at(-1)
}

addItem()
addItem()

function deleteItem(item?: BoxItem | null) {
  if (!item) return

  const idx = data.items.findIndex((i) => i.id === item.id)
  data.items.splice(idx, 1)

  drag.data = null
}

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

const format = 'text/test-item'
function onDrag(e: DragEvent) {
  e.dataTransfer?.setData(format, 'new ' + nextId())
}

function onDrop(e: DragEvent) {
  const name = e.dataTransfer?.getData(format)
  console.log(e)
  drag.data = addItem(name, {
    x: e.offsetX,
    y: e.offsetY,
  })
}
</script>

<template>
  <div class="flex h-screen">
    <div class="box-container flex-1" @drop.prevent="onDrop" @dragover.prevent dropzone="true">
      <div
        class="box"
        v-for="item in data.items"
        :style="boxStyle(item)"
        @mousedown="startDrag(item, $event)"
      >
        {{ item.name }}
      </div>
    </div>

    <div class="setting-panel flex flex-col gap-2 py-2">
      <div class="px-4">
        <div class="box w-fit px-4 py-2 select-none" draggable="true" @dragstart="onDrag">test</div>
      </div>

      <div class="border-b border-gray-200"></div>

      <div class="py-1 px-4 py-1">设置面板</div>
      <div class="border-b border-gray-200"></div>
      <div v-if="drag.data" class="flex flex-col gap-4 px-4">
        <div class="flex">
          <span class="w-80px"> 名称: </span>
          {{ drag.data.name }}
        </div>
        <NumberField name="x" v-model="drag.data.x" :min="0" :max="200"></NumberField>
        <NumberField name="y" v-model="drag.data.y" :min="0" :max="200"></NumberField>
        <NumberField name="width" v-model="drag.data.w"></NumberField>
        <NumberField name="height" v-model="drag.data.h"></NumberField>
        <div>
          <button @click="deleteItem(drag.data)">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less">
.box-container {
  position: relative;
  .box {
    position: absolute;
  }
}

.box {
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

.setting-panel {
  width: 400px;
  border-left: 1px solid #eee;
}
</style>
