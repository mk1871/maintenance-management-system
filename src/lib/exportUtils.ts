// src/lib/exportUtils.ts

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * Interface para datos exportables a CSV/PDF
 */
interface ExportableData {
  [key: string]: string | number | boolean | null | undefined
}

/**
 * Interface para configuración de headers CSV
 */
interface CSVHeaders {
  [key: string]: string
}

/**
 * Exporta datos a CSV con encoding UTF-8
 * @param data - Array de objetos con los datos a exportar
 * @param filename - Nombre del archivo sin extensión
 * @param headers - Mapeo de claves de datos a nombres de columnas
 * @throws Error si no hay datos para exportar
 */
export const exportToCSV = (
  data: ExportableData[],
  filename: string,
  headers: CSVHeaders,
): void => {
  if (data.length === 0) {
    throw new Error('No hay datos para exportar')
  }

  const headerKeys = Object.keys(headers)
  const headerLabels = Object.values(headers)
  const csvHeader = headerLabels.join(',')

  const csvRows = data.map((row) => {
    return headerKeys
      .map((key) => {
        const value = row[key]

        // Manejar valores nulos o undefined
        if (value === null || value === undefined) {
          return ''
        }

        const stringValue = String(value)

        // Escapar valores con comas o comillas
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }

        return stringValue
      })
      .join(',')
  })

  const csvContent = [csvHeader, ...csvRows].join('\n')

  // BOM para UTF-8
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Interface extendida de jsPDF con propiedad lastAutoTable
 */
interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY: number
  }
}

/**
 * Exporta datos a PDF con tabla formateada
 * @param data - Array de objetos con los datos a exportar
 * @param filename - Nombre del archivo sin extensión
 * @param title - Título del documento
 * @param headers - Array con nombres de columnas
 * @param columns - Array con claves de datos a incluir
 * @param totalAmount - Monto total opcional para mostrar al final
 * @param subtitle - Subtítulo opcional del documento
 * @throws Error si no hay datos para exportar
 */
export const exportToPDF = (
  data: ExportableData[],
  filename: string,
  title: string,
  headers: string[],
  columns: string[],
  totalAmount?: number,
  subtitle?: string,
): void => {
  if (data.length === 0) {
    throw new Error('No hay datos para exportar')
  }

  const doc = new jsPDF() as JsPDFWithAutoTable

  // Título principal
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 14, 22)

  let currentY = 30

  // Subtítulo opcional
  if (subtitle) {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100)
    doc.text(subtitle, 14, currentY)
    currentY += 6
  }

  // Fecha de generación
  doc.setFontSize(9)
  doc.setTextColor(150)
  const now = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  doc.text(`Generado: ${now}`, 14, currentY)

  // Preparar datos de la tabla
  const tableData = data.map((row) =>
    columns.map((col) => {
      const value = row[col]
      return value !== null && value !== undefined ? String(value) : '-'
    }),
  )

  // Crear tabla con autoTable
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: currentY + 6,
    theme: 'striped',
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: 10 },
  })

  // Agregar total si existe
  if (totalAmount !== undefined && doc.lastAutoTable) {
    const finalY = doc.lastAutoTable.finalY

    doc.setFontSize(12)
    doc.setTextColor(0)
    doc.setFont('helvetica', 'bold')
    doc.text(`TOTAL: €${totalAmount.toFixed(2)}`, 14, finalY + 10)
  }

  // Descargar PDF
  doc.save(`${filename}.pdf`)
}

/**
 * Formatea fecha para exportación en formato español
 * @param dateString - Fecha en formato ISO string
 * @returns Fecha formateada como dd/mm/yyyy
 */
export const formatDateForExport = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Formatea moneda para exportación sin símbolo
 * @param amount - Cantidad numérica
 * @returns String con dos decimales
 */
export const formatCurrencyForExport = (amount: number): string => {
  return amount.toFixed(2)
}

/**
 * Genera nombre de archivo con timestamp
 * @param base - Nombre base del archivo
 * @returns Nombre con formato base_YYYYMMDD
 */
export const generateFilename = (base: string): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${base}_${year}${month}${day}`
}
