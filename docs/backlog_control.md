# 🗂️ recicla Core — Quadro Geral de Backlog e Próximos Passos

Este documento gerencia o estado da arte do desenvolvimento do motor `recicla`. Nenhuma tarefa se perde. O progresso é cumulativo, temporal e imutável.

---

## 🏃‍♂️ EM EXECUÇÃO (Foco Atual / Engatilhados)

### 📊 ITEM 01: Simetria de Documentação Viva das Verticais
* **Data de Geração:** 11/06/2026 (11:30h)
* **Status:** 🟢 100% CONCLUÍDO (Entregue em 11/06/2026 - 12:10h)
* **Resultado:** Chão 100% simétrico e em inglês técnico (`corp_business_rules.md` e `city_business_rules.md`).

### 🏢 ITEM 02: Adaptação das Rotas do Servidor (`server.ts`) para o Fluxo B2B
* **Data de Geração:** 11/06/2026 (12:00h)
* **Status:** 🟢 100% CONCLUÍDO (Homologado na raiz nativa /recicla em 11/06/2026 - 15:10h)
* **Resultado:** Endpoints de `/resolution` e `/transition` respondendo sob as travas lógicas da máquina de estados.

### 🧪 ITEM 03: Teste de Carga e Ingestão Física via `curl`
* **Data de Geração:** 10/06/2026 (18:15h)
* **Status:** 🟢 100% CONCLUÍDO (Executado e Homologado via Terminal em 11/06/2026 - 15:25h)
* **Evidência:** O terminal barrou com HTTP 400 tentativas de burla de fluxo e aceitou avanço em passo único com HTTP 200.

### 📊 ITEM 04 (Fase F): Geração do Protótipo Unificado Front-End (Sankey Integrado)
* **Data de Geração:** 13/06/2026 (10:24h)
* **Status:** 🟢 100% CONCLUÍDO
* **Resultado:** Arquivo `dashboard.html` criado com sucesso. Integração nativa com Google Charts para plotagem do diagrama Sankey em Dark Mode (Balanço de Massa Secos + Orgânicos) e consolidação visual dos dados originários das 7 visões analíticas por vertical.

### 4.3 Filtro de Incompatibilidade de Destino (Classe I vs Classe II)
O sistema opera em conformidade estrita com a Política Nacional de Resíduos Sólidos (PNRS):
* **CONSOLIDADOR (Cooperativa/Pátio):** Exclusivo para fluxos de Classe II (A - Recicláveis e B - Orgânicos/Compostáveis).
* **BLOQUEIO NA ORIGEM:** Qualquer tentativa de emitir uma Ordem de Serviço (O.S.) vinculando um gerador de Resíduo Classe I (Perigoso) a um destino do tipo Consolidador será abortada pelo middleware `validarIncompatibilidadeClasse` antes de gerar a missão.


### 🏢 ITEM 05 (Fase G): Saneamento Arquitetural e Modularização por Domínio
* **Data de Geração:** 13/06/2026 (13:25h)
* **Status:** 🟢 100% CONCLUÍDO (Design Saneado)
* **Resultado:** Removido o arquivo de rotas solto da pasta global do gateway. Criado o `metricsController.ts` dentro de `src/modules/consolidation/controllers/` para respeitar o princípio de encapsulamento de domínio, isolando as queries do Consolidador e preparando a arquitetura para receber as futuras expansões de CITY e M2a de forma limpa.


### 🏢 ITEM 06 (Fase G): Implementação do Middleware de Bloqueio EHS para Classe I
* **Data de Geração:** 13/06/2026 (15:58h)
* **Status:** 🟢 100% CONCLUÍDO (Barramento de Origem Trancado)
* **Resultado:** Criado o validador `osValidator.ts` para inspecionar as Ordens de Serviço em tempo de execução. O sistema agora impede a criação de missões com resíduos perigosos (Classe I) destinadas ao Consolidador, garantindo a conformidade legal do operador de PGRS e protegendo as frentes de trabalho da cooperativa na raiz do processo.


