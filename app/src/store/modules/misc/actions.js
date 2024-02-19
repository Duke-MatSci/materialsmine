export default {
  async uploadFile (
    { commit, rootGetters },
    { file = null, isTemp = true, isVisualizationCSV = false }
  ) {
    if (!file) return
    let fileName = null
    let fileLink = null
    const formData = new FormData()
    formData.append('uploadfile', file[0])
    const url = !isVisualizationCSV
      ? `/api/files/upload?isTemp=${isTemp}`
      : `/api/files/upload?isVisualizationCSV=${isTemp}`
    try {
      const token = rootGetters['auth/token']
      if (!token) {
        throw new Error('To upload a file, you need to log in')
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer ' + token
        },
        body: formData
      })
      const resData = await res.json()
      const { filename, swaggerFilename } = resData?.files[0]
      fileLink = filename
      fileName = swaggerFilename
      commit('setUploadedFile', fileName)
    } catch (err) {
      throw new Error(err?.message ?? 'File Upload Error')
    }
    return { fileName, fileLink }
  },
  async deleteFile (
    { commit, rootGetters },
    { name = null, link = null, isTemp = true }
  ) {
    if (!link && !name) return

    const url = !link ? `/api/files/${name}?isFileStore=${isTemp}` : link
    const token = rootGetters['auth/token']

    let deleted = false
    let error = null

    try {
      const req = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        method: 'DELETE'
      })
      if (req.status !== 200) {
        let res
        if (req.status === 400) res = await req.json()
        throw new Error(res?.message ?? 'Something went wrong')
      }
      commit('setUploadedFile', '')
      deleted = true
    } catch (err) {
      error = err?.message ?? 'Something went wrong'
    }

    return { deleted, error }
  },

  async fetchWrapper (
    { dispatch },
    { url = '', body = '{}', reset = false, expiresIn = 10800000 }
  ) {
    if (!url) {
      // TODO: Are we ever gonna need this?
      throw new Error('Provide Url Query')
    }

    // No need to reassign body to cBody since it's not modified
    const hashedKey = `#${url}#${body}#`
    const newHashedKey = await dispatch('toHash', hashedKey)
    const date = new Date().getTime() + expiresIn

    // Simplify IndexedDB access
    const indexedDB =
      window.indexedDB ||
      window.mozIndexedDB ||
      window.webkitIndexedDB ||
      window.msIndexedDB
    const cacheDB = 'cachedRequest'
    const dbVersion = 2

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(cacheDB, dbVersion)

      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error)
        reject(new Error('IndexedDB error'))
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains('requests')) {
          const store = db.createObjectStore('requests', {
            keyPath: 'id',
            autoIncrement: true
          })
          store.createIndex('request_hash', 'hash', { unique: true })
        }
      }

      request.onsuccess = async (event) => {
        const db = event.target.result
        const transaction = db.transaction(['requests'], 'readwrite')
        const store = transaction.objectStore('requests')
        const hashIndex = store.index('request_hash')
        const hashQuery = hashIndex.get(newHashedKey)

        hashQuery.onsuccess = () => {
          const result = hashQuery.result
          if (
            !result ||
            reset ||
            !result.timestamp ||
            new Date().getTime() - result.timestamp >= expiresIn
          ) {
            const updateData = {
              hash: newHashedKey,
              timestamp: reset ? null : date
            }
            store.put(result ? { ...result, ...updateData } : updateData)
            resolve({ val: 'reload' })
          } else if (
            result.timestamp &&
            new Date().getTime() - result.timestamp < expiresIn
          ) {
            resolve({ val: 'force-cache' })
          } else {
            resolve({ val: 'reload' })
          }
        }

        hashQuery.onerror = (event) => {
          console.error('hashQuery error:', event.target.error)
          reject(new Error('hashQuery error'))
        }
      }
    })
  },

  async toHash (context, str) {
    let hash = 0
    if (str.length === 0) return hash
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString()
  }
}
