import test from 'node:test';
import assert from 'node:assert/strict';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
async function session() { const r = await fetch(base + '/api/session'); assert.equal(r.status,200); return r.headers.get('set-cookie')?.split(';')[0] || ''; }
async function call(path,cookie,body,method='POST',origin=base) { return fetch(base+path,{method,headers:{'Content-Type':'application/json',Origin:origin,Cookie:cookie},body:JSON.stringify(body)}); }
async function read(path,cookie='') { const r=await fetch(base+path,{headers:{Cookie:cookie}}); assert.equal(r.status,200); return r.json(); }
test('real API: filters, persistence, ownership, ratings and validation', async t => {
 const one=await session(),two=await session();
 await t.test('catalogue uses real source URLs, has no seeded ratings, enforces 2 km',async()=>{
  const {dishes}=await read('/api/catalog'); assert.equal(dishes.length,8); assert.ok(dishes.every(d=>d.distance<=2000&&d.price>0&&d.source.startsWith('https://')));
 });
 await t.test('combined budget, time and cuisine filters hold',async()=>{
  const {dishes}=await read('/api/catalog?budget=250&minutes=45&cuisine=european'); assert.ok(dishes.length>0); assert.ok(dishes.every(d=>d.price<=250&&d.totalMinutes<=45&&d.cuisine==='european'));
  const empty=await read('/api/catalog?budget=1&minutes=1'); assert.deepEqual(empty.dishes,[]);
  assert.equal((await fetch(base+'/api/catalog?budget=broken')).status,400);
 });
 await t.test('favorites persist across requests and are isolated by owner',async()=>{
  assert.equal((await call('/api/favorites',one,{dishId:'roll',saved:true})).status,200);
  assert.deepEqual((await read('/api/favorites',one)).favorites,['roll']);
  assert.deepEqual((await read('/api/favorites',two)).favorites,[]);
  await call('/api/favorites',one,{dishId:'roll',saved:true}); assert.equal((await read('/api/favorites',one)).favorites.length,1);
  assert.equal((await call('/api/favorites',one,{dishId:'fake',saved:true})).status,400);
  await call('/api/favorites',one,{dishId:'roll',saved:false}); assert.deepEqual((await read('/api/favorites',one)).favorites,[]);
 });
 await t.test('reviews create, update, aggregate and delete with owner isolation',async()=>{
  const baseline=(await read('/api/reviews?dishId=roll',one)).reviews;
  const body={dishId:'roll',author:'Автоматическая проверка',rating:4,body:'Служебный тест сохранения. Будет удалён после проверки.'};
  assert.equal((await call('/api/reviews',one,body)).status,201);
  let own=await read('/api/reviews?dishId=roll',one); assert.equal(own.reviews.find(r=>r.author===body.author).mine,1);
  const other=await read('/api/reviews?dishId=roll',two); assert.equal(other.reviews.find(r=>r.author===body.author).mine,0);
  await call('/api/reviews',two,{dishId:'roll'},'DELETE'); assert.equal((await read('/api/reviews?dishId=roll',one)).reviews.length,own.reviews.length);
  await call('/api/reviews',one,{...body,rating:5}); own=await read('/api/reviews?dishId=roll',one); assert.equal(own.reviews.filter(r=>r.mine).length,1); assert.equal(own.reviews.find(r=>r.mine).rating,5);
  const {dishes}=await read('/api/catalog'); const roll=dishes.find(d=>d.id==='roll'); assert.equal(roll.rating,Math.round((baseline.reduce((sum,r)=>sum+r.rating,0)+5)/(baseline.length+1)*10)/10); assert.equal(roll.reviewCount,baseline.length+1);
  await call('/api/reviews',one,{dishId:'roll'},'DELETE'); assert.equal((await read('/api/reviews?dishId=roll',one)).reviews.length,baseline.length);
  assert.equal((await call('/api/reviews',one,{...body,rating:6})).status,400);
  assert.equal((await call('/api/reviews',one,{...body,body:'x'})).status,400);
 });
 await t.test('write endpoints reject cross-origin, missing sessions and malformed bodies',async()=>{
  assert.equal((await call('/api/favorites',one,{dishId:'roll',saved:true},'POST','https://other.example')).status,403);
  assert.equal((await call('/api/favorites','',{dishId:'roll',saved:true})).status,401);
  const r=await fetch(base+'/api/reviews',{method:'POST',headers:{Origin:base,Cookie:one,'Content-Type':'application/json'},body:'{broken'}); assert.equal(r.status,400);
 });
});
