import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

class DataStore {
  constructor() {
    this.data = {
      users: [],
      tasks: [],
      qa_checks: [],
      coverage: [],
      settings: [],
      audit_log: [],
      import_errors: [],
      sync_meta: {
        last_updated: new Date().toISOString(),
        sync_status: 'success',
        last_success_timestamp: new Date().toISOString(),
        error_message: null,
        scheduled_time: '06:00 AM IST Daily',
        source_name: 'Tracker Production Sync API (v1.4)'
      }
    };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.save();
      }
    } catch (err) {
      console.error('Error loading DB file, initializing empty store:', err.message);
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving DB file:', err.message);
    }
  }

  createBackup(label = 'manual') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `backup-${label}-${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(this.data, null, 2), 'utf-8');
    // Keep only last 14 backups as per spec (15 GB free policy)
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('backup-'))
      .map(f => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time);

    if (files.length > 14) {
      for (let i = 14; i < files.length; i++) {
        fs.unlinkSync(path.join(BACKUP_DIR, files[i].name));
      }
    }
    return backupFile;
  }

  // Generic collection operations
  get(collectionName) {
    return this.data[collectionName] || [];
  }

  find(collectionName, predicate = () => true) {
    const coll = this.data[collectionName] || [];
    return coll.filter(predicate);
  }

  findOne(collectionName, predicate) {
    const coll = this.data[collectionName] || [];
    return coll.find(predicate);
  }

  insert(collectionName, item) {
    if (!this.data[collectionName]) {
      this.data[collectionName] = [];
    }
    this.data[collectionName].push(item);
    this.save();
    return item;
  }

  insertMany(collectionName, items) {
    if (!this.data[collectionName]) {
      this.data[collectionName] = [];
    }
    this.data[collectionName].push(...items);
    this.save();
    return items;
  }

  update(collectionName, predicate, updates) {
    const coll = this.data[collectionName] || [];
    let updatedCount = 0;
    for (let i = 0; i < coll.length; i++) {
      if (predicate(coll[i])) {
        coll[i] = { ...coll[i], ...updates };
        updatedCount++;
      }
    }
    if (updatedCount > 0) {
      this.save();
    }
    return updatedCount;
  }

  delete(collectionName, predicate) {
    if (!this.data[collectionName]) return 0;
    const initialLen = this.data[collectionName].length;
    this.data[collectionName] = this.data[collectionName].filter(item => !predicate(item));
    const deletedCount = initialLen - this.data[collectionName].length;
    if (deletedCount > 0) {
      this.save();
    }
    return deletedCount;
  }

  getSyncMeta() {
    return this.data.sync_meta;
  }

  updateSyncMeta(updates) {
    this.data.sync_meta = { ...this.data.sync_meta, ...updates };
    this.save();
    return this.data.sync_meta;
  }

  resetAll(newData) {
    this.data = newData;
    this.save();
  }
}

export const db = new DataStore();
export default db;