### 🏢 ITEM 06 (Fase I): Refinamento da Equação de Fluxo Contínuo Mensal
* **Data de Geração:** 13/06/2026 (14:00h)
* **Status:** 🟢 100% CONCLUÍDO (Consenso Atingido)
* **Resultado:** Substituída a lógica de inventariado pelo modelo de Saldo Técnico Dedutível (ME = MV + EMS + Rj). O sistema agora calcula o material em processo e fardado de forma indireta por balanço de fluxo, mantendo a blindagem anti-fraude para NF-es sem alterar a rotina operacional da cooperativa.


### 🏢 ITEM 06 (Fase J): Trancamento Gravimétrico no Emulador e Alinhamento de KPIs
* **Data de Geração:** 13/06/2026 (16:15h)
* **Status:** 🟢 100% CONCLUÍDO (Pronto para Homologação)
* **Resultado:** Saneado o escopo arquitetural: os parâmetros de gravimetria nacional foram mantidos exclusivamente na camada de injeção sintética do simulador. O dashboard e as APIs permanecem 100% agnósticos e baseados em dados puros. Atualizados os cartões do front-end para exibir de forma elegante o trio fiscal estruturado (MV, EMS, ME) associado ao cálculo de CO₂ equivalente.


### 🏢 ITEM 06 (Fase L): Correção de Inicialização Relacional DDL no Injetor
* **Data de Geração:** 13/06/2026 (16:15h)
* **Status:** 🟢 100% CONCLUÍDO (Estabilizado)
* **Resultado:** Tratada a exceção de tabela inexistente adicionando blocos `CREATE TABLE IF NOT EXISTS` no script `simulate_kmp_flow.sh`. O mecanismo de isolamento transacional do PostgreSQL funcionou perfeitamente, abortando a carga prévia sem deixar resíduos corrompidos na base de dados.

### 🏢 ITEM 06 (Fase M): Saneamento Relacional do Injetor via Sequenciadores Nativos
* **Data de Geração:** 13/06/2026 (16:21h)
* **Status:** 🟢 100% CONCLUÍDO (Estabilizado)
* **Resultado:** Eliminada a quebra de Foreign Key no script de emulação. Substituídas as IDs fixas pela função `currval('id_seq')` do PostgreSQL, sincronizando dinamicamente as chaves de evidência no exato milissegundo de inserção das missões. Transação concluída com sucesso absoluto.

### 🏢 ITEM 06 (Fase N): Transição do Pipeline para Inserções Atômicas via CTE
* **Data de Geração:** 13/06/2026 (16:33h)
* **Status:** 🟢 100% CONCLUÍDO (Saneado e Estabilizado)
* **Resultado:** Substituído o comando volátil `currval()` por blocos transacionais `WITH ... RETURNING`. A amarração relacional de chaves estrangeiras entre as Ordens de Serviço (O.S.) e as Evidências Mobile agora ocorre de forma atômica na memória do PostgreSQL, garantindo a carga contínua sem risco de rollback de integridade.

### 🏢 ITEM 06 (Fase U): Pacificação de Arquitetura Física e Assentamento de Serviços
* **Data de Geração:** 13/06/2026 (17:09h)
* **Status:** 🟢 100% CONCLUÍDO (Topologia Selada)
* **Resultado:** Derrubadas de forma definitiva todas as suposições de pacotes complexos do Android Studio. O arquivo de ciclo de vida mobile foi assentado na rota legítima determinada pela árvore física: `workspace/torre/mobile/services/JornadaService.kt`. O ecossistema está limpo, sem hardcodes artificiais e pronto para operar a engenharia de dados.


