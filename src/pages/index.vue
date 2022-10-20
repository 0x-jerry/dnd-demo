<script lang="ts" setup>
import { reactive } from 'vue'
import { useEventListener } from '@vueuse/core'
import NumberField from '@/components/NumberField.vue'
import { createAutoIncrementGenerator } from '@0x-jerry/utils'
import * as THREE from 'three'
import { MapControls } from 'three/examples/jsm/controls/OrbitControls'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls'
import { Pane } from 'tweakpane'
import { Text as ThreeText } from 'troika-three-text'

const nextId = createAutoIncrementGenerator()
const itemId = createAutoIncrementGenerator()

const option = {
  cubeColor: '#797979',
  lineColor: '#797979',
  produce: {
    scaleCoord: 0.1,
    scaleSize: 0.1,
  },
}

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
addItem(undefined, {
  x: 10,
  y: 10,
})

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

const cameraControl = new MapControls(camera, renderer.domElement)

cameraControl.enableDamping = true // an animation loop is required when either damping or auto-rotation are enabled
cameraControl.dampingFactor = 0.05

cameraControl.screenSpacePanning = false

cameraControl.minDistance = 1
cameraControl.maxDistance = 400

cameraControl.maxPolarAngle = Math.PI / 2
cameraControl.addEventListener('change', updateRender)

{
  // const control = new TransformControls(camera, renderer.domElement)
  // control.addEventListener('dragging-changed', function (event) {
  //   cameraControl.enabled = !event.value
  // })
  // control.attach(cube)
  // control.addEventListener('change', updateRender)
  // scene.add(control)
}

camera.position.z = 5

{
  const axesHelper = new THREE.AxesHelper(5000)
  scene.add(axesHelper)
}

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
  camera.position.set(12.212375655035835, 58.55811591470866, 41.5784838932445)
  camera.quaternion.set(
    -0.4725898347770624,
    -0.0158657797807186,
    -0.00850983807602517,
    0.8810985800426978,
  )

  renderer.setSize(el.clientWidth, el.clientHeight)
  el.appendChild(renderer.domElement)

  generateCubes()
})

onUnmounted(() => {
  renderer.domElement.remove()
})

// ---------

const cubeMaterial = new THREE.MeshLambertMaterial({ color: new THREE.Color(option.cubeColor) })
const lineMaterial = new THREE.LineBasicMaterial({ color: new THREE.Color(option.lineColor) })

const meshes: THREE.Object3D[] = []

function generateCubes() {
  meshes.forEach((item) => {
    item.removeFromParent()
  })
  meshes.splice(0)

  const coordScale = option.produce.scaleCoord
  const sizeScale = option.produce.scaleSize

  data.items.forEach((item) => {
    const z = 1 + Math.random() * 2
    const w = item.w * sizeScale
    const h = item.h * sizeScale
    const geometry = new THREE.BoxGeometry(w, z, h)

    geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(w / 2, z / 2, h / 2))

    const cube = new THREE.Mesh(geometry, cubeMaterial)

    {
      cube.castShadow = true
      cube.receiveShadow = true
      cube.position.setX(item.x * coordScale)
      cube.position.setZ(item.y * coordScale)

      scene.add(cube)
      meshes.push(cube)
    }

    {
      const points = []
      points.push(new THREE.Vector3(cube.position.x, 0, cube.position.z))
      points.push(new THREE.Vector3(cube.position.x, cube.position.y + 10, cube.position.z))

      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)

      const line = new THREE.Line(lineGeometry, lineMaterial)
      scene.add(line)
      meshes.push(line)
    }

    {
      const text = new ThreeText()
      scene.add(text)

      // Set properties to configure:
      text.text = item.name
      text.fontSize = 3

      text.position.set(cube.position.x, cube.position.y + 10, cube.position.z)

      text.color = 0x9966ff

      // Update the rendering:
      text.sync()

      meshes.push(text)
    }
  })
}

// -------- tweak pane

let pane: Pane | null

const paneRoot = ref<HTMLElement>()

onMounted(() => {
  pane = new Pane({ title: 'option', container: paneRoot.value })

  pane.addInput(option, 'cubeColor').on('change', (ev) => {
    cubeMaterial.color = new THREE.Color(ev.value)
  })

  pane.addButton({ title: '生成 3D 图' }).on('click', () => {
    generateCubes()
  })

  let p = pane.addFolder({ title: 'Produce' })
  p.addInput(option.produce, 'scaleCoord', { min: 0.1, max: 1 })
})

onUnmounted(() => {
  pane?.dispose()
})
// ----------
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
      <div class="flex-1 border-t border-gray-200 relative">
        <div class="w-full h-full" ref="threeRoot" @mousemove="pointerPos"></div>
        <div class="setting absolute top-0 right-0" ref="paneRoot"></div>
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
