import { getMpaSessionStore } from '../../services/MpaSessionStore';
import { DependencyService } from '../../services/dependencyService';
import type { AgentTool } from './types';

interface Input {
  sessionId?: string;
  focusServer?: string;
  includeWaves?: boolean;
  maxNodes?: number;
}

const dependencyService = new DependencyService();

/**
 * Reads the MPA already uploaded for the current session and returns a
 * compact dependency picture (clusters, optional migration waves, optional
 * focus subgraph). Replaces the old "OPCIÓN 1: paste data here / OPCIÓN 2:
 * use the native tool" hallucination — the agent now has a real tool.
 */
export const getDependencyGraphTool: AgentTool<Input> = {
  name: 'get_dependency_graph',
  description:
    'Return the dependency graph from the MPA uploaded for this session. ' +
    'Use this when the consultant asks about server dependencies, clusters, ' +
    'migration waves, or which server depends on which. If `focusServer` is ' +
    'provided, returns the subgraph around that server. If `includeWaves` is ' +
    'true (default), also includes the proposed migration wave plan based on ' +
    'criticality and dependency chains. Token-friendly: caps node and edge ' +
    'counts so the response always fits.',
  input_schema: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: 'Defaults to the current session in context.',
      },
      focusServer: {
        type: 'string',
        description:
          'Optional. If supplied, returns only the subgraph around this ' +
          'server (incoming/outgoing + transitive deps up to depth 2).',
      },
      includeWaves: {
        type: 'boolean',
        description:
          'Include the proposed migration wave plan. Default true.',
      },
      maxNodes: {
        type: 'number',
        description:
          'Cap on nodes returned in `graph.nodes` (default 80, max 200). ' +
          'Edges are trimmed proportionally to stay token-friendly.',
      },
    },
    additionalProperties: false,
  },
  async run(input, ctx) {
    const sessionId = input.sessionId ?? ctx.sessionId;
    if (!sessionId) {
      return { error: 'no sessionId available in context' };
    }

    const stored = await getMpaSessionStore().get(sessionId);
    if (!stored) {
      return {
        error: 'no_mpa_uploaded',
        message:
          'No hay un MPA cargado para esta sesión. Pídele al usuario subir ' +
          'el archivo Excel del MPA con el botón de adjuntar (📎) en el chat ' +
          'y vuelve a llamar esta tool.',
      };
    }

    const data = stored.data;
    const cap = Math.min(Math.max(input.maxNodes ?? 80, 10), 200);
    const includeWaves = input.includeWaves ?? true;

    if (input.focusServer) {
      const subgraph = dependencyService.searchDependencies(data, input.focusServer);
      if (!subgraph) {
        return {
          sessionId,
          focusServer: input.focusServer,
          message: `No se encontró el servidor "${input.focusServer}" en el MPA.`,
          availableSampleServers: Array.from(data.servers).slice(0, 20),
        };
      }
      const trimmed = trimGraph(subgraph.graph, cap);
      return {
        sessionId,
        mpaFile: stored.filename,
        focusServer: subgraph.server,
        incoming: subgraph.dependencies.incoming.length,
        outgoing: subgraph.dependencies.outgoing.length,
        relatedServers: subgraph.relatedServers.slice(0, 50),
        relatedApplications: subgraph.relatedApplications.slice(0, 30),
        graph: trimmed,
      };
    }

    const fullGraph = dependencyService.buildDependencyGraph(data.dependencies);
    const trimmed = trimGraph(fullGraph, cap);

    const result: Record<string, unknown> = {
      sessionId,
      mpaFile: stored.filename,
      uploadedAt: stored.uploadedAt,
      summary: data.summary,
      isolatedServerCount: Math.max(
        0,
        data.servers.size - new Set(fullGraph.nodes.map((n) => n.id)).size
      ),
      graph: trimmed,
    };

    if (includeWaves) {
      const waves = dependencyService.calculateMigrationWaves(data.dependencies);
      result.migrationWaves = {
        totalWaves: waves.totalWaves,
        totalServers: waves.totalServers,
        serversWithoutDependencies: waves.serversWithoutDependencies,
        waves: waves.waves.map((w) => ({
          waveNumber: w.waveNumber,
          serverCount: w.serverCount,
          servers: w.servers.slice(0, 25),
          truncated: w.servers.length > 25,
        })),
      };
    }

    return result;
  },
};

function trimGraph(
  graph: { nodes: Array<{ id: string; label: string; group?: string }>; edges: Array<{ from: string; to: string; label: string }> },
  cap: number
) {
  if (graph.nodes.length <= cap) {
    return {
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
      nodes: graph.nodes,
      edges: graph.edges.slice(0, cap * 4),
      truncated: graph.edges.length > cap * 4,
    };
  }
  const keep = new Set(graph.nodes.slice(0, cap).map((n) => n.id));
  const nodes = graph.nodes.filter((n) => keep.has(n.id));
  const edges = graph.edges.filter((e) => keep.has(e.from) && keep.has(e.to));
  return {
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    nodes,
    edges: edges.slice(0, cap * 4),
    truncated: true,
    note: `Truncated to first ${cap} nodes for token budget.`,
  };
}
