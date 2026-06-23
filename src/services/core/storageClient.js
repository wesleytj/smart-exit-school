export const storageClient = {
  async get(key) {
    const data = localStorage.getItem(key);
    if (!data || data === "undefined") return null;
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  },

  async set(key, value) {
    try {
      const data = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, data);
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error('[Storage Error] Limite de armazenamento do navegador atingido.');
      }
      throw error;
    }
  },

  async remove(key) {
    localStorage.removeItem(key);
  },

  async clearAll() {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('@SmartExit:')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
};
