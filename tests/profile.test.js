import test from 'node:test';
import assert from 'node:assert/strict';
import { accountName, saveProfile } from '../supabase/profile.js';

test('account names prefer the saved profile, then Google names, then email', () => {
  assert.equal(accountName({user_metadata:{display_name:'  New name ',full_name:'Google Name'},email:'user@example.com'}),'New name');
  assert.equal(accountName({user_metadata:{full_name:'Google Name'}}),'Google Name');
  assert.equal(accountName({user_metadata:{full_name:' ',name:'Provider Name'}}),'Provider Name');
  assert.equal(accountName({user_metadata:{display_name:42},email:'linn.user@example.com'}),'linn.user');
  assert.equal(accountName(null),'Member');
});

test('profile saves only display name metadata and returns the persisted user', async () => {
  const user={id:'member',is_anonymous:false,user_metadata:{display_name:'မောင်လင်း'}};
  const client={auth:{getSession:async()=>({data:{session:{user}}}),updateUser:async attributes=>{
    assert.deepEqual(attributes,{data:{display_name:'မောင်လင်း'}});
    return {data:{user},error:null};
  }}};
  assert.equal(await saveProfile(client,' မောင်လင်း '),user);
});

test('invalid names, guests and failed profile writes never report saved', async () => {
  await assert.rejects(saveProfile({},'   '), /Name/);
  await assert.rejects(saveProfile({},'a'.repeat(51)), /Name/);
  const client={auth:{getSession:async()=>({data:{session:{user:{id:'guest',is_anonymous:true}}}})}};
  await assert.rejects(saveProfile(client,'New name'),/sign in/);
  client.auth.getSession=async()=>({data:{session:{user:{id:'member',is_anonymous:false}}}});
  client.auth.updateUser=async()=>({error:new Error('Network unavailable')});
  await assert.rejects(saveProfile(client,'New name'),/Network unavailable/);
});
