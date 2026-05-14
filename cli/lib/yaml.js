function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

function dumpArray(arr, indent) {
  const pad = '  '.repeat(indent)
  if (arr.length === 0) return `${pad}[]\n`
  return arr.map((v) => `${pad}- ${String(v)}\n`).join('')
}

function dumpObject(obj, indent) {
  const pad = '  '.repeat(indent)
  const keys = Object.keys(obj)
  if (keys.length === 0) return `${pad}{}\n`

  return keys
    .map((k) => {
      const v = obj[k]
      if (Array.isArray(v)) return `${pad}${k}:\n${dumpArray(v, indent + 1)}`
      if (isPlainObject(v)) return `${pad}${k}:\n${dumpObject(v, indent + 1)}`
      return `${pad}${k}: ${String(v)}\n`
    })
    .join('')
}

function dumpYaml(value) {
  if (Array.isArray(value)) return dumpArray(value, 0)
  if (isPlainObject(value)) return dumpObject(value, 0)
  return `${String(value)}\n`
}

module.exports = { dumpYaml }

