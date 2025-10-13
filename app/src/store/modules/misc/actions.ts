import { ActionContext } from 'vuex';
import { MiscState } from './mutations';

interface RootState {
  auth: {
    token: string | null;
  };
  [key: string]: unknown;
}

interface UploadFilePayload {
  file?: FileList | null;
  isTemp?: boolean;
  isVisualizationCSV?: boolean;
}

interface UploadFileResponse {
  fileName: string | null;
  fileLink: string | null;
}

interface DeleteFilePayload {
  name?: string | null;
  link?: string | null;
  isTemp?: boolean;
}

interface DeleteFileResponse {
  deleted: boolean;
  error: string | null;
}

interface FetchWrapperPayload {
  url?: string;
  body?: string;
  reset?: boolean;
  expiresIn?: number;
}

interface FetchWrapperResponse {
  val: RequestCache | 'reload';
}

interface UploadedFileData {
  files: Array<{
    filename: string;
    swaggerFilename: string;
  }>;
}

interface IndexedDBRequest extends IDBRequest {
  result: IDBDatabase;
}

interface HashQueryRequest extends IDBRequest {
  result:
    | {
        id?: number;
        hash: string;
        timestamp: number | null;
      }
    | undefined;
}

export default {
  async uploadFile(
    { commit, rootGetters }: ActionContext<MiscState, RootState>,
    { file = null, isTemp = true, isVisualizationCSV = false }: UploadFilePayload
  ): Promise<UploadFileResponse> {
    if (!file) return { fileName: null, fileLink: null };
    let fileName: string | null = null;
    let fileLink: string | null = null;
    const formData = new FormData();
    formData.append('uploadfile', file[0]);
    const url = !isVisualizationCSV
      ? `/api/files/upload?isTemp=${isTemp}`
      : `/api/files/upload?isVisualizationCSV=${isTemp}`;
    try {
      const token = rootGetters['auth/token'] as string | null;
      if (!token) {
        throw new Error('To upload a file, you need to log in');
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: formData,
      });
      const resData: UploadedFileData = await res.json();
      const { filename, swaggerFilename } = resData?.files?.[0] ?? {
        filename: '',
        swaggerFilename: '',
      };
      fileLink = filename;
      fileName = swaggerFilename;
      commit('setUploadedFile', fileName);
    } catch (err: unknown) {
      const error = err as Error;
      throw new Error(error?.message ?? 'File Upload Error');
    }
    return { fileName, fileLink };
  },
  async deleteFile(
    { commit, rootGetters }: ActionContext<MiscState, RootState>,
    { name = null, link = null, isTemp = true }: DeleteFilePayload
  ): Promise<DeleteFileResponse> {
    if (!link && !name) return { deleted: false, error: null };

    const url = !link ? `/api/files/${name}?isFileStore=${isTemp}` : link;
    const token = rootGetters['auth/token'] as string | null;

    let deleted = false;
    let error: string | null = null;

    try {
      const req = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        method: 'DELETE',
      });
      if (req.status !== 200) {
        let res: { message?: string } | undefined;
        if (req.status === 400) res = await req.json();
        throw new Error(res?.message ?? 'Something went wrong');
      }
      commit('setUploadedFile', '');
      deleted = true;
    } catch (err: unknown) {
      const errorObj = err as Error;
      error = errorObj?.message ?? 'Something went wrong';
    }

    return { deleted, error };
  },

  async fetchWrapper(
    { dispatch }: ActionContext<MiscState, RootState>,
    { url = '', body = '{}', reset = false, expiresIn = 10800000 }: FetchWrapperPayload
  ): Promise<FetchWrapperResponse> {
    if (!url) {
      // TODO: Are we ever gonna need this?
      throw new Error('Provide Url Query');
    }

    // No need to reassign body to cBody since it's not modified
    const hashedKey = `#${url}#${body}#`;
    const newHashedKey = (await dispatch('toHash', hashedKey)) as string;
    const date = new Date().getTime() + expiresIn;

    // Simplify IndexedDB access
    const indexedDB =
      window.indexedDB ||
      (window as typeof window & { mozIndexedDB?: IDBFactory }).mozIndexedDB ||
      (window as typeof window & { webkitIndexedDB?: IDBFactory }).webkitIndexedDB ||
      (window as typeof window & { msIndexedDB?: IDBFactory }).msIndexedDB;
    const cacheDB = 'cachedRequest';
    const dbVersion = 3; // Increment version to force upgrade

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(cacheDB, dbVersion);

      request.onerror = (event) => {
        console.error('IndexedDB error:', (event.target as IDBRequest)?.error);
        reject(new Error('IndexedDB error'));
      };

      request.onupgradeneeded = (event) => {
        console.log('IndexedDB upgrade needed');
        const db = (event.target as IndexedDBRequest)?.result;

        // Delete old object store if it exists to ensure clean state
        if (db.objectStoreNames.contains('requests')) {
          db.deleteObjectStore('requests');
          console.log('Deleted old "requests" object store');
        }

        // Create fresh object store
        const store = db.createObjectStore('requests', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('request_hash', 'hash', { unique: true });
        console.log('Created new "requests" object store');
      };

      request.onsuccess = async (event) => {
        const db = (event.target as IndexedDBRequest)?.result;

        // Check if the object store exists
        if (!db.objectStoreNames.contains('requests')) {
          console.warn('Object store "requests" does not exist. Resolving with reload.');
          resolve({ val: 'reload' });
          return;
        }

        try {
          const transaction = db.transaction(['requests'], 'readwrite');
          const store = transaction.objectStore('requests');
          const hashIndex = store.index('request_hash');
          const hashQuery = hashIndex.get(newHashedKey);

          hashQuery.onsuccess = () => {
            const result = (hashQuery as HashQueryRequest).result;
            if (
              !result ||
              reset ||
              !result.timestamp ||
              new Date().getTime() - result.timestamp >= expiresIn
            ) {
              const updateData = {
                hash: newHashedKey,
                timestamp: reset ? null : date,
              };
              store.put(result ? { ...result, ...updateData } : updateData);
              resolve({ val: 'reload' });
            } else if (result.timestamp && new Date().getTime() - result.timestamp < expiresIn) {
              resolve({ val: 'force-cache' as RequestCache });
            } else {
              resolve({ val: 'reload' });
            }
          };

          hashQuery.onerror = (event) => {
            console.error('hashQuery error:', (event.target as IDBRequest)?.error);
            reject(new Error('hashQuery error'));
          };
        } catch (err) {
          console.error('Transaction error:', err);
          // If transaction fails, resolve with reload to bypass cache
          resolve({ val: 'reload' });
        }
      };
    });
  },

  async toHash(_context: ActionContext<MiscState, RootState>, str: string): Promise<string> {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  },
};
