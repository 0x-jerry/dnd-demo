interface Disposable {
  dispose(): void
}

export function createResourceTracker<T extends Disposable>() {
  let objects: Set<T> = new Set()

  return {
    add(obj: T) {
      objects.add(obj)
    },
    dispose(obj?: T) {
      if (obj) {
        obj.dispose()
        objects.delete(obj)
        return
      }

      objects.forEach((item) => {
        item.dispose()
      })

      objects = new Set()
    },
  }
}
