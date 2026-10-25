import test from 'node:test';
import assert from 'node:assert/strict';
import { createUuid } from '../lib/uuid.js';
test('LAN HTTP and older phones produce valid v4 UUIDs without randomUUID', () => {
  const id=createUuid({getRandomValues(bytes){bytes.fill(255);return bytes;}});
  assert.match(id,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(id,'ffffffff-ffff-4fff-bfff-ffffffffffff');
  assert.throws(()=>createUuid({}),/Secure random IDs/);
});
