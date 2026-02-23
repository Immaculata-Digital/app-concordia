import { jsPDF } from 'jspdf'
import type { PeopleDTO, PeopleAddress } from '../services/people'
import { peopleService } from '../services/people'
import { COMMON_PRINT_BASE_CSS, PDF_SPECIFIC_PRINT_CSS } from '../styles/printConstants'

/**
 * Formata um objeto de endereço para uma string legível
 */
export const formatAddress = (address: PeopleAddress | null | undefined): string => {
    if (!address) return ''
    const parts = [
        address.street,
        address.number ? `nº ${address.number}` : null,
        address.complement,
        address.neighborhood,
        `${address.city} - ${address.state}`,
        address.postalCode ? `CEP: ${address.postalCode}` : null,
    ].filter(Boolean)
    return parts.join(', ')
}

/**
 * Obtém o nome formatado para o snapshot do cliente baseado no documento e detalhes
 */

export const getSnapshotClienteNome = (cliente: PeopleDTO | null | undefined): string => {
    console.group('getSnapshotClienteNome')
    console.log('Cliente recebido:', cliente)

    if (!cliente) {
        console.log('Cliente é null/undefined')
        console.groupEnd()
        return ''
    }

    const isCnpj = (cliente.cpfCnpj || '').replace(/[^a-zA-Z0-9]/g, '').length === 14
    console.log('CPF/CNPJ:', cliente.cpfCnpj, 'isCnpj:', isCnpj)

    const details = cliente.details as any
    console.log('Detalhes:', details)

    if (isCnpj) {
        const legalName = details?.legalName
        const snakeLegalName = details?.legal_name
        return legalName || snakeLegalName || cliente.name
    }

    // CPF: firstName + surname
    const firstName = details?.firstName || details?.first_name || ''
    const surname = details?.surname || details?.surname || ''
    const fullName = `${firstName} ${surname}`.trim()

    return fullName || cliente.name
}


export interface ContractSnapshot {
    clienteId: string
    clienteNome: string
    clienteDocumento: string
    enderecoId: string
    enderecoFormatado: string
    assinantes: Array<{ nome: string; documento: string }>
}

/**
 * Constrói o objeto de snapshot completo do contrato
 */
export const buildContractSnapshot = (params: {
    cliente: PeopleDTO | null | undefined
    selectedAddrId?: string
    assinantes?: Array<{ name: string; document: string }>
}): ContractSnapshot => {
    const { cliente, selectedAddrId, assinantes } = params
    const selectedAddr = cliente?.addresses?.find(a => a.id === selectedAddrId)

    return {
        clienteId: cliente?.id || '',
        clienteNome: getSnapshotClienteNome(cliente),
        clienteDocumento: cliente?.cpfCnpj || '',
        enderecoId: selectedAddrId || '',
        enderecoFormatado: formatAddress(selectedAddr),
        assinantes: (assinantes || []).map(s => ({
            nome: s.name,
            documento: s.document
        }))
    }
}

/**
 * Cria o objeto de snapshot completo do contrato buscando dados atualizados
 */
export const createContractSnapshotPayload = async (params: {
    clienteId: string
    clienteEnderecoId?: string
    signerPersonIds?: string[]
}): Promise<ContractSnapshot> => {
    const { clienteId, clienteEnderecoId, signerPersonIds } = params

    // Buscar dados atualizados do cliente para garantir detalhes corretos
    const cliente = await peopleService.getById(clienteId)

    // Buscar dados atualizados dos assinantes
    const assinantesFormatted: Array<{ name: string; document: string }> = []

    if (signerPersonIds && signerPersonIds.length > 0) {
        // Buscar detalhes de cada assinante
        const assinantesPessoas = await Promise.all(
            signerPersonIds.map(id => peopleService.getById(id).catch(e => {
                console.error(`Erro ao buscar assinante ${id}`, e)
                return null
            }))
        )

        assinantesPessoas.forEach(pessoa => {
            if (pessoa) {
                assinantesFormatted.push({
                    name: getSnapshotClienteNome(pessoa),
                    document: pessoa.cpfCnpj || ''
                })
            }
        })
    }

    return buildContractSnapshot({
        cliente,
        selectedAddrId: clienteEnderecoId,
        assinantes: assinantesFormatted
    })
}

