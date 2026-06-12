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

---

## 🗓️ BACKLOG PRIORIZADO (Próximas Sprints)

### 🏢 Vertical `corp` (Fase B: Telemetria de Hardware IoT)
* **Data de Geração:** 11/06/2026 (15:30h)
* [ ] Integrar no `server.ts` a captura do `MissionEvidenceEnvelope` para as pesagens físicas de Tara (T2) e Carga (T3).
* [ ] Travar validação de strings brutas de balança serial Bluetooth (`iot_serial_ble`).S