import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { CargoTrip, CompanyProfile, Driver } from '../types/logistics';
import { formatDateTime, getOCStatusLabel, formatWeightKg, formatWeightTons } from './formatters';

/**
 * Retorna o SVG oficial do monograma Yukaer embutido em código limpo para impressão
 */
function getYukaerSymbolSvg(width = 24, height = 24): string {
  return `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" style="flex-shrink:0;">
    <defs>
      <linearGradient id="yukaer-blue-pdf" x1="20" y1="90" x2="100" y2="20" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#0F5897" />
        <stop offset="45%" stop-color="#146EBA" />
        <stop offset="100%" stop-color="#1B78C2" />
      </linearGradient>
      <linearGradient id="yukaer-ring-pdf" x1="15" y1="25" x2="95" y2="95" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#1977C0" />
        <stop offset="70%" stop-color="#1264A6" />
        <stop offset="100%" stop-color="#0D4F85" />
      </linearGradient>
    </defs>
    <path d="M 23 58 C 20 42, 31 27, 47 21 C 61 16, 75 19, 84 27 L 77 34 C 70 28, 59 26, 49 29 C 37 33, 29 44, 31 58 Z" fill="url(#yukaer-ring-pdf)" />
    <path d="M 97 62 C 100 78, 89 93, 73 99 C 59 104, 45 101, 36 93 L 43 86 C 50 92, 61 94, 71 91 C 83 87, 91 76, 89 62 Z" fill="url(#yukaer-ring-pdf)" />
    <path d="M 60 72 L 60 102 C 60 104, 57 106, 55 106 L 52 106 C 50 106, 48 104, 48 102 L 48 68 L 29 36 C 28 34, 29 32, 31 32 L 39 32 C 41 32, 43 33, 44 35 L 54 53 L 64 35 C 65 33, 67 32, 69 32 L 77 32 C 79 32, 80 34, 79 36 Z" fill="url(#yukaer-blue-pdf)" />
    <polygon points="90,14 106,14 106,30 99,23 83,39 77,33 93,17" fill="#146EBA" />
  </svg>`;
}

/**
 * Constrói o HTML idêntico ao modelo da modal de visualização da Ordem de Carregamento (O.C.)
 * com CSS inline em padrões RGB/HEX (sem dependência de variáveis oklch), perfeitamente ajustado
 * para caber em uma única página A4 padrão (210mm x 297mm).
 */
