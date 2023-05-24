export default {
  methods: {
    parseEntries (entries, parent = [], depth = 0) {
      // const entries = object.entries(d)
      // for entry in entries (now is an array)
      // first element in array is label
      // second element is object or array
      //
      // If object: value is value, type tells what kind of input to use
      // If type==multiple, needs to be able to add more than one of that object
      // If array: need to recurse on the remaining objects
      const parsedEntries = []
      for (const entry of entries) {
        if (entry[1]?.type === 'multiples') {
          const newEntry = {
            label: entry[0],
            vmodel: [...parent, entry[0]],
            type: 'multiple',
            entries: []
          }
          const valuesList = entry[1]?.values ?? []
          const len = valuesList.length
          for (let i = 0; i < len; i++) { // there may be multiple values entered
            newEntry.entries[i] = {
              label: `${entry[0]} #${i + 1}`,
              type: `header${depth}`,
              vmodel: [...parent, 'values', `${entry[0]} #${i + 1}`]
            }
            const nestedEntries = Object.entries(valuesList[i])
            newEntry.entries[i].entries = this.parseEntries(nestedEntries,
              [...parent, entry[0], 'values', i], depth + 1)
          }
          parsedEntries.push(newEntry)
        } else if (!('value' in entry[1])) { // requires recursion
          const newEntry = {
            label: entry[0],
            vmodel: [...parent, entry[0]],
            type: `header${depth}`,
            entries: this.parseEntries(Object.entries(entry[1]), [...parent, entry[0]], depth + 1)
          }
          parsedEntries.push(newEntry)
        } else { // is a normal object
          const newEntry = {
            label: entry[0],
            vmodel: [...parent, entry[0]],
            type: entry[1]?.type,
            value: ''
          }
          if (entry[1]?.type === 'List') {
            newEntry.validList = entry[1]?.validList
          }
          parsedEntries.push(newEntry)
        }
      }
      return parsedEntries
    },
    addEntryUI (e) {
      const getNestedObject = (nestedObj, pathArr) => {
        return pathArr.reduce(
          (obj, key) => (obj && obj[key].entries !== 'undefined' ? obj[key].entries : null),
          nestedObj
        )
      }
      var multipleValues = getNestedObject(this.steps, e)
      const newEntry = this.createEmptyEntry(multipleValues[0], multipleValues.length + 1)
      multipleValues.push(newEntry)
    },
    createEmptyEntry (obj, newNumber, newObj = {}) {
      const regex = /[A-Za-z0-9]+\s#[0-9]+/i
      if (typeof obj !== 'object') {
        if (regex.test(obj)) {
          return obj.split('#')[0] + `#${newNumber}`
        } return obj
      }
      for (const key in obj) {
        if (key === 'value') { newObj[key] = '' } else if (Array.isArray(obj[key])) {
          newObj[key] = []
          const len = obj[key].length
          for (let i = 0; i < len; i++) {
            if ((key === 'vmodel') && (i === 2) && typeof (obj.vmodel[i]) === 'number') {
              newObj[key].push(newNumber - 1)
            } else newObj[key].push(this.createEmptyEntry(obj[key][i], newNumber))
          }
        } else newObj[key] = this.createEmptyEntry(obj[key], newNumber)
      }
      return newObj
    }
  }
}
