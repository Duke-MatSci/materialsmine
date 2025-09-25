// Helper function for API requests
const makeApiRequest = async (url: string, options: any = {}): Promise<any> => {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.message || 'API request failed');
  }

  return response.json();
};

// Helper function to get auth token
const getAuthToken = (rootGetters: any): string => {
  const token = rootGetters['auth/token'];
  if (!token) {
    throw new Error('Authentication required');
  }
  return token;
};

export default {
  async uploadFile(
    { commit, rootGetters }: any,
    { file = null, isTemp = true, isVisualizationCSV = false }: any
  ): Promise<any> {
    if (!file) return;

    const formData = new FormData();
    formData.append('uploadfile', file[0]);

    const url = !isVisualizationCSV
      ? `/api/files/upload?isTemp=${isTemp}`
      : `/api/files/upload?isVisualizationCSV=${isTemp}`;

    try {
      const token = getAuthToken(rootGetters);

      const resData = await makeApiRequest(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const { filename, swaggerFilename } = resData?.files?.[0] || {};
      const fileLink = filename;
      const fileName = swaggerFilename;

      commit('setUploadedFile', fileName);
      return { fileName, fileLink };
    } catch (err: any) {
      throw new Error(err?.message ?? 'File Upload Error');
    }
  },

  async deleteFile(
    { commit, rootGetters }: any,
    { name = null, link = null, isTemp = true }: any
  ): Promise<any> {
    if (!link && !name) return;

    const url = !link ? `/api/files/${name}?isFileStore=${isTemp}` : link;
    const token = getAuthToken(rootGetters);

    try {
      await makeApiRequest(url, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      commit('setUploadedFile', '');
      return { deleted: true, error: null };
    } catch (err: any) {
      return { deleted: false, error: err?.message ?? 'Something went wrong' };
    }
  },

  async fetchWrapper(
    { dispatch }: any,
    { url = '', body = '{}', reset = false, expiresIn = 10800000 }: any
  ): Promise<any> {
    if (!url) {
      throw new Error('Provide Url Query');
    }

    const hashedKey = `#${url}#${body}#`;
    const newHashedKey = await dispatch('toHash', hashedKey);
    const date = new Date().getTime() + expiresIn;

    // IndexedDB setup
    const indexedDB =
      window.indexedDB ||
      (window as any).mozIndexedDB ||
      (window as any).webkitIndexedDB ||
      (window as any).msIndexedDB;
    const cacheDB = 'cachedRequest';
    const dbVersion = 2;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(cacheDB, dbVersion);

      request.onerror = (event: any) => {
        console.error('IndexedDB error:', event.target.error);
        reject(new Error('IndexedDB error'));
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('requests')) {
          db.createObjectStore('requests', { keyPath: 'key' });
        }
      };

      request.onsuccess = (event: any) => {
        const db = event.target.result;
        const transaction = db.transaction(['requests'], 'readwrite');
        const store = transaction.objectStore('requests');

        if (reset) {
          const clearRequest = store.clear();
          clearRequest.onsuccess = () => resolve(null);
          clearRequest.onerror = () => reject(new Error('Failed to clear cache'));
          return;
        }

        const getRequest = store.get(newHashedKey);
        getRequest.onsuccess = () => {
          const result = getRequest.result;
          if (result && result.expires > new Date().getTime()) {
            resolve(result.data);
          } else {
            resolve(null);
          }
        };
        getRequest.onerror = () => reject(new Error('Failed to get from cache'));
      };
    });
  },

  async toHash(context: any, str: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  },
};
