export const clusterName = 'dpf-training';

export function gradeLesson(namespace, configmap) {
  const checks = [
    {label: 'Europe namespace is Active', passed: namespace?.metadata?.name === 'tenant-europe' && namespace?.status?.phase === 'Active'},
    {label: 'Namespace has workshop.dpf/tenant=europe', passed: namespace?.metadata?.labels?.['workshop.dpf/tenant'] === 'europe'},
    {label: 'lab-identity belongs to tenant-europe', passed: configmap?.metadata?.name === 'lab-identity' && configmap?.metadata?.namespace === 'tenant-europe'},
    {label: 'Identity says region=europe and environment=simulation', passed: configmap?.data?.region === 'europe' && configmap?.data?.environment === 'simulation'},
  ];
  return {passed: checks.every(check => check.passed), checks};
}

export function allowedRequest(host, origin) {
  return typeof host === 'string' && /^(localhost|127\.0\.0\.1):[0-9]+$/.test(host) && origin === `http://${host}`;
}

export function validateCluster(config) {
  const expected = `kind-${clusterName}`;
  const context = config.contexts?.[0];
  const cluster = config.clusters?.[0];
  const user = config.users?.[0];
  if (config['current-context'] !== expected || config.contexts?.length !== 1 || config.clusters?.length !== 1 || config.users?.length !== 1 ||
      context?.name !== expected || context?.context?.cluster !== expected || context?.context?.user !== expected ||
      cluster?.name !== expected || cluster?.cluster?.server !== `https://${clusterName}-control-plane:6443` ||
      user?.name !== expected || user?.user?.exec || user?.user?.['auth-provider'] ||
      !user?.user?.['client-certificate-data'] || !user?.user?.['client-key-data']) {
    throw new Error('Only the dedicated internal kind-dpf-training kubeconfig is accepted.');
  }
}
