// Servicio para extracción de datos de documentos médicos usando OpenAI GPT-4

import { OpenAIExtractionRequest, OpenAIExtractionResponse, DatosExtraidos } from '../types/documentos-medicos';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar worker de PDF.js - usar versión local de node_modules
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// Configuración de OpenAI
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
// Usando GPT-5-nano para máxima precisión en extracción de datos médicos

// Prompt optimizado para extracción de datos médicos
const SYSTEM_PROMPT = `Eres un asistente médico especializado en extraer información EXACTA de documentos médicos en español.

REGLAS CRÍTICAS:
1. SOLO extrae información que esté EXPLÍCITAMENTE escrita en el documento
2. NO inventes, supongas o infiera información que no esté clara
3. Si un dato no está presente o no es claro, usa null
4. Copia TEXTUALMENTE nombres, fechas y valores numéricos
5. La confianza debe ser ESTRICTA: solo 80-100% si TODOS los campos están claramente visibles

CAMPOS A EXTRAER:
1. tipo_estudio: Identifica el tipo exacto del estudio médico
2. paciente.nombre: Nombre COMPLETO tal como aparece
3. paciente.edad: Edad numérica exacta (si no está clara, usa null)
4. paciente.sexo: M, F o Otro (solo si está explícito)
5. fecha_estudio: Fecha exacta del estudio (formato DD/MM/YYYY)
6. medico_solicitante: Nombre del médico que solicitó (copia textual)
7. institucion: Nombre del hospital/clínica (copia textual)
8. numero_estudio: Número de folio/orden (copia exacta)
9. impresion_diagnostica: Copia TEXTUAL de la impresión diagnóstica o conclusión
10. hallazgos: Lista de hallazgos TEXTUALES del documento
11. recomendaciones: Recomendaciones exactas del médico
12. datos_especificos: Datos técnicos específicos del estudio
13. confianza: Calcula así:
    - 90-100%: TODOS los campos principales están claros y legibles
    - 70-89%: La mayoría de campos están claros, algunos faltantes
    - 50-69%: Información parcial o poco clara
    - <50%: Documento difícil de leer o información muy incompleta

PARA LABORATORIOS:
- Extrae CADA valor con su unidad exacta
- Copia el rango de referencia textualmente
- Marca como alto/bajo/crítico solo si el documento lo indica

PARA IMAGENOLOGÍA:
- Copia la técnica exacta utilizada
- Región anatómica tal como se menciona
- Medidas numéricas exactas con unidades

NO INVENTES INFORMACIÓN. Es mejor dejar un campo en null que poner datos incorrectos.`;

/**
 * Extrae texto de un PDF usando PDF.js
 */
