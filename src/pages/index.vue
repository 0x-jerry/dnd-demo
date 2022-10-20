<script lang="ts" setup>
import { reactive } from 'vue'
import { useEventListener } from '@vueuse/core'
import NumberField from '@/components/NumberField.vue'
import { createAutoIncrementGenerator } from '@0x-jerry/utils'
import * as THREE from 'three'
import { DragControls } from 'three/examples/jsm/controls/DragControls'
import { MapControls } from 'three/examples/jsm/controls/OrbitControls'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls'

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
  data: null as null | BoxItem | undefined,
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

  drag.target?.classList.add('is-dragging')
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

// -------- three
const threeRoot = ref<HTMLElement>()
// THREE
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000)
camera.position.set(50, 40, 10)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.outputEncoding = THREE.sRGBEncoding
renderer.shadowMap.enabled = true
renderer.setClearColor(0xeeeeee)
renderer.setPixelRatio(window.devicePixelRatio)

scene.background = new THREE.Color().setHSL(0.6, 0, 1)
scene.fog = new THREE.Fog(scene.background, 1, 5000)

// LIGHTS

const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6)
hemiLight.color.setHSL(0.6, 1, 0.6)
hemiLight.groundColor.setHSL(0.095, 1, 0.75)
hemiLight.position.set(0, 50, 0)
scene.add(hemiLight)

const hemiLightHelper = new THREE.HemisphereLightHelper(hemiLight, 10)
scene.add(hemiLightHelper)

//
const dirLight = new THREE.DirectionalLight(0xffffff, 1)
dirLight.color.setHSL(0.1, 1, 0.95)
dirLight.position.set(-1, 1.75, 1)
dirLight.position.multiplyScalar(30)
scene.add(dirLight)

dirLight.castShadow = true

dirLight.shadow.mapSize.width = 2048
dirLight.shadow.mapSize.height = 2048

const d = 50

dirLight.shadow.camera.left = -d
dirLight.shadow.camera.right = d
dirLight.shadow.camera.top = d
dirLight.shadow.camera.bottom = -d

dirLight.shadow.camera.far = 3500
dirLight.shadow.bias = -0.0001

const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 10)
scene.add(dirLightHelper)
// --- GROUND

scene.add(new THREE.GridHelper(200, 10))

// ------

const geometry = new THREE.BoxGeometry(10, 10, 10)
const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 })
const cube = new THREE.Mesh(geometry, material)

cube.castShadow = true
cube.receiveShadow = true

{
  // const controls = new DragControls([cube], camera, renderer.domElement)
}

const cameraControl = new MapControls(camera, renderer.domElement)

cameraControl.enableDamping = true // an animation loop is required when either damping or auto-rotation are enabled
cameraControl.dampingFactor = 0.05

cameraControl.screenSpacePanning = false

cameraControl.minDistance = 1
cameraControl.maxDistance = 400

cameraControl.maxPolarAngle = Math.PI / 2
cameraControl.addEventListener('change', updateRender)

{
  const control = new TransformControls(camera, renderer.domElement)

  control.addEventListener('dragging-changed', function (event) {
    cameraControl.enabled = !event.value
  })

  control.attach(cube)
  control.addEventListener('change', updateRender)

  scene.add(control)
}

scene.add(cube)

camera.position.z = 5

const pointer = {
  x: 0,
  y: 0,
}

function pointerPos(event: MouseEvent) {
  const target = event.target as HTMLElement

  pointer.x = (event.offsetX / target.clientWidth) * 2 - 1
  pointer.y = -(event.offsetY / target.clientHeight) * 2 + 1
}

useRafFn(() => {
  updateRender()
})

function updateRender() {
  renderer.render(scene, camera)
}

onMounted(() => {
  const el = threeRoot.value
  if (!el) return

  camera.aspect = el.clientWidth / el.clientHeight
  camera.updateProjectionMatrix()

  renderer.setSize(el.clientWidth, el.clientHeight)
  el.appendChild(renderer.domElement)
})

onUnmounted(() => {
  renderer.domElement.remove()
})
// ---------
</script>

<template>
  <div class="flex h-screen">
    <div class="flex-1 flex flex-col">
      <div
        class="box-container flex-1 select-none"
        @drop.prevent="onDrop"
        @dragover.prevent
        dropzone="true"
        @click.self="drag.data = null"
      >
        <div
          class="box"
          v-for="item in data.items"
          :class="{
            'is-selected': drag.data?.id === item.id,
          }"
          :style="boxStyle(item)"
          @mousedown="startDrag(item, $event)"
        >
          {{ item.name }}
        </div>
      </div>
      <div class="flex-1 border-t border-gray-200" ref="threeRoot" @mousemove="pointerPos">
        <!--  -->
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

    &.is-selected {
      background: rgb(208, 241, 255);
    }
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
