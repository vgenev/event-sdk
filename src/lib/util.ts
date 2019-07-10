const getNestedObject = (parent: any, path: string): any => {
  let child = { ...parent }
  let result: object | null = {}
  let id: string[] = path.split('.')
  for (let i = 0; i < id.length; i++) {
    if (i !== id.length - 1) {
      child = child[id[i]]
    }
    else {
      result = child[id[i]]
    }
  }
  return result || null
}

export { getNestedObject } 