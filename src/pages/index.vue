<script lang="ts" setup>
import { reactive, watch } from 'vue'
import { useEventListener } from '@vueuse/core'
import NumberField from '@/components/NumberField.vue'
import { createAutoIncrementGenerator, toArray, uuid } from '@0x-jerry/utils'
import * as THREE from 'three'
import { MapControls, OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls'
// import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer'
import { Reflector } from 'three/examples/jsm/objects/Reflector'
import { Pane } from 'tweakpane'
import { mapRange, parseListOptions } from '@tweakpane/core'

const nextId = createAutoIncrementGenerator()

interface BoxItem {
  id: string
  name: string
  x: number
  y: number
  w: number
  h: number
  z: number
}

const names = Array(10)
  .fill(0)
  .map((_, idx) => `name-${idx}`)

const items = useLocalStorage<BoxItem[]>('test-items', [])

const defaultOption = {
  cubeColor: '#797979',
  lineColor: '#797979',
  groundColor: '#8c837b',
  showCoord: true,
  produce: {
    scale: 1,
    labelOffset: 10,
  },
  heightRange: {
    min: 2,
    max: 20,
  },
}

const option = useLocalStorage('test-option', defaultOption)

watch(
  () => items.value,
  () => {
    generateCubes()
  },
)

// -----------
function boxStyle(item: BoxItem) {
  return {
    left: item.x + 'px',
    top: item.y + 'px',
    width: item.w + 'px',
    height: item.h + 'px',
  }
}

function hasTheSameName(item: BoxItem, idx: number) {
  return !!items.value.slice(0, idx).find((i) => i.name === item.name)
}
// -----------

function addItem(opt?: Partial<Omit<BoxItem, 'name'>>) {
  items.value.push({
    x: 0,
    y: 0,
    w: 100,
    h: 40,
    z: 5,
    ...opt,
    name: names[0],
    id: uuid(),
  })

  return items.value.at(-1)
}

function deleteItem(item?: BoxItem | null) {
  if (!item) return

  const idx = items.value.findIndex((i) => i.id === item.id)
  items.value.splice(idx, 1)

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
  const type = e.dataTransfer?.getData(format)
  console.log(type)
  drag.data = addItem({
    x: e.offsetX,
    y: e.offsetY,
  })
}

// -------- three
const threeRoot = ref<HTMLElement>()
// THREE
const container = new THREE.Object3D()
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000)
scene.add(container)

// @ts-ignore
window.$c = camera
// @ts-ignore
window.$s = scene

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.outputEncoding = THREE.sRGBEncoding
renderer.shadowMap.enabled = true
renderer.setClearColor(0xeeeeee)
renderer.setPixelRatio(window.devicePixelRatio)

const labelRenderer = new CSS3DRenderer()

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

const d = 500

dirLight.shadow.camera.left = -d
dirLight.shadow.camera.right = d
dirLight.shadow.camera.top = d
dirLight.shadow.camera.bottom = -d

dirLight.shadow.camera.far = 3500
dirLight.shadow.bias = -0.0001

const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 10)
scene.add(dirLightHelper)

// --- GROUND

const planeGeometry = new THREE.PlaneGeometry(1000, 1000)
const planeMaterial = new THREE.MeshLambertMaterial({
  color: option.value.groundColor,
  opacity: 0.7,
  transparent: true,
})

const plane = new THREE.Mesh(planeGeometry, planeMaterial)
plane.rotation.x = -Math.PI / 2
plane.receiveShadow = true

const mirror = new Reflector(planeGeometry, {
  clipBias: 1,
  // textureWidth: window.innerWidth * window.devicePixelRatio,
  // textureHeight: window.innerHeight * window.devicePixelRatio,
  color: 0x889999,
})
mirror.rotation.x = -Math.PI / 2
mirror.position.y = -1

// toArray(plane.material).forEach((item) => {
//   item.transparent = true
//   item.opacity = 0.1
// })

scene.add(plane)
scene.add(mirror)

// ------

const cameraControl = new OrbitControls(camera, labelRenderer.domElement)

cameraControl.enableDamping = true // an animation loop is required when either damping or auto-rotation are enabled
cameraControl.dampingFactor = 0.05

cameraControl.screenSpacePanning = false
cameraControl.enablePan = false

cameraControl.minDistance = 1
cameraControl.maxDistance = 400

cameraControl.maxPolarAngle = Math.PI / 2

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

const axesHelper = new THREE.AxesHelper(5000)
scene.add(axesHelper)

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
  cameraControl.update()
  renderer.render(scene, camera)
  labelRenderer.render(scene, camera)
}

onMounted(() => {
  const el = threeRoot.value
  if (!el) return
  // scene.

  camera.aspect = el.clientWidth / el.clientHeight
  camera.updateProjectionMatrix()
  camera.position.set(439.70056150251946, 205.11216968960736, 394.5127209947809)

  el.appendChild(renderer.domElement)
  renderer.setSize(el.clientWidth, el.clientHeight)

  {
    labelRenderer.setSize(el.clientWidth, el.clientHeight)
    labelRenderer.domElement.style.position = 'absolute'
    labelRenderer.domElement.style.top = '0px'
    el.appendChild(labelRenderer.domElement)
  }

  generateCubes()
  focusOnCenter()
})

