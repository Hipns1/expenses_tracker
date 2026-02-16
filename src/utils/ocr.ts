import Tesseract from 'tesseract.js'

export interface OCRResult {
    text: string
    confidence: number
}

/**
 * Extrae texto de una imagen usando OCR (Tesseract.js)
 * @param file - Archivo de imagen a procesar
 * @param onProgress - Callback opcional para reportar progreso (0-1)
 * @returns Texto extraído y nivel de confianza
 */
export async function extractTextFromImage(
    file: File,
    onProgress?: (progress: number) => void
): Promise<OCRResult> {
    try {
        const result = await Tesseract.recognize(file, 'eng+spa', {
            logger: (m) => {
                if (m.status === 'recognizing text' && onProgress) {
                    onProgress(m.progress)
                }
            }
        })

        return {
            text: result.data.text,
            confidence: result.data.confidence
        }
    } catch (error) {
        console.error('OCR Error:', error)
        throw new Error('Failed to extract text from image')
    }
}

/**
 * Parsea el texto extraído de una factura y extrae información relevante
 * @param text - Texto extraído por OCR
 * @returns Objeto con la información parseada
 */
export function parseInvoiceText(text: string) {
    // Normalizar el texto
    const normalizedText = text.toLowerCase().trim()

    // Extraer monto (buscar patrones como $123.45, 123.45, etc.)
    const amountPatterns = [
        /\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/,
        /total[:\s]*\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        /amount[:\s]*\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
        /(\d+(?:,\d{3})*(?:\.\d{2}))/
    ]

    let amount = 0
    for (const pattern of amountPatterns) {
        const match = text.match(pattern)
        if (match) {
            amount = parseFloat(match[1].replace(/,/g, ''))
            if (amount > 0) break
        }
    }

    // Extraer fecha (diferentes formatos)
    const datePatterns = [
        /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
        /(\d{2,4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
        /date[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
    ]

    let dateStr = new Date().toISOString().split('T')[0]
    for (const pattern of datePatterns) {
        const match = text.match(pattern)
        if (match) {
            try {
                const parsedDate = new Date(match[1])
                if (!isNaN(parsedDate.getTime())) {
                    dateStr = parsedDate.toISOString().split('T')[0]
                    break
                }
            } catch {
                // Continuar con el siguiente patrón
            }
        }
    }

    // Extraer descripción (primera línea con texto significativo)
    const lines = text.split('\n').filter(line => line.trim().length > 3)
    let description = 'Invoice'

    // Buscar líneas que puedan ser el nombre del comercio o descripción
    for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.length > 3 && trimmed.length < 100) {
            // Evitar líneas que sean solo números o fechas
            if (!/^\d+[\d\s\.\-\/]*$/.test(trimmed)) {
                description = trimmed
                break
            }
        }
    }

    // Intentar categorizar basado en palabras clave
    const categories: { [key: string]: string[] } = {
        Food: ['restaurant', 'cafe', 'food', 'pizza', 'burger', 'coffee', 'lunch', 'dinner', 'breakfast'],
        Transport: ['taxi', 'uber', 'transport', 'gas', 'fuel', 'parking', 'metro', 'bus'],
        Shopping: ['store', 'shop', 'market', 'retail', 'mall'],
        Utilities: ['electric', 'water', 'gas', 'internet', 'phone', 'utility'],
        Entertainment: ['movie', 'cinema', 'theater', 'concert', 'game'],
        Health: ['pharmacy', 'hospital', 'medical', 'doctor', 'clinic']
    }

    let category = 'General'
    for (const [cat, keywords] of Object.entries(categories)) {
        if (keywords.some(keyword => normalizedText.includes(keyword))) {
            category = cat
            break
        }
    }

    return {
        description,
        amount,
        date: dateStr,
        category
    }
}