### 🏢 ITEM 06 (Fase Z6): Carimbo Temporal e Geográfico de Evidências Fotográficas no Backend
* **Data de Geração:** 13/06/2026 (18:15h)
* **Status:** 🟢 100% CONCLUÍDO (Malha Pericial Selada)
* **Resultado:** Implementada a checagem cruzada de metadados das imagens no Backend do Recicla. O aplicativo móvel coleta a latitude, longitude e data/hora com segundos na captura da foto e repassa de forma bruta. O controlador `forensicMissionController.ts` analisa os dados e aplica travas de distância (máximo 200m) e cronologia, invalidando na raiz fraudes de reutilização de imagens.

### 🏢 ITEM 06 (Fase Z10): Correção de Contexto de Execução do Simulador PGRS
* **Data de Geração:** 13/06/2026 (18:39h)
* **Status:** 🟢 100% CONCLUÍDO (Ambiente Sincronizado)
* **Resultado:** Identificado que o terminal operava diretamente no escopo de trabalho `/boot/torre/recicla`. Corrigidos os comandos de chamada de `workspace/torre/...` para o caminho relativo direto `./tests/simulate_kmp_flow.sh`. O script agora possui livre trânsito de execução para testar as travas do backend do Recicla.

---

### 🗂️ Atualização do Registo de Backlog (`docs/backlog_control.md`)

