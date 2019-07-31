const getNestedObject = (parent: any, path?: string): any => {
  let result = {}
  if (!path) result = parent
  else {
    let child = { ...parent }
    let id: string[] = path.split('.')
    for (let i = 0; i < id.length; i++) {
      if (i !== id.length - 1) {
        child = child[id[i]]
      }
      else {
        result = child[id[i]]
      }
    }
  }
  return result
}

export { getNestedObject } 