export interface ContractVariable {
    id: string
    name: string
    icon?: string
}

/**
 * Achata a estrutura de variáveis recursivamente
 */
export const flattenContractVariables = (items: any[], prefix = ''): ContractVariable[] => {
    const flattened: ContractVariable[] = []

    const process = (subItems: any[], subPrefix = '') => {
        if (!Array.isArray(subItems)) return

        subItems.forEach((item: any) => {
            const label = subPrefix ? `${subPrefix} > ${item.name}` : item.name
            if (item.variables && Array.isArray(item.variables) && item.variables.length > 0) {
                process(item.variables, label)
            } else {
                flattened.push({ id: item.id, name: label, icon: item.icon })
            }
        })
    }

    process(items, prefix)
    return flattened
}

/**
 * Escapa caracteres HTML especiais para prevenir XSS
 */
export const escapeHtml = (text: string): string => {
    if (!text) return ''
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }
    return text.replace(/[&<>"']/g, (m) => map[m])
}

/**
 * Mapeia variáveis do template para valores do cliente e contrato
 */
export const buildVariableMap = (
    clienteData: PeopleDTO | null,
    contractData?: any
): Record<string, string> => {
    const variableMap: Record<string, string> = {}

    if (!clienteData && !contractData) return variableMap

    if (clienteData) {

        // Variáveis do contratante
        variableMap['{{contratante.name}}'] = clienteData.name || ''
        variableMap['{{contratante.cpf_cnpj}}'] = clienteData.cpfCnpj || ''

        // Detalhes do cliente (se disponível)
        if (clienteData.details) {
            variableMap['{{contratante.legal_name}}'] = clienteData.details.legalName || ''
            variableMap['{{contratante.trade_name}}'] = clienteData.details.tradeName || ''
            variableMap['{{contratante.nationality}}'] = clienteData.details.nationality || ''
            variableMap['{{contratante.marital_status}}'] = clienteData.details.maritalStatus || ''
            variableMap['{{contratante.occupation}}'] = clienteData.details.occupation || ''
        }

        // Data de nascimento
        if (clienteData.birthDate) {
            const birthDate = new Date(clienteData.birthDate)
            variableMap['{{contratante.birth_date}}'] = birthDate.toLocaleDateString('pt-BR')
        } else {
            variableMap['{{contratante.birth_date}}'] = ''
        }

        // Endereço (pegar o primeiro endereço disponível)
        if (clienteData.addresses && clienteData.addresses.length > 0) {
            const address = clienteData.addresses[0]
            variableMap['{{contratante.address.street}}'] = address.street || ''
            variableMap['{{contratante.address.number}}'] = address.number || ''
            variableMap['{{contratante.address.complement}}'] = address.complement || ''
            variableMap['{{contratante.address.neighborhood}}'] = address.neighborhood || ''
            variableMap['{{contratante.address.city}}'] = address.city || ''
            variableMap['{{contratante.address.state}}'] = address.state || ''
            variableMap['{{contratante.address.postal_code}}'] = address.postalCode || ''
        } else {
            variableMap['{{contratante.address.street}}'] = ''
            variableMap['{{contratante.address.number}}'] = ''
            variableMap['{{contratante.address.complement}}'] = ''
            variableMap['{{contratante.address.neighborhood}}'] = ''
            variableMap['{{contratante.address.city}}'] = ''
            variableMap['{{contratante.address.state}}'] = ''
            variableMap['{{contratante.address.postal_code}}'] = ''
        }

        // Contatos (email e telefone)
        if (clienteData.contacts && clienteData.contacts.length > 0) {
            const email = clienteData.contacts.find((c) => c.contactType === 'Email' || c.contactType === 'email')
            const phone = clienteData.contacts.find((c) => c.contactType === 'Telefone' || c.contactType === 'telefone')
            variableMap['{{contratante.contact.email}}'] = email?.contactValue || ''
            variableMap['{{contratante.contact.phone}}'] = phone?.contactValue || ''
        } else {
            variableMap['{{contratante.contact.email}}'] = ''
            variableMap['{{contratante.contact.phone}}'] = ''
        }

        // Variáveis do contrato
        if (contractData) {
            if (contractData.vigenciaDataInicio) {
                const startDate = new Date(contractData.vigenciaDataInicio)
                variableMap['{{contrato.vigencia_inicio}}'] = startDate.toLocaleDateString('pt-BR')
            } else {
                variableMap['{{contrato.vigencia_inicio}}'] = ''
            }

            if (contractData.vigenciaDataFim) {
                const endDate = new Date(contractData.vigenciaDataFim)
                variableMap['{{contrato.vigencia_fim}}'] = endDate.toLocaleDateString('pt-BR')
            } else {
                variableMap['{{contrato.vigencia_fim}}'] = ''
            }
        }

    }

    return variableMap
}

const segmentsToHtml = (segments: any): string => {
if (typeof segments === 'string') return escapeHtml(segments)
if (!Array.isArray(segments)) return ''
return segments.map(s => {
    let res = escapeHtml(s.text || '')
    if (s.bold) res = `<b>${res}</b>`
    if (s.underline) res = `<u>${res}</u>`
    return res
}).join('')
}

/**
 * Substitui variáveis no conteúdo do contrato
 */
export const replaceVariables = (content: string, variableMap: Record<string, string>): string => {
// Tentar parsear como JSON (formato do BlockEditorPicker)
try {
    const blocks = JSON.parse(content)
    if (Array.isArray(blocks)) {
        // Substituir variáveis em cada bloco
        const blocksWithReplaced = blocks.map((block: any) => {
            let blockContent = block.content || ''

            if (Array.isArray(blockContent)) {
                blockContent = blockContent.map(seg => {
                    let text = seg.text || ''
                    Object.keys(variableMap).forEach(v => {
                        const regex = new RegExp(v.replace(/[{}]/g, '\\$&'), 'g')
                        text = text.replace(regex, variableMap[v])
                    })
                    return { ...seg, text }
                })
            } else if (typeof blockContent === 'string') {
                // Substituir todas as variáveis no conteúdo do bloco
                Object.keys(variableMap).forEach(variable => {
                    const regex = new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g')
                    blockContent = blockContent.replace(regex, variableMap[variable])
                })
            }

            return { ...block, content: blockContent }
        })
        return JSON.stringify(blocksWithReplaced)
    }
} catch (e) {
    // Se não for JSON, substituir diretamente na string
}

// Substituir todas as variáveis no conteúdo (fallback para texto simples)
let replacedContent = content
Object.keys(variableMap).forEach(variable => {
    const regex = new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g')
    replacedContent = replacedContent.replace(regex, variableMap[variable])
})

return replacedContent
}

/**
 * Converte conteúdo JSON do BlockEditorPicker para HTML formatado
 */
export const convertBlocksToHtml = (content: string): string => {
try {
    // Tentar parsear como JSON (formato do BlockEditorPicker)
    const blocks = JSON.parse(content)
    if (Array.isArray(blocks) && blocks.length > 0) {
        let resultHtml = ''
        let i = 0

        while (i < blocks.length) {
            const block = blocks[i]

            if (block.type === 'number' || block.type === 'bullet') {
                const listType = block.type === 'number' ? 'ol' : 'ul'
                const items: string[] = []

                while (i < blocks.length && blocks[i].type === block.type) {
                    const htmlContent = segmentsToHtml(blocks[i].content)
                    items.push(`<li style="margin: 5px 0; line-height: 1.8; color: #000;">${htmlContent}</li>`)
                    i++
                }

                const listStyle = listType === 'ol'
                    ? 'margin: 10px 0; padding-left: 30px; color: #000;'
                    : 'margin: 10px 0; padding-left: 30px; color: #000; list-style-type: disc;'

                resultHtml += `<${listType} style="${listStyle}">${items.join('')}</${listType}>`
            } else {
                const htmlContent = segmentsToHtml(block.content)
                switch (block.type) {
                    case 'h1':
                        resultHtml += `<h1 style="font-size: 16pt; font-weight: bold; margin: 20px 0 10px 0; color: #000; text-align: left;">${htmlContent}</h1>`
                        break
                    case 'h2':
                        resultHtml += `<h2 style="font-size: 14pt; font-weight: bold; margin: 18px 0 8px 0; color: #000; text-align: left;">${htmlContent}</h2>`
                        break
                    case 'h3':
                        resultHtml += `<h3 style="font-size: 13pt; font-weight: bold; margin: 16px 0 6px 0; color: #000; text-align: left;">${htmlContent}</h3>`
                        break
                    default:
                        if (htmlContent.trim()) {
                            resultHtml += `<p style="margin: 10px 0; line-height: 1.8; color: #000; text-align: justify;">${htmlContent}</p>`
                        }
                        break
                }
                i++
            }
        }
        return resultHtml
    } else {
        // Se não for array válido, tratar como texto simples
        return `<p style="margin: 10px 0; line-height: 1.8; color: #000; text-align: justify; white-space: pre-wrap;">${escapeHtml(content)}</p>`
    }
} catch (e) {
    // Se não for JSON, tratar como texto simples
    return `<p style="margin: 10px 0; line-height: 1.8; color: #000; text-align: justify; white-space: pre-wrap;">${escapeHtml(content)}</p>`
}
}

/**
 * Gera HTML dos assinantes para adicionar ao final do contrato
 */
const generateSignersHtml = (signers: Array<{ name: string; document: string }>): string => {
if (!signers || signers.length === 0) return ''

// Agrupar assinantes em pares (2 por linha)
const signersRows: Array<Array<{ name: string; document: string }>> = []
for (let i = 0; i < signers.length; i += 2) {
    signersRows.push(signers.slice(i, i + 2))
}

const signersHtml = signersRows.map((row, rowIndex) => {
    const signersInRow = row.map((signer, signerIndex) => {
        const signerHtml = `
        <div style="flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; min-width: 200px; max-width: 250px; line-height: 1;">
            <div style="text-align: center; margin: 0; padding: 0; font-size: 12pt; width: 100%; line-height: 1; display: block;">_________________________</div>
            <div style="height: 4px; border-bottom: 2px solid #000; margin: 0; padding: 0; width: 100%; display: block;"></div>
            <div style="text-align: center; margin-top: 5px; padding: 0; width: 100%; display: block; line-height: 1;">
                <div style="font-weight: bold; margin: 0; padding: 0; text-align: center; line-height: 1; display: block;">${escapeHtml(signer.name)}</div>
                <div style="font-size: 10pt; margin: 0; padding: 0; text-align: center; line-height: 1; display: block;">${escapeHtml(signer.document)}</div>
            </div>
        </div>
    `

        // Adicionar espaço entre assinantes (exceto antes do primeiro)
        if (signerIndex > 0) {
            // Adicionar um elemento de espaço de 60px entre assinantes
            return `<p style="width: 60px; min-width: 60px; height: 1px; margin: 0; padding: 0; display: block; flex-shrink: 0;">&nbsp;</p>${signerHtml}`
        }
        return signerHtml
    }).join('')

    // Adicionar espaço extra antes da primeira linha
    const marginTop = rowIndex === 0 ? '0px' : '40px'
    return `<div style="display: flex; margin-top: ${marginTop}; justify-content: flex-start; width: 100%; align-items: flex-start;">${signersInRow}</div>`
}).join('')

return signersHtml
}

/**
 * Gera HTML formatado para impressão jurídica
 */
export const generateContractHtml = (
formattedContent: string,
contractSeqId?: string | number,
signers?: Array<{ name: string; document: string }>
): string => {
const signersHtml = signers && signers.length > 0 ? generateSignersHtml(signers) : ''

// Adicionar espaço significativo no final do conteúdo usando parágrafo com altura
const contentWithSpacing = signersHtml ? formattedContent + '<p style="height: 150px; min-height: 150px; margin: 0; padding: 0; display: block; clear: both; page-break-inside: avoid; line-height: 150px;">&nbsp;</p>' : formattedContent

return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Contrato #${contractSeqId || 'N/A'}</title>
<style>
    ${COMMON_PRINT_BASE_CSS}
    ${PDF_SPECIFIC_PRINT_CSS}
</style>
</head>
<body>
<div class="contract-content">
    <div class="contract-content-wrapper">
        ${contentWithSpacing}
    </div>
    ${signersHtml ? `<div class="signers-section">${signersHtml}</div>` : ''}
</div>
</body>
</html>
`
}

/**
 * Gera PDF a partir do HTML renderizado
 */
export const generatePdfFromHtml = async (htmlContent: string): Promise<Blob> => {
// Criar um container invisível para o iframe
const container = document.createElement('div')
container.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 0 !important;
    height: 0 !important;
    overflow: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
    z-index: -999999 !important;
    visibility: hidden !important;
    display: block !important;
`;

// Criar um iframe temporário para renderizar o HTML
const iframe = document.createElement('iframe')
iframe.style.cssText = `
    width: 800px !important;
    height: 1200px !important;
    border: none !important;
    background: white !important;
    visibility: visible !important;
    display: block !important;
`;

container.appendChild(iframe)
document.documentElement.appendChild(container)

// Aguardar o iframe carregar
await new Promise<void>((resolve) => {
    iframe.onload = () => resolve()
    iframe.srcdoc = htmlContent
})

// Aguardar um pouco mais para garantir que tudo seja renderizado
await new Promise(resolve => setTimeout(resolve, 500))

// Obter o elemento body do iframe
const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
if (!iframeDoc) {
    throw new Error('Não foi possível acessar o documento do iframe')
}

const bodyElement = iframeDoc.body || iframeDoc.documentElement

// Gerar PDF com texto selecionável usando jsPDF
const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
})

