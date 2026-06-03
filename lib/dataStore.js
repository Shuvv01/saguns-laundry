import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

const SERVICES = [
  {
    id: 1,
    name: 'Daily Wearable Clothes',
    description: 'Everyday clothes washed, dried and folded for regular use.',
    price: 100,
    unit: 'per kg',
    icon: 'tshirt',
    is_active: 1
  },
  {
    id: 2,
    name: 'Blanket Wash & Dry',
    description: 'Blankets and bedding washed and dried with machine support.',
    price: 100,
    unit: 'per kg',
    icon: 'basket',
    is_active: 1
  },
  {
    id: 3,
    name: 'Fiber Blanket Wash & Dry',
    description: 'Fiber blankets cleaned and dried with extra care.',
    price: 150,
    unit: 'per kg',
    icon: 'blanket',
    is_active: 1
  },
  {
    id: 4,
    name: 'Sleeping Bags',
    description: 'Sleeping bags washed and dried for travel or seasonal use.',
    price: 500,
    unit: 'per piece',
    icon: 'bed',
    is_active: 1
  },
  {
    id: 5,
    name: 'Down Jacket Wash & Dry - Small',
    description: 'Small down jackets washed and dried with extra care.',
    price: 150,
    unit: 'per piece',
    icon: 'jacket',
    is_active: 1
  },
  {
    id: 6,
    name: 'Down Jacket Wash & Dry - Big',
    description: 'Big down jackets washed and dried with extra care.',
    price: 170,
    unit: 'per piece',
    icon: 'jacket',
    is_active: 1
  },
  {
    id: 7,
    name: 'Down Jacket Wash & Dry - Feather',
    description: 'Feather down jackets washed and dried with extra care.',
    price: 200,
    unit: 'per piece',
    icon: 'jacket',
    is_active: 1
  }
];

export class DataStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = this.load();
  }

  load() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    if (fs.existsSync(this.filePath)) {
      const data = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      if (JSON.stringify(data.services) !== JSON.stringify(SERVICES)) {
        data.services = SERVICES;
        data.seq = { ...data.seq, services: Math.max(data.seq?.services || 1, SERVICES.length + 1) };
        fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
      }
      return data;
    }

    const now = new Date().toISOString();
    const adminPassword = process.env.ADMIN_PASSWORD || crypto.randomBytes(14).toString('base64url');
    const data = {
      seq: {
        users: 1,
        admins: 2,
        services: 8,
        orders: 1,
        order_items: 1,
        order_status_history: 1,
        contact_messages: 1
      },
      users: [],
      admins: [
        {
          id: 1,
          username: 'admin',
          email: 'admin@sagunslaundry.com',
          password_hash: bcrypt.hashSync(adminPassword, 12),
          created_at: now
        }
      ],
      services: SERVICES,
      orders: [],
      order_items: [],
      order_status_history: [],
      contact_messages: []
    };
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    if (!process.env.ADMIN_PASSWORD) {
      const setupNote = [
        `Generated admin password for local setup: ${adminPassword}`,
        'Set ADMIN_PASSWORD before first run in production or delete data/db.json and restart with ADMIN_PASSWORD set.',
        ''
      ].join('\n');
      fs.writeFileSync(path.join(path.dirname(this.filePath), 'admin-setup.txt'), setupNote);
    }
    return data;
  }

  save() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
  }

  next(collection) {
    const id = this.data.seq[collection] || 1;
    this.data.seq[collection] = id + 1;
    return id;
  }

  insert(collection, row) {
    const now = new Date().toISOString();
    const record = {
      id: this.next(collection),
      ...row,
      created_at: row.created_at || now,
      updated_at: row.updated_at || now
    };
    this.data[collection].push(record);
    this.save();
    return record;
  }

  update(collection, id, patch) {
    const record = this.data[collection].find((item) => item.id === Number(id));
    if (!record) return null;
    Object.assign(record, patch, { updated_at: new Date().toISOString() });
    this.save();
    return record;
  }

  deleteWhere(collection, predicate) {
    const before = this.data[collection].length;
    this.data[collection] = this.data[collection].filter((item) => !predicate(item));
    if (this.data[collection].length !== before) this.save();
  }
}
