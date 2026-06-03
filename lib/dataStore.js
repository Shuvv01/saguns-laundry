import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

const SERVICES = [
  {
    id: 1,
    name: 'Regular Wash',
    description: 'Standard machine wash with detergent. Suitable for everyday wearable clothes including shirts, pants, and casuals.',
    price: 50,
    unit: 'per kg',
    icon: 'tshirt',
    is_active: 1
  },
  {
    id: 2,
    name: 'Premium Wash',
    description: 'Advanced wash with premium detergent and fabric conditioner. Ideal for delicate and high-quality garments.',
    price: 80,
    unit: 'per kg',
    icon: 'star',
    is_active: 1
  },
  {
    id: 3,
    name: 'Ironing',
    description: 'Professional steam ironing for crisp, wrinkle-free clothes. Available for all fabric types.',
    price: 30,
    unit: 'per item',
    icon: 'lightning',
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
      return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
    }

    const now = new Date().toISOString();
    const adminPassword = process.env.ADMIN_PASSWORD || crypto.randomBytes(14).toString('base64url');
    const data = {
      seq: {
        users: 1,
        admins: 2,
        services: 5,
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
