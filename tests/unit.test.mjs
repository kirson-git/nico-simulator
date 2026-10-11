import test from 'node:test';
import assert from 'node:assert/strict';
import { gradeLesson, allowedRequest, validateCluster } from '../lesson.mjs';

test('grading rejects missing, terminating and mislabeled resources', () => {
  const ns = {metadata: {name: 'tenant-europe', labels: {'workshop.dpf/tenant': 'europe'}}, status: {phase: 'Active'}};
  const cm = {metadata: {name: 'lab-identity', namespace: 'tenant-europe'}, data: {region: 'europe', environment: 'simulation'}};
  for (const [namespace, configmap, passed] of [
    [null, null, false], [ns, null, false],
    [{...ns, metadata: {...ns.metadata, labels: {}}}, cm, false],
    [{...ns, status: {phase: 'Terminating'}}, cm, false],
    [ns, {...cm, data: {...cm.data, region: 'asia'}}, false],
    [ns, {...cm, data: {...cm.data, environment: 'physical'}}, false],
    [ns, cm, true],
  ]) assert.equal(gradeLesson(namespace, configmap).passed, passed);
});

test('browser requests require the exact local origin, rejecting cross-origin and rebinding hosts', () => {
  for (const [host, origin, want] of [
    ['127.0.0.1:8780', 'http://127.0.0.1:8780', true],
    ['localhost:8780', 'http://localhost:8780', true],
    ['localhost:8780', 'http://evil.example', false],
    ['evil.example:8780', 'http://evil.example:8780', false],
    ['localhost:8780', undefined, false],
    ['localhost:8780', 'null', false],
  ]) assert.equal(allowedRequest(host, origin), want);
});

test('startup refuses default, external, or credential-plugin kubeconfigs', () => {
  const config = {'current-context': 'kind-dpf-training', contexts: [{name: 'kind-dpf-training', context: {cluster: 'kind-dpf-training', user: 'kind-dpf-training'}}], clusters: [{name: 'kind-dpf-training', cluster: {server: 'https://dpf-training-control-plane:6443'}}], users: [{name: 'kind-dpf-training', user: {'client-certificate-data': 'test', 'client-key-data': 'test'}}]};
  assert.doesNotThrow(() => validateCluster(config));
  for (const bad of [
    {...config, 'current-context': 'physical'},
    {...config, clusters: [{name: 'kind-dpf-training', cluster: {server: 'https://192.0.2.1:6443'}}]},
    {...config, users: [{name: 'kind-dpf-training', user: {exec: {command: 'something'}}}]},
    {...config, contexts: [...config.contexts, {name: 'physical'}]},
  ]) assert.throws(() => validateCluster(bad));
});
