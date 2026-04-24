import { MigrationWave } from '@/types/assessment';

export interface DependencyEdge {
  source: string;
  target: string;
  port?: number;
  protocol?: string;
}

export interface Cluster {
  id: string;
  servers: string[];
  internalEdges: number;
  externalEdges: number;
}

export interface WaveConflict {
  waveId: string;
  waveNumber: number;
  server: string;
  dependsOn: string;
  dependsOnWaveNumber: number;
  severity: 'critical' | 'warning';
  message: string;
}

export function detectClusters(
  allServers: string[],
  dependencies: DependencyEdge[]
): Cluster[] {
  const adjacency = new Map<string, Set<string>>();
  allServers.forEach((s) => adjacency.set(s, new Set()));

  dependencies.forEach((d) => {
    if (!d.source || !d.target) return;
    if (!adjacency.has(d.source)) adjacency.set(d.source, new Set());
    if (!adjacency.has(d.target)) adjacency.set(d.target, new Set());
    adjacency.get(d.source)!.add(d.target);
    adjacency.get(d.target)!.add(d.source);
  });

  const visited = new Set<string>();
  const clusters: Cluster[] = [];

  for (const [node] of adjacency) {
    if (visited.has(node)) continue;
    const members: string[] = [];
    const queue: string[] = [node];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      members.push(current);
      const neighbors = adjacency.get(current);
      if (!neighbors) continue;
      for (const n of neighbors) {
        if (!visited.has(n)) queue.push(n);
      }
    }
    const memberSet = new Set(members);
    let internal = 0;
    let external = 0;
    dependencies.forEach((d) => {
      const sIn = memberSet.has(d.source);
      const tIn = memberSet.has(d.target);
      if (sIn && tIn) internal++;
      else if (sIn || tIn) external++;
    });
    clusters.push({
      id: `cluster-${clusters.length + 1}`,
      servers: members.sort(),
      internalEdges: internal,
      externalEdges: external,
    });
  }

  return clusters.sort((a, b) => b.servers.length - a.servers.length);
}

export function detectWaveConflicts(
  waves: MigrationWave[],
  dependencies: DependencyEdge[]
): WaveConflict[] {
  const serverToWave = new Map<string, { id: string; number: number }>();
  waves.forEach((w) => {
    (w.servers ?? []).forEach((s) =>
      serverToWave.set(s, { id: w.id, number: w.waveNumber })
    );
  });

  const conflicts: WaveConflict[] = [];
  const seen = new Set<string>();

  dependencies.forEach((d) => {
    const sourceWave = serverToWave.get(d.source);
    const targetWave = serverToWave.get(d.target);
    if (!sourceWave || !targetWave) return;

    // Conflict: source depends on target, but target migrates later.
    if (sourceWave.number < targetWave.number) {
      const key = `${sourceWave.id}|${d.source}|${d.target}`;
      if (seen.has(key)) return;
      seen.add(key);
      conflicts.push({
        waveId: sourceWave.id,
        waveNumber: sourceWave.number,
        server: d.source,
        dependsOn: d.target,
        dependsOnWaveNumber: targetWave.number,
        severity: targetWave.number - sourceWave.number > 1 ? 'critical' : 'warning',
        message: `${d.source} (Wave ${sourceWave.number}) depends on ${d.target} (Wave ${targetWave.number}) — target should migrate first.`,
      });
    }
  });

  return conflicts.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'critical' ? -1 : 1;
    return a.waveNumber - b.waveNumber;
  });
}

export function suggestWavesFromClusters(
  clusters: Cluster[],
  maxServersPerWave = 25
): Array<{ waveNumber: number; servers: string[]; rationale: string }> {
  const waves: Array<{ waveNumber: number; servers: string[]; rationale: string }> = [];
  let waveNumber = 1;

  clusters.forEach((cluster) => {
    if (cluster.servers.length <= maxServersPerWave) {
      waves.push({
        waveNumber: waveNumber++,
        servers: cluster.servers,
        rationale: `Connected cluster of ${cluster.servers.length} servers (${cluster.internalEdges} internal flows).`,
      });
      return;
    }

    for (let i = 0; i < cluster.servers.length; i += maxServersPerWave) {
      const chunk = cluster.servers.slice(i, i + maxServersPerWave);
      waves.push({
        waveNumber: waveNumber++,
        servers: chunk,
        rationale: `Large cluster split by size — batch ${Math.floor(i / maxServersPerWave) + 1}.`,
      });
    }
  });

  return waves;
}