export function buildOrdemCarregamentoHTML(
  cargo: CargoTrip,
  companyProfile?: CompanyProfile,
  driver?: Driver
): string {
  const companyTrade = (companyProfile?.tradeName || 'CARGAFRET LOGÍSTICA & TRANSPORTES').toUpperCase();
  const companyName = companyProfile?.companyName || 'CargaFret Intermediação e Logística Rodoviária Ltda';
  const cnpj = companyProfile?.cnpj || '00.000.000/0001-00';
  const rntrc = companyProfile?.rntrc || 'Emissão Operacional';
  const centralPhone = companyProfile?.phone || '';
  const address = companyProfile?.address || '';

  const ocNumber = cargo.ocNumber || 'OC-CARGA';
  const emissionDate = formatDateTime(cargo.createdAt);
  const statusLabel = getOCStatusLabel(cargo.ocStatus).label.toUpperCase();

  // Dados do Motorista e Empresa Vinculada
  const driverName = cargo.driverName || driver?.name || 'A Definir (Escala Pendente)';
  const driverCpf = driver?.cpf || 'Não informado';
  const driverPhone = cargo.driverPhone || driver?.phone || 'Não informado';
  const razaoSocial = driver?.razaoSocial || (driver?.name ? `${driver.name} (Transportador)` : 'Não informada');
  const cnpjEmpresa = driver?.cnpjCpfEmpresa || driver?.cpf || 'Não informado';
  const antt = driver?.antt || 'Isento / Não inf.';

  // Veículos
  const cavaloPlate = cargo.cavaloPlate || 'A Definir';
  const carretaPlate = cargo.carretaPlate || 'A Definir';
  const carretaType = cargo.carretaType || 'Não informado';
  const carreta2Plate = cargo.carreta2Plate || '';
  const carreta2Type = cargo.carreta2Type || '';

  // Dados Bancários
  const bankCode = driver?.bankCode || (driver?.bankName?.includes('Brasil') ? '001' : '-');
  const bankName = driver?.bankName || 'Não informado';
  const bankAgency = driver?.bankAgency || 'Não informada';
  const bankAccount = driver?.bankAccount || 'Não informada';
  const pixKey = cargo.driverPix || (driver?.pixKey ? `${driver.pixKey} (${driver.pixKeyType || 'PIX'})` : 'Não informada');

  // Itinerário
  const originSupplier = cargo.originSupplierName || 'Não informado';
  const originCity = cargo.originCityState || 'Não informado';
  const originAddr = cargo.originAddress || '';
  const loadingDate = formatDateTime(cargo.scheduledLoadingDate);

  const destSupplier = cargo.destinationSupplierName || 'Não informado';
  const destCity = cargo.destinationCityState || 'Não informado';
  const destAddr = cargo.destinationAddress || '';
  const deliveryDate = formatDateTime(cargo.scheduledDeliveryDate);

  // Instruções
  const collectionNotes = cargo.collectionNotes || '';
  const deliveryNotes = cargo.deliveryInstructions || '';

  return `
    <div style="width: 800px; background-color: #ffffff; color: #020617; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-sizing: border-box; padding: 15px 20px; border: 1px solid #cbd5e1; line-height: 1.25; font-size: 11.5px;">
      
      <!-- 1. CABEÇALHO INSTITUCIONAL -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 8px; margin-bottom: 7px; border-bottom: 2.5px solid #0f172a;">
        <div style="display: flex; align-items: center; gap: 10px;">
          ${getYukaerSymbolSvg(32, 32)}
          <div>
            <div style="font-size: 16.5px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.3px; color: #020617; line-height: 1.15;">
              ${companyTrade}
            </div>
            <div style="font-size: 11px; font-weight: 700; color: #334155; margin-top: 1px;">
              ${companyName}
            </div>
            <div style="font-size: 9.5px; color: #475569; margin-top: 2px; line-height: 1.35;">
              <span style="font-weight: 800; color: #1e293b;">CNPJ:</span> ${cnpj}
              <span style="margin: 0 5px;">·</span>
              <span style="font-weight: 800; color: #1e293b;">RNTRC:</span> ${rntrc}
              ${centralPhone ? `<span style="margin: 0 5px;">·</span><span style="font-weight: 800; color: #1e293b;">Central:</span> ${centralPhone}` : ''}
              ${address ? `<br/><span style="font-weight: 800; color: #1e293b;">Endereço:</span> ${address}` : ''}
            </div>
          </div>
        </div>

        <div style="text-align: right; flex-shrink: 0;">
          <div style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 3px 9px; font-family: monospace; font-weight: 800; font-size: 10px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
            ORDEM DE CARREGAMENTO
          </div>
          <div style="font-size: 20px; font-weight: 900; font-family: monospace; color: #020617; margin-top: 2px; letter-spacing: -0.5px; line-height: 1;">
            ${ocNumber}
          </div>
          <div style="font-size: 9.5px; color: #475569; margin-top: 2px;">
            <span style="font-weight: 700; color: #334155;">Emissão:</span> ${emissionDate}
          </div>
          <div style="font-size: 9.5px; font-weight: 700; color: #334155;">
            Status: <span style="font-weight: 900; color: #020617; text-transform: uppercase;">${statusLabel}</span>
          </div>
        </div>
      </div>

      <!-- 2. SEÇÃO I: IDENTIFICAÇÃO DA OPERAÇÃO & MERCADORIA -->
      <div style="margin-top: 6px;">
        <div style="background-color: #f1f5f9; padding: 4px 10px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; border: 1px solid #e2e8f0;">
          <span style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a;">
            1. Dados da Operação e Mercadoria
          </span>
          <div style="display: flex; gap: 6px;">
            ${cargo.pedidoCliente ? `<span style="font-family: monospace; font-size: 9px; font-weight: 800; color: #0f172a; background: #ffffff; padding: 1.5px 7px; border-radius: 3px; border: 1px solid #cbd5e1;">Pedido: ${cargo.pedidoCliente}</span>` : ''}
            ${cargo.ctNumber ? `<span style="font-family: monospace; font-size: 9px; font-weight: 800; color: #14532d; background: #f0fdf4; padding: 1.5px 7px; border-radius: 3px; border: 1px solid #86efac;">CT-e: ${cargo.ctNumber}</span>` : ''}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1.8fr 1fr 1.2fr 1fr; gap: 8px; background-color: #f8fafc; padding: 7px 10px; border-radius: 4px; border: 1px solid #e2e8f0; font-size: 11px;">
          <div>
            <div style="font-size: 8.5px; text-transform: uppercase; font-weight: 800; color: #475569; margin-bottom: 2px;">Tomador / Cliente:</div>
            <div style="font-weight: 900; color: #020617; font-size: 12px; word-break: break-word; line-height: 1.2;">${cargo.clientName || 'Não informado'}</div>
            <div style="font-size: 8.5px; color: #64748b; margin-top: 2px;">ID: ${cargo.clientId || '-'}</div>
          </div>
          <div>
            <div style="font-size: 8.5px; text-transform: uppercase; font-weight: 800; color: #475569; margin-bottom: 2px;">Pedido do Cliente:</div>
            <div style="font-weight: 800; color: #020617; font-size: 12px; font-family: monospace;">${cargo.pedidoCliente || 'Não informado'}</div>
          </div>
          <div>
            <div style="font-size: 8.5px; text-transform: uppercase; font-weight: 800; color: #475569; margin-bottom: 2px;">Mercadoria / Produto:</div>
            <div style="font-weight: 800; color: #020617; font-size: 12px;">${cargo.productName || 'Não informado'}</div>
            <div style="font-size: 8.5px; color: #64748b; margin-top: 2px;">Granel / Carga Operacional</div>
          </div>
          <div>
            <div style="font-size: 8.5px; text-transform: uppercase; font-weight: 800; color: #334155; margin-bottom: 2px;">Peso Total da Carga (KG):</div>
            <div style="font-weight: 900; color: #020617; font-size: 13.5px; font-family: monospace; line-height: 1.1;">${formatWeightKg(cargo.weightTons)}</div>
            <div style="font-size: 8.5px; color: #64748b; font-weight: 600; margin-top: 2px;">(${formatWeightTons(cargo.weightTons)})</div>
          </div>
        </div>
      </div>

      <!-- 3. SEÇÃO II: MOTORISTA, EMPRESA E CONJUNTO TRANSPORTADOR -->
      <div style="margin-top: 6px;">
        <div style="background-color: #f1f5f9; padding: 4px 10px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; border: 1px solid #e2e8f0;">
          <span style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a;">
            2. Motorista Condutor, Empresa e Conjunto Transportador
          </span>
          ${antt !== 'Isento / Não inf.' ? `<span style="font-family: monospace; font-size: 9px; font-weight: 800; color: #082f49; background: #ffffff; padding: 1.5px 7px; border-radius: 3px; border: 1px solid #cbd5e1;">ANTT: ${antt}</span>` : ''}
        </div>

        <div style="display: grid; grid-template-columns: 1.25fr 0.85fr 1.2fr; gap: 10px; background-color: #f8fafc; padding: 7px 10px; border-radius: 4px; border: 1px solid #e2e8f0; font-size: 11px;">
          
          <!-- Sub-bloco A: Condutor & Empresa -->
          <div style="border-right: 1px solid #e2e8f0; padding-right: 10px;">
            <div style="margin-bottom: 4px;">
              <div style="font-size: 8.5px; text-transform: uppercase; font-weight: 800; color: #475569;">Motorista Condutor:</div>
              <div style="font-weight: 900; color: #020617; font-size: 12.5px; word-break: break-word; line-height: 1.2;">${driverName}</div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 4px;">
              <div>
                <span style="font-size: 8px; text-transform: uppercase; font-weight: 800; color: #475569; display: block;">CPF Motorista:</span>
                <span style="font-family: monospace; font-weight: 800; color: #0f172a; font-size: 10.5px;">${driverCpf}</span>
              </div>
              <div>
                <span style="font-size: 8px; text-transform: uppercase; font-weight: 800; color: #475569; display: block;">Telefone:</span>
                <span style="font-family: monospace; font-weight: 700; color: #1e293b; font-size: 10.5px;">${driverPhone}</span>
              </div>
            </div>
            <div style="border-top: 1px solid #e2e8f0; padding-top: 3px; margin-bottom: 4px;">
              <span style="font-size: 8px; text-transform: uppercase; font-weight: 800; color: #475569; display: block;">Razão Social / Empresa:</span>
              <span style="font-weight: 700; color: #020617; font-size: 11px; word-break: break-word; line-height: 1.2; display: block;">${razaoSocial}</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
              <div>
                <span style="font-size: 8px; text-transform: uppercase; font-weight: 800; color: #475569; display: block;">CPF / CNPJ Emp.:</span>
                <span style="font-family: monospace; color: #1e293b; font-size: 10px; font-weight: 600;">${cnpjEmpresa}</span>
              </div>
              <div>
                <span style="font-size: 8px; text-transform: uppercase; font-weight: 800; color: #475569; display: block;">Registro ANTT:</span>
                <span style="font-family: monospace; font-weight: 800; color: #082f49; font-size: 10px;">${antt}</span>
              </div>
            </div>
          </div>

          <!-- Sub-bloco B: Conjunto Veicular -->
          <div style="border-right: 1px solid #e2e8f0; padding-right: 10px;">
            <div style="margin-bottom: 4px;">
              <div style="font-size: 8.5px; text-transform: uppercase; font-weight: 800; color: #475569;">Cavalo Mecânico (Trator):</div>
              <div style="font-family: monospace; font-weight: 900; color: #020617; font-size: 13.5px; letter-spacing: 0.5px;">${cavaloPlate}</div>
              <div style="font-size: 8.5px; color: #64748b;">Caminhão Trator Rodoviário</div>
            </div>
            <div style="border-top: 1px solid #e2e8f0; padding-top: 3px; margin-bottom: 4px;">
              <div style="font-size: 8px; text-transform: uppercase; font-weight: 800; color: #475569;">
                ${carreta2Plate ? '1º Implemento (Carreta 1):' : 'Implemento (Carreta / Reboque):'}
              </div>
              <div style="font-family: monospace; font-weight: 900; color: #020617; font-size: 12px; letter-spacing: 0.3px;">${carretaPlate}</div>
              <div style="font-size: 8.5px; color: #334155; word-break: break-word; font-weight: 500;">${carretaType}</div>
            </div>
            ${carreta2Plate ? `
              <div style="border-top: 1px solid #e2e8f0; padding-top: 3px;">
                <div style="font-size: 8px; text-transform: uppercase; font-weight: 800; color: #475569;">2º Implemento (Carreta 2):</div>
                <div style="font-family: monospace; font-weight: 900; color: #020617; font-size: 12px; letter-spacing: 0.3px;">${carreta2Plate}</div>
                <div style="font-size: 8.5px; color: #334155; word-break: break-word; font-weight: 500;">${carreta2Type}</div>
              </div>
            ` : ''}
          </div>

          <!-- Sub-bloco C: Dados Bancários Completos -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 8.5px; text-transform: uppercase; font-weight: 900; color: #312e81; letter-spacing: 0.3px;">Dados Bancários para Liquidação:</span>
              <span style="font-size: 8px; color: #475569; font-weight: 700;">Adiantamento & Saldo</span>
            </div>
            <div style="display: grid; grid-template-columns: 0.7fr 1.6fr; gap: 6px; margin-bottom: 4px;">
              <div>
                <span style="font-size: 8px; text-transform: uppercase; font-weight: 800; color: #475569; display: block;">Cód. Banco:</span>
                <span style="font-family: monospace; font-weight: 900; color: #0f172a; font-size: 11px;">${bankCode}</span>
              </div>
              <div>
                <span style="font-size: 8px; text-transform: uppercase; font-weight: 800; color: #475569; display: block;">Banco / Instituição:</span>
                <span style="font-weight: 800; color: #020617; font-size: 11px; word-break: break-word; display: block;">${bankName}</span>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 4px;">
              <div>
                <span style="font-size: 8px; text-transform: uppercase; font-weight: 800; color: #475569; display: block;">Agência:</span>
                <span style="font-family: monospace; font-weight: 800; color: #0f172a; font-size: 11px;">${bankAgency}</span>
              </div>
              <div>
                <span style="font-size: 8px; text-transform: uppercase; font-weight: 900; color: #312e81; display: block;">Conta Bancária:</span>
                <span style="font-family: monospace; font-weight: 900; color: #020617; font-size: 12.5px;">${bankAccount}</span>
              </div>
            </div>
            <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 4px; padding: 4px 7px; margin-top: 3px;">
              <span style="font-size: 8px; text-transform: uppercase; font-weight: 800; color: #064e3b; display: block; margin-bottom: 1px;">Chave PIX Cadastrada:</span>
              <span style="font-family: monospace; font-weight: 900; color: #022c22; font-size: 11px; word-break: break-all; display: block;">${pixKey}</span>
            </div>
          </div>

        </div>
      </div>

      <!-- 4. SEÇÃO III: ITINERÁRIO E PRAZOS OPERACIONAIS -->
      <div style="margin-top: 6px;">
        <div style="background-color: #f1f5f9; padding: 4px 10px; border-radius: 4px; margin-bottom: 4px; border: 1px solid #e2e8f0;">
          <span style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a;">
            3. Itinerário e Prazos Operacionais
          </span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <!-- Origem -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 7px 10px; font-size: 10.5px;">
            <div style="color: #082f49; font-weight: 900; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-bottom: 3px;">
              ● Ponto de Coleta / Origem
            </div>
            <div style="margin-bottom: 3px;">
              <span style="font-size: 8px; text-transform: uppercase; font-weight: 800; color: #475569; display: block;">Embarcador / Fornecedor:</span>
              <span style="font-weight: 900; color: #020617; font-size: 11.5px; word-break: break-word;">${originSupplier}</span>
            </div>
            <div style="margin-bottom: 3px;">
              <span style="font-size: 8px; text-transform: uppercase; font-weight: 800; color: #475569; display: block;">Cidade / UF:</span>
              <span style="font-weight: 700; color: #0f172a; font-size: 11px;">${originCity}</span>
            </div>
            ${originAddr ? `
              <div style="margin-bottom: 3px;">
                <span style="font-size: 8px; text-transform: uppercase; font-weight: 800; color: #475569; display: block;">Endereço:</span>
                <span style="color: #334155; font-size: 9.5px; word-break: break-word;">${originAddr}</span>
              </div>
            ` : ''}
            <div style="border-top: 1px solid #e2e8f0; padding-top: 3px; margin-top: 3px;">
              <span style="font-size: 8px; text-transform: uppercase; font-weight: 800; color: #475569; display: block;">Agendamento de Carregamento:</span>
              <span style="font-weight: 900; color: #020617; font-size: 11.5px;">${loadingDate}</span>
            </div>
          </div>

          <!-- Destino -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 7px 10px; font-size: 10.5px;">
            <div style="color: #022c22; font-weight: 900; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-bottom: 3px;">
              ● Ponto de Descarga / Destino
            </div>
            <div style="margin-bottom: 3px;">
              <span style="font-size: 8px; text-transform: uppercase; font-weight: 800; color: #475569; display: block;">Destinatário / Indústria:</span>
              <span style="font-weight: 900; color: #020617; font-size: 11.5px; word-break: break-word;">${destSupplier}</span>
            </div>
            <div style="margin-bottom: 3px;">
              <span style="font-size: 8px; text-transform: uppercase; font-weight: 800; color: #475569; display: block;">Cidade / UF:</span>
              <span style="font-weight: 700; color: #0f172a; font-size: 11px;">${destCity}</span>
            </div>
            ${destAddr ? `
              <div style="margin-bottom: 3px;">
                <span style="font-size: 8px; text-transform: uppercase; font-weight: 800; color: #475569; display: block;">Endereço:</span>
                <span style="color: #334155; font-size: 9.5px; word-break: break-word;">${destAddr}</span>
              </div>
            ` : ''}
            <div style="border-top: 1px solid #e2e8f0; padding-top: 3px; margin-top: 3px;">
              <span style="font-size: 8px; text-transform: uppercase; font-weight: 800; color: #475569; display: block;">Previsão Agendada de Entrega:</span>
              <span style="font-weight: 900; color: #020617; font-size: 11.5px;">${deliveryDate}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. SEÇÃO IV: REQUISITOS OPERACIONAIS, BALANÇA E PROCEDIMENTOS -->
      <div style="margin-top: 6px;">
        <div style="background-color: #f1f5f9; padding: 4px 10px; border-radius: 4px; margin-bottom: 4px; border: 1px solid #e2e8f0;">
          <span style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a;">
            4. Requisitos Operacionais, Balança e Procedimentos
          </span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 7px 10px; font-size: 9.5px; color: #1e293b;">
            <div style="font-size: 8.5px; text-transform: uppercase; font-weight: 800; color: #0f172a; margin-bottom: 2px;">
              Instruções de Coleta, Pátio e Pesagem:
            </div>
            <ul style="margin: 0; padding-left: 14px; line-height: 1.35;">
              <li>Pesagem obrigatória de Tara na entrada e Peso Bruto na saída da unidade.</li>
              <li>Uso obrigatório de EPI completo (capacete, colete, calçado e óculos).</li>
              <li>Conferir bicas de descarga fechadas, travas e lona sem avarias antes de sair.</li>
            </ul>
            ${collectionNotes ? `
              <div style="border-top: 1px solid #e2e8f0; padding-top: 3px; margin-top: 3px;">
                <span style="font-weight: 800; color: #0f172a; font-size: 8.5px;">Obs. Coleta:</span>
                <span style="color: #020617; word-break: break-word;">${collectionNotes}</span>
              </div>
            ` : ''}
          </div>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 7px 10px; font-size: 9.5px; color: #1e293b;">
            <div style="font-size: 8.5px; text-transform: uppercase; font-weight: 800; color: #0f172a; margin-bottom: 2px;">
              Instruções para Entrega e Liberação de Canhoto:
            </div>
            <ul style="margin: 0; padding-left: 14px; line-height: 1.35;">
              <li>Apresentar a documentação fiscal de transporte na portaria de destino.</li>
              <li>Exigir carimbo legível, data, horário e assinatura no canhoto original da NF-e.</li>
              <li>Comunicar imediatamente à Central qualquer divergência de peso ou avaria.</li>
            </ul>
            ${deliveryNotes ? `
              <div style="border-top: 1px solid #e2e8f0; padding-top: 3px; margin-top: 3px;">
                <span style="font-weight: 800; color: #0f172a; font-size: 8.5px;">Obs. Descarga:</span>
                <span style="color: #020617; word-break: break-word;">${deliveryNotes}</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- 6. SEÇÃO V: DECLARAÇÃO DE RESPONSABILIDADE & ASSINATURAS -->
      <div style="margin-top: 8px; padding-top: 5px; border-top: 1.5px solid #cbd5e1;">
        <p style="font-size: 9px; color: #475569; line-height: 1.3; margin: 0 0 10px 0; text-align: justify;">
          <strong>Declaração do Transportador / Condutor:</strong> O condutor declara ter conferido as especificações desta Ordem de Carregamento, condições de segurança e amarração, comprometendo-se a cumprir o itinerário estipulado, normas de trânsito e exigências do expedidor até a entrega.
        </p>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 48px; text-align: center; font-size: 10px; color: #334155; margin-bottom: 6px;">
          <div>
            <div style="border-top: 1px solid #64748b; padding-top: 4px;">
              <div style="font-weight: 900; color: #020617; font-size: 11px;">${companyTrade}</div>
              <div style="font-size: 8.5px; color: #64748b; font-weight: 500;">Expedição / Transportador Responsável</div>
            </div>
          </div>

          <div>
            <div style="border-top: 1px solid #64748b; padding-top: 4px;">
              <div style="font-weight: 900; color: #020617; font-size: 11px; word-break: break-word;">${driverName}</div>
              <div style="font-size: 8.5px; color: #64748b; font-weight: 500;">Assinatura do Condutor · Data: ____/____/________</div>
            </div>
          </div>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 3px; text-align: center; font-size: 8.5px; color: #64748b; font-family: monospace;">
          Documento emitido eletronicamente via Sistema CargaFret Logística · O.C. nº ${ocNumber} · Documento Operacional
        </div>
      </div>

    </div>
  `;
}

/**
 * Downloads a clean, faithful PDF of the Ordem de Carregamento (O.C.).
 * Mirrors exactly the modal visual layout, blocks, and data in a crisp single-page A4.
 */
export async function downloadOrdemCarregamentoPDF(
  cargo: CargoTrip,
  elementOrId?: HTMLElement | string | null,
  companyProfile?: CompanyProfile,
  driver?: Driver
): Promise<boolean> {
  const fileName = `${cargo.ocNumber || 'OC-CARGA'}.pdf`;

  // 1. Monta o container HTML padronizado com CSS inline puro (RGB/HEX)
  // Isso garante 100% de compatibilidade com html2canvas e fidelidade absoluta ao modal.
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.backgroundColor = '#ffffff';
  container.style.zIndex = '-9999';
  container.innerHTML = buildOrdemCarregamentoHTML(cargo, companyProfile, driver);

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2, // Resolução Retina 2x ultra nítida
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 800,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

    // Margens mínimas de respiro (8mm) para encaixe estrito em 1 página A4
    const marginX = 8;
    const marginY = 8;
    const printableWidth = pdfWidth - marginX * 2; // 194mm
    const printableHeight = pdfHeight - marginY * 2; // 281mm

    let renderWidth = printableWidth;
    let renderHeight = (canvas.height * renderWidth) / canvas.width;

    // Se porventura a altura calculada exceder a página A4, ajusta proporcionalmente
    if (renderHeight > printableHeight) {
      const scaleRatio = printableHeight / renderHeight;
      renderHeight = printableHeight;
      renderWidth = renderWidth * scaleRatio;
    }

    const posX = marginX + (printableWidth - renderWidth) / 2;
    const posY = marginY;

    pdf.addImage(imgData, 'JPEG', posX, posY, renderWidth, renderHeight);
    pdf.save(fileName);
    return true;
  } catch (canvasErr) {
    console.warn('[CargaFret PDF] Canvas capture fallback to structured vector PDF:', canvasErr);
    return generateStructuredVectorPDF(cargo, fileName, companyProfile, driver);
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Fallback vetorial jsPDF de alta fidelidade:
 * Desenha os mesmos 5 blocos da modal com todos os dados da operação,
 * motorista, empresa, dados bancários (incluindo Conta Coluna S) e rota.
 */
function generateStructuredVectorPDF(
  cargo: CargoTrip,
  fileName: string,
  companyProfile?: CompanyProfile,
  driver?: Driver
): boolean {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const primaryColor = [15, 23, 42]; // Slate 900
    const accentColor = [14, 110, 186]; // Yukaer Blue
    const lightGray = [241, 245, 249]; // Slate 100
    const boxBg = [248, 250, 252]; // Slate 50
    const textColor = [15, 23, 42]; // Slate 900
    const mutedColor = [100, 116, 139]; // Slate 500
    const borderColor = [226, 232, 240]; // Slate 200

    const companyTrade = (companyProfile?.tradeName || 'CARGAFRET LOGÍSTICA & TRANSPORTES').toUpperCase();
    const companyName = companyProfile?.companyName || 'CargaFret Intermediação e Logística Rodoviária Ltda';
    const driverName = cargo.driverName || driver?.name || 'A Definir';
    const razaoSocial = driver?.razaoSocial || (driver?.name ? `${driver.name} (Transportador)` : 'Não informada');
    const antt = driver?.antt || 'Isento / Não inf.';

    // Cabeçalho institucional
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(10, 10, 190, 14, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(companyTrade, 14, 17);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(companyName, 14, 21);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('ORDEM DE CARREGAMENTO', 145, 16);
    doc.setFontSize(11);
    doc.text(cargo.ocNumber || 'OC-CARGA', 145, 21);

    let y = 29;

    // Sub-cabeçalho de metadados
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text(`CNPJ: ${companyProfile?.cnpj || '00.000.000/0001-00'}  ·  RNTRC: ${companyProfile?.rntrc || 'Emissão Operacional'}  ·  Tel: ${companyProfile?.phone || '-'}`, 10, y);
    doc.text(`Emissão: ${formatDateTime(cargo.createdAt)}  ·  Status: ${getOCStatusLabel(cargo.ocStatus).label.toUpperCase()}`, 125, y);

    y += 4;
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.line(10, y, 200, y);

    // ==========================================
    // BLOCO 1: DADOS DA OPERAÇÃO E MERCADORIA
    // ==========================================
    y += 5;
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(10, y, 190, 6, 'F');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('1. DADOS DA OPERAÇÃO E MERCADORIA', 13, y + 4.2);

    if (cargo.pedidoCliente) {
      doc.text(`PEDIDO: ${cargo.pedidoCliente}`, 125, y + 4.2);
    }
    if (cargo.ctNumber) {
      doc.setTextColor(22, 101, 52);
      doc.text(`CT-e: ${cargo.ctNumber}`, 165, y + 4.2);
    }

    y += 7;
    doc.setFillColor(boxBg[0], boxBg[1], boxBg[2]);
    doc.rect(10, y, 190, 12, 'F');
    doc.rect(10, y, 190, 12, 'S');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text('CLIENTE / TOMADOR:', 13, y + 4);
    doc.text('PEDIDO CLIENTE:', 80, y + 4);
    doc.text('MERCADORIA / PRODUTO:', 120, y + 4);
    doc.text('PESO TOTAL (KG):', 158, y + 4);

    doc.setFontSize(8.5);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(cargo.clientName || 'Não informado', 13, y + 9);
    doc.text(cargo.pedidoCliente || '-', 80, y + 9);
    doc.text(cargo.productName || 'Não informado', 120, y + 9);
    doc.text(`${formatWeightKg(cargo.weightTons)} (${formatWeightTons(cargo.weightTons)})`, 158, y + 9);

    // ==========================================
    // BLOCO 2: MOTORISTA, EMPRESA E VEÍCULO
    // ==========================================
    y += 15;
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(10, y, 190, 6, 'F');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('2. MOTORISTA CONDUTOR, EMPRESA E CONJUNTO TRANSPORTADOR', 13, y + 4.2);
    if (antt !== 'Isento / Não inf.') {
      doc.text(`ANTT: ${antt}`, 165, y + 4.2);
    }

    y += 7;
    doc.setFillColor(boxBg[0], boxBg[1], boxBg[2]);
    doc.rect(10, y, 190, 36, 'F');
    doc.rect(10, y, 190, 36, 'S');

    // Sub-divisores verticais
    doc.line(75, y, 75, y + 36);
    doc.line(135, y, 135, y + 36);

    // Coluna 1: Condutor & Empresa
    doc.setFontSize(7.5);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text('MOTORISTA CONDUTOR:', 13, y + 5);
    doc.setFontSize(8.5);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(driverName, 13, y + 9);

    doc.setFontSize(7.5);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text(`CPF: ${driver?.cpf || 'Não inf.'}  ·  Tel: ${cargo.driverPhone || driver?.phone || 'Não inf.'}`, 13, y + 14);

    doc.text('RAZÃO SOCIAL / EMPRESA:', 13, y + 20);
    doc.setFontSize(8);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(doc.splitTextToSize(razaoSocial, 58), 13, y + 24);

    doc.setFontSize(7.5);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text(`CNPJ/CPF Emp.: ${driver?.cnpjCpfEmpresa || driver?.cpf || '-'}`, 13, y + 30);
    doc.text(`Registro ANTT: ${antt}`, 13, y + 34);

    // Coluna 2: Conjunto Veicular
    doc.setFontSize(7.5);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text('CAVALO MECÂNICO (TRATOR):', 78, y + 5);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(cargo.cavaloPlate || 'A Definir', 78, y + 10);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text('1º IMPLEMENTO (CARRETA 1):', 78, y + 16);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(`${cargo.carretaPlate || 'A Definir'}${cargo.carretaType ? ` (${cargo.carretaType})` : ''}`, 78, y + 21);

    if (cargo.carreta2Plate) {
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
      doc.text('2º IMPLEMENTO (CARRETA 2):', 78, y + 27);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(`${cargo.carreta2Plate}${cargo.carreta2Type ? ` (${cargo.carreta2Type})` : ''}`, 78, y + 32);
    }

    // Coluna 3: Dados Bancários Completos (Com Conta Coluna S)
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(55, 48, 163);
    doc.text('DADOS BANCÁRIOS P/ LIQUIDAÇÃO:', 138, y + 5);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text(`Cód. Banco: ${driver?.bankCode || '-'}  ·  Banco: ${driver?.bankName || 'Não inf.'}`, 138, y + 10);
    doc.text(`Agência: ${driver?.bankAgency || 'Não inf.'}`, 138, y + 16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`Conta Bancária: ${driver?.bankAccount || 'Não inf.'}`, 138, y + 21);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text('Chave PIX Cadastrada:', 138, y + 27);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 95, 70);
    const pixStr = cargo.driverPix || (driver?.pixKey ? `${driver.pixKey} (${driver.pixKeyType || 'PIX'})` : 'Não informada');
    doc.text(doc.splitTextToSize(pixStr, 58), 138, y + 32);

    // ==========================================
    // BLOCO 3: ITINERÁRIO E PRAZOS
    // ==========================================
    y += 39;
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(10, y, 190, 6, 'F');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('3. ITINERÁRIO E PRAZOS OPERACIONAIS', 13, y + 4.2);

    y += 7;
    // Box Coleta (Esquerda) e Descarga (Direita)
    doc.setFillColor(boxBg[0], boxBg[1], boxBg[2]);
    doc.rect(10, y, 92, 28, 'F');
    doc.rect(10, y, 92, 28, 'S');

    doc.rect(108, y, 92, 28, 'F');
    doc.rect(108, y, 92, 28, 'S');

    // Origem
    doc.setFontSize(8);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('PONTO DE COLETA / ORIGEM', 13, y + 5);

    doc.setFontSize(7.5);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text(`Fornecedor: ${cargo.originSupplierName || 'Não inf.'}`, 13, y + 10);
    doc.text(`Cidade/UF: ${cargo.originCityState || 'Não inf.'}`, 13, y + 15);
    doc.text(doc.splitTextToSize(`Endereço: ${cargo.originAddress || '-'}`, 85), 13, y + 20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(`Carregamento: ${formatDateTime(cargo.scheduledLoadingDate)}`, 13, y + 26);

    // Destino
    doc.setFontSize(8);
    doc.setTextColor(6, 78, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('PONTO DE DESCARGA / DESTINO', 111, y + 5);

    doc.setFontSize(7.5);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text(`Destinatário: ${cargo.destinationSupplierName || 'Não inf.'}`, 111, y + 10);
    doc.text(`Cidade/UF: ${cargo.destinationCityState || 'Não inf.'}`, 111, y + 15);
    doc.text(doc.splitTextToSize(`Endereço: ${cargo.destinationAddress || '-'}`, 85), 111, y + 20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(`Previsão Entrega: ${formatDateTime(cargo.scheduledDeliveryDate)}`, 111, y + 26);

    // ==========================================
    // BLOCO 4: REQUISITOS OPERACIONAIS E BALANÇA
    // ==========================================
    y += 31;
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(10, y, 190, 6, 'F');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('4. REQUISITOS OPERACIONAIS, BALANÇA E PROCEDIMENTOS', 13, y + 4.2);

    y += 7;
    doc.setFillColor(boxBg[0], boxBg[1], boxBg[2]);
    doc.rect(10, y, 92, 19, 'F');
    doc.rect(10, y, 92, 19, 'S');

    doc.rect(108, y, 92, 19, 'F');
    doc.rect(108, y, 92, 19, 'S');

    // Instruções Coleta
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text('Instruções de Coleta e Pesagem:', 13, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text('• Pesagem obrigatória de Tara na entrada e Peso Bruto na saída.', 13, y + 8);
    doc.text('• Uso obrigatório de EPI completo (capacete, colete, calçado e óculos).', 13, y + 12);
    doc.text('• Conferir bicas de descarga fechadas, travas e lona sem avarias.', 13, y + 16);

    // Instruções Descarga
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text('Instruções para Entrega e Liberação de Canhoto:', 111, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text('• Apresentar documentação fiscal de transporte na portaria de destino.', 111, y + 8);
    doc.text('• Exigir carimbo legível, data, horário e assinatura no canhoto da NF-e.', 111, y + 12);
    doc.text('• Comunicar imediatamente à Central qualquer divergência de peso.', 111, y + 16);

    // ==========================================
    // BLOCO 5: DECLARAÇÃO E ASSINATURAS
    // ==========================================
    y += 22;
    doc.setFontSize(7);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    const declText = 'Declaração do Transportador / Condutor: O condutor declara ter conferido as especificações desta Ordem de Carregamento, condições de segurança e amarração, comprometendo-se a cumprir o itinerário estipulado, normas de trânsito e exigências do expedidor até a entrega.';
    doc.text(doc.splitTextToSize(declText, 190), 10, y);

    y += 13;
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.line(15, y, 90, y);
    doc.line(120, y, 195, y);

    y += 3.5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(companyTrade, 52.5, y, { align: 'center' });
    doc.text(driverName, 157.5, y, { align: 'center' });

    y += 3.2;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text('Expedição / Transportador Responsável', 52.5, y, { align: 'center' });
    doc.text('Assinatura do Condutor · Data: ____/____/________', 157.5, y, { align: 'center' });

    // Rodapé
    doc.setFontSize(7);
    doc.text(`Documento emitido eletronicamente via Sistema CargaFret Logística · O.C. nº ${cargo.ocNumber} · Documento Operacional`, 105, 290, { align: 'center' });

    doc.save(fileName);
    return true;
  } catch (err) {
    console.error('[CargaFret PDF] Erro fatal no gerador de PDF:', err);
    return false;
  }
}
