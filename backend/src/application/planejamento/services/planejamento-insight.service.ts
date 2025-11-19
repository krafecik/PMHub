import { Injectable } from '@nestjs/common';
import { CapacitySnapshot, Epico } from '@domain/planejamento';

@Injectable()
export class PlanejamentoInsightService {
  buildCapacityAlerts(snapshots: CapacitySnapshot[]): string[] {
    return snapshots
      .map((snapshot) => {
        const obj = snapshot.toObject();
        const utilization =
          obj.capacidadeTotal === 0 ? 0 : (obj.capacidadeUsada / obj.capacidadeTotal) * 100;
        if (utilization > 110) {
          return `Squad ${obj.squadId} acima de 110% (${utilization.toFixed(1)}%).`;
        }
        if (utilization < 70) {
          return `Squad ${obj.squadId} com folga de capacidade (${utilization.toFixed(1)}%).`;
        }
        return null;
      })
      .filter((alert): alert is string => Boolean(alert));
  }

  buildScenarioComments(
    cabem: string[],
    atrasados: string[],
    capacityMap: Map<string, number>,
  ): string[] {
    const comments: string[] = [];
    if (atrasados.length > 0) {
      comments.push(
        `${atrasados.length} épico(s) excedem a capacidade disponível. Avalie replanejamento ou ajustes de squad.`,
      );
    } else {
      comments.push('Todos os épicos cabem dentro da capacidade configurada.');
    }

    const squadsSemCapacidade = [...capacityMap.entries()].filter(([, value]) => value <= 0);
    if (squadsSemCapacidade.length > 0) {
      comments.push(
        `Existem squads sem capacidade registrada: ${squadsSemCapacidade
          .map(([squad]) => squad)
          .join(', ')}.`,
      );
    }

    if (cabem.length > 0 && atrasados.length > 0) {
      comments.push('Considere mover épicos Targeted para outros squads com folga.');
    }

    return comments;
  }

  getEpicoHealthHint(epico: Epico, capacityBySquad: Map<string, number>): string | null {
    const obj = epico.toObject();
    if (!obj.squadId) return 'Defina um squad para liberar capacidade estimada.';
    const capacity = capacityBySquad.get(obj.squadId);
    if (capacity === undefined) {
      return `Sem snapshot de capacidade para o squad ${obj.squadId}.`;
    }
    if ((obj.progressPercent ?? 0) < 25 && obj.health.getValue() === 'GREEN') {
      return 'Revise health: progresso baixo pode indicar risco oculto.';
    }
    return null;
  }
}
