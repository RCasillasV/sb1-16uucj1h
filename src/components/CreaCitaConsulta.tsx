"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { FileUp, HelpCircle, Info, AlertTriangle, Calendar, Clock, Check } from "lucide-react"
import { format, addDays, parse, isAfter } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const formSchema = z.object({
  nombres: z.string().min(2, { message: "El nombre es requerido" }),
  apellidoPaterno: z.string().min(2, { message: "El apellido paterno es requerido" }),
  apellidoMaterno: z.string().optional(),
  edad: z.string().min(1, { message: "La edad es requerida" }),
  genero: z.string().min(1, { message: "El género es requerido" }),
  tipoConsulta: z.string().min(1, { message: "El tipo de consulta es requerido" }),
  motivoPrincipal: z.string().min(2, { message: "El motivo principal es requerido" }),
  tiempoEvolucion: z.string().min(1, { message: "El tiempo de evolución es requerido" }),
  unidadTiempo: z.string().min(1, { message: "La unidad de tiempo es requerida" }),
  sintomasAsociados: z.array(z.string()).optional(),
  otrosSintomas: z.string().max(50, { message: "Máximo 50 caracteres" }).optional(),
  esUrgencia: z.boolean().default(false),
  mismoMotivo: z.boolean().default(false),
  fechaCita: z.string().optional(),
  horaCita: z.string().optional(),
})

// Definir los horarios disponibles (de 8:00 a 18:00, cada 30 minutos)
const HORARIOS_CONSULTA = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
]

// Tipo para las citas
type Cita = {
  id: number
  fecha: Date
  hora: string
  paciente: string
  tipo: string
}