// Configurações de página
const pageWidth = 210 // A4 width em mm
const pageHeight = 297 // A4 height em mm
const margin = 25 // margem em mm
const maxWidth = pageWidth - (margin * 2)
let yPosition = margin

// Função para adicionar texto com quebra de linha automática
const addText = (text: string, fontSize: number, isBold: boolean = false) => {
    pdf.setFontSize(fontSize)
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal')

    // Dividir texto em linhas que cabem na página
    const lines = pdf.splitTextToSize(text, maxWidth)

    // Verificar se precisa de nova página
    if (yPosition + (lines.length * fontSize * 0.4) > pageHeight - margin) {
        pdf.addPage()
        yPosition = margin
    }

    // Adicionar cada linha
    lines.forEach((line: string) => {
        pdf.text(line, margin, yPosition, { align: 'justify' })
        yPosition += fontSize * 0.4
    })
}

// Extrair e adicionar conteúdo do HTML
const contentDiv = bodyElement.querySelector('.contract-content')
if (contentDiv) {
    // Processar todos os elementos filhos recursivamente
    const processElement = (element: Element, isInsideSignerContainer: boolean = false) => {
        const tagName = element.tagName.toLowerCase()
        const text = element.textContent?.trim() || ''

        // Verificar se é um elemento de espaço (p com altura ou largura definida)
        if (tagName === 'p') {
            const htmlElement = element as HTMLElement
            const computedStyle = iframeDoc.defaultView?.getComputedStyle(htmlElement)
            const height = computedStyle?.height || htmlElement.style.height
            const minHeight = computedStyle?.minHeight || htmlElement.style.minHeight
            const width = computedStyle?.width || htmlElement.style.width
            const minWidth = computedStyle?.minWidth || htmlElement.style.minWidth
            const hasHeight = height && (parseInt(height) > 0 || height.includes('px') || height.includes('pt') || height.includes('mm'))
            const hasMinHeight = minHeight && (parseInt(minHeight) > 0 || minHeight.includes('px') || minHeight.includes('pt') || minHeight.includes('mm'))
            const hasWidth = width && (parseInt(width) > 0 || width.includes('px') || width.includes('pt') || width.includes('mm'))
            const hasMinWidth = minWidth && (parseInt(minWidth) > 0 || minWidth.includes('px') || minWidth.includes('pt') || minWidth.includes('mm'))

            // Se é um elemento de espaço vertical (p com altura e sem texto real ou apenas &nbsp;)
            if ((hasHeight || hasMinHeight) && (!text || text === '\u00A0' || text === '&nbsp;')) {
                const heightValue = hasHeight ? parseInt(height) : (hasMinHeight ? parseInt(minHeight) : 0)
                // Converter pixels para mm (aproximadamente 0.264583 mm por pixel)
                const heightInMm = heightValue * 0.264583
                yPosition += heightInMm
                return
            }

            // Se é um elemento de espaço horizontal (p com largura e sem texto real ou apenas &nbsp;)
            if ((hasWidth || hasMinWidth) && (!text || text === '\u00A0' || text === '&nbsp;')) {
                const widthValue = hasWidth ? parseInt(width) : (hasMinWidth ? parseInt(minWidth) : 0)
                // Converter pixels para mm (aproximadamente 0.264583 mm por pixel)
                // No PDF, espaço horizontal vira espaço vertical ou quebra de linha
                const widthInMm = widthValue * 0.264583
                // Adicionar espaço vertical equivalente (ajustar conforme necessário)
                yPosition += widthInMm * 0.3 // Converter espaço horizontal em espaço vertical
                return
            }
        }

        // Se é um elemento vazio, pular
        if (!text && !['ul', 'ol'].includes(tagName)) return

        switch (tagName) {
            case 'h1':
                if (yPosition > margin) yPosition += 5 // Espaço antes
                addText(text, 16, true)
                yPosition += 5 // Espaço depois
                break
            case 'h2':
                if (yPosition > margin) yPosition += 4
                addText(text, 14, true)
                yPosition += 4
                break
            case 'h3':
                if (yPosition > margin) yPosition += 3
                addText(text, 13, true)
                yPosition += 3
                break
            case 'p':
                if (text) {
                    addText(text, 12, false)
                    // Não adicionar espaço extra se for parte de um assinante
                    if (!isInsideSignerContainer) {
                        yPosition += 2
                    }
                }
                break
            case 'ul':
                const ulItems = element.querySelectorAll('li')
                ulItems.forEach((li) => {
                    const itemText = li.textContent?.trim() || ''
                    if (itemText) {
                        addText('• ' + itemText, 12, false)
                        yPosition += 1
                    }
                })
                yPosition += 2
                break
            case 'ol':
                let olCounter = 1
                const olItems = element.querySelectorAll('li')
                olItems.forEach((li) => {
                    const itemText = li.textContent?.trim() || ''
                    if (itemText) {
                        addText(`${olCounter}. ${itemText}`, 12, false)
                        olCounter++
                        yPosition += 1
                    }
                })
                yPosition += 2
                break
            case 'li':
                // Li será processado pelo ul/ol pai
                break
            case 'div':
                // Verificar se é um container flex (linha de assinantes)
                const divElement = element as HTMLElement
                const divComputedStyle = iframeDoc.defaultView?.getComputedStyle(divElement)
                const display = divComputedStyle?.display || divElement.style.display
                const flexDirection = divComputedStyle?.flexDirection || divElement.style.flexDirection

                if (display === 'flex') {
                    // Verificar se é um container de assinante (flex-direction: column)
                    const isSignerContainer = flexDirection === 'column'

                    // É um container flex - processar filhos com espaçamento
                    const children = Array.from(element.children)
                    children.forEach((child, index) => {
                        if (index > 0 && !isSignerContainer) {
                            // Verificar se o elemento anterior era um espaço
                            const prevChild = children[index - 1]
                            const prevTagName = prevChild.tagName.toLowerCase()

                            // Se o elemento anterior não era um espaço, adicionar espaço entre assinantes
                            if (prevTagName !== 'p') {
                                // Adicionar espaço de 60px (aproximadamente 15.9mm) entre assinantes
                                yPosition += 15.9
                            }
                        }
                        // Se for container de assinante, processar sem adicionar espaço entre filhos
                        processElement(child, isSignerContainer)
                    })
                } else {
                    // Processar filhos normalmente
                    Array.from(element.children).forEach(child => processElement(child, isInsideSignerContainer))
                    // Se não tem filhos mas tem texto, adicionar
                    if (text && element.children.length === 0) {
                        addText(text, 12, false)
                        if (!isInsideSignerContainer) {
                            yPosition += 2
                        }
                    }
                }
                break
            default:
                // Para outros elementos, processar filhos
                Array.from(element.children).forEach(child => processElement(child, isInsideSignerContainer))
                // Se não tem filhos mas tem texto, adicionar
                if (text && element.children.length === 0) {
                    addText(text, 12, false)
                    if (!isInsideSignerContainer) {
                        yPosition += 2
                    }
                }
        }
    }

    // Processar todos os elementos filhos
    Array.from(contentDiv.children).forEach(child => processElement(child))
}

