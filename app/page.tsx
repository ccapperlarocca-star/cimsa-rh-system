"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
} from "recharts";

// =====================================================
// CATÁLOGO DE VACANTES Y CLIENTES
// =====================================================

const CATALOGO_VACANTES: {
  vacante: string;
  cliente: string;
}[] = [
  // OPERACIONES
  { vacante: "MECÁNICO",                cliente: "OPERACIONES" },
  { vacante: "SOLDADOR",                cliente: "OPERACIONES" },
  { vacante: "ELÉCTRICO",               cliente: "OPERACIONES" },
  { vacante: "ELECTROMECÁNICO",         cliente: "OPERACIONES" },
  { vacante: "AYUDANTE GENERAL",        cliente: "OPERACIONES" },
  { vacante: "AYUDANTE LARGOS NORTE",   cliente: "OPERACIONES" },
  { vacante: "AYUDANTE FERROPAK",       cliente: "OPERACIONES" },
  { vacante: "CORTADOR",                cliente: "OPERACIONES" },

  // HISE
  { vacante: "SUPERVISOR DE SEGURIDAD", cliente: "HISE" },
  { vacante: "AUXILIAR ADMIN HISE",     cliente: "HISE" },

  // PROGRAMACIÓN
  { vacante: "CHOFER",                  cliente: "PROGRAMACIÓN" },

  // ALMACÉN CIMSA
  { vacante: "ALMACENISTA",             cliente: "ALMACÉN CIMSA" },
  { vacante: "AUXILIAR DE COMPRAS",     cliente: "ALMACÉN CIMSA" },

  // HUGO CASADOS
  { vacante: "CODIFICADOR",             cliente: "HUGO CASADOS" },
  { vacante: "GESTIÓN",                 cliente: "HUGO CASADOS" },
  { vacante: "PROGRAMADOR TERNIUM",     cliente: "HUGO CASADOS" },
  { vacante: "MONTACARGUISTA",          cliente: "HUGO CASADOS" },
  { vacante: "ALMACENISTA TERNIUM",     cliente: "HUGO CASADOS" },
  { vacante: "INSPECTOR",               cliente: "HUGO CASADOS" },
  { vacante: "SEGURIDAD TERNIUM",       cliente: "HUGO CASADOS" },
];