export default function AgendarConsulta() {
  const [isRecurringPatient, setIsRecurringPatient] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [isPrimeraVez, setIsPrimeraVez] = useState(true)
  const [edadCalculada, setEdadCalculada] = useState<number | null>(null)

  // Estado para las citas existentes
  const [citasExistentes, setCitasExistentes] = useState<Cita[]>([
    { id: 1, fecha: new Date(), hora: "09:00", paciente: "Juan Pérez", tipo: "seguimiento" },
    { id: 2, fecha: new Date(), hora: "10:30", paciente: "Ana Gómez", tipo: "primera" },
    { id: 3, fecha: new Date(), hora: "12:00", paciente: "Carlos Ruiz", tipo: "urgencia" },
    { id: 4, fecha: addDays(new Date(), 1), hora: "09:30", paciente: "Laura Torres", tipo: "primera" },
    { id: 5, fecha: addDays(new Date(), 1), hora: "11:00", paciente: "Miguel Sánchez", tipo: "seguimiento" },
  ])

  // Estado para los horarios disponibles
  const [horariosDisponiblesHoy, setHorariosDisponiblesHoy] = useState<string[]>([])
  const [horariosDisponiblesManana, setHorariosDisponiblesManana] = useState<string[]>([])
  const [horariosDisponiblesFecha, setHorariosDisponiblesFecha] = useState<string[]>([])

  // Estado para la fecha seleccionada
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null)

  // Estado para el horario seleccionado
  const [horarioSeleccionado, setHorarioSeleccionado] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombres: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      edad: "",
      genero: "",
      tipoConsulta: "",
      motivoPrincipal: "",
      tiempoEvolucion: "",
      unidadTiempo: "dias",
      sintomasAsociados: [],
      otrosSintomas: "",
      esUrgencia: false,
      mismoMotivo: false,
      fechaCita: "",
      horaCita: "",
    },
  })

  // Función para calcular los horarios disponibles para una fecha específica
  const calcularHorariosDisponibles = (fecha: Date): string[] => {
    const horariosOcupados = citasExistentes
      .filter(
        (cita) =>
          cita.fecha.getDate() === fecha.getDate() &&
          cita.fecha.getMonth() === fecha.getMonth() &&
          cita.fecha.getFullYear() === fecha.getFullYear(),
      )
      .map((cita) => cita.hora)

    // Si la fecha es hoy, filtrar también los horarios que ya pasaron
    const ahora = new Date()

    return HORARIOS_CONSULTA.filter((horario) => {
      // Verificar si el horario ya está ocupado
      if (horariosOcupados.includes(horario)) {
        return false
      }

      // Si es hoy, verificar si el horario ya pasó
      if (
        fecha.getDate() === ahora.getDate() &&
        fecha.getMonth() === ahora.getMonth() &&
        fecha.getFullYear() === ahora.getFullYear()
      ) {
        const [horas, minutos] = horario.split(":").map(Number)
        const horarioDate = new Date(fecha)
        horarioDate.setHours(horas, minutos)

        return isAfter(horarioDate, ahora)
      }

      return true
    })
  }

  // Calcular horarios disponibles al cargar el componente
  useEffect(() => {
    const hoy = new Date()
    const manana = addDays(new Date(), 1)

    setHorariosDisponiblesHoy(calcularHorariosDisponibles(hoy))
    setHorariosDisponiblesManana(calcularHorariosDisponibles(manana))
  }, [citasExistentes])

  // Observar cambios en el tipo de consulta para actualizar automáticamente el estado de urgencia
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "tipoConsulta" || name === undefined) {
        const tipoConsulta = value.tipoConsulta
        if (tipoConsulta === "urgencia") {
          form.setValue("esUrgencia", true)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [form])

  function onSubmit(values: z.infer<typeof formSchema>) {
    //console.log(values)
    // Aquí iría la lógica para guardar la cita

    // Si se seleccionó una fecha y hora, agregar la cita a las existentes
    if (values.fechaCita && values.horaCita) {
      const nuevaCita: Cita = {
        id: citasExistentes.length + 1,
        fecha: parse(values.fechaCita, "yyyy-MM-dd", new Date()),
        hora: values.horaCita,
        paciente: `${values.nombres} ${values.apellidoPaterno}`,
        tipo: values.tipoConsulta,
      }

      setCitasExistentes([...citasExistentes, nuevaCita])

      // Limpiar selección
      setHorarioSeleccionado(null)
      form.setValue("horaCita", "")
    }

    // Simulación de alerta basada en síntomas
    if (values.sintomasAsociados?.includes("fiebre") && values.sintomasAsociados?.includes("erupcion")) {
      setShowAlert(true)
    }
  }

  function buscarPaciente() {
    // Simulación de búsqueda de paciente recurrente
    setIsRecurringPatient(true)
    form.setValue("nombres", "María")
    form.setValue("apellidoPaterno", "García")
    form.setValue("apellidoMaterno", "López")
    form.setValue("edad", "42")
    form.setValue("genero", "femenino")
  }

  function cargarUltimaConsulta() {
    // Simulación de carga de datos de última consulta
    form.setValue("motivoPrincipal", "Cefalea intensa")
    form.setValue("tiempoEvolucion", "2")
    form.setValue("unidadTiempo", "semanas")
    form.setValue("sintomasAsociados", ["mareo", "nauseas"])
    form.setValue("mismoMotivo", true)
  }

  function calcularEdad(fechaNacimiento: string) {
    if (!fechaNacimiento) return null

    const fechaNac = new Date(fechaNacimiento)
    const hoy = new Date()

    let edad = hoy.getFullYear() - fechaNac.getFullYear()
    const mes = hoy.getMonth() - fechaNac.getMonth()

    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--
    }

    return edad
  }

  function seleccionarFecha() {
    // Abrir un selector de fecha (simulado)
    const nuevaFecha = addDays(new Date(), 3)
    setFechaSeleccionada(nuevaFecha)

    // Calcular horarios disponibles para la fecha seleccionada
    const horariosDisponibles = calcularHorariosDisponibles(nuevaFecha)
    setHorariosDisponiblesFecha(horariosDisponibles)

    // Actualizar el formulario con la fecha seleccionada
    form.setValue("fechaCita", format(nuevaFecha, "yyyy-MM-dd"))
  }

  function seleccionarHorario(fecha: Date, hora: string) {
    setHorarioSeleccionado(hora)

    // Actualizar el formulario con la fecha y hora seleccionadas
    form.setValue("fechaCita", format(fecha, "yyyy-MM-dd"))
    form.setValue("horaCita", hora)
  }

  return (
    <div className="container mx-auto py-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="py-1.5 px-3 bg-gradient-to-r from-slate-100 to-slate-50 border-b">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl">Agendar Consulta Médica</CardTitle>
                {isRecurringPatient && (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-300">
                    Paciente Recurrente
                  </Badge>
                )}
              </div>
              <CardDescription>Ingrese los datos del paciente y el motivo de consulta</CardDescription>
            </div>
            <div className="flex items-center">
              <Button type="button" variant="outline" size="sm" onClick={buscarPaciente}>
                Buscar Paciente
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Sección Superior - Datos Básicos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Datos del Paciente</h3>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="nombres"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre(s)</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: María José" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="apellidoPaterno"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Apellido Paterno</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: García" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="apellidoMaterno"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Apellido Materno</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: López" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="edad"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha de Nacimiento</FormLabel>
                          <div className="flex items-center space-x-3">
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e)
                                  setEdadCalculada(calcularEdad(e.target.value))
                                }}
                              />
                            </FormControl>
                            {edadCalculada !== null && (
                              <div className="text-sm text-muted-foreground whitespace-nowrap">
                                Edad: <span className="font-medium">{edadCalculada} años</span>
                              </div>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="genero"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Género</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar género" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="masculino">Masculino</SelectItem>
                              <SelectItem value="femenino">Femenino</SelectItem>
                              <SelectItem value="otro">Otro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="tipoConsulta"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Tipo de Consulta</FormLabel>
                      <FormControl>
                        <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:space-y-0">
                          <RadioGroup
                            onValueChange={(value) => {
                              field.onChange(value)
                              setIsPrimeraVez(value === "primera")
                              // Si se selecciona urgencia, activar automáticamente el switch de urgencia
                              if (value === "urgencia") {
                                form.setValue("esUrgencia", true)
                              }
                            }}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1 sm:flex-row sm:space-x-4 sm:space-y-0"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="primera" />
                              </FormControl>
                              <FormLabel className="font-normal">Primera vez</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="seguimiento" />
                              </FormControl>
                              <FormLabel className="font-normal">Seguimiento</FormLabel> 
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="urgencia" />
                              </FormControl>
                              <FormLabel className="font-normal">Urgencia</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="control" />
                              </FormControl>
                              <FormLabel className="font-normal">Control rutinario</FormLabel>
                            </FormItem>
                          </RadioGroup>

                          {!isPrimeraVez && field.value && (
                            <div className="ml-0 mt-3 sm:ml-6 sm:mt-0">
                              <div className="flex flex-col">
                                <FormLabel className="text-sm font-normal text-muted-foreground mb-1">
                                  Fecha última cita
                                </FormLabel>
                                <Input type="date" className="w-full sm:w-40" placeholder="Fecha última cita" />
                              </div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="motivoPrincipal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motivo Principal</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Dolor de cabeza, Fiebre" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex space-x-2">
                    <FormField
                      control={form.control}
                      name="tiempoEvolucion"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>
                            Tiempo de Evolución
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-4 w-4 ml-1">
                                    <HelpCircle className="h-3 w-3" />
                                    <span className="sr-only">Ayuda</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Usar "Horas" si es menos de 24h</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Ej: 2" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="unidadTiempo"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Unidad</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Unidad" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="horas">Horas</SelectItem>
                              <SelectItem value="dias">Días</SelectItem>
                              <SelectItem value="semanas">Semanas</SelectItem>
                              <SelectItem value="meses">Meses</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Sección Dinámica - Síntomas */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Síntomas Asociados</h3>

                <FormField
                  control={form.control}
                  name="sintomasAsociados"
                  render={({ field }) => (
                    <FormItem>
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          <TooltipProvider>
                            {[
                              { id: "fiebre", label: "Fiebre", description: "≥38°C axilar" },
                              { id: "llanto", label: "Llanto inconsolable", description: "sin causa aparente" },
                              {
                                id: "rechazo_alimentacion",
                                label: "Rechazo al seno/biberón",
                                description: "disminución de tomas",
                              },
                              { id: "vomitos", label: "Vómitos", description: "proyectiles o frecuentes" },
                              { id: "diarrea", label: "Diarrea", description: "heces líquidas >3 veces/día" },
                              { id: "congestion", label: "Congestión nasal", description: "respiración ruidosa" },
                              { id: "tos", label: "Tos", description: "seca o con flemas audibles" },
                              { id: "erupcion", label: "Erupción en piel", description: "ronchas, manchas rojas" },
                              {
                                id: "somnolencia",
                                label: "Somnolencia excesiva",
                                description: "dificultad para despertar",
                              },
                              { id: "irritabilidad", label: "Irritabilidad", description: "mayor a lo habitual" },
                              {
                                id: "estreñimiento",
                                label: "Estreñimiento",
                                description: "heces duras o ausencia >3 días",
                              },
                              {
                                id: "regurgitaciones",
                                label: "Regurgitaciones frecuentes",
                                description: "con/sin malestar",
                              },
                              { id: "sibilancias", label: "Sibilancias", description: "silbido al respirar" },
                              {
                                id: "secrecion_ocular",
                                label: "Secreción ocular",
                                description: "legañas amarillas/verdes",
                              },
                              {
                                id: "dificultad_dormir",
                                label: "Dificultad para dormir",
                                description: "despertares frecuentes",
                              },
                              { id: "estornudos", label: "Estornudos repetidos", description: "posible alergia" },
                              { id: "hipo", label: "Hipo persistente", description: "episodios prolongados" },
                              {
                                id: "movimientos_anormales",
                                label: "Movimientos anormales",
                                description: "temblores, espasmos",
                              },
                              {
                                id: "fontanela",
                                label: "Fontanela abombada",
                                description: 'padres lo notan "hinchada"',
                              },
                              { id: "palidez", label: "Palidez cutánea", description: 'reportada como "está pálido"' },
                            ].map((sintoma) => (
                              <button
                                key={sintoma.id}
                                type="button"
                                onClick={() => {
                                  const currentValue = field.value || []
                                  if (currentValue.includes(sintoma.id)) {
                                    field.onChange(currentValue.filter((id) => id !== sintoma.id))
                                  } else {
                                    field.onChange([...currentValue, sintoma.id])
                                  }
                                }}
                                className={`px-2 py-0.5 rounded-md text-xs font-medium transition-colors border ${
                                  field.value?.includes(sintoma.id)
                                    ? "bg-slate-800 text-white border-slate-900"
                                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                                }`}
                              >
                                {sintoma.label}
                              </button>
                            ))}
                          </TooltipProvider>

                          {field.value
                            ?.filter(
                              (id) =>
                                ![
                                  "fiebre",
                                  "llanto",
                                  "rechazo_alimentacion",
                                  "vomitos",
                                  "diarrea",
                                  "congestion",
                                  "tos",
                                  "erupcion",
                                  "somnolencia",
                                  "irritabilidad",
                                  "estreñimiento",
                                  "regurgitaciones",
                                  "sibilancias",
                                  "secrecion_ocular",
                                  "dificultad_dormir",
                                  "estornudos",
                                  "hipo",
                                  "movimientos_anormales",
                                  "fontanela",
                                  "palidez",
                                ].includes(id),
                            )
                            .map((customTag) => (
                              <div
                                key={customTag}
                                className="flex items-center bg-slate-800 text-white px-2 py-0.5 rounded-md text-xs font-medium border border-slate-900"
                              >
                                {customTag}
                                <button
                                  type="button"
                                  className="ml-1 text-white hover:text-slate-200"
                                  onClick={() => {
                                    field.onChange(field.value?.filter((id) => id !== customTag))
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                        </div>

                        <div className="flex">
                          <Input
                            type="text"
                            placeholder="Agregar nuevo síntoma"
                            className="rounded-r-none"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && e.currentTarget.value.trim()) {
                                e.preventDefault()
                                const newTag = e.currentTarget.value.trim()
                                if (!field.value?.includes(newTag)) {
                                  field.onChange([...(field.value || []), newTag])
                                }
                                e.currentTarget.value = ""
                              }
                            }}
                          />
                          <Button
                            type="button"
                            className="rounded-l-none"
                            onClick={(e) => {
                              const input = e.currentTarget.previousSibling as HTMLInputElement
                              const newTag = input.value.trim()
                              if (newTag && !field.value?.includes(newTag)) {
                                field.onChange([...(field.value || []), newTag])
                              }
                              input.value = ""
                            }}
                          >
                            Agregar
                          </Button>
                        </div>

                        {field.value && field.value.length > 0 && (
                          <div className="text-sm text-muted-foreground">
                            {field.value.length}{" "}
                            {field.value.length === 1 ? "síntoma seleccionado" : "síntomas seleccionados"}
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Sección de Agenda */}
              <div className="space-y-2">
                <h3 className="text-base font-medium mb-1">Agenda de Citas</h3>

                {/* Campos ocultos para almacenar la fecha y hora seleccionadas */}
                <FormField
                  control={form.control}
                  name="fechaCita"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="horaCita"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Horarios disponibles hoy */}
                  <Card className="overflow-hidden">
                    <CardHeader className="py-1.5 px-3">
                      <CardTitle className="text-base flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Disponible hoy ({format(new Date(), "d 'de' MMMM", { locale: es })})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {horariosDisponiblesHoy.length > 0 ? (
                        <div className="max-h-40 overflow-y-auto">
                          <div className="grid grid-cols-3 gap-0.5 p-1.5">
                            {horariosDisponiblesHoy.map((hora) => (
                              <Button
                                key={hora}
                                type="button"
                                variant={
                                  horarioSeleccionado === hora &&
                                  form.getValues("fechaCita") === format(new Date(), "yyyy-MM-dd")
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                className={`justify-start text-xs py-0.5 h-7 ${
                                  horarioSeleccionado === hora &&
                                  form.getValues("fechaCita") === format(new Date(), "yyyy-MM-dd")
                                    ? "bg-green-600 hover:bg-green-700"
                                    : ""
                                }`}
                                onClick={() => seleccionarHorario(new Date(), hora)}
                              >
                                {hora}
                                {horarioSeleccionado === hora &&
                                  form.getValues("fechaCita") === format(new Date(), "yyyy-MM-dd") && (
                                    <Check className="h-3 w-3 ml-1" />
                                  )}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No hay horarios disponibles para hoy
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="bg-slate-50 py-1 px-3">
                      <div className="text-xs text-muted-foreground w-full text-center">
                        {horariosDisponiblesHoy.length} horarios disponibles
                      </div>
                    </CardFooter>
                  </Card>

                  {/* Horarios disponibles mañana */}
                  <Card className="overflow-hidden">
                    <CardHeader className="py-1.5 px-3">
                      <CardTitle className="text-base flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Disponible mañana ({format(addDays(new Date(), 1), "d 'de' MMMM", { locale: es })})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {horariosDisponiblesManana.length > 0 ? (
                        <div className="max-h-40 overflow-y-auto">
                          <div className="grid grid-cols-3 gap-0.5 p-1.5">
                            {horariosDisponiblesManana.map((hora) => (
                              <Button
                                key={hora}
                                type="button"
                                variant={
                                  horarioSeleccionado === hora &&
                                  form.getValues("fechaCita") === format(addDays(new Date(), 1), "yyyy-MM-dd")
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                className={`justify-start text-xs py-0.5 h-7 ${
                                  horarioSeleccionado === hora &&
                                  form.getValues("fechaCita") === format(addDays(new Date(), 1), "yyyy-MM-dd")
                                    ? "bg-green-600 hover:bg-green-700"
                                    : ""
                                }`}
                                onClick={() => seleccionarHorario(addDays(new Date(), 1), hora)}
                              >
                                {hora}
                                {horarioSeleccionado === hora &&
                                  form.getValues("fechaCita") === format(addDays(new Date(), 1), "yyyy-MM-dd") && (
                                    <Check className="h-3 w-3 ml-1" />
                                  )}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No hay horarios disponibles para mañana
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="bg-slate-50 py-1 px-3">
                      <div className="text-xs text-muted-foreground w-full text-center">
                        {horariosDisponiblesManana.length} horarios disponibles
                      </div>
                    </CardFooter>
                  </Card>

                  {/* Selección de otra fecha */}
                  <Card className="overflow-hidden">
                    <CardHeader className="py-1.5 px-3">
                      <CardTitle className="text-base flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Seleccionar otra fecha
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-1.5">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Button type="button" variant="outline" className="w-full" onClick={seleccionarFecha}>
                            <Calendar className="h-4 w-4 mr-2" />
                            Elegir fecha
                          </Button>
                        </div>

                        {fechaSeleccionada && (
                          <div className="pt-2">
                            <p className="text-sm font-medium mb-2">
                              Horarios para el {format(fechaSeleccionada, "d 'de' MMMM", { locale: es })}:
                            </p>
                            {horariosDisponiblesFecha.length > 0 ? (
                              <div className="grid grid-cols-3 gap-0.5">
                                {horariosDisponiblesFecha.map((hora) => (
                                  <Button
                                    key={hora}
                                    type="button"
                                    variant={
                                      horarioSeleccionado === hora &&
                                      form.getValues("fechaCita") === format(fechaSeleccionada, "yyyy-MM-dd")
                                        ? "default"
                                        : "outline"
                                    }
                                    size="sm"
                                    className={`justify-start text-xs py-0.5 h-7 ${
                                      horarioSeleccionado === hora &&
                                      form.getValues("fechaCita") === format(fechaSeleccionada, "yyyy-MM-dd")
                                        ? "bg-green-600 hover:bg-green-700"
                                        : ""
                                    }`}
                                    onClick={() => seleccionarHorario(fechaSeleccionada, hora)}
                                  >
                                    {hora}
                                    {horarioSeleccionado === hora &&
                                      form.getValues("fechaCita") === format(fechaSeleccionada, "yyyy-MM-dd") && (
                                        <Check className="h-3 w-3 ml-1" />
                                      )}
                                  </Button>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No hay horarios disponibles para esta fecha
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                    {fechaSeleccionada && (
                      <CardFooter className="bg-slate-50 py-1 px-3">
                        <div className="text-xs text-muted-foreground w-full text-center">
                          {horariosDisponiblesFecha.length} horarios disponibles
                        </div>
                      </CardFooter>
                    )}
                  </Card>
                </div>

                {/* Resumen de la cita seleccionada */}
                {horarioSeleccionado && form.getValues("fechaCita") && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2 mt-1">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-green-600 mr-2" />
                      <div>
                        <p className="font-medium text-green-800 text-sm">
                          Cita seleccionada: {horarioSeleccionado} hrs -{" "}
                          {format(parse(form.getValues("fechaCita"), "yyyy-MM-dd", new Date()), "EEEE d 'de' MMMM", {
                            locale: es,
                          })}
                        </p>
                        <p className="text-sm text-green-600">
                          Confirme los datos y haga clic en "Agendar Consulta" para reservar este horario
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Botones Rápidos */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Opciones Adicionales</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="esUrgencia"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Marcar como Urgencia</FormLabel>
                          <FormDescription>
                            {form.watch("tipoConsulta") === "urgencia"
                              ? "Activado automáticamente por tipo de consulta"
                              : "Resalta en rojo en la agenda"}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className={form.watch("tipoConsulta") === "urgencia" ? "opacity-90" : ""}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mismoMotivo"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Mismo motivo que última visita</FormLabel>
                          <FormDescription>Autocompleta desde historial</FormDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked)
                                if (checked) cargarUltimaConsulta()
                              }}
                              disabled={!isRecurringPatient}
                            />
                          </FormControl>
                          {!isRecurringPatient && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Disponible solo para pacientes recurrentes</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <FileUp className="h-5 w-5" />
                    <h4 className="font-medium">Adjuntar Documentos</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Input type="file" id="estudios" className="cursor-pointer" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Adjunte estudios previos (RX, analíticas, etc.)
                      </p>
                    </div>
                    <div>
                      <Input type="file" id="documentos" className="cursor-pointer" />
                      <p className="text-xs text-muted-foreground mt-1">Adjunte otros documentos relevantes</p>
                    </div>
                  </div>
                </div>
              </div>

              {showAlert && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-400 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-amber-800">Atención: Posible caso prioritario</h3>
                    <p className="text-amber-700 text-sm">
                      La combinación de fiebre y erupción cutánea podría requerir atención prioritaria.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
                <Button type="submit" disabled={!form.getValues("fechaCita") || !form.getValues("horaCita")}>
                  Agendar Consulta
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
