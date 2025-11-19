export enum TipoEvidenciaEnum {
  DADOS_ANALYTICS = 'DADOS_ANALYTICS',
  PRINT = 'PRINT',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  FEEDBACK_USUARIO = 'FEEDBACK_USUARIO',
  LOG_SISTEMA = 'LOG_SISTEMA',
  TRANSCRICAO = 'TRANSCRICAO',
  RESULTADO_TESTE = 'RESULTADO_TESTE',
  BENCHMARK = 'BENCHMARK',
  DOCUMENTO = 'DOCUMENTO',
}

export class TipoEvidenciaVO {
  private static readonly VALID_TYPES = Object.values(TipoEvidenciaEnum);

  constructor(private readonly value: TipoEvidenciaEnum) {
    if (!TipoEvidenciaVO.VALID_TYPES.includes(value)) {
      throw new Error(`Tipo de evidência inválido: ${value}`);
    }
  }

  getValue(): TipoEvidenciaEnum {
    return this.value;
  }

  getLabel(): string {
    const labels: Record<TipoEvidenciaEnum, string> = {
      [TipoEvidenciaEnum.DADOS_ANALYTICS]: 'Dados Analytics',
      [TipoEvidenciaEnum.PRINT]: 'Print/Screenshot',
      [TipoEvidenciaEnum.VIDEO]: 'Vídeo',
      [TipoEvidenciaEnum.AUDIO]: 'Áudio',
      [TipoEvidenciaEnum.FEEDBACK_USUARIO]: 'Feedback de Usuário',
      [TipoEvidenciaEnum.LOG_SISTEMA]: 'Log do Sistema',
      [TipoEvidenciaEnum.TRANSCRICAO]: 'Transcrição',
      [TipoEvidenciaEnum.RESULTADO_TESTE]: 'Resultado de Teste',
      [TipoEvidenciaEnum.BENCHMARK]: 'Benchmark',
      [TipoEvidenciaEnum.DOCUMENTO]: 'Documento',
    };
    return labels[this.value];
  }

  requiresFile(): boolean {
    return [
      TipoEvidenciaEnum.PRINT,
      TipoEvidenciaEnum.VIDEO,
      TipoEvidenciaEnum.AUDIO,
      TipoEvidenciaEnum.DOCUMENTO,
    ].includes(this.value);
  }

  equals(other: TipoEvidenciaVO): boolean {
    return this.value === other.value;
  }
}
