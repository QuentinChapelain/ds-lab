// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startFixtureServers } from './helpers/serveur.js';

test('serveurs de fixtures : deux origines, substitution de l’origine distante', async (t) => {
  const s = await startFixtureServers();
  t.after(s.close);
  assert.notEqual(new URL(s.origin).origin, new URL(s.remoteOrigin).origin);

  const html = await (await fetch(`${s.origin}/`)).text();
  assert.ok(html.includes(`${s.remoteOrigin}/styles/remote.css`));
  assert.ok(!html.includes('{{ORIGINE_DISTANTE}}'));

  const remote = await fetch(`${s.remoteOrigin}/styles/remote.css`);
  assert.equal(remote.status, 200);
  assert.match(remote.headers.get('content-type') ?? '', /text\/css/);
  assert.equal(remote.headers.get('access-control-allow-origin'), null, 'pas d’en-tête CORS : la feuille reste illisible depuis la page');

  assert.equal((await fetch(`${s.origin}/styles/theme.css`)).status, 200);
  assert.equal((await fetch(`${s.origin}/page-2.html`)).status, 200);
  assert.equal((await fetch(`${s.origin}/absent.css`)).status, 404);
  assert.equal((await fetch(`${s.remoteOrigin}/../index.html`)).status, 404);
});

test.todo('audit de bout en bout : déclaré (lot 3)');
test.todo('audit de bout en bout : rendu et contraste (lot 4)');
