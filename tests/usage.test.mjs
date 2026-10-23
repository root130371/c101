import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withUsageReservation, UsageLimitError } from '../supabase/functions/_shared/usage.ts';

const user='00000000-0000-4000-8000-000000000003';
function mock({ allowed=true, reserveStatus=200, settlementStatus=200 }={}) {
  const calls=[];
  return { calls, request:async (url, options) => {
    const body=JSON.parse(options.body); calls.push({url,body,headers:options.headers});
    if(url.endsWith('reserve_ai_usage')) return Response.json({allowed,plan:'free',limit:5,used:allowed?0:5,
      request_id:body.p_request_id},{status:reserveStatus});
    return Response.json(true,{status:settlementStatus});
  }};
}
test('denied admission never performs work and retains the existing 402 payload',async()=>{
  const {calls,request}=mock({allowed:false}); let worked=false;
  await assert.rejects(withUsageReservation('https://test','server',user,'chat_messages',async()=>{worked=true;},request),error=>{
    assert.ok(error instanceof UsageLimitError); assert.equal(error.payload().used,5); return true;
  });
  assert.equal(worked,false); assert.equal(calls.length,1);
});
test('successful work reserves first and commits once with the same identity',async()=>{
  const {calls,request}=mock();
  const result=await withUsageReservation('https://test','server',user,'contract_analyses',async()=>{
    assert.equal(calls.length,1); return 'answer';
  },request);
  assert.equal(result,'answer'); assert.equal(calls[0].body.p_user_id,user);
  assert.equal(calls[0].body.p_metric,'contract_analyses');
  assert.equal(calls[1].body.p_request_id,calls[0].body.p_request_id);
  assert.equal(calls[1].body.p_succeeded,true);
  assert.equal(calls[0].headers.authorization,'Bearer server');
});
test('handled work failures release their own reservation and preserve the original error',async()=>{
  const {calls,request}=mock(); const failure=Error('provider unavailable');
  await assert.rejects(withUsageReservation('https://test','server',user,'evidence_analyses',async()=>{throw failure;},request),e=>e===failure);
  assert.equal(calls[1].body.p_succeeded,false);
});
test('reservation errors fail closed before provider work',async()=>{
  const {request}=mock({reserveStatus:500});
  await assert.rejects(withUsageReservation('https://test','server',user,'chat_messages',async()=>assert.fail('work ran'),request),/reservation|reserve_ai_usage/);
});
test('malformed admission fails closed',async()=>{
  await assert.rejects(withUsageReservation('https://test','server',user,'chat_messages',async()=>assert.fail('work ran'),async()=>Response.json({allowed:true})),/Invalid AI usage/);
});
test('lost success settlement never refunds completed work or loses its result',async()=>{
  const {calls,request}=mock({settlementStatus:503});
  assert.equal(await withUsageReservation('https://test','server',user,'chat_messages',async()=>42,request),42);
  assert.equal(calls.length,2); assert.equal(calls[1].body.p_succeeded,true);
});
test('failed release preserves original failure and never retries paid work',async()=>{
  const {calls,request}=mock({settlementStatus:503}); let worked=0;
  await assert.rejects(withUsageReservation('https://test','server',user,'chat_messages',async()=>{worked++;throw Error('original');},request),/original/);
  assert.equal(worked,1); assert.equal(calls.length,2);
});

// Exercise the actual Edge Function handlers, with no Supabase/Gemini requests.
test('both AI endpoints authenticate and reserve before invoking the provider',async()=>{
  const settings={GEMINI_API_KEY:'gemini',SUPABASE_URL:'https://project.test',SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'server'};
  const originalFetch=globalThis.fetch, originalDeno=globalThis.Deno;
  try {
    for(const name of ['ask-assistant','analyze-evidence']) {
      let handler; globalThis.Deno={env:{get:k=>settings[k]},serve:fn=>{handler=fn;}};
      await import(`../supabase/functions/${name}/index.ts`);
      for(const scenario of ['unauthenticated','denied','success','provider-failure',...(name==='analyze-evidence'?['wrong-owner','lookup-failure']:[])]) {
        const calls=[];
        globalThis.fetch=async(url,options={})=>{
          const body=options.body?JSON.parse(options.body):null; calls.push({url,body});
          if(url.endsWith('/auth/v1/user')) return Response.json(scenario==='unauthenticated'?{}:{id:user},{status:scenario==='unauthenticated'?401:200});
          if(url.includes('/evidence_items?') && !options.method) {
            if(scenario==='lookup-failure') return Response.json({}, {status:503});
            return Response.json([{id:'evidence',user_id:scenario==='wrong-owner'?'other':user,type:'contract',file_bucket:'evidence',file_path:'document.pdf',file_name:'document.pdf',file_type:'application/pdf'}]);
          }
          if(url.endsWith('reserve_ai_usage')) return Response.json({allowed:scenario!=='denied',plan:'free',limit:5,used:scenario==='denied'?5:0,request_id:body.p_request_id});
          if(url.endsWith('settle_ai_usage')) return Response.json(true);
          if(url.includes('googleapis.com')) {
            if(scenario==='provider-failure') return Response.json({error:{message:'test failure'}},{status:503});
            return Response.json({candidates:[{content:{parts:[{text:JSON.stringify({answer_text:'answer',confidence:0.8})}]}}]});
          }
          if(url.includes('/storage/v1/object/')) return new Response('file');
          if(options.method==='POST' || options.method==='PATCH') return new Response(null,{status:204});
          return Response.json([]);
        };
        const response=await handler(new Request('https://function.test',{method:'POST',headers:{authorization:'Bearer session'},body:JSON.stringify({question:'hello',evidence_id:'evidence'})}));
        const expected=scenario==='unauthenticated'?401:scenario==='denied'?402:scenario==='success'?200:scenario==='wrong-owner'?403:scenario==='provider-failure'&&name==='ask-assistant'?502:500;
        assert.equal(response.status,expected, name+' '+scenario);
        const provider=calls.findIndex(call=>call.url.includes('googleapis.com'));
        const reserve=calls.findIndex(call=>call.url.endsWith('reserve_ai_usage'));
        const settled=calls.find(call=>call.url.endsWith('settle_ai_usage'));
        if(scenario==='success' || scenario==='provider-failure') {
          assert.ok(provider>reserve && reserve>=0);
          assert.equal(settled.body.p_succeeded,scenario==='success');
        } else {
          assert.equal(provider,-1); assert.equal(settled,undefined);
          if(scenario==='wrong-owner' || scenario==='lookup-failure') {
            assert.equal(reserve,-1);
            assert.equal(calls.some(call=>call.url.includes('/evidence_items?') && call.body),false);
          }
        }
        if(scenario==='denied') assert.equal((await response.json()).error_code,'usage_limit_reached');
      }
    }
  } finally { globalThis.fetch=originalFetch; globalThis.Deno=originalDeno; }
});
