import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
const source=await readFile(new URL('../c101-mobile/src/hooks/authRedirect.ts',import.meta.url),'utf8');
const {nativeAuthRedirect,nativeCallbackRedirect}=await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString('base64')}`);
test('registered installed-app callback is preserved without rewriting the path',()=>{
 assert.equal(nativeAuthRedirect('c101://auth/callback','unused'),'c101://auth/callback');
});
test('HTTPS web bridge retains its host and clears old query/fragment',()=>{
 assert.equal(nativeAuthRedirect('https://example.com/old?q=1#old','unused'),'https://example.com/auth/native-callback');
});
test('HTTP local bridge keeps its port',()=>{
 assert.equal(nativeAuthRedirect('http://localhost:8086/test','unused'),'http://localhost:8086/auth/native-callback');
});
test('unset native redirect uses the runtime-generated deep link',()=>{
 assert.equal(nativeAuthRedirect(undefined,'exp://127.0.0.1:8081/--/auth/callback'),'exp://127.0.0.1:8081/--/auth/callback');
});
test('bridge default opens the installed app instead of an old development IP',()=>{
 assert.equal(nativeCallbackRedirect(undefined),'c101://auth/callback');
});
test('explicit Expo Go bridge callback remains supported',()=>{
 assert.equal(nativeCallbackRedirect('exp://192.0.2.1:8081/--/auth/callback'),'exp://192.0.2.1:8081/--/auth/callback');
});
