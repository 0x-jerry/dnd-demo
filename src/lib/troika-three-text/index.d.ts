type A = typeof import('./types/src/index').Text

declare module 'troika-three-text' {
  import { Mesh } from 'three'

  export const Text: {
    new (): Mesh & InstanceType<A>
  }
}