// Remover container temporário
if (container.parentNode) {
    container.parentNode.removeChild(container)
}

// Gerar blob do PDF
return pdf.output('blob')
}

/**
 * Abre o PDF em uma nova janela do navegador
 */
export const openPdfInNewWindow = (pdfBlob: Blob, onError?: (message: string) => void): void => {
const pdfBlobUrl = URL.createObjectURL(pdfBlob)
const newWindow = window.open(pdfBlobUrl, '_blank')

if (!newWindow) {
    onError?.('Por favor, permita pop-ups para visualizar o contrato')
    URL.revokeObjectURL(pdfBlobUrl)
} else {
    // Limpar URL após um tempo maior para permitir download
    setTimeout(() => {
        URL.revokeObjectURL(pdfBlobUrl)
    }, 300000) // 5 minutos
}
}

/**
 * Abre o PDF em uma nova janela e tenta imprimir automaticamente
 */
export const openPdfForPrint = (pdfBlob: Blob, onError?: (message: string) => void): void => {
const pdfBlobUrl = URL.createObjectURL(pdfBlob)
const newWindow = window.open(pdfBlobUrl, '_blank')

if (!newWindow) {
    onError?.('Por favor, permita pop-ups para imprimir o contrato')
    URL.revokeObjectURL(pdfBlobUrl)
} else {
    // Tentar chamar print() após um pequeno delay para dar tempo do PDF carregar
    setTimeout(() => {
        try {
            newWindow.print()
        } catch (e) {
            // Se não conseguir chamar print(), o usuário pode usar Ctrl+P manualmente
            console.log('Não foi possível chamar print() automaticamente')
        }
    }, 1000)

    // Limpar URL após um tempo maior para permitir impressão
    setTimeout(() => {
        URL.revokeObjectURL(pdfBlobUrl)
    }, 300000) // 5 minutos
}
}