export default function Home() {

  // =====================================================
  // STATES CANDIDATOS
  // =====================================================

  const [nombre, setNombre] =
    useState("");

  const [telefono, setTelefono] =
    useState("");

  const [vacante, setVacante] =
    useState("");

  const [cliente, setCliente] =
    useState("");

  const [localidad, setLocalidad] =
    useState("");

  const [
    medioCaptacion,
    setMedioCaptacion,
  ] = useState("");

  const [
    vacanteIdSeleccionada,
    setVacanteIdSeleccionada,
  ] = useState("");

  const [candidatos, setCandidatos] =
    useState<any[]>([]);

  // =====================================================
  // STATES VACANTES
  // =====================================================

  const [
    vacanteNueva,
    setVacanteNueva,
  ] = useState("");

  const [
    clienteVacante,
    setClienteVacante,
  ] = useState("");

  const [
    solicitados,
    setSolicitados,
  ] = useState("");

  const [vacantes, setVacantes] =
    useState<any[]>([]);

  // =====================================================
  // CALENDARIO
  // =====================================================

  const [
    fechaSeleccionada,
    setFechaSeleccionada,
  ] = useState<Date | null>(null);

  useEffect(() => {
    setFechaSeleccionada(new Date());
  }, []);

  // =====================================================
  // SEMANAS
  // =====================================================

  const [
    offsetSemana,
    setOffsetSemana,
  ] = useState(0);

  // =====================================================
  // OBTENER CANDIDATOS
  // =====================================================

  const obtenerCandidatos = async () => {
    const { data, error } = await supabase
      .from("candidatos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) { console.log(error); return; }
    setCandidatos(data || []);
  };

  // =====================================================
  // OBTENER VACANTES
  // =====================================================

  const obtenerVacantes = async () => {
    const { data, error } = await supabase
      .from("vacantes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) { console.log(error); return; }
    setVacantes(data || []);
  };

  // =====================================================
  // GUARDAR CANDIDATO
  // =====================================================

  const guardarCandidato = async () => {
    if (
      !nombre ||
      !telefono ||
      !vacante ||
      !vacanteIdSeleccionada ||
      !cliente ||
      !localidad ||
      !medioCaptacion
    ) {
      alert("Completa todos los campos");
      return;
    }

    const { error } = await supabase
      .from("candidatos")
      .insert([
        {
          nombre,
          telefono,
          vacante,
          vacante_id: vacanteIdSeleccionada,
          cliente,
          localidad,
          medio_captacion: medioCaptacion,
          asistencia: "Pendiente",
          contratado: false,
        },
      ]);

    if (error) {
      console.log(error);
      alert(error.message);
      return;
    }

    setNombre("");
    setTelefono("");
    setVacante("");
    setVacanteIdSeleccionada("");
    setCliente("");
    setLocalidad("");
    setMedioCaptacion("");

    obtenerCandidatos();
  };

  // =====================================================
  // GUARDAR VACANTE
  // =====================================================

  const guardarVacante = async () => {
    if (!vacanteNueva || !clienteVacante || !solicitados) {
      alert("Completa todos los campos");
      return;
    }

    // Verificar si ya existe una vacante con ese nombre
    const yaExiste = vacantes.find(
      (v) => v.nombre === vacanteNueva
    );

    if (yaExiste) {
      const confirmar = confirm(
        `Ya existe una vacante "${vacanteNueva}" (${yaExiste.estatus}). ¿Deseas agregar otra de todas formas?`
      );
      if (!confirmar) return;
    }

    const { error } = await supabase
      .from("vacantes")
      .insert([
        {
          nombre:     vacanteNueva,
          cliente:    clienteVacante,
          solicitados: Number(solicitados),
          cubiertos:  0,
          estatus:    "Abierta",
        },
      ]);

    if (error) {
      console.log(error);
      alert(error.message);
      return;
    }

    setVacanteNueva("");
    setClienteVacante("");
    setSolicitados("");

    obtenerVacantes();
  };

  // =====================================================
  // ACTUALIZAR ASISTENCIA
  // =====================================================

  const actualizarAsistencia = async (
    id: string,
    asistencia: string
  ) => {
    const { error } = await supabase
      .from("candidatos")
      .update({ asistencia })
      .eq("id", id);

    if (error) { console.log(error); return; }
    obtenerCandidatos();
  };

  // =====================================================
  // CONTRATADO + HEADCOUNT
  // FIX: contar contratados DESPUÉS de confirmar el update
  // =====================================================

  const actualizarContratado = async (
    id: string,
    contratado: boolean,
    vacanteId: string,
    vacanteNombre: string
  ) => {

    // 1. Actualizar candidato
    const { error } = await supabase
      .from("candidatos")
      .update({ contratado })
      .eq("id", id);

    if (error) { console.log(error); return; }

    // 2. Contar contratados de ESA vacante específica por ID
    const { data: contratadosVacante } = await supabase
      .from("candidatos")
      .select("id")
      .eq("vacante_id", vacanteId)
      .eq("contratado", true);

    // Fallback: si no hay vacante_id, contar por nombre
    const { data: contratadosPorNombre } = await supabase
      .from("candidatos")
      .select("id")
      .eq("vacante", vacanteNombre)
      .eq("contratado", true);

    const cubiertosReales = contratadosVacante?.length
      ? contratadosVacante.length
      : contratadosPorNombre?.length || 0;

    // 3. Obtener vacante por ID directamente
    const { data: vacanteData } = await supabase
      .from("vacantes")
      .select("*")
      .eq("id", vacanteId)
      .single();

    if (!vacanteData) {
      obtenerVacantes();
      obtenerCandidatos();
      return;
    }

    // 4. Determinar nuevo estatus
    const nuevoEstatus =
      cubiertosReales >= vacanteData.solicitados
        ? "Cubierta"
        : "Abierta";

    // 5. Actualizar vacante
    await supabase
      .from("vacantes")
      .update({
        cubiertos: cubiertosReales,
        estatus:   nuevoEstatus,
      })
      .eq("id", vacanteId);

    obtenerVacantes();
    obtenerCandidatos();
  };

  // =====================================================
  // ACTUALIZAR ESTATUS VACANTE MANUALMENTE
  // =====================================================

  const actualizarEstatusVacante = async (
    id: string,
    nuevoEstatus: string
  ) => {
    if (!id) return;

    const { data, error } = await supabase
      .from("vacantes")
      .update({ estatus: nuevoEstatus })
      .eq("id", id)
      .select();

    if (error || !data || data.length === 0) {
      console.log("Error actualizando estatus:", error);
      return;
    }

    obtenerVacantes();
  };

  // =====================================================
  // ELIMINAR CANDIDATO
  // =====================================================

  const eliminarCandidato = async (id: string) => {
    const confirmar = confirm("¿Eliminar candidato?");
    if (!confirmar) return;

    const { error } = await supabase
      .from("candidatos")
      .delete()
      .eq("id", id);

    if (error) { console.log(error); alert(error.message); return; }
    obtenerCandidatos();
  };

  // =====================================================
  // ELIMINAR VACANTE
  // =====================================================

  const eliminarVacante = async (id: string) => {
    const confirmar = confirm("¿Eliminar vacante?");
    if (!confirmar) return;

    const { error } = await supabase
      .from("vacantes")
      .delete()
      .eq("id", id);

    if (error) { console.log(error); alert(error.message); return; }
    obtenerVacantes();
  };

  // =====================================================
  // KPIs RH
  // =====================================================

  const acudieron   = candidatos.filter((c) => c.asistencia === "Acudió").length;
  const faltaron    = candidatos.filter((c) => c.asistencia === "Faltó").length;
  const reagendados = candidatos.filter((c) => c.asistencia === "Reagendado").length;
  const contratados = candidatos.filter((c) => c.contratado === true).length;

  const conversion  = acudieron > 0
    ? ((contratados / acudieron) * 100).toFixed(1)
    : "0";

  // =====================================================
  // KPIs VACANTES
  // =====================================================

  const vacantesAbiertas  = vacantes.filter((v) => v.estatus === "Abierta").length;
  const vacantesCubiertas = vacantes.filter((v) => v.estatus === "Cubierta").length;

  // =====================================================
  // CALENDARIO
  // =====================================================

  const candidatosFecha = fechaSeleccionada
    ? candidatos.filter((candidato) => {
        const fecha = new Date(candidato.created_at);
        return fecha.toDateString() === fechaSeleccionada.toDateString();
      })
    : [];

  // =====================================================
  // REPORTE SEMANAL
  // =====================================================

  const graficaSemanal = useMemo(() => {
    const hoy = new Date();
    hoy.setDate(hoy.getDate() + offsetSemana * 7);

    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);
    finSemana.setHours(23, 59, 59, 999);

    const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

    return dias.map((dia, index) => {
      const candidatosSemana = candidatos.filter((c) => {
        const fecha = new Date(c.created_at);
        return (
          fecha >= inicioSemana &&
          fecha <= finSemana &&
          fecha.getDay() === index
        );
      });

      return {
        dia,
        acudieron:   candidatosSemana.filter((c) => c.asistencia === "Acudió").length,
        faltaron:    candidatosSemana.filter((c) => c.asistencia === "Faltó").length,
        reagendados: candidatosSemana.filter((c) => c.asistencia === "Reagendado").length,
        contratados: candidatosSemana.filter((c) => c.contratado === true).length,
      };
    });
  }, [candidatos, offsetSemana]);

  // =====================================================
  // INIT
  // =====================================================

  useEffect(() => {
    obtenerCandidatos();
    obtenerVacantes();

    // Refrescar cada 30 segundos para mantener ids sincronizados
    const interval = setInterval(() => {
      obtenerCandidatos();
      obtenerVacantes();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="bg-white p-8 rounded-2xl shadow mb-8">
          <h1 className="text-5xl font-bold text-blue-900 mb-2">
            CIMSA RH SYSTEM
          </h1>
          <p className="text-gray-600 text-lg">
            Sistema de Reclutamiento y Headcount
          </p>
        </div>

        {/* KPIs RH */}
        <div className="grid md:grid-cols-6 gap-4 mb-8">
          <div className="bg-blue-900 text-white p-6 rounded-2xl shadow">
            <h2>Citados</h2>
            <p className="text-4xl font-bold">{candidatos.length}</p>
          </div>
          <div className="bg-green-600 text-white p-6 rounded-2xl shadow">
            <h2>Acudieron</h2>
            <p className="text-4xl font-bold">{acudieron}</p>
          </div>
          <div className="bg-red-600 text-white p-6 rounded-2xl shadow">
            <h2>Faltaron</h2>
            <p className="text-4xl font-bold">{faltaron}</p>
          </div>
          <div className="bg-yellow-500 text-white p-6 rounded-2xl shadow">
            <h2>Reagendados</h2>
            <p className="text-4xl font-bold">{reagendados}</p>
          </div>
          <div className="bg-purple-600 text-white p-6 rounded-2xl shadow">
            <h2>Contratados</h2>
            <p className="text-4xl font-bold">{contratados}</p>
          </div>
          <div className="bg-black text-white p-6 rounded-2xl shadow">
            <h2>Conversión RH</h2>
            <p className="text-4xl font-bold">{conversion}%</p>
          </div>
        </div>

        {/* GESTIÓN VACANTES */}
        <div className="bg-white p-8 rounded-2xl shadow mb-8">
          <h2 className="text-2xl font-bold mb-6">Gestión de Vacantes</h2>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-900 text-white p-6 rounded-xl">
              <h3>Vacantes Abiertas</h3>
              <p className="text-4xl font-bold">{vacantesAbiertas}</p>
            </div>
            <div className="bg-green-600 text-white p-6 rounded-xl">
              <h3>Vacantes Cubiertas</h3>
              <p className="text-4xl font-bold">{vacantesCubiertas}</p>
            </div>
            <div className="bg-black text-white p-6 rounded-xl">
              <h3>Total Vacantes</h3>
              <p className="text-4xl font-bold">{vacantes.length}</p>
            </div>
          </div>

          {/* FORM VACANTES — con catálogo */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">

            {/* SELECTOR DE VACANTE (catálogo) — auto-llena cliente */}
            <select
              value={vacanteNueva}
              onChange={(e) => {
                const seleccion = CATALOGO_VACANTES.find(
                  (v) => v.vacante === e.target.value
                );
                setVacanteNueva(e.target.value);
                if (seleccion) setClienteVacante(seleccion.cliente);
              }}
              className="border p-4 rounded-xl"
            >
              <option value="">Selecciona Vacante</option>
              {CATALOGO_VACANTES.map((v) => (
                <option key={v.vacante} value={v.vacante}>
                  {v.vacante}
                </option>
              ))}
            </select>

            {/* CLIENTE — se llena automático, editable si se necesita */}
            <input
              type="text"
              placeholder="Cliente (auto)"
              value={clienteVacante}
              onChange={(e) => setClienteVacante(e.target.value)}
              className="border p-4 rounded-xl bg-gray-50"
            />

            <input
              type="number"
              placeholder="Solicitados"
              value={solicitados}
              onChange={(e) => setSolicitados(e.target.value)}
              className="border p-4 rounded-xl"
            />
          </div>

          <button
            onClick={guardarVacante}
            className="bg-blue-900 text-white px-6 py-3 rounded-xl"
          >
            Guardar Vacante
          </button>

          {/* TABLA VACANTES */}
          <div className="overflow-x-auto mt-8">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-4 text-left">Vacante</th>
                  <th className="p-4 text-left">Cliente</th>
                  <th className="p-4 text-left">Fecha Req.</th>
                  <th className="p-4 text-left">Solicitados</th>
                  <th className="p-4 text-left">Cubiertos</th>
                  <th className="p-4 text-left">Pendientes</th>
                  <th className="p-4 text-left">Estatus</th>
                  <th className="p-4 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {vacantes.map((v) => (
                  <tr key={v.id} className="border-b">
                    <td className="p-4">{v.nombre}</td>
                    <td className="p-4">{v.cliente}</td>
                    <td className="p-4">
                      {new Date(v.created_at).toLocaleDateString("es-MX")}
                    </td>
                    <td className="p-4">{v.solicitados}</td>
                    <td className="p-4">{v.cubiertos}</td>
                    <td className="p-4">
                      {v.solicitados - v.cubiertos}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${
                        v.estatus === "Cubierta" ? "bg-green-600" : "bg-yellow-500"
                      }`}>
                        {v.estatus}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => eliminarVacante(v.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FORM CANDIDATOS */}
        <div className="bg-white p-8 rounded-2xl shadow mb-8">
          <h2 className="text-2xl font-bold mb-6">Registrar Candidato</h2>

          <div className="grid md:grid-cols-2 gap-4">

            {/* VACANTE — de las vacantes activas en DB, guarda ID */}
            <select
              value={vacanteIdSeleccionada}
              onChange={(e) => {
                const v = vacantes.find((v) => v.id === e.target.value);
                setVacanteIdSeleccionada(e.target.value);
                if (v) {
                  setVacante(v.nombre);
                  setCliente(v.cliente);
                }
              }}
              className="border p-4 rounded-xl"
            >
              <option value="">Selecciona Vacante</option>
              {vacantes.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nombre} — {v.cliente} ({new Date(v.created_at).toLocaleDateString("es-MX")})
                </option>
              ))}
            </select>

            {/* CLIENTE — se llena automático */}
            <input
              type="text"
              placeholder="Cliente (auto)"
              value={cliente}
              readOnly
              className="border p-4 rounded-xl bg-gray-100 text-gray-600 cursor-not-allowed"
            />

            {/* NOMBRE */}
            <input
              type="text"
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="border p-4 rounded-xl"
            />

            {/* TELÉFONO */}
            <input
              type="text"
              placeholder="Teléfono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="border p-4 rounded-xl"
            />

            {/* LOCALIDAD */}
            <input
              type="text"
              placeholder="Localidad"
              value={localidad}
              onChange={(e) => setLocalidad(e.target.value)}
              className="border p-4 rounded-xl"
            />

            {/* CAPTACIÓN */}
            <select
              value={medioCaptacion}
              onChange={(e) => setMedioCaptacion(e.target.value)}
              className="border p-4 rounded-xl"
            >
              <option value="">Medio de Captación</option>
              <option value="Facebook">Facebook</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Indeed">Indeed</option>
              <option value="Volanteo">Volanteo</option>
              <option value="Recomendado">Recomendado</option>
            </select>
          </div>

          <button
            onClick={guardarCandidato}
            className="mt-6 bg-blue-900 text-white px-6 py-3 rounded-xl"
          >
            Guardar Candidato
          </button>
        </div>

        {/* CALENDARIO */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-8 rounded-2xl shadow">
            <h2 className="text-2xl font-bold mb-6">
              Calendario de Asistencias
            </h2>
            <Calendar
              onChange={(value) =>
                setFechaSeleccionada(value as Date)
              }
              value={fechaSeleccionada ?? new Date()}
            />
          </div>

          {/* ASISTENCIAS DEL DÍA */}
          <div className="bg-white p-8 rounded-2xl shadow">
            <h2 className="text-2xl font-bold mb-6">Asistencias del Día</h2>
            <div className="space-y-4">
              {candidatosFecha.length === 0 && (
                <p>No hay candidatos este día</p>
              )}
              {candidatosFecha.map((candidato) => (
                <div key={candidato.id} className="border p-4 rounded-xl">
                  <p className="font-bold">{candidato.nombre}</p>
                  <p>{candidato.vacante}</p>
                  <p>{candidato.asistencia}</p>
                  <p>
                    {candidato.contratado ? "Contratado" : "No contratado"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* REPORTE SEMANAL */}
        <div className="bg-white p-8 rounded-2xl shadow mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Reporte Semanal RH</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setOffsetSemana(offsetSemana - 1)}
                className="bg-gray-200 px-4 py-2 rounded-lg"
              >
                ← Semana anterior
              </button>
              <button
                onClick={() => setOffsetSemana(0)}
                className="bg-blue-900 text-white px-4 py-2 rounded-lg"
              >
                Semana actual
              </button>
              <button
                onClick={() => setOffsetSemana(offsetSemana + 1)}
                className="bg-gray-200 px-4 py-2 rounded-lg"
              >
                Semana siguiente →
              </button>
            </div>
          </div>

          <div style={{ width: "100%", height: 400, minHeight: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graficaSemanal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="acudieron"   fill="#16a34a" />
                <Bar dataKey="faltaron"    fill="#dc2626" />
                <Bar dataKey="reagendados" fill="#eab308" />
                <Bar dataKey="contratados" fill="#9333ea" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TABLA CANDIDATOS */}
        <div className="bg-white p-8 rounded-2xl shadow mb-8">
          <h2 className="text-3xl font-bold mb-6">Candidatos Registrados</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-4 text-left">Nombre</th>
                  <th className="p-4 text-left">Vacante</th>
                  <th className="p-4 text-left">Cliente</th>
                  <th className="p-4 text-left">Localidad</th>
                  <th className="p-4 text-left">Captación</th>
                  <th className="p-4 text-left">Asistencia</th>
                  <th className="p-4 text-left">Contratado</th>
                  <th className="p-4 text-left">Fecha</th>
                  <th className="p-4 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {candidatos.map((candidato) => (
                  <tr key={candidato.id} className="border-b">
                    <td className="p-4">{candidato.nombre}</td>
                    <td className="p-4">{candidato.vacante}</td>
                    <td className="p-4">{candidato.cliente}</td>
                    <td className="p-4">{candidato.localidad}</td>
                    <td className="p-4">{candidato.medio_captacion}</td>
                    <td className="p-4">
                      <select
                        value={candidato.asistencia}
                        onChange={(e) =>
                          actualizarAsistencia(
                            candidato.id,
                            e.target.value
                          )
                        }
                        className="border rounded-lg p-2"
                      >
                        <option>Pendiente</option>
                        <option>Acudió</option>
                        <option>Faltó</option>
                        <option>Reagendado</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() =>
                          actualizarContratado(
                            candidato.id,
                            !candidato.contratado,
                            candidato.vacante_id || candidato.id,
                            candidato.vacante
                          )
                        }
                        className={`px-4 py-2 rounded-lg text-white ${
                          candidato.contratado
                            ? "bg-green-600"
                            : "bg-gray-500"
                        }`}
                      >
                        {candidato.contratado ? "Sí" : "No"}
                      </button>
                    </td>
                    <td className="p-4">
                      {new Date(candidato.created_at).toLocaleDateString(
                        "es-MX"
                      )}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => eliminarCandidato(candidato.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}
