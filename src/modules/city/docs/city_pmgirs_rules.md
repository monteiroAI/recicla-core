cat << 'EOF' > src/modules/city/docs/city_pmgirs_rules.md
/*******************************************************************************
 * PROJETO: recycle Core Engine
 * MODULE: City (coleta domiciliar seletiva ou ordinária, zeladoria pública (varrição e manutenção de praças e jardins públicos)
 * ARQUIVO: city_pmgirs_rules.md
 * DATA DE CRIAÇÃO: 19 de Junho de 2026
 * AUTOR: Arquitetura de Sistemas recycle (monteiroAI)
 * STATUS: PACIFICADO & MANDATÓRIO
 *******************************************************************************/

# 🏢 Vertical City: Plano Municipal de Gestão Integrada de Resíduos Sólidos

O PMGIRS estabelece obrigações e objetivos para a gestão de resíduos sólidos pelo município. Desse modo, faz-se imperativo analisar esta Vertical quanto às suas duas finalidades: 1) Gestão 2) Operacionalização

---

## 🎯 1. Pilares de Viabilidade e Arquitetura Tripartite

A priorização do desenvolvimento focado na vertical `city` baseia-se em transformar um problema em solução. 
1. **Gestão Integrada** Sendo o ente para o qual convergem informações de outras "Verticais" Grandes Geradores, Catadores e Catadoras, Consolidadores públicos ou privados, 
2. **Consistência estrutural:** As soluções de hardware, as rotas do backend-core, o app mobile e o motor de dashboards transformam dados dispersos em informações críticas para a gestão pública, orientando gastos, aportando KPI's estratégicos, capazes de prevenir fraudes e gerar créditos ambientais distribuidos, fator de justiça social e elevação dos indicadores sociais da cidade. 

---

## 👥 2. Atores e Suas Dores Operacionais (Domain Mapping)

O Gestor Municipal passa a praticar de fato a gestão integrada de RS pois nenhum gerador e nenhum setor ficam de fora da sua visão. Desse modo, convém considerar o que caracteriza cada um dos participantes desse fluxo: 

### 🏭 A- O corpGenerator (Grande Gerador / Indústrias / Redes de Varejo)
Responsável legal pela geração, necessita de garantias de conformidade para mitigar riscos de corresponsabilidade civil e criminal por crimes ambientais.

* **Frequency ("Fábrica Limpa"):** Exigência de coleta contínua e sincronizada com a taxa de geração interna. Setores críticos (ex: alimentação) não toleram gargalos de armazenamento.
* **Competence & Seriedade:** Exigência de auditoria em tempo real sobre as licenças do operador para evitar o descarte clandestino em corpos d'água ou terrenos baldios (o que acarretaria multas severas e destruição da reputação da marca).
* **Compliance Ambiental & Investidores (ESG):** Demanda por relatórios auditáveis e **Certificados Ancorados** imutáveis para prestação de contas a acionistas, auditorias e público consumidor.
* **Multi-Ponto:** Um único `corpGenerator` pode possuir múltiplas plantas/unidades físicas de retirada e múltiplas frações de resíduos (incluindo Classe II inertes destinados a `Cooperatives` de triagem via módulo `keeper`).

### 🚛 B- O Operator (Empresa Especialista em PGRS)
Empresa contratada para executar a coleta, transporte, tratamento e destinação final certificada.

* **Cost Control:** Necessidade de otimização milimétrica de frotas e monitorização rigorosa das rotas percorridas.
* **Desvim de Frota:** Garantia de que os ativos (veículos/equipamentos) estão a ser utilizados exclusivamente no contrato designado, sem desvios para fretes paralelos.
* **M.R.V. Premium (Diferencial Forense):** Utilização do sistema como argumento de vendas (Garantia de Qualidade). Operadores que oferecem dados rastreáveis e **Certificados Ancorados em Blockchain** atraem clientes *Premium* de alto valor.

### C- O Catador avulso
Homens e mulheres que dedicam-se a coleta e venda de resíduos sólidos como meio de subsistência. Utilizam carriolas, em geral como pedestres e em alguns casos com um triciclo ou mesmo carroça com emprego de força animal. Vendem seus resíduos para Consolidadores, que podem ser Cooperativas ou Associações de Catadores e Catadoras, galpões de triagem administrados pela empresa concessionária do serviço público de coleta urbana, o que pode incluir a varrição pública e manutenção de praças e jardins públicos. 

    ** O trabalho ambiental que prestam às comunidades é totalmente invisível: não é quantificado e é absolutamente anônimo e não remunerado;
    ** O catador e catadora recebem valores aviltados pelo material que coletam, enquanto que as margens ao longo do fluxo de recuperação até chegar à industria podem gerar 10 vezes ou mais o valor que fica com o catador; 
    ** O catador entrega à consolidadora um material préviamente classificado, dispensando a triagem na esteira do galpão; 
    ** Na economia circular os catadores e catadoras são elos importantes nas grandes metrópoles pois fazem a coleta difusa, literalmente limpando o meio ambiente urbano da poluição decorrente da dispersão de plásticos principalmente, 
    
