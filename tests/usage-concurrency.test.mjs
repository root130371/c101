import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

// Explicit opt-in: use only the disposable CI/local test database.
test('40 real PostgreSQL sessions admit only five requests; concurrent releases refund once',
  { skip: process.env.C101_USAGE_DB_TEST !== '1' }, async () => {
    const container=process.env.C101_TEST_POSTGRES_CONTAINER;
    function sql(query) {
      return new Promise((resolve,reject)=>{
        const args=['-U','postgres','-v','ON_ERROR_STOP=1','-Atc',query];
        const child=spawn(container?'docker':'psql',container?['exec',container,'psql',...args]:args);
        let output='',error='';
        child.stdout.on('data',data=>output+=data); child.stderr.on('data',data=>error+=data);
        child.on('error',reject); child.on('close',code=>code===0?resolve(output.trim()):reject(Error(error)));
      });
    }
    const user=crypto.randomUUID();
    await sql(`insert into auth.users(id) values ('${user}')`);
    const results=await Promise.all(Array.from({length:40},()=>sql(
      `set role service_role; select public.reserve_ai_usage('${user}','chat_messages','${crypto.randomUUID()}')->>'allowed'`)));
    assert.equal(results.filter(result=>result.endsWith('true')).length,5);
    assert.equal(results.filter(result=>result.endsWith('false')).length,35);
    const id=await sql(`select request_id from public.usage_reservations where user_id='${user}' limit 1`);
    const settlements=await Promise.all(Array.from({length:20},()=>sql(
      `set role service_role; select public.settle_ai_usage('${id}',false)`)));
    assert.equal(settlements.filter(result=>result.endsWith('t')).length,1);
    assert.equal(await sql(`select used_count from public.usage_counters where user_id='${user}'`),'4');
    assert.equal(await sql(`select count(*) from public.usage_reservations where user_id='${user}' and state='reserved'`),'4');
  });