onUnmounted(() => {
  renderer.domElement.remove()
  labelRenderer.domElement.remove()
})

// ---------

const cubeMaterial = new THREE.MeshLambertMaterial({
  color: new THREE.Color(option.value.cubeColor),
  transparent: true,
  opacity: 0.85,
})

const lineMaterial = new THREE.LineBasicMaterial({ color: new THREE.Color(option.value.lineColor) })

const meshes: THREE.Object3D[] = []

function generateCubes() {
  meshes.forEach((item) => {
    item.removeFromParent()
  })

  meshes.splice(0)

  const scale = option.value.produce.scale

  const { heightRange } = option.value

  items.value.forEach((item) => {
    const el = threeRoot.value!
    // const cubeHeight =
    const len = Math.sqrt(item.x ** 2 + item.y ** 2)
    const maxLen = Math.sqrt(el.clientWidth ** 2 + el.clientHeight ** 2)

    const h = mapRange(len, 0, maxLen, heightRange.max, heightRange.min)

    const size = {
      x: item.w * scale,
      y: h,
      z: item.h * scale,
    }

    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z)

    geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(size.x / 2, size.y / 2, size.z / 2))

    const cube = new THREE.Mesh(geometry, cubeMaterial)

    {
      cube.castShadow = true
      cube.receiveShadow = true
      cube.position.setX(item.x * scale)
      cube.position.setZ(item.y * scale)

      container.add(cube)
      meshes.push(cube)
    }

    const points = []
    points.push(new THREE.Vector3(size.x / 2, size.y, size.z / 2))
    points.push(
      new THREE.Vector3(size.x / 2, size.y + option.value.produce.labelOffset, size.z / 2),
    )

    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)

    const line = new THREE.Line(lineGeometry, lineMaterial)
    cube.add(line)
    meshes.push(line)

    const label = document.createElement('div')

    label.className = 'label'
    label.textContent = item.name
    label.style.cursor = 'pointer'

    label.addEventListener('pointerdown', () => {
      console.log(item.name)
    })

    const textLabel = new CSS3DObject(label)
    textLabel.position.set(size.x / 2, size.y + option.value.produce.labelOffset, size.z / 2)

    line.add(textLabel)

    meshes.push(textLabel)
  })
}

// -------- tweak pane

let pane: Pane | null

const paneRoot = ref<HTMLElement>()

onMounted(() => {
  pane = new Pane({ title: 'option', container: paneRoot.value })

  pane.addInput(option.value, 'cubeColor').on('change', (ev) => {
    cubeMaterial.color = new THREE.Color(ev.value)
  })

  pane.addInput(option.value, 'groundColor').on('change', (ev) => {
    planeMaterial.color = new THREE.Color(ev.value)
  })

  pane.addInput(option.value, 'showCoord').on('change', (ev) => {
    axesHelper.visible = ev.value
  })

  pane.addButton({ title: '生成 3D 图' }).on('click', () => {
    generateCubes()
  })

  pane.addButton({ title: '相机居中' }).on('click', () => {
    focusOnCenter()
  })

  let p = pane.addFolder({ title: 'Produce' })

  p.addInput(option.value.produce, 'scale', { min: 0.1, max: 1 }).on('change', () => {
    generateCubes()
  })

  p.addInput(option.value.produce, 'labelOffset', { min: 10, max: 100 }).on('change', () => {
    generateCubes()
  })

  p = pane.addFolder({ title: 'height Range' })

  p.addInput(option.value.heightRange, 'min', { min: 1, max: 50 }).on('change', () => {
    generateCubes()
  })

  p.addInput(option.value.heightRange, 'max', { min: 5, max: 100 }).on('change', () => {
    generateCubes()
  })
})

onUnmounted(() => {
  pane?.dispose()
})

// ----------

function focusOnCenter() {
  const c = new THREE.Vector3()
  new THREE.Box3().setFromObject(container).getCenter(c)
  cameraControl.target = c
}
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
          v-for="(item, idx) in items"
          :class="{
            'is-selected': drag.data?.id === item.id,
            'is-same': hasTheSameName(item, idx),
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
          <select v-model="drag.data.name">
            <option v-for="item in names" :value="item">
              {{ item }}
            </option>
          </select>
        </div>
        <NumberField name="x" v-model="drag.data.x" :min="0" :max="200"></NumberField>
        <NumberField name="y" v-model="drag.data.y" :min="0" :max="200"></NumberField>
        <NumberField name="长" v-model="drag.data.h"></NumberField>
        <NumberField name="宽" v-model="drag.data.w"></NumberField>
        <!-- <NumberField name="高" v-model="drag.data.z"></NumberField> -->
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

    &.is-same {
      background: rgb(255, 205, 189);
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

<style>
.label {
  background: rgba(0, 0, 0, 0.482);
  color: white;
  border: 1px solid rgba(190, 190, 190, 0.435);
  font-size: 12px;
  padding: 1px;
}
</style>