### D- Os Consolidadores 
Em um dado município podem coexistir duas ou mais instalações Consolidadoras de Resíduos Sólidos, Podem organizar-se de diversos modos, sendo os mais frequentes a Cooperativa de Catadores, a Associação idem, ou serem operadas pela empresa Concessionária de serviços públicos de coleta, varrição e jardigem pública. 
Segundo os principios da Lei 12305 de 2010, cabe aos poderes públicos reconhecer e estimular a participação de Cooperativas no fluxo de RS nos municípios, considerando o seu potencial de geração de emprego e renda. Então, não será ético uma empresa concessionária comercializar a matéria-secunda que coleta pois ela já é remunerada pelo municipio para essa atividade. 


---

## 🔄 3. O Fluxo de Dados: Rotas de Coleta e Frequência

O serviço municipal de coleta de resíduos dentro do backend do `recycle` é quebrado em uma estrutura de dados relacional e sequencial de três níveis:

[ Contrato de Licitação - Coleta Domiciliar de Resíduos Sólidos ]
│
▼
[ [Níveis de operação licitados] [kpis]
│
├──► [ Rota 1 ] Roteiro, Frequencia, Distancia percorrida, Destino, Tipo de Coleta, Peso recolhido, Motorista, Veículo) 
├──► [ Rota 2 ] Roteiro, Frequencia, Distancia percorrida, Destino, Tipo de Coleta, Peso recolhido, Motorista, Veículo) 
├──► [ Rota 3 ] Roteiro, Frequencia, Distancia percorrida, Destino, Tipo de Coleta, Peso recolhido, Motorista, Veículo) 


[ Contrato de Licitação - Varrição e manutenção de praças e jardins
│
▼
[ [Níveis de operação licitados] [kpis]
│
├──► [ Rota 1 ] Roteiro, Frequencia, Distancia percorrida, Destino, Tipo de Coleta, Peso recolhido, Motorista, Veículo) 
├──► [ Rota 2 ] Roteiro, Frequencia, Distancia percorrida, Destino, Tipo de Coleta, Peso recolhido, Motorista, Veículo) 
├──► [ Rota 3 ] Roteiro, Frequencia, Distancia percorrida, Destino, Tipo de Coleta, Peso recolhido, Motorista, Veículo) 

O contrato de licitação de serviços públicos de limpeza, varrição e manutenção de praças e jardins deve prever a destinação excluisiva para Cooperativas de Catadores e Pátios de Compostagem dentro do município, conforme o tipo de resíduo. 


## 📊 4. Geração de créditos ambientais e distribuição de incentivos
o mrvTRUST é uma estrutura de confiança operacional e forense, pelo que está em condição de oferecer ao mercado Créditos Ambientais de alta qualidade, pois permite o ratreamento da massa de resíduos desde a sua entrada na Consolidadora e ainda antes no caso dos Catadores e Catadoras avulsas. 
A tokenização se dá em volumes consistentes com os padrões do mercado de créditos de carbono e créditos da logistica reversa de plásticos e outros materiais. Para alcanlar esse patamar o mrvTRUST cria pools de CO2/equivalente. 
Mecanismos de rastreamento - os mesmos que permitem aos auditores percorrerem todo o caminho do resíduo - permitem também a distribuição de micropagamentos de incentivos ambientais jutamente para os trabalhadores na base da pirâmide. E entre eles temos os catadores e os trabalhadores nos galpões de triagem (geradores, cooperados, associados ou trabalhadores clt's). Uma Matriz de Distribuição prevê que no mínimo 70% dos valores sejam distribuidos a essas pessoas. 

---

## 📊 4. Engenharia de Dados e Indicadores (Frontend & Blockchain)

O motor analítico do `recycle` processará a massa de dados das Coletas Domiciliares  consumindo a base unificada para renderizar no Dashboard Cidade os seguintes KPIs e saídas forenses:

* **Massa Líquida Coletada:** Gross Weight - Tare Weight calculados via integração de hardware.
* **Operational Rate:** Índice de eficiência da Missão (Tempo programado vs Tempo executado / Rotas planejadas vs Rotas efetivas).
* **ESG Carbon Metrics:** Conversão da tonelagem de resíduos desviada de aterros para rotas de reciclagem/compostagem em índice de emissão de CO2 equivalente evitado.
* **Mecanismo de Confiança (Certificado Homologado):** O município pode receber um Certificado Homologado de Confiança Operacional e Forense para o seu PMGIRS ao registrar índices de suficiência nas operações realizadas pelo Concessionário, o que é atestado através dos mecanismos do mrvTRUST. 

