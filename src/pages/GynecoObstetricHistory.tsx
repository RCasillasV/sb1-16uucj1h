// src/pages/GynecoObstetricHistory.tsx
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Heart, Save, AlertCircle, Baby, Printer, Info } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../components/Modal';
import clsx from 'clsx';
import { api } from '../lib/api';
import { format, parseISO } from 'date-fns';
import { Tooltip } from '../components/Tooltip'; // <-- Importa el nuevo componente Tooltip

// ... (resto de imports y esquemas)

export function GynecoObstetricHistory() {
  // ... (estados y hooks)

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart className="h-6 w-6" style={{ color: currentTheme.colors.primary }} />
          <h1
            className="text-2xl font-bold"
            style={{ color: currentTheme.colors.text }}
          >
            Antecedentes Gineco-Obstétricos
          </h1>
        </div>
        <div className="flex gap-2">
          {selectedPatient && (
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className={clsx(buttonStyle.base, 'flex items-center gap-2')}
              style={buttonStyle.primary}
            >
              <Printer className="h-4 w-4" />
              Imprimir Informe
            </button>
          )}
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={saving}
            className={clsx(buttonStyle.base, 'disabled:opacity-50', 'flex items-center gap-2')}
            style={buttonStyle.primary}
          >
            <Save className="h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {error && (
        <div
          className="p-4 rounded-md border-l-4"
          style={{
            background: '#FEE2E2',
            borderLeftColor: '#DC2626',
            color: '#DC2626',
          }}
        >
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5" />
            <div className="ml-3">
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Form Card */}
      <div
        className="rounded-lg shadow-lg p-6"
        style={{
          background: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        }}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Sección de Gestas, Paras, Abortos, Cesáreas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="gestas" className="flex items-center text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                Gestas
                <Tooltip text="Número total de embarazos que ha tenido la paciente, incluyendo embarazos actuales, partos a término, partos prematuros, abortos y embarazos ectópicos.">
                  <Info className="h-4 w-4 ml-1 cursor-help" style={{ color: currentTheme.colors.textSecondary }} />
                </Tooltip>
              </label>
              <input
                type="number"
                id="gestas"
                {...register('gestas')}
                placeholder="Ej: 3"
                className="w-full p-2 rounded-md border"
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="paras" className="flex items-center text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                Paras
                <Tooltip text="Número de partos que han llegado a término (después de las 37 semanas) o prematuros (entre las 20 y 37 semanas), resultando en un nacimiento vivo.">
                  <Info className="h-4 w-4 ml-1 cursor-help" style={{ color: currentTheme.colors.textSecondary }} />
                </Tooltip>
              </label>
              <input
                type="number"
                id="paras"
                {...register('paras')}
                placeholder="Ej: 2"
                className="w-full p-2 rounded-md border"
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="abortos" className="flex items-center text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                Abortos
                <Tooltip text="Número total de embarazos que terminaron antes de las 20 semanas de gestación, ya sea de forma espontánea o inducida.">
                  <Info className="h-4 w-4 ml-1 cursor-help" style={{ color: currentTheme.colors.textSecondary }} />
                </Tooltip>
              </label>
              <input
                type="number"
                id="abortos"
                {...register('abortos')}
                placeholder="Ej: 1"
                className="w-full p-2 rounded-md border"
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="cesareas" className="flex items-center text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                Cesáreas
                <Tooltip text="Número de partos que se realizaron mediante una intervención quirúrgica (cesárea).">
                  <Info className="h-4 w-4 ml-1 cursor-help" style={{ color: currentTheme.colors.textSecondary }} />
                </Tooltip>
              </label>
              <input
                type="number"
                id="cesareas"
                {...register('cesareas')}
                placeholder="Ej: 1"
                className="w-full p-2 rounded-md border"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Sección de Historial Menstrual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fum" className="flex items-center text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                Fecha Última Menstruación (FUM)
                <Tooltip text="La fecha del primer día de la última menstruación de la paciente. Es un dato clave para calcular la edad gestacional en caso de embarazo.">
                  <Info className="h-4 w-4 ml-1 cursor-help" style={{ color: currentTheme.colors.textSecondary }} />
                </Tooltip>
              </label>
              <input
                type="date"
                id="fum"
                {...register('fum')}
                className="w-full p-2 rounded-md border"
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="menarquia" className="flex items-center text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                Edad de Menarquia (años)
                <Tooltip text="La edad en años en la que la paciente tuvo su primera menstruación. Normalmente ocurre entre los 10 y 16 años.">
                  <Info className="h-4 w-4 ml-1 cursor-help" style={{ color: currentTheme.colors.textSecondary }} />
                </Tooltip>
              </label>
              <input
                type="number"
                id="menarquia"
                {...register('menarquia')}
                placeholder="Ej: 13"
                className="w-full p-2 rounded-md border"
                style={inputStyle}
              />
            </div>
            <div className="col-span-full">
              <label htmlFor="ritmo_menstrual" className="flex items-center text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                Ritmo Menstrual
                <Tooltip text="Describe la duración del ciclo menstrual y la duración del sangrado. Se expresa como 'duración del ciclo x duración del sangrado' (ej. 28x5 = ciclo de 28 días con 5 días de sangrado).">
                  <Info className="h-4 w-4 ml-1 cursor-help" style={{ color: currentTheme.colors.textSecondary }} />
                </Tooltip>
              </label>
              <input
                type="text"
                id="ritmo_menstrual"
                {...register('ritmo_menstrual')}
                placeholder="Ej: 28x5 (ciclo de 28 días, 5 días de sangrado)"
                className="w-full p-2 rounded-md border"
                style={inputStyle}
              />
            </div>
            <div className="col-span-full">
              <label htmlFor="metodo_anticonceptivo" className="flex items-center text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                Método Anticonceptivo Actual
                <Tooltip text="El método que la paciente utiliza actualmente para prevenir el embarazo (ej. Píldoras anticonceptivas, DIU, Condón, Implante, Ninguno).">
                  <Info className="h-4 w-4 ml-1 cursor-help" style={{ color: currentTheme.colors.textSecondary }} />
                </Tooltip>
              </label>
              <input
                type="text"
                id="metodo_anticonceptivo"
                {...register('metodo_anticonceptivo')}
                placeholder="Ej: Píldoras, DIU, Condón, Ninguno"
                className="w-full p-2 rounded-md border"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Sección de Papanicolau y Mamografía */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fecha_ultimo_papanicolau" className="flex items-center text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                Fecha Último Papanicolau
                <Tooltip text="Fecha en que se realizó la última prueba de Papanicolau (citología cervical), un examen para detectar cambios en las células del cuello uterino.">
                  <Info className="h-4 w-4 ml-1 cursor-help" style={{ color: currentTheme.colors.textSecondary }} />
                </Tooltip>
              </label>
              <input
                type="date"
                id="fecha_ultimo_papanicolau"
                {...register('fecha_ultimo_papanicolau')}
                className="w-full p-2 rounded-md border"
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="resultado_ultimo_papanicolau" className="flex items-center text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                Resultado Último Papanicolau
                <Tooltip text="El resultado del último Papanicolau. Valores comunes: Normal, ASCUS (células atípicas), NIC I/II/III (lesiones precancerosas).">
                  <Info className="h-4 w-4 ml-1 cursor-help" style={{ color: currentTheme.colors.textSecondary }} />
                </Tooltip>
              </label>
              <input
                type="text"
                id="resultado_ultimo_papanicolau"
                {...register('resultado_ultimo_papanicolau')}
                placeholder="Ej: Normal, ASCUS, NIC I"
                className="w-full p-2 rounded-md border"
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="mamografia" className="flex items-center text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                Fecha Última Mamografía
                <Tooltip text="Fecha en que se realizó la última mamografía, una radiografía de la mama utilizada para detectar el cáncer de mama.">
                  <Info className="h-4 w-4 ml-1 cursor-help" style={{ color: currentTheme.colors.textSecondary }} />
                </Tooltip>
              </label>
              <input
                type="date"
                id="mamografia"
                {...register('mamografia')}
                className="w-full p-2 rounded-md border"
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="resultado_mamografia" className="flex items-center text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                Resultado Última Mamografía
                <Tooltip text="El resultado de la última mamografía, clasificado usando el sistema BIRADS. BIRADS 1: Normal, BIRADS 2: Hallazgos benignos, BIRADS 3: Probablemente benigno.">
                  <Info className="h-4 w-4 ml-1 cursor-help" style={{ color: currentTheme.colors.textSecondary }} />
                </Tooltip>
              </label>
              <input
                type="text"
                id="resultado_mamografia"
                {...register('resultado_mamografia')}
                placeholder="Ej: BIRADS 1, BIRADS 2"
                className="w-full p-2 rounded-md border"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Notas Adicionales */}
          <div>
            <label htmlFor="notas_adicionales" className="flex items-center text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
              Notas Adicionales
              <Tooltip text="Cualquier otra información relevante sobre el historial gineco-obstétrico que no encaje en los campos anteriores (ej. antecedentes familiares de cáncer de mama, problemas de fertilidad, menopausia).">
                <Info className="h-4 w-4 ml-1 cursor-help" style={{ color: currentTheme.colors.textSecondary }} />
              </Tooltip>
            </label>
            <textarea
              id="notas_adicionales"
              {...register('notas_adicionales')}
              placeholder="Ej: Antecedente familiar de cáncer de mama, problemas de fertilidad..."
              rows={4}
              className="w-full p-2 rounded-md border"
              style={inputStyle}
            />
          </div>

          {/* Botón de Guardar (también en el header) */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className={clsx(buttonStyle.base, 'disabled:opacity-50')}
              style={buttonStyle.primary}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal del Informe Gineco-Obstétrico (si se implementa) */}
      {selectedPatient && showReportModal && (
        <Modal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          title="Informe de Antecedentes Gineco-Obstétricos"
          className="max-w-6xl w-full"
        >
          {/* Aquí iría el componente de informe si lo creas */}
          <div className="p-4 text-center">
            <p>Contenido del informe de antecedentes gineco-obstétricos.</p>
            <p>Esta sección está en desarrollo.</p>
            <button
              onClick={() => setShowReportModal(false)}
              className={clsx(buttonStyle.base, 'mt-4')}
              style={buttonStyle.primary}
            >
              Cerrar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
 