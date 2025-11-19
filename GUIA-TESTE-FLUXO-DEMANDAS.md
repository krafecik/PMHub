# Guia de Teste - Fluxo Completo de Demandas e Triagem

## Credenciais de Teste
- **Email**: claudio@faktory.com.br
- **Senha**: #3beBREs
- **URL**: http://localhost:3056/login

---

## Passo 1: Login

1. Acesse http://localhost:3056/login
2. Preencha:
   - Email: `claudio@faktory.com.br`
   - Senha: `#3beBREs`
3. Clique em "Entrar como administrador"
4. Aguarde redirecionamento para o Dashboard

---

## Passo 2: Cadastrar Demanda Completa

1. No menu lateral, clique em **"Demandas"**
2. Clique no botão **"+ Nova Demanda"** (canto superior direito ou botão flutuante)
3. Preencha o formulário com os seguintes dados:

### Informações Básicas:
- **Tipo**: Selecione uma opção (ex: "Problema", "Ideia" ou "Oportunidade")
- **Título**: `Usuários abandonam onboarding no passo 3`
- **Produto**: Selecione um produto da lista
- **Descrição detalhada**: 
  ```
  Observamos que 70% dos novos usuários abandonam o processo de onboarding no passo 3. 
  Este passo envolve a configuração de preferências e parece ser onde os usuários mais se confundem.
  
  Métricas afetadas:
  - Taxa de conclusão do onboarding: caiu de 85% para 30%
  - Tempo médio de onboarding: aumentou 40%
  - NPS de novos usuários: redução de 15 pontos
  
  Evidências:
  - Analytics mostra pico de abandono no passo 3
  - Feedback de suporte indica confusão com interface
  - Testes de usabilidade confirmam problema de UX
  ```

### Classificação e Contexto:
- **Origem**: Selecione uma opção (ex: "Analytics", "Suporte", "Pesquisa")
- **Prioridade**: Selecione (ex: "Alta" ou "Crítica")
- **Status inicial**: Selecione "Novo"
- **Detalhe da origem** (opcional): `Analytics + Feedback de Suporte`

### Atribuição:
- **Responsável** (opcional): Selecione um usuário ou deixe em branco

4. Clique em **"Criar Demanda"**
5. Aguarde a mensagem de sucesso
6. O drawer de detalhes deve abrir automaticamente

---

## Passo 3: Verificar Demanda Criada

1. No drawer que abriu, verifique:
   - ✅ Título está correto
   - ✅ Descrição está completa
   - ✅ Tipo, origem e prioridade estão corretos
   - ✅ Status está como "Novo"

2. Navegue pelas abas:
   - **Resumo**: Verifica informações básicas
   - **Contexto**: (em desenvolvimento)
   - **Histórico**: Verifica comentários

3. No rodapé do drawer, clique em **"Mover para Triagem"**
4. Aguarde redirecionamento para a página de Triagem

---

## Passo 4: Realizar Triagem da Demanda

1. Na página de **Triagem**, você deve ver a demanda criada
2. Clique no card da demanda para expandir (ou clique em "Expandir")
3. Verifique os **Sinais Visuais**:
   - ✅ "Útil" (se impacto e urgência estiverem definidos)
   - ⚠️ "Falta evidência" (se descrição for curta)
   - ⚠️ "Impreciso" (se título for curto ou tiver "?")

4. Clique no botão **"Enviar para Discovery"** (ou no card para abrir modal de detalhes)

### No Modal de Detalhes da Triagem:

1. **Preencha as Avaliações**:
   - **Impacto**: Selecione (ex: "Alto" ou "Crítico")
   - **Urgência**: Selecione (ex: "Alta")
   - **Complexidade**: Selecione (ex: "Média" ou "Alta")

2. **Verifique o Checklist de Triagem**:
   - ✅ Descrição clara e objetiva (deve estar OK com a descrição detalhada)
   - ✅ Alinhada ao produto correto
   - ✅ Impacto avaliado (após selecionar)
   - ✅ Urgência avaliada (após selecionar)
   - ✅ Duplicações revisadas

3. **Se houver pendências no checklist**:
   - Complete os itens obrigatórios
   - Adicione informações faltantes se necessário

4. **Observações** (opcional):
   - Adicione observações sobre a triagem se necessário

5. Clique em **"Enviar para Discovery"**
6. Aguarde mensagem de sucesso
7. A demanda deve desaparecer da lista de triagem (ou aparecer como "Pronto Discovery")

---

## Passo 5: Verificar Resultado

1. Navegue de volta para **"Demandas"**
2. Busque pela demanda criada
3. Abra o drawer da demanda
4. Verifique que:
   - ✅ Status mudou para "Triagem" ou "Discovery"
   - ✅ Histórico mostra a evolução

---

## Problemas Comuns e Soluções

### ❌ Erro ao criar demanda
- Verifique se todos os campos obrigatórios estão preenchidos
- Verifique se há produtos cadastrados
- Verifique se os catálogos (tipo, origem, prioridade, status) estão configurados

### ❌ Botão "Enviar para Discovery" desabilitado
- Verifique se todos os itens obrigatórios do checklist estão completos
- Verifique se Impacto, Urgência e Complexidade estão selecionados
- Verifique se a descrição tem pelo menos 120 caracteres e 10 palavras

### ❌ Demanda não aparece na triagem
- Verifique se o status da demanda foi atualizado para "TRIAGEM"
- Verifique se a triagem foi criada corretamente
- Recarregue a página

### ❌ Erro ao mover para triagem
- Verifique se o backend está rodando na porta 3055
- Verifique o console do navegador para erros
- Verifique os logs do backend

---

## Checklist de Validação

- [ ] Login funcionou corretamente
- [ ] Demanda foi criada com sucesso
- [ ] Todos os campos foram salvos corretamente
- [ ] Demanda foi movida para triagem
- [ ] Demanda aparece na página de triagem
- [ ] Avaliações (impacto, urgência, complexidade) foram preenchidas
- [ ] Checklist de triagem foi validado
- [ ] Demanda foi enviada para Discovery com sucesso
- [ ] Status da demanda foi atualizado corretamente
- [ ] Histórico mostra a evolução da demanda

---

## Observações Importantes

1. **Descrição Mínima**: Para passar no checklist, a descrição deve ter:
   - Mínimo de 120 caracteres
   - Mínimo de 10 palavras

2. **Checklist Obrigatório**: Todos os itens marcados como obrigatórios devem estar completos antes de enviar para Discovery

3. **Catálogos**: Certifique-se de que os catálogos (tipo_demanda, origem_demanda, prioridade_nivel, status_demanda, impacto, urgencia, complexidade) estão configurados em Configurações > Catálogos Flexíveis

4. **Produtos**: Deve haver pelo menos um produto cadastrado para criar demandas

---

## Próximos Passos Após o Teste

Se encontrar problemas:
1. Anote o erro exato
2. Verifique o console do navegador (F12)
3. Verifique os logs do backend
4. Reporte os problemas encontrados

Se tudo funcionou:
1. Teste outros cenários (diferentes tipos, prioridades, etc.)
2. Teste fluxos alternativos (solicitar info, marcar duplicata, arquivar)
3. Teste o modo foco na triagem
4. Teste diferentes visualizações (cards, lista, kanban)