```markdown
### 🏢 ITEM 06 (Fase Z16): Criação do Diretório Shared via Automação de Terminal
* **Data de Geração:** 13/06/2026 (19:04h)
* **Status:** 🟢 100% CONCLUÍDO (Isolamento de Escopo Garantido)
* **Resultado:** Disponibilizado script estruturado em Markdown para criação forçada da pasta `src/shared/` na raiz absoluta do projeto. A abordagem mitiga as limitações de foco visual do VS Code (focado na pasta `tests/`), garantindo o alinhamento da Clean Architecture.

### 🏢 ITEM 06 (Fase Z17): Acoplamento de Rotas Shared e Correção do Script HTML
* **Data de Geração:** 13/06/2026 (19:13h)
* **Status:** 🟢 100% CONCLUÍDO (Ponte de Dados Homologada)
* **Resultado:** Corrigido o ponto cego do Frontend. Injetado o roteador `systemRouter` no arquivo de inicialização do servidor HTTP do Recicla (`server.ts`). Atualizado o arquivo HTML do painel com uma chamada nativa assíncrona contra a rota `/system/config/status`, reativando o indicador visual dinâmico de Schema (`simulation` vs `public`) para controle do operador de pátio.



### 🏢 ITEM 06 (Fase Z18): Consolidação Unificada do gateway-api/server.ts
* **Data de Geração:** 13/06/2026 (19:20h)
* **Status:** 🟢 100% CONCLUÍDO (Arquitetura Saneada)
* **Resultado:** Entregue o arquivo central `src/gateway-api/server.ts` unificado. Foram eliminadas as duplicidades estruturais, integrando em um único runtime os barramentos globais de infraestrutura compartilhada (Shared/Schema indicator) e os endpoints complexos de balanço de massa do Sankey baseados na janela móvel operacional de competência (dia 26 ao dia 25).

### 🏢 ITEM 06 (Fase Z19): Fusão Estrutural Concluída em src/gateway-api/server.ts
* **Data de Geração:** 13/06/2026 (19:31h)
* **Status:** 🟢 100% CONCLUÍDO (Código Saneado)
* **Resultado:** Corrigida a quebra de compilação exposta no VS Code. O arquivo `server.ts` do Gateway-API foi integralmente reescrito: adicionada a inicialização explícita da instância do Express (`app`), a instância nativa do `Pool` do PostgreSQL, o método isolado `executarQuery`, as rotas do Sankey de competência 26 a 25 e o acoplamento do barramento de infraestrutura compartilhada.


### 🏢 ITEM 08 (Fase Z25): Homologação e Saneamento do server.ts Atualizado pelo Cline
* **Data de Geração:** 14/06/2026 (11:34h)
* **Status:** 🟢 100% CONCLUÍDO (Pronto para GitHub)
* **Resultado:** Corrigidos os desvios residuais do Cline no arquivo `server.ts`. A porta do servidor Node foi consolidada em `3000` para coincidir com a exposição externa do contêiner e a rota de analytics foi realocada para `/api/v1/metrics/sankey`, eliminando qualquer ponto cego de comunicação com o front-end corporativo.

### 🏢 ITEM 08 (Fase Z26): Resolução de Vínculo Quebrado de Banco no Server Core
* **Data de Geração:** 14/06/2026 (11:37h)
* **Status:** 🟢 100% CONCLUÍDO (Compilação Homologada)
* **Resultado:** Corrigido o erro de compilação do TypeScript interceptado no VS Code (`Cannot find module '../shared/infra/postgres'`). Substituído o import fictício gerado pelo Cline por uma instanciação direta e limpa do `Pool` do driver nativo `pg`, garantindo integridade no runtime da API e abrindo caminho para o tráfego de dados na porta 3000.


### 🏢 ITEM 08 (Fase Z27): Resolução de Parse Error no Dockerfile de Infraestrutura
* **Data de Geração:** 14/06/2026 (11:45h)
* **Status:** 🟢 100% CONCLUÍDO (Sintaxe de Build Homologada)
* **Resultado:** Corrigido o erro de compilação do Docker Engine (`unknown instruction: Dockerfile`). Removidos os resíduos textuais e comentários corrompidos inseridos na linha 38 pelo assistente automatizado. Estabelecido o chassi de construção purista do Linux Alpine focado na porta 3000.


### 🏢 ITEM 08 (Fase Z31): Estabilização e Handshake de Rede na Porta Real 3000
* **Data de Geração:** 14/06/2026 (12:07h)
* **Status:** 🟢 100% CONCLUÍDO (Marco de Engenharia Atingido)
* **Resultado:** Desbloqueado e saneado o chassi completo de microsserviços. O container `recicla-api-1` foi compilado com sucesso a partir do código TypeScript estável em `dist/` e inicializado escutando rigorosamente na porta 3000. Barramentos e rotas modulares harmonizados para o início dos testes periciais PGRS em pátio.


### 🏢 ITEM 11 (Fase Z35): Homologação da Ontologia Ubíqua de Vínculos Dinâmicos
* **Data de Geração:** 14/06/2026 (13:07h)
* **Status:** 🟢 100% CONCLUÍDO (Conformidade Arquitetural)
* **Resultado:** Validada a aderência do esquema físico do PostgreSQL à ontologia original de "Usuário -> Vínculo -> Função". Confirmado que a tabela `recicla_dispositivos_homologados` atua como o nó contextual e agnóstico de amarração, viabilizando o reuso da mesma infraestrutura para motoristas corporativos, catadores e auditores de pátio.


### 🏢 ITEM 11 (Fase Z37): Homologação do Endpoint de Auditoria Trilateral Contextual
* **Data de Geração:** 14/06/2026 (13:31h)
* **Status:** 🟢 100% CONCLUÍDO (Pronto para Runtime)
* **Resultado:** Aprovado o Diff do controlador `driverAuditoryController.ts`. O ecossistema passa a expor a rota `/api/v1/system/driver/missions`, materializando em código a regra de negócio dinâmica ("Usuário -> Vínculo -> Função") e permitindo ao Coordenador PGRS auditar as missões do Driver a partir do seu dispositivo homologado.

---


## 🗓️ BACKLOG PRIORIZADO (Próximas Sprints)

### 🏢 Vertical `corp` (Fase B: Telemetria de Hardware IoT)
* **Data de Geração:** 11/06/2026 (15:30h)
* [ ] Integrar no `server.ts` a captura do `MissionEvidenceEnvelope` para as pesagens físicas de Tara (T2) e Carga (T3).
* [ ] Travar validação de strings brutas de balança serial Bluetooth (`iot_serial_ble`).S