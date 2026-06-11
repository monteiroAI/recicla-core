cat << 'EOF' > src/modules/corp/docs/corp_business_rules.md
/*******************************************************************************
 * PROJETO: recycle Core Engine
 * MODULE: corp (Vertical Corporativa / Grandes Geradores)
 * ARQUIVO: corp_business_rules.md
 * DATA DE CRIAÇÃO: 11 de Junho de 2026
 * AUTOR: Arquitetura de Sistemas recycle (monteiroAI)
 * STATUS: PACIFICADO & MANDATÓRIO
 *******************************************************************************/

# 🏢 Vertical Corp: Gestão de Grandes Geradores Industriais e Comerciais

A vertical `corp` rege o ecossistema privado de movimentação de resíduos Classe I e Classe II (não estéreis), auditando e integrando a relação de conformidade legal (Lei 12.305/2010 - PNRS) entre os Geradores Corporativos (`corpGenerator`) e as Empresas Especialistas em Engenharia Ambiental (`Operator`).

---

## 🎯 1. Pilares de Viabilidade e Arquitetura Tripartite

A priorização do desenvolvimento focado na vertical `corp` baseia-se em vantagens estratégicas de negócio e engenharia:
1. **Tratamento Direto (B2B):** Fluxo de caixa imediato através de contratos privados, livre de entraves e morosidades de licitações públicas.
2. **Replicabilidade Estrutural:** As soluções de hardware, as rotas do backend-core, o app mobile e o motor de dashboards construídos para `corp` servem de fundação e chassi técnico direto para as verticais `city` e `keeper`.

---

## 👥 2. Atores e Suas Dores Operacionais (Domain Mapping)

### 🏭 A) O corpGenerator (Grande Gerador / Indústrias / Redes de Varejo)
Responsável legal pela geração, necessita de garantias de conformidade para mitigar riscos de corresponsabilidade civil e criminal por crimes ambientais.

* **Frequency ("Fábrica Limpa"):** Exigência de coleta contínua e sincronizada com a taxa de geração interna. Setores críticos (ex: alimentação) não toleram gargalos de armazenamento.
* **Competence & Seriedade:** Exigência de auditoria em tempo real sobre as licenças do operador para evitar o descarte clandestino em corpos d'água ou terrenos baldios (o que acarretaria multas severas e destruição da reputação da marca).
* **Compliance Ambiental & Investidores (ESG):** Demanda por relatórios auditáveis e **Certificados Ancorados** imutáveis para prestação de contas a acionistas, auditorias e público consumidor.
* **Multi-Ponto:** Um único `corpGenerator` pode possuir múltiplas plantas/unidades físicas de retirada e múltiplas frações de resíduos (incluindo Classe II inertes destinados a `Cooperatives` de triagem via módulo `keeper`).

### 🚛 B) O Operator (Empresa Especialista em PGRS)
Empresa contratada para executar a coleta, transporte, tratamento e destinação final certificada.

* **Cost Control:** Necessidade de otimização milimétrica de frotas e monitorização rigorosa das rotas percorridas.
* **Desvim de Frota:** Garantia de que os ativos (veículos/equipamentos) estão a ser utilizados exclusivamente no contrato designado, sem desvios para fretes paralelos.
* **M.R.V. Premium (Diferencial Forense):** Utilização do sistema como argumento de vendas (Garantia de Qualidade). Operadores que oferecem dados rastreáveis e **Certificados Ancorados em Blockchain** atraem clientes *Premium* de alto valor.

---

## 🔄 3. O Fluxo de Dados: Service Orders, Missões e Viagens

O core business da logística reversa privada dentro do backend do `recycle` é quebrado em uma estrutura de dados relacional e sequencial de três níveis:

[ Service Order (S.O.) ]
│
▼
[ Mission (1) ] ── (Orquestração do Operador)
│
├──► [ Voyage 1 ] (Driver X + Placa Y + Peso Ingressado)
├──► [ Voyage 2 ] (Driver X + Placa Y + Peso Ingressado)
└──► [ Voyage N ] (Multi-caminhões / Coleta Fracionada)


### 📋 A) Service Order (S.O.)
O gatilho comercial. É o documento eletrónico emitido no sistema que parametriza o atendimento:
* Identificação do `corpGenerator` e do Local físico de retirada.
* Especificação da classe e tipo de resíduo.
* Data programada de execução.
* Designação primária do motorista (`Driver`) e do veículo/caçamba (`Equipment`).

### 📦 B) Mission (A Missão)
O pacote lógico de execução enviado ao **corpMobile**. Representa o objetivo logístico completo determinado pelo painel de controle do `Operator`. 

### 🚛 C) Voyage (A Viagem - Relação 1:N)
Uma única Missão pode requerer múltiplas Viagens. Isso ocorre quando o volume de resíduos gerado na planta excede a capacidade de carga física de um único equipamento, exigindo idas e vindas ao ponto de descarga ou o uso de comboios (multi-caminhões).
* Cada viagem colhe metadados isolados: Telemetria de balança local (`iot_serial_ble`), coordenadas de GPS temporal, fotos de evidência de carga e assinaturas eletrónicas em campo.

---

## 📊 4. Engenharia de Dados e Indicadores (Frontend & Blockchain)

O motor analítico do `recycle` processará a massa de dados das Missões consumindo a base unificada para renderizar no Dashboard Corporativo os seguintes KPIs e saídas forenses:

* **Massa Líquida Processada:** Gross Weight - Tare Weight calculados via integração de hardware.
* **Operational Rate:** Índice de eficiência da Missão (Tempo programado vs Tempo executado / Rotas planejadas vs Rotas efetivas).
* **ESG Carbon Metrics:** Conversão da tonelagem de resíduos desviada de aterros para rotas de reciclagem/compostagem em índice de emissão de CO2 equivalente evitado.
* **Mecanismo de Confiança (Certificado Ancorado):** Se a Missão atingir 100% dos critérios de validação (Coordenadas de GPS batem com os locais cadastrados, XML fiscal validado na SEFAZ/SINIR e pesagens sem divergências no Hub de Consolidação), o sistema dispara um gatilho assíncrono para a Camada 5 (Blockchain), gerando o selo de inviolabilidade do serviço prestado.
EOF