/**
 * Função principal para gerar e visualizar preview do contrato
 */
export const previewContractContent = async (
contractContent: string,
clienteData: PeopleDTO | null,
contractSeqId?: string | number,
onError?: (message: string) => void,
signers?: Array<{ name: string; document: string }>,
contractData?: any
): Promise<void> => {
try {
    // Construir mapa de variáveis
    const variableMap = buildVariableMap(clienteData, contractData)

    // Substituir variáveis no conteúdo
    const contentWithVariables = replaceVariables(contractContent, variableMap)

    // Converter blocos para HTML
    const formattedContent = convertBlocksToHtml(contentWithVariables)

    // Gerar HTML completo com assinantes
    const htmlContent = generateContractHtml(formattedContent, contractSeqId, signers)

    // Gerar PDF
    const pdfBlob = await generatePdfFromHtml(htmlContent)

    // Abrir PDF em nova janela
    openPdfInNewWindow(pdfBlob, onError)
} catch (error) {
    console.error('Erro ao gerar preview:', error)
    onError?.('Erro ao gerar preview do contrato')
}
}

/**
 * Função principal para gerar e imprimir o contrato
 */
export const printContractContent = async (
contractContent: string,
clienteData: PeopleDTO | null,
contractSeqId?: string | number,
onError?: (message: string) => void,
signers?: Array<{ name: string; document: string }>,
contractData?: any
): Promise<void> => {
try {
    // Construir mapa de variáveis
    const variableMap = buildVariableMap(clienteData, contractData)

    // Substituir variáveis no conteúdo
    const contentWithVariables = replaceVariables(contractContent, variableMap)

    // Converter blocos para HTML
    const formattedContent = convertBlocksToHtml(contentWithVariables)

    // Gerar HTML completo com assinantes
    const htmlContent = generateContractHtml(formattedContent, contractSeqId, signers)

    // Gerar PDF
    const pdfBlob = await generatePdfFromHtml(htmlContent)

    // Abrir PDF para impressão
    openPdfForPrint(pdfBlob, onError)
} catch (error) {
    console.error('Erro ao gerar preview para impressão:', error)
    onError?.('Erro ao gerar preview do contrato para impressão')
}
}
export type ContractStatusColor = 'success' | 'error' | 'warning' | 'info' | 'default'

