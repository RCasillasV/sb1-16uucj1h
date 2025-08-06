"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Clock, MapPin, X, Plus } from 'lucide-react'
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Consultorio {
  id: number
  name: string
  enabled: boolean
}

interface BloqueoFecha {
  id: string
  startDate: Date
  endDate: Date
  reason: string
  type: 'vacation' | 'congress' | 'legal' | 'other'
}

export default function MedicalScheduleConfig() {
  const [slotDuration, setSlotDuration] = useState("30")
  const [consultorios, setConsultorios] = useState<Consultorio[]>([
    { id: 1, name: "Consultorio 1", enabled: true },
    { id: 2, name: "Consultorio 2", enabled: false },
    { id: 3, name: "Consultorio 3", enabled: false }
  ])
  
  const [workDays, setWorkDays] = useState({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false
  })
  
  const [startTime, setStartTime] = useState("08:00")
  const [endTime, setEndTime] = useState("18:00")
  
  const [bloqueos, setBloqueos] = useState<BloqueoFecha[]>([])
  const [newBloqueo, setNewBloqueo] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    reason: "",
    type: "vacation" as const
  })

  const updateConsultorioName = (id: number, name: string) => {
    setConsultorios(prev => 
      prev.map(c => c.id === id ? { ...c, name } : c)
    )
  }

  const toggleConsultorio = (id: number) => {
    setConsultorios(prev => 
      prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c)
    )
  }

  const addBloqueo = () => {
    if (newBloqueo.startDate && newBloqueo.endDate && newBloqueo.reason) {
      const bloqueo: BloqueoFecha = {
        id: Date.now().toString(),
        startDate: newBloqueo.startDate,
        endDate: newBloqueo.endDate,
        reason: newBloqueo.reason,
        type: newBloqueo.type
      }
      setBloqueos(prev => [...prev, bloqueo])
      setNewBloqueo({
        startDate: undefined,
        endDate: undefined,
        reason: "",
        type: "vacation"
      })
    }
  }

  const removeBloqueo = (id: string) => {
    setBloqueos(prev => prev.filter(b => b.id !== id))
  }

  const getBloqueoTypeLabel = (type: string) => {
    const labels = {
      vacation: "Vacaciones",
      congress: "Congreso",
      legal: "Descanso Legal",
      other: "Otro"
    }
    return labels[type as keyof typeof labels] || "Otro"
  }

  const getBloqueoTypeColor = (type: string) => {
    const colors = {
      vacation: "bg-blue-100 text-blue-800",
      congress: "bg-purple-100 text-purple-800",
      legal: "bg-green-100 text-green-800",
      other: "bg-gray-100 text-gray-800"
    }
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configuración de Agenda</h1>
          <p className="text-muted-foreground">Configure los parámetros básicos de su agenda médica</p>
        </div>
        <Button>Guardar Configuración</Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="horarios" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Horarios
          </TabsTrigger>
          <TabsTrigger value="bloqueos" className="flex items-center gap-2">
            <X className="h-4 w-4" />
            Bloqueos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Citas</CardTitle>
              <CardDescription>Configure la duración de cada slot de cita</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="slot-duration">Duración de cada cita (minutos)</Label>
                <Select value={slotDuration} onValueChange={setSlotDuration}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="20">20 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="45">45 minutos</SelectItem>
                    <SelectItem value="60">60 minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Consultorios</CardTitle>
              <CardDescription>Configure sus consultorios disponibles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {consultorios.map((consultorio) => (
                <div key={consultorio.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={consultorio.enabled}
                        onCheckedChange={() => toggleConsultorio(consultorio.id)}
                      />
                      <Label className="text-sm font-medium">
                        {consultorio.enabled ? "Habilitado" : "Deshabilitado"}
                      </Label>
                    </div>
                    <Input
                      value={consultorio.name}
                      onChange={(e) => updateConsultorioName(consultorio.id, e.target.value)}
                      disabled={!consultorio.enabled}
                      className="max-w-xs"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="horarios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Días de Atención</CardTitle>
              <CardDescription>Seleccione los días de la semana que atenderá</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: 'monday', label: 'Lunes' },
                  { key: 'tuesday', label: 'Martes' },
                  { key: 'wednesday', label: 'Miércoles' },
                  { key: 'thursday', label: 'Jueves' },
                  { key: 'friday', label: 'Viernes' },
                  { key: 'saturday', label: 'Sábado' },
                  { key: 'sunday', label: 'Domingo' }
                ].map((day) => (
                  <div key={day.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={day.key}
                      checked={workDays[day.key as keyof typeof workDays]}
                      onCheckedChange={(checked) =>
                        setWorkDays(prev => ({ ...prev, [day.key]: checked }))
                      }
                    />
                    <Label htmlFor={day.key}>{day.label}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Horario de Trabajo</CardTitle>
              <CardDescription>Configure su horario de inicio y fin de jornada</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Hora de inicio</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">Hora de fin</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bloqueos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agregar Bloqueo</CardTitle>
              <CardDescription>Configure períodos de no disponibilidad</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha de inicio</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newBloqueo.startDate ? format(newBloqueo.startDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newBloqueo.startDate}
                        onSelect={(date) => setNewBloqueo(prev => ({ ...prev, startDate: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Fecha de fin</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newBloqueo.endDate ? format(newBloqueo.endDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newBloqueo.endDate}
                        onSelect={(date) => setNewBloqueo(prev => ({ ...prev, endDate: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Tipo de bloqueo</Label>
                <Select value={newBloqueo.type} onValueChange={(value: any) => setNewBloqueo(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacation">Vacaciones</SelectItem>
                    <SelectItem value="congress">Congreso</SelectItem>
                    <SelectItem value="legal">Descanso Legal</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Motivo</Label>
                <Textarea
                  placeholder="Describa el motivo del bloqueo..."
                  value={newBloqueo.reason}
                  onChange={(e) => setNewBloqueo(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>
              
              <Button onClick={addBloqueo} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Bloqueo
              </Button>
            </CardContent>
          </Card>

          {bloqueos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Bloqueos Configurados</CardTitle>
                <CardDescription>Lista de períodos bloqueados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bloqueos.map((bloqueo) => (
                    <div key={bloqueo.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className={getBloqueoTypeColor(bloqueo.type)}>
                            {getBloqueoTypeLabel(bloqueo.type)}
                          </Badge>
                          <span className="text-sm font-medium">{bloqueo.reason}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(bloqueo.startDate, "PPP", { locale: es })} - {format(bloqueo.endDate, "PPP", { locale: es })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBloqueo(bloqueo.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
