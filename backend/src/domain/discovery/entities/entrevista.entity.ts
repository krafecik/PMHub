import { TenantId } from '../../shared/value-objects/tenant-id.vo';
import { EntrevistaId, PesquisaId } from '../value-objects';

interface EntrevistaProps {
  id?: EntrevistaId;
  tenantId: TenantId;
  pesquisaId: PesquisaId;
  participanteNome: string;
  participantePerfil?: string;
  participanteEmail?: string;
  dataHora: Date;
  transcricao?: string;
  notas?: string;
  gravacaoUrl?: string;
  tags: string[];
  duracaoMinutos?: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export class Entrevista {
  private readonly props: EntrevistaProps;

  constructor(props: EntrevistaProps) {
    this.props = props;
  }

  get id(): EntrevistaId | undefined {
    return this.props.id;
  }

  get tenantId(): TenantId {
    return this.props.tenantId;
  }

  get pesquisaId(): PesquisaId {
    return this.props.pesquisaId;
  }

  get participanteNome(): string {
    return this.props.participanteNome;
  }

  get participantePerfil(): string | undefined {
    return this.props.participantePerfil;
  }

  get participanteEmail(): string | undefined {
    return this.props.participanteEmail;
  }

  get dataHora(): Date {
    return this.props.dataHora;
  }

  get transcricao(): string | undefined {
    return this.props.transcricao;
  }

  get notas(): string | undefined {
    return this.props.notas;
  }

  get gravacaoUrl(): string | undefined {
    return this.props.gravacaoUrl;
  }

  get tags(): string[] {
    return this.props.tags;
  }

  get duracaoMinutos(): number | undefined {
    return this.props.duracaoMinutos;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | null | undefined {
    return this.props.deletedAt;
  }

  // Domain Methods
  isRealizada(): boolean {
    return new Date() > this.props.dataHora;
  }

  isAgendada(): boolean {
    return new Date() <= this.props.dataHora;
  }

  hasTranscricao(): boolean {
    return !!this.props.transcricao && this.props.transcricao.trim().length > 0;
  }

  hasNotas(): boolean {
    return !!this.props.notas && this.props.notas.trim().length > 0;
  }

  hasGravacao(): boolean {
    return !!this.props.gravacaoUrl;
  }

  updateParticipantePerfil(perfil: string): void {
    this.props.participantePerfil = perfil;
  }

  updateDataHora(dataHora: Date): void {
    if (this.isRealizada()) {
      throw new Error('Não é possível alterar a data de uma entrevista já realizada');
    }
    this.props.dataHora = dataHora;
  }

  addTranscricao(transcricao: string): void {
    if (!this.isRealizada()) {
      throw new Error('Entrevista ainda não foi realizada');
    }
    this.props.transcricao = transcricao;
  }

  updateNotas(notas: string): void {
    this.props.notas = notas;
  }

  addGravacao(gravacaoUrl: string, duracaoMinutos?: number): void {
    if (!this.isRealizada()) {
      throw new Error('Entrevista ainda não foi realizada');
    }
    this.props.gravacaoUrl = gravacaoUrl;
    if (duracaoMinutos) {
      this.props.duracaoMinutos = duracaoMinutos;
    }
  }

  addTag(tag: string): void {
    if (!tag || tag.trim().length === 0) {
      throw new Error('Tag não pode ser vazia');
    }

    const normalizedTag = tag.trim().toLowerCase();
    if (!this.props.tags.includes(normalizedTag)) {
      this.props.tags.push(normalizedTag);
    }
  }

  removeTag(tag: string): void {
    const normalizedTag = tag.trim().toLowerCase();
    this.props.tags = this.props.tags.filter((t) => t !== normalizedTag);
  }

  updateDuracaoMinutos(duracao: number): void {
    if (duracao < 0) {
      throw new Error('Duração não pode ser negativa');
    }
    this.props.duracaoMinutos = duracao;
  }

  // Factory method
  static create(
    props: Omit<EntrevistaProps, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> & {
      tags?: string[];
    },
  ): Entrevista {
    if (!props.participanteNome || props.participanteNome.trim().length === 0) {
      throw new Error('Nome do participante é obrigatório');
    }

    return new Entrevista({
      ...props,
      tags: props.tags || [],
    });
  }

  // Reconstitution from persistence
  static fromPersistence(props: EntrevistaProps): Entrevista {
    return new Entrevista(props);
  }
}
