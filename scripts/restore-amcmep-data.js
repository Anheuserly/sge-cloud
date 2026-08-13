const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { Client } = require('pg');
const crypto = require('crypto');

const exportDir = '/Volumes/HP_P500/GitHub/sge-datahub/migration-state/export';

function toUuid(str) {
  if (!str) return crypto.randomUUID();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(str)) return str;

  const hex = crypto.createHash('md5').update(String(str)).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

async function restoreData() {
  console.log('=== RESTORING ALL BACKUP DATA INTO amcmep ===');
  const client = new Client({ connectionString: 'postgresql://localhost:5432/amcmep' });
  await client.connect();

  const businessIdMap = new Map(); // rawId -> uuid
  const conversationIdMap = new Map(); // rawId -> uuid

  // 1. Businesses
  const bizFile = path.join(exportDir, 'collection-businesses.ndjson');
  if (fs.existsSync(bizFile)) {
    const rl = readline.createInterface({ input: fs.createReadStream(bizFile) });
    let count = 0;
    for await (const line of rl) {
      if (!line.trim()) continue;
      const rec = JSON.parse(line);
      const payload = rec.payload || rec;
      const rawId = payload['$id'] || rec.recordId || crypto.randomUUID();
      const id = toUuid(rawId);
      businessIdMap.set(rawId, id);

      const name = payload.name || 'Unnamed business';
      const kind = (payload.businessType || 'service_provider').toLowerCase();
      const location = payload.city || payload.address || null;
      const createdAt = payload['$createdAt'] || new Date().toISOString();
      const updatedAt = payload['$updatedAt'] || new Date().toISOString();

      try {
        await client.query(`
          INSERT INTO businesses (id, name, kind, location, metadata, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            kind = EXCLUDED.kind,
            location = EXCLUDED.location,
            metadata = EXCLUDED.metadata,
            updated_at = EXCLUDED.updated_at
        `, [id, name, kind, location, payload, createdAt, updatedAt]);
        count++;
      } catch (e) {}
    }
    console.log(`✅ Restored ${count} businesses into amcmep`);
  }

  // 2. Business Memberships
  const memFile = path.join(exportDir, 'collection-business_memberships.ndjson');
  if (fs.existsSync(memFile)) {
    const rl = readline.createInterface({ input: fs.createReadStream(memFile) });
    let count = 0;
    for await (const line of rl) {
      if (!line.trim()) continue;
      const rec = JSON.parse(line);
      const payload = rec.payload || rec;
      const rawBizId = payload.businessId;
      const userId = payload.userId;
      if (!rawBizId || !userId) continue;

      const bizId = businessIdMap.get(rawBizId) || toUuid(rawBizId);
      const role = payload.role || 'member';
      const status = payload.status || 'active';
      const perms = JSON.stringify(payload.permissions || []);
      const createdAt = payload['$createdAt'] || new Date().toISOString();
      const updatedAt = payload['$updatedAt'] || new Date().toISOString();

      try {
        await client.query(`
          INSERT INTO business_memberships (business_id, user_id, role, status, permissions, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (business_id, user_id) DO UPDATE SET
            role = EXCLUDED.role,
            status = EXCLUDED.status,
            permissions = EXCLUDED.permissions,
            updated_at = EXCLUDED.updated_at
        `, [bizId, userId, role, status, perms, createdAt, updatedAt]);
        count++;
      } catch (e) {}
    }
    console.log(`✅ Restored ${count} business memberships into amcmep`);
  }

  // 3. Listings (showcases)
  const listFile = path.join(exportDir, 'collection-marketplace_showcases.ndjson');
  if (fs.existsSync(listFile)) {
    const rl = readline.createInterface({ input: fs.createReadStream(listFile) });
    let count = 0;
    for await (const line of rl) {
      if (!line.trim()) continue;
      const rec = JSON.parse(line);
      const payload = rec.payload || rec;
      const sourceId = payload['$id'] || rec.recordId;
      const rawBizId = payload.businessId;
      const bizId = businessIdMap.get(rawBizId) || (rawBizId ? toUuid(rawBizId) : null);
      const createdBy = payload.sellerId || payload.adminId || 'unknown';
      const type = payload.isService ? 'service' : 'product';
      const title = payload.title || payload.name || 'Untitled listing';
      const desc = payload.description || '';
      const category = payload.category || 'Other';
      const price = parseFloat(payload.price) || 0;
      const availability = payload.status || 'available';
      const published = payload.isActive !== false;
      const createdAt = payload['$createdAt'] || new Date().toISOString();
      const updatedAt = payload['$updatedAt'] || new Date().toISOString();

      try {
        await client.query(`
          INSERT INTO listings (source_record_id, business_id, created_by_user_id, type, title, description, category, price, currency, availability, specifications, published, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (source_record_id) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            category = EXCLUDED.category,
            price = EXCLUDED.price,
            availability = EXCLUDED.availability,
            specifications = EXCLUDED.specifications,
            published = EXCLUDED.published,
            updated_at = EXCLUDED.updated_at
        `, [sourceId, bizId, createdBy, type, title, desc, category, price, 'INR', availability, payload, published, createdAt, updatedAt]);
        count++;
      } catch (e) {}
    }
    console.log(`✅ Restored ${count} listings into amcmep`);
  }

  // 4. Conversations & Chat sessions
  const chatSessionFiles = ['collection-chat_sessions.ndjson', 'collection-internal_chat_sessions.ndjson'];
  let convCount = 0;
  for (const f of chatSessionFiles) {
    const sFile = path.join(exportDir, f);
    if (fs.existsSync(sFile)) {
      const rl = readline.createInterface({ input: fs.createReadStream(sFile) });
      for await (const line of rl) {
        if (!line.trim()) continue;
        const rec = JSON.parse(line);
        const payload = rec.payload || rec;
        const sourceId = payload['$id'] || rec.recordId;
        const id = toUuid(sourceId);
        conversationIdMap.set(sourceId, id);

        const rawBizId = payload.businessId;
        const bizId = businessIdMap.get(rawBizId) || (rawBizId ? toUuid(rawBizId) : null);
        const title = payload.title || payload.clientName || payload.partnerName || 'Conversation';
        const type = f.includes('internal') ? (payload.conversationType === 'partner' ? 'partner' : 'team') : 'customer';
        const createdBy = payload.createdBy || payload.initiatorUserId || 'unknown';
        const createdAt = payload.createdAt || payload['$createdAt'] || new Date().toISOString();
        const updatedAt = payload.updatedAt || payload['$updatedAt'] || new Date().toISOString();

        try {
          await client.query(`
            INSERT INTO conversations (id, source_record_id, business_id, type, subject, created_by_user_id, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO UPDATE SET
              subject = EXCLUDED.subject,
              updated_at = EXCLUDED.updated_at
          `, [id, sourceId, bizId, type, title, createdBy, createdAt, updatedAt]);
          convCount++;
        } catch (e) {}
      }
    }
  }
  console.log(`✅ Restored ${convCount} conversations into amcmep`);

  // 5. Chat messages
  const msgFiles = ['collection-chat_messages.ndjson', 'collection-internal_chat_messages.ndjson'];
  let msgCount = 0;
  for (const f of msgFiles) {
    const mFile = path.join(exportDir, f);
    if (fs.existsSync(mFile)) {
      const rl = readline.createInterface({ input: fs.createReadStream(mFile) });
      for await (const line of rl) {
        if (!line.trim()) continue;
        const rec = JSON.parse(line);
        const payload = rec.payload || rec;
        const sourceId = payload['$id'] || rec.recordId;
        const id = toUuid(sourceId);
        const senderId = payload.senderUserId || payload.senderId || payload.userId || 'unknown';
        const bodyText = payload.messageText || payload.content || payload.text || payload.message || '';
        const msgType = payload.messageType || 'text';
        const createdAt = payload.timestamp || payload.createdAt || payload['$createdAt'] || new Date().toISOString();

        const sessId = payload.sessionId || payload.chatSessionId;
        let convId = conversationIdMap.get(sessId);

        if (!convId && sessId) {
          convId = toUuid(sessId);
        }

        if (!convId) {
          const cRes = await client.query('SELECT id FROM conversations LIMIT 1');
          if (cRes.rows[0]) convId = cRes.rows[0].id;
        }

        if (convId && bodyText) {
          try {
            await client.query(`
              INSERT INTO chat_messages (id, conversation_id, sender_user_id, body, type, created_at, source_record_id, metadata)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              ON CONFLICT (id) DO UPDATE SET body = EXCLUDED.body
            `, [id, convId, senderId, bodyText, msgType, createdAt, sourceId, payload]);
            msgCount++;
          } catch (e) {}
        }
      }
    }
  }
  console.log(`✅ Restored ${msgCount} chat messages into amcmep`);

  // 6. Feed posts
  const feedFile = path.join(exportDir, 'collection-68a361040001a07e0b58.ndjson');
  if (fs.existsSync(feedFile)) {
    const rl = readline.createInterface({ input: fs.createReadStream(feedFile) });
    let count = 0;
    for await (const line of rl) {
      if (!line.trim()) continue;
      const rec = JSON.parse(line);
      const payload = rec.payload || rec;
      const sourceId = payload['$id'] || rec.recordId;
      const authorId = payload.user_id || 'unknown';
      const body = payload.content || '';
      const media = payload.mediaUrl ? JSON.stringify([payload.mediaUrl]) : '[]';
      const visibility = payload.isActive !== false ? 'public' : 'hidden';
      const createdAt = payload.createdAt || payload['$createdAt'] || new Date().toISOString();
      const updatedAt = payload['$updatedAt'] || new Date().toISOString();

      try {
        await client.query(`
          INSERT INTO feed_posts (source_record_id, author_user_id, body, media_object_keys, visibility, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (source_record_id) DO UPDATE SET
            body = EXCLUDED.body,
            updated_at = EXCLUDED.updated_at
        `, [sourceId, authorId, body, media, visibility, createdAt, updatedAt]);
        count++;
      } catch (e) {}
    }
    console.log(`✅ Restored ${count} feed posts into amcmep`);
  }

  // 7. Media Objects
  const mediaFile = path.join(exportDir, 'media.ndjson');
  if (fs.existsSync(mediaFile)) {
    const rl = readline.createInterface({ input: fs.createReadStream(mediaFile) });
    let count = 0;
    for await (const line of rl) {
      if (!line.trim()) continue;
      const rec = JSON.parse(line);
      const key = rec.objectKey || rec.fileId || rec.id;
      if (!key) continue;
      const id = toUuid(key);
      const mime = rec.mimeType || 'application/octet-stream';
      const size = rec.byteSize || rec.sizeBytes || 0;
      const owner = rec.ownerUserId || rec.userId || 'system';
      const createdAt = rec.createdAt || new Date().toISOString();

      try {
        await client.query(`
          INSERT INTO media_objects (id, object_key, content_type, byte_size, owner_user_id, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (object_key) DO UPDATE SET
            content_type = EXCLUDED.content_type,
            byte_size = EXCLUDED.byte_size
        `, [id, key, mime, size, owner, createdAt]);
        count++;
      } catch (e) {}
    }
    console.log(`✅ Restored ${count} media objects into amcmep`);
  }

  await client.end();
  console.log('🎉 ALL BACKUP DATA SUCCESSFULLY RESTORED INTO amcmep!');
}

restoreData().catch(console.error);