export interface ContractStatusConfig {
label: string
color: ContractStatusColor
}

/**
 * Retorna a cor padrão para um código de status conhecido
 */
export const getContractStatusColor = (status: string): ContractStatusColor => {
switch (status) {
    case 'waiting_data':
    case 'drafting':
    case 'expired':
    case 'archived':
        return 'default'

    case 'received_data':
    case 'external_negotiation':
    case 'sent_for_signature':
        return 'info'

    case 'screening':
    case 'technical_review':
    case 'internal_validation_pending':
    case 'analyzing_redlines':
    case 'waiting_finance_approval':
    case 'waiting_compliance_approval':
    case 'partially_signed':
    case 'amendment_in_progress':
    case 'suspended':
    case 'renewal_in_progress':
        return 'warning'

    case 'ready_for_signature':
    case 'signed_executed':
    case 'active':
        return 'success'

    case 'request_rejected':
    case 'negotiation_deadlock':
    case 'terminated':
        return 'error'

    default:
        return 'default'
}
}

/**
 * Mapeia o código do status para um label amigável e cor.
 * Se um mapping for fornecido (da API), ele será usado antes do fallback estático.
 */
export const getContractStatusConfig = (
status: string | null | undefined,
mapping?: Record<string, string>
): ContractStatusConfig => {
const code = status || 'draft'
const label = mapping?.[code] || ''

if (label) {
    return { label, color: getContractStatusColor(code) }
}

switch (code) {
    case 'draft':
        return { label: 'Rascunho', color: 'default' }
    case 'under_review':
        return { label: 'Em Análise', color: 'warning' }
    case 'approved':
        return { label: 'Aprovado', color: 'success' }
    case 'rejected':
        return { label: 'Rejeitado', color: 'error' }
    case 'active':
        return { label: 'Ativo', color: 'success' }
    case 'cancelled':
            return { label: 'Cancelado', color: 'error' }
        case 'suspended':
            return { label: 'Suspenso', color: 'warning' }
        case 'finished':
            return { label: 'Finalizado', color: 'info' }
        default:
            return { label: code, color: 'default' }
    }
}
