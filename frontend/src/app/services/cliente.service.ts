import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Cliente {
  id: number;
  tipoCliente: 'PF' | 'PJ';
  nomeRazaoSocial: string;
  nomeFantasia?: string | null;
  cpfCnpj: string;
  rgIe?: string | null;
  dataCadastro?: string | null;
  ativo: boolean;
  telefonePrincipal?: string | null;
  telefoneSecundario?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  observacoes?: string | null;
  tipoClienteBorracharia?: 'Avulso' | 'Frotista' | 'Empresa' | null;
  limiteCredito?: number | null;
  formaPagamentoPadrao?: string | null;
}

export interface ClientePayload extends Omit<Cliente, 'id' | 'dataCadastro'> {}

export interface ClienteHistorico {
  id: number;
  idCliente: number;
  tipoEvento: string;
  descricao?: string | null;
  dataEvento?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private baseUrl = environment.apiUrl || '';

  constructor(private http: HttpClient) {}

  listar(filtros?: { nome?: string; empresa?: string }): Observable<Cliente[]> {
    let params = new HttpParams();
    if (filtros?.nome) params = params.set('nome', filtros.nome);
    if (filtros?.empresa) params = params.set('empresa', filtros.empresa);
    return this.http.get<Cliente[]>(`${this.baseUrl}/clientes`, { params });
  }

  obter(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.baseUrl}/clientes/${id}`);
  }

  criar(payload: ClientePayload): Observable<Cliente> {
    return this.http.post<Cliente>(`${this.baseUrl}/clientes`, payload);
  }

  atualizar(id: number, payload: ClientePayload): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/clientes/${id}`, payload);
  }

  remover(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/clientes/${id}`);
  }

  historico(idCliente: number): Observable<ClienteHistorico[]> {
    return this.http.get<ClienteHistorico[]>(`${this.baseUrl}/clientes/${idCliente}/historico`);
  }

  adicionarHistorico(idCliente: number, payload: { tipoEvento: string; descricao?: string | null }): Observable<ClienteHistorico> {
    return this.http.post<ClienteHistorico>(`${this.baseUrl}/clientes/${idCliente}/historico`, payload);
  }
}

