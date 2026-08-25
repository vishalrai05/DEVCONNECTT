import assert from 'node:assert/strict'
import test from 'node:test'
import Message from './Message.js'
import User from './User.js'

test('rejects invalid profile enum values', async () => {
  const user = new User({
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashed-password',
    preferredRole: 'Not a real role',
  })

  await assert.rejects(user.validate(), /preferredRole/)
})

test('rejects invalid or excessive project interests', async () => {
  const invalid = new User({
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashed-password',
    projectInterests: ['Not a real interest'],
  })
  await assert.rejects(invalid.validate(), /projectInterests/)

  const excessive = new User({
    name: 'Test User',
    email: 'test2@example.com',
    password: 'hashed-password',
    projectInterests: Array.from({ length: 11 }, (_, index) => `Interest ${index}`),
  })
  await assert.rejects(excessive.validate(), /projectInterests/)
})

test('rejects empty or oversized messages', async () => {
  const empty = new Message({ team: '507f1f77bcf86cd799439011', sender: '507f1f77bcf86cd799439012', content: '' })
  await assert.rejects(empty.validate(), /content/)

  const oversized = new Message({
    team: '507f1f77bcf86cd799439011',
    sender: '507f1f77bcf86cd799439012',
    content: 'x'.repeat(2001),
  })
  await assert.rejects(oversized.validate(), /content/)
})