async function extractTextFromPDF(fileUrl: string): Promise<string> {
  try {
    console.log('Descargando PDF desde:', fileUrl);
    
    // Descargar el PDF
    const response = await fetch(fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    
    console.log('PDF descargado, extrayendo texto...');
    
    // Cargar el documento PDF
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    console.log(`PDF cargado. Total de páginas: ${pdf.numPages}`);
    
    let fullText = '';
    
    // Extraer texto de cada página
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Concatenar todos los items de texto
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n\n';
      console.log(`Página ${pageNum} procesada`);
    }
    
    console.log(`Texto extraído exitosamente. Longitud: ${fullText.length} caracteres`);
    
    return fullText.trim();
  } catch (error) {
    console.error('Error extrayendo texto del PDF:', error);
    throw new Error(`No se pudo extraer el texto del PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Extrae datos de un documento médico usando OpenAI GPT-4
 */
export async function extractMedicalData(
  request: OpenAIExtractionRequest
): Promise<OpenAIExtractionResponse> {
  try {
    // Validar API key
    if (!OPENAI_API_KEY) {
      throw new Error('VITE_OPENAI_API_KEY no está configurada en las variables de entorno');
    }

    // Para PDFs, extraer texto primero y luego analizar con IA
    if (request.mimeType === 'application/pdf') {
      console.log('Procesando PDF:', request.fileName);
      
      // Extraer texto del PDF
      const pdfText = await extractTextFromPDF(request.fileUrl);
      
      if (!pdfText || pdfText.length < 10) {
        throw new Error('El PDF parece estar vacío o no contiene texto extraíble');
      }
      
      console.log(`Texto extraído del PDF (${pdfText.length} caracteres). Enviando a OpenAI...`);
      
      const promptWithInstructions = `Analiza el siguiente documento médico PDF y extrae ÚNICAMENTE la información que esté EXPLÍCITAMENTE escrita.

Nombre del archivo: ${request.fileName}

CONTENIDO DEL DOCUMENTO:
${pdfText}

INSTRUCCIONES CRÍTICAS:
1. Lee el documento COMPLETO cuidadosamente
2. Extrae SOLO información que veas claramente escrita
3. NO inventes ni supongas nada
4. Si un campo no está claro, usa null
5. Copia nombres, fechas y valores EXACTAMENTE como aparecen
6. Calcula la confianza de forma ESTRICTA (solo alta si TODO está claro)

Responde ÚNICAMENTE con un objeto JSON válido siguiendo la estructura especificada.`;

      // Usar GPT-4o (más preciso) para mejor extracción
      const openaiResponse = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-5-nano', // Usar GPT-5-nano para mayor velocidad y economía
          messages: [
            {
              role: 'system',
              content: SYSTEM_PROMPT
            },
            {
              role: 'user',
              content: promptWithInstructions
            }
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        }),
      });

      if (!openaiResponse.ok) {
        const error = await openaiResponse.json();
        throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await openaiResponse.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No se recibió respuesta de OpenAI');
      }

      const datosExtraidos: DatosExtraidos = JSON.parse(content);

      const tokensUsados = data.usage?.total_tokens || 0;
      const costoPorToken = 0.00003; // GPT-4o pricing (~15x más caro pero mucho más preciso)
      const costoEstimado = tokensUsados * costoPorToken;

      return {
        success: true,
        datos: datosExtraidos,
        tokens_usados: tokensUsados,
        costo_estimado: costoEstimado,
      };
    } else {
      // Para otros tipos de archivo (texto plano, etc.)
      const response = await fetch(request.fileUrl);
      const documentContent = await response.text();

      const userPrompt = `Analiza el siguiente documento médico y extrae ÚNICAMENTE la información que esté EXPLÍCITAMENTE escrita.

Nombre del archivo: ${request.fileName}
Tipo de archivo: ${request.mimeType}

CONTENIDO DEL DOCUMENTO:
${documentContent}

INSTRUCCIONES CRÍTICAS:
1. Lee el documento COMPLETO cuidadosamente
2. Extrae SOLO información que veas claramente escrita
3. NO inventes ni supongas nada
4. Si un campo no está claro, usa null
5. Copia nombres, fechas y valores EXACTAMENTE como aparecen
6. Calcula la confianza de forma ESTRICTA (solo alta si TODO está claro)

Responde ÚNICAMENTE con un objeto JSON válido siguiendo la estructura especificada.`;

      const openaiResponse = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-5-nano', // Usar GPT-5-nano para mayor velocidad y economía
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        }),
      });

      if (!openaiResponse.ok) {
        const error = await openaiResponse.json();
        throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await openaiResponse.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No se recibió respuesta de OpenAI');
      }

      const datosExtraidos: DatosExtraidos = JSON.parse(content);

      const tokensUsados = data.usage?.total_tokens || 0;
      const costoPorToken = 0.00003; // GPT-4o pricing
      const costoEstimado = tokensUsados * costoPorToken;

      return {
        success: true,
        datos: datosExtraidos,
        tokens_usados: tokensUsados,
        costo_estimado: costoEstimado,
      };
    }

  } catch (error) {
    console.error('Error en extractMedicalData:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al extraer datos',
    };
  }
}

/**
 * Analiza imágenes médicas (rayos X, ultrasonidos, etc.) usando GPT-4o Vision
 */
export async function analyzeMedicalImage(
  request: OpenAIExtractionRequest
): Promise<OpenAIExtractionResponse> {
  try {
    if (!OPENAI_API_KEY) {
      throw new Error('VITE_OPENAI_API_KEY no está configurada');
    }

    console.log('Analizando imagen médica:', request.fileName);

    const imagePrompt = `Analiza esta imagen médica y extrae ÚNICAMENTE la información que puedas identificar con certeza.

IMPORTANTE - LIMITACIONES:
- Este análisis NO constituye un diagnóstico médico
- Solo identifica el tipo de estudio y características técnicas visibles
- NO interpretes hallazgos clínicos a menos que sean extremadamente obvios
- Indica claramente tu nivel de confianza

INFORMACIÓN A EXTRAER:
1. tipo_estudio: Identifica el tipo de imagen (radiografia, ultrasonido, tomografia, resonancia, etc.)
2. Región anatómica visible
3. Orientación/proyección (si aplica: AP, lateral, oblicua, etc.)
4. Calidad técnica de la imagen
5. Cualquier texto visible (nombre paciente, fecha, institución, número de estudio)
6. Hallazgos OBVIOS (solo si son extremadamente claros, ej: fractura evidente, cuerpo extraño)

REGLAS ESTRICTAS:
- Si no estás seguro, usa null
- NO hagas diagnósticos médicos
- Solo describe lo que VES claramente
- Confianza baja (<60%) si la imagen no es clara
- Incluye DISCLAIMER de que no es diagnóstico médico

Responde en formato JSON siguiendo la estructura especificada.`;

    const openaiResponse = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        mmodel: 'gpt-5-nano', // Usar GPT-5-nano para mayor velocidad y economía
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: imagePrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: request.fileUrl,
                  detail: 'high' // Alta resolución para mejor análisis
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await openaiResponse.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No se recibió respuesta de OpenAI');
    }

    const datosExtraidos: DatosExtraidos = JSON.parse(content);

    // Asegurar que todos los campos requeridos existan (para imágenes pueden faltar)
    if (!datosExtraidos.paciente) {
      datosExtraidos.paciente = {
        nombre: '',
        edad: undefined,
        sexo: undefined
      };
    }
    if (!datosExtraidos.hallazgos) {
      datosExtraidos.hallazgos = [];
    }
    if (!datosExtraidos.impresion_diagnostica) {
      datosExtraidos.impresion_diagnostica = 'Análisis de imagen médica - requiere interpretación profesional';
    }

    // Agregar disclaimer automático
    datosExtraidos.notas_adicionales = (datosExtraidos.notas_adicionales || '') + 
      '\n\n⚠️ IMPORTANTE: Este análisis automático NO constituye un diagnóstico médico. ' +
      'Debe ser revisado y validado por un profesional médico calificado.';

    const tokensUsados = data.usage?.total_tokens || 0;
    const costoPorToken = 0.00003; // GPT-4o pricing
    const costoEstimado = tokensUsados * costoPorToken;

    return {
      success: true,
      datos: datosExtraidos,
      tokens_usados: tokensUsados,
      costo_estimado: costoEstimado,
    };

  } catch (error) {
    console.error('Error en analyzeMedicalImage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al analizar imagen',
    };
  }
}