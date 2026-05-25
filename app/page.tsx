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

const CATALOGO_VACANTES: { vacante: string; cliente: string }[] = [
  { vacante: "MECÁNICO",                cliente: "OPERACIONES" },
  { vacante: "SOLDADOR",                cliente: "OPERACIONES" },
  { vacante: "ELÉCTRICO",               cliente: "OPERACIONES" },
  { vacante: "ELECTROMECÁNICO",         cliente: "OPERACIONES" },
  { vacante: "AYUDANTE GENERAL",        cliente: "OPERACIONES" },
  { vacante: "AYUDANTE LARGOS NORTE",   cliente: "OPERACIONES" },
  { vacante: "AYUDANTE FERROPAK",       cliente: "OPERACIONES" },
  { vacante: "CORTADOR",                cliente: "OPERACIONES" },
  { vacante: "SUPERVISOR DE SEGURIDAD", cliente: "HISE" },
  { vacante: "AUXILIAR ADMIN HISE",     cliente: "HISE" },
  { vacante: "CHOFER",                  cliente: "PROGRAMACIÓN" },
  { vacante: "ALMACENISTA",             cliente: "ALMACÉN CIMSA" },
  { vacante: "AUXILIAR DE COMPRAS",     cliente: "ALMACÉN CIMSA" },
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
// FECHA Y HORA ACTUAL
// =====================================================

const [fechaActual, setFechaActual] = useState(new Date());

  // STATES CANDIDATOS
  const [nombre, setNombre]               = useState("");
  const [telefono, setTelefono]           = useState("");
  const [vacante, setVacante]             = useState("");
  const [vacanteId, setVacanteId]         = useState("");
  const [cliente, setCliente]             = useState("");
  const [localidad, setLocalidad]         = useState("");
  const [medioCaptacion, setMedioCaptacion] = useState("");
  const [candidatos, setCandidatos]       = useState<any[]>([]);

  // STATES VACANTES
  const [vacanteNueva, setVacanteNueva]       = useState("");
  const [clienteVacante, setClienteVacante]   = useState("");
  const [solicitados, setSolicitados]         = useState("");
  const [vacantes, setVacantes]               = useState<any[]>([]);

  // =====================================================
// PAGINACIÓN VACANTES
// =====================================================

const [paginaVacantes, setPaginaVacantes] = useState(1);

const vacantesPorPagina = 4;

  // =====================================================
// REASIGNACIÓN
// =====================================================

const [mostrarReasignacion, setMostrarReasignacion] = useState(false);

const [candidatoPendiente, setCandidatoPendiente] = useState<any>(null);

const [nuevaVacanteId, setNuevaVacanteId] = useState("");

  // CALENDARIO
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null);
  const [offsetSemana, setOffsetSemana]           = useState(0);

  useEffect(() => {
    setFechaSeleccionada(new Date());
  }, []);

  // =====================================================
  // OBTENER DATOS
  // =====================================================

  const obtenerCandidatos = async () => {
    const { data, error } = await supabase
      .from("candidatos")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { console.log(error); return; }
    setCandidatos(data || []);
  };

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
    if (!nombre || !telefono || !vacante || !vacanteId || !cliente || !localidad || !medioCaptacion) {
      alert("Completa todos los campos");
      return;
    }
    const { error } = await supabase.from("candidatos").insert([{
      nombre,
      telefono,
      vacante,
      vacante_id: vacanteId,
      cliente,
      localidad,
      medio_captacion: medioCaptacion,
      asistencia: "Pendiente",
      contratado: false,
    }]);
    if (error) { console.log(error); alert(error.message); return; }
    setNombre(""); setTelefono(""); setVacante(""); setVacanteId("");
    setCliente(""); setLocalidad(""); setMedioCaptacion("");
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
    const yaExiste = vacantes.find((v) => v.nombre === vacanteNueva);
    if (yaExiste) {
      const ok = confirm(`Ya existe "${vacanteNueva}" (${yaExiste.estatus}). ¿Agregar otro requerimiento?`);
      if (!ok) return;
    }
    const { error } = await supabase.from("vacantes").insert([{
      nombre: vacanteNueva,
      cliente: clienteVacante,
      solicitados: Number(solicitados),
      cubiertos: 0,
      estatus: "Abierta",
    }]);
    if (error) { console.log(error); alert(error.message); return; }
    setVacanteNueva(""); setClienteVacante(""); setSolicitados("");
    obtenerVacantes();
  };

  // =====================================================
  // ACTUALIZAR ASISTENCIA
  // =====================================================

  const actualizarAsistencia = async (id: string, asistencia: string) => {
    const { error } = await supabase
      .from("candidatos").update({ asistencia }).eq("id", id);
    if (error) { console.log(error); return; }
    obtenerCandidatos();
  };

  // =====================================================
  // CONTRATADO + HEADCOUNT (por vacante_id)
  // =====================================================

  const actualizarContratado = async (
  candidato: any
) => {
  const reasignarCandidato = async () => {

  if (!candidatoPendiente || !nuevaVacanteId) {
    alert("Selecciona una vacante");
    return;
  }

  // =========================================
  // OBTENER NUEVA VACANTE
  // =========================================

  const nuevaVacante = vacantes.find(
    (v) => v.id === nuevaVacanteId
  );

  if (!nuevaVacante) return;

  // =========================================
  // ACTUALIZAR CANDIDATO
  // =========================================

  const { error } = await supabase
    .from("candidatos")
    .update({
      vacante: nuevaVacante.nombre,
      vacante_id: nuevaVacante.id,
      cliente: nuevaVacante.cliente,
      contratado: true
    })
    .eq("id", candidatoPendiente.id);

  if (error) {
    console.log(error);
    return;
  }

  // =========================================
  // RECALCULAR NUEVA VACANTE
  // =========================================

  const { data: contratadosData } = await supabase
    .from("candidatos")
    .select("id")
    .eq("vacante_id", nuevaVacante.id)
    .eq("contratado", true);

  const cubiertosReales = contratadosData?.length || 0;

  const nuevoEstatus =
    cubiertosReales >= nuevaVacante.solicitados
      ? "Cubierta"
      : "Abierta";
      let fechaCobertura = null;
let diasCobertura = null;

if (nuevoEstatus === "Cubierta") {

  fechaCobertura = new Date();

  const fechaInicio = new Date(vacanteData.created_at);

  const diferenciaMs =
    fechaCobertura.getTime() - fechaInicio.getTime();

  diasCobertura = Math.ceil(
    diferenciaMs / (1000 * 60 * 60 * 24)
  );
}

  // =========================================
  // ACTUALIZAR VACANTE
  // =========================================

 await supabase
  .from("vacantes")
  .update({
    cubiertos: cubiertosReales,
    estatus: nuevoEstatus,
    fecha_cobertura: fechaCobertura,
    dias_cobertura: diasCobertura
  })
    .eq("id", nuevaVacante.id);

  // =========================================
  // LIMPIAR
  // =========================================

  setMostrarReasignacion(false);

  setCandidatoPendiente(null);

  setNuevaVacanteId("");

  obtenerVacantes();

  obtenerCandidatos();
};

  const vId = candidato.vacante_id;

  // =========================================
  // OBTENER VACANTE
  // =========================================

  const { data: vacanteData, error: vacanteError } = await supabase
    .from("vacantes")
    .select("*")
    .eq("id", vId)
    .single();

  if (vacanteError || !vacanteData) {
    console.log(vacanteError);
    return;
  }

  // =========================================
  // VALIDAR SI YA ESTÁ CUBIERTA
  // =========================================

  if (
    vacanteData.cubiertos >= vacanteData.solicitados &&
    !candidato.contratado
  ) {

    alert("La vacante ya fue cubierta. Debes reasignar el candidato.");

    setCandidatoPendiente(candidato);

    setMostrarReasignacion(true);

    return;
  }

  // =========================================
  // CAMBIAR ESTATUS CONTRATADO
  // =========================================

  const nuevoEstado = !candidato.contratado;

  const { error } = await supabase
    .from("candidatos")
    .update({
      contratado: nuevoEstado
    })
    .eq("id", candidato.id);

  if (error) {
    console.log(error);
    return;
  }

  // =========================================
  // RECALCULAR CUBIERTOS
  // =========================================

  const { data: contratadosData } = await supabase
    .from("candidatos")
    .select("id")
    .eq("vacante_id", vId)
    .eq("contratado", true);

  const cubiertosReales = contratadosData?.length || 0;

  // =========================================
  // NUEVO ESTATUS
  // =========================================

  const nuevoEstatus =
    cubiertosReales >= vacanteData.solicitados
      ? "Cubierta"
      : "Abierta";
      let fechaCobertura = null;
let diasCobertura = null;

if (nuevoEstatus === "Cubierta") {

  fechaCobertura = new Date();

  const fechaInicio = new Date(vacanteData.created_at);

  const diferenciaMs =
    fechaCobertura.getTime() - fechaInicio.getTime();

  diasCobertura = Math.ceil(
    diferenciaMs / (1000 * 60 * 60 * 24)
  );
}

  // =========================================
  // ACTUALIZAR VACANTE
  // =========================================

 await supabase
  .from("vacantes")
  .update({
    cubiertos: cubiertosReales,
    estatus: nuevoEstatus,
    fecha_cobertura: fechaCobertura,
    dias_cobertura: diasCobertura
  })

    .eq("id", vId);

  obtenerVacantes();

  obtenerCandidatos();
};

  // =====================================================
  // ACTUALIZAR ESTATUS VACANTE (manual)
  // =====================================================

  const actualizarEstatusVacante = async (id: string, nuevoEstatus: string) => {
    if (!id) return;
    const { data, error } = await supabase
      .from("vacantes").update({ estatus: nuevoEstatus }).eq("id", id).select();
    if (error || !data || data.length === 0) {
      console.log("Error actualizando estatus:", error);
      return;
    }
    obtenerVacantes();
  };

  const reasignarCandidato = async () => {

  if (!candidatoPendiente || !nuevaVacanteId) {
    alert("Selecciona una vacante");
    return;
  }

  // =========================================
  // OBTENER NUEVA VACANTE
  // =========================================

  const nuevaVacante = vacantes.find(
    (v) => v.id === nuevaVacanteId
  );

  if (!nuevaVacante) return;

  // =========================================
  // ACTUALIZAR CANDIDATO
  // =========================================

  const { error } = await supabase
    .from("candidatos")
    .update({
      vacante: nuevaVacante.nombre,
      vacante_id: nuevaVacante.id,
      cliente: nuevaVacante.cliente,
      contratado: true
    })
    .eq("id", candidatoPendiente.id);

  if (error) {
    console.log(error);
    return;
  }

  // =========================================
  // RECALCULAR CUBIERTOS
  // =========================================

  const { data: contratadosData } = await supabase
    .from("candidatos")
    .select("id")
    .eq("vacante_id", nuevaVacante.id)
    .eq("contratado", true);

  const cubiertosReales = contratadosData?.length || 0;

  // =========================================
  // NUEVO ESTATUS
  // =========================================

  const nuevoEstatus =
    cubiertosReales >= nuevaVacante.solicitados
      ? "Cubierta"
      : "Abierta";
      let fechaCobertura = null;
let diasCobertura = null;

if (nuevoEstatus === "Cubierta") {

  fechaCobertura = new Date();

  const fechaInicio = new Date(nuevaVacante.created_at);

  const diferenciaMs =
    fechaCobertura.getTime() - fechaInicio.getTime();

  diasCobertura = Math.ceil(
    diferenciaMs / (1000 * 60 * 60 * 24)
  );
}

  // =========================================
  // ACTUALIZAR VACANTE
  // =========================================

 await supabase
  .from("vacantes")
  .update({
    cubiertos: cubiertosReales,
    estatus: nuevoEstatus,
    fecha_cobertura: fechaCobertura,
    dias_cobertura: diasCobertura
  })

    .eq("id", nuevaVacante.id);

  // =========================================
  // LIMPIAR MODAL
  // =========================================

  setMostrarReasignacion(false);

  setCandidatoPendiente(null);

  setNuevaVacanteId("");

  obtenerVacantes();

  obtenerCandidatos();
};

  // =====================================================
  // ELIMINAR
  // =====================================================

  const eliminarCandidato = async (id: string) => {
    if (!confirm("¿Eliminar candidato?")) return;
    const { error } = await supabase.from("candidatos").delete().eq("id", id);
    if (error) { console.log(error); alert(error.message); return; }
    obtenerCandidatos();
  };

  const eliminarVacante = async (id: string) => {
    if (!confirm("¿Eliminar vacante?")) return;
    const { error } = await supabase.from("vacantes").delete().eq("id", id);
    if (error) { console.log(error); alert(error.message); return; }
    obtenerVacantes();
  };

  // =====================================================
  // KPIs
  // =====================================================

  const acudieron   = candidatos.filter((c) => c.asistencia === "Acudió").length;
  const faltaron    = candidatos.filter((c) => c.asistencia === "Faltó").length;
  const reagendados = candidatos.filter((c) => c.asistencia === "Reagendado").length;
  const contratados = candidatos.filter((c) => c.contratado === true).length;
  const conversion  = acudieron > 0 ? ((contratados / acudieron) * 100).toFixed(1) : "0";

  const vacantesAbiertas  = vacantes.filter((v) => v.estatus === "Abierta").length;
  const vacantesCubiertas = vacantes.filter((v) => v.estatus === "Cubierta").length;
  const vacantesDisponibles = vacantes.filter(
  (v) => v.estatus === "Abierta" &&
  v.cubiertos < v.solicitados
);
const indiceInicial =
  (paginaVacantes - 1) * vacantesPorPagina;

const indiceFinal =
  indiceInicial + vacantesPorPagina;

const vacantesPaginadas =
  vacantes.slice(indiceInicial, indiceFinal);

const totalPaginas = Math.ceil(
  vacantes.length / vacantesPorPagina
);

// =====================================================
// RESUMEN POR TIPO DE VACANTE
// =====================================================

const resumenVacantes = Object.values(

  vacantes.reduce((acc: any, vacante: any) => {

    if (!acc[vacante.nombre]) {

      acc[vacante.nombre] = {
        nombre: vacante.nombre,
        abiertas: 0,
        cubiertas: 0,
        total: 0,
      };

    }

    acc[vacante.nombre].total++;

    if (vacante.estatus === "Cubierta") {
      acc[vacante.nombre].cubiertas++;
    } else {
      acc[vacante.nombre].abiertas++;
    }

    return acc;

  }, {})

);

  const candidatosFecha = fechaSeleccionada
    ? candidatos.filter((c) =>
        new Date(c.created_at).toDateString() === fechaSeleccionada.toDateString()
      )
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

    return ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"].map((dia, index) => {
      const cs = candidatos.filter((c) => {
        const f = new Date(c.created_at);
        return f >= inicioSemana && f <= finSemana && f.getDay() === index;
      });
      return {
        dia,
        acudieron:   cs.filter((c) => c.asistencia === "Acudió").length,
        faltaron:    cs.filter((c) => c.asistencia === "Faltó").length,
        reagendados: cs.filter((c) => c.asistencia === "Reagendado").length,
        contratados: cs.filter((c) => c.contratado === true).length,
      };
    });
  }, [candidatos, offsetSemana]);

  // =====================================================
  // INIT
  // =====================================================

  useEffect(() => {

  obtenerCandidatos();

  obtenerVacantes();

  // =========================================
  // ACTUALIZAR FECHA/HORA
  // =========================================

  const reloj = setInterval(() => {
    setFechaActual(new Date());
  }, 1000);

  // =========================================
  // REFRESH DATOS
  // =========================================

  const interval = setInterval(() => {
    obtenerCandidatos();
    obtenerVacantes();
  }, 30000);

  // =========================================
  // LIMPIAR INTERVALOS
  // =========================================

  return () => {
    clearInterval(interval);
    clearInterval(reloj);
  };

}, []);

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="bg-white p-8 rounded-2xl shadow mb-8">

  <div className="flex justify-between items-center">

    {/* IZQUIERDA */}
    <div>
      <h1 className="text-5xl font-bold text-blue-900 mb-2">
        CIMSA RH SYSTEM
      </h1>

      <p className="text-gray-600 text-lg">
        Sistema de Reclutamiento y Headcount
      </p>
    </div>

    {/* DERECHA */}
    <div className="text-right">

      <p className="text-gray-500 text-sm uppercase tracking-wide">
        Fecha Actual
      </p>

      <h2 className="text-2xl font-bold text-blue-900">
        {fechaActual.toLocaleDateString("es-MX", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </h2>

      <p className="text-gray-600 text-lg mt-1">
        {fechaActual.toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </p>

    </div>

  </div>

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

          {/* KPIs VACANTES */}
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

          {/* FORM NUEVA VACANTE — usa catálogo, auto-llena cliente */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <select
              value={vacanteNueva}
              onChange={(e) => {
                const sel = CATALOGO_VACANTES.find((v) => v.vacante === e.target.value);
                setVacanteNueva(e.target.value);
                if (sel) setClienteVacante(sel.cliente);
              }}
              className="border p-4 rounded-xl"
            >
              <option value="">Selecciona Vacante</option>
              {CATALOGO_VACANTES.map((v) => (
                <option key={v.vacante} value={v.vacante}>{v.vacante}</option>
              ))}
            </select>

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
            className="bg-blue-900 text-white px-6 py-3 rounded-xl mb-8"
          >
            Guardar Vacante
          </button>
{/* ========================================= */}
{/* RESUMEN DE VACANTES */}
{/* ========================================= */}

<div className="mb-8">

  <h3 className="text-2xl font-bold mb-4">
    Resumen de Vacantes
  </h3>

  <div className="grid md:grid-cols-4 gap-4">

    {resumenVacantes.map((r: any) => (

      <div
        key={r.nombre}
        className="bg-gray-100 border rounded-2xl p-5 shadow-sm"
      >

        <h4 className="text-xl font-bold text-blue-900 mb-3">
          {r.nombre}
        </h4>

        <div className="space-y-1">

          <p>
            <span className="font-semibold text-blue-700">
              Abiertas:
            </span>{" "}
            {r.abiertas}
          </p>

          <p>
            <span className="font-semibold text-green-700">
              Cubiertas:
            </span>{" "}
            {r.cubiertas}
          </p>

          <p>
            <span className="font-semibold text-gray-700">
              Total:
            </span>{" "}
            {r.total}
          </p>

        </div>

      </div>

    ))}

  </div>

</div>
          {/* TABLA VACANTES */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-4 text-left">Vacante</th>
                  <th className="p-4 text-left">Cliente</th>
                  <th className="p-4 text-left">Fecha Req.</th>
                  <th className="p-4 text-left">Solicitados</th>
                  <th className="p-4 text-left">Cubiertos</th>
                  <th className="p-4 text-left">Pendientes</th>
                  <th className="p-4 text-left">Tiempo</th>
                  <th className="p-4 text-left">Estatus</th>
                  <th className="p-4 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {vacantesPaginadas.map((v) => (
                  <tr key={v.id} className="border-b">
                    <td className="p-4">{v.nombre}</td>
                    <td className="p-4">{v.cliente}</td>
                    <td className="p-4">
                      {new Date(v.created_at).toLocaleDateString("es-MX")}
                    </td>
                    <td className="p-4">{v.solicitados}</td>
                    <td className="p-4">{v.cubiertos}</td>
                    <td className="p-4">
  {Math.max(v.solicitados - v.cubiertos, 0)}
</td>
<td className="p-4">

  {v.estatus === "Cubierta"
    ? `Cubierta en ${v.dias_cobertura || 0} días`
    : `Abierta hace ${
        Math.ceil(
          (
            new Date().getTime() -
            new Date(v.created_at).getTime()
          ) /
          (1000 * 60 * 60 * 24)
        )
      } días`
  }

</td>
                    <td className="p-4">
                      <select
                        value={v.estatus}
                        onChange={(e) => actualizarEstatusVacante(v.id, e.target.value)}
                        className={`px-3 py-2 rounded-lg text-white font-semibold border-0 cursor-pointer ${
                          v.estatus === "Cubierta"
  ? "bg-green-600"
  : v.cubiertos > 0
  ? "bg-yellow-500"
  : "bg-blue-900"
                        }`}
                      >
                        <option value="Abierta"  className="bg-white text-black">Abierta</option>
                        <option value="Cubierta" className="bg-white text-black">Cubierta</option>
                      </select>
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
            <div className="flex justify-center items-center gap-4 mt-6">

  <button
    onClick={() =>
      setPaginaVacantes((prev) =>
        Math.max(prev - 1, 1)
      )
    }
    className="bg-gray-200 px-4 py-2 rounded-lg"
  >
    ← Anterior
  </button>

  <span className="font-semibold">
    Página {paginaVacantes} de {totalPaginas}
  </span>

  <button
    onClick={() =>
      setPaginaVacantes((prev) =>
        Math.min(prev + 1, totalPaginas)
      )
    }
    className="bg-gray-200 px-4 py-2 rounded-lg"
  >
    Siguiente →
  </button>

</div>
          </div>
        </div>

        {/* FORM CANDIDATOS */}
        <div className="bg-white p-8 rounded-2xl shadow mb-8">
          <h2 className="text-2xl font-bold mb-6">Registrar Candidato</h2>

          <div className="grid md:grid-cols-2 gap-4">

            {/* VACANTE — muestra requerimientos activos de la DB con fecha para distinguir duplicados */}
            <select
              value={vacanteId}
              onChange={(e) => {
                const sel = vacantes.find((v) => v.id === e.target.value);
                setVacanteId(e.target.value);
                if (sel) { setVacante(sel.nombre); setCliente(sel.cliente); }
              }}
              className="border p-4 rounded-xl"
            >
              <option value="">Selecciona Vacante</option>
              {vacantesDisponibles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nombre} — {v.cliente} ({new Date(v.created_at).toLocaleDateString("es-MX")})
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Cliente (auto)"
              value={cliente}
              readOnly
              className="border p-4 rounded-xl bg-gray-100 text-gray-600 cursor-not-allowed"
            />

            <input
              type="text"
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="border p-4 rounded-xl"
            />

            <input
              type="text"
              placeholder="Teléfono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="border p-4 rounded-xl"
            />

            <input
              type="text"
              placeholder="Localidad"
              value={localidad}
              onChange={(e) => setLocalidad(e.target.value)}
              className="border p-4 rounded-xl"
            />

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
            <h2 className="text-2xl font-bold mb-6">Calendario de Asistencias</h2>
            <Calendar
              onChange={(value) => setFechaSeleccionada(value as Date)}
              value={fechaSeleccionada ?? new Date()}
            />
          </div>

          <div className="bg-white p-8 rounded-2xl shadow">
            <h2 className="text-2xl font-bold mb-6">Asistencias del Día</h2>
            <div className="space-y-4">
              {candidatosFecha.length === 0 && <p>No hay candidatos este día</p>}
              {candidatosFecha.map((c) => (
                <div key={c.id} className="border p-4 rounded-xl">
                  <p className="font-bold">{c.nombre}</p>
                  <p>{c.vacante}</p>
                  <p>{c.asistencia}</p>
                  <p>{c.contratado ? "Contratado" : "No contratado"}</p>
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
              >← Semana anterior</button>
              <button
                onClick={() => setOffsetSemana(0)}
                className="bg-blue-900 text-white px-4 py-2 rounded-lg"
              >Semana actual</button>
              <button
                onClick={() => setOffsetSemana(offsetSemana + 1)}
                className="bg-gray-200 px-4 py-2 rounded-lg"
              >Semana siguiente →</button>
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
                {candidatos.map((c) => (
                  <tr key={c.id} className="border-b">
                    <td className="p-4">{c.nombre}</td>
                    <td className="p-4">{c.vacante}</td>
                    <td className="p-4">{c.cliente}</td>
                    <td className="p-4">{c.localidad}</td>
                    <td className="p-4">{c.medio_captacion}</td>
                    <td className="p-4">
                      <select
                        value={c.asistencia}
                        onChange={(e) => actualizarAsistencia(c.id, e.target.value)}
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
                        onClick={() => actualizarContratado(c)}
                        className={`px-4 py-2 rounded-lg text-white ${
                          c.contratado ? "bg-green-600" : "bg-gray-500"
                        }`}
                      >
                        {c.contratado ? "Sí" : "No"}
                      </button>
                    </td>
                    <td className="p-4">
                      {new Date(c.created_at).toLocaleDateString("es-MX")}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => eliminarCandidato(c.id)}
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
      {/* ========================================= */}
{/* MODAL REASIGNACIÓN */}
{/* ========================================= */}

{mostrarReasignacion && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

    <div className="bg-white p-8 rounded-2xl w-full max-w-lg">

      <h2 className="text-2xl font-bold mb-4">
        Reasignar Candidato
      </h2>

      <p className="mb-2">
        La vacante original ya fue cubierta.
      </p>

      <p className="font-semibold mb-6">
        {candidatoPendiente?.nombre}
      </p>

      <select
        value={nuevaVacanteId}
        onChange={(e) => setNuevaVacanteId(e.target.value)}
        className="w-full border p-4 rounded-xl mb-6"
      >

        <option value="">
          Selecciona nueva vacante
        </option>

        {vacantesDisponibles.map((v) => (

          <option key={v.id} value={v.id}>

            {v.nombre} — {v.cliente}
            | Pendientes: {v.solicitados - v.cubiertos}

          </option>

        ))}

      </select>

      <div className="flex gap-4">

        <button
          onClick={reasignarCandidato}
          className="bg-green-600 text-white px-6 py-3 rounded-xl"
        >
          Reasignar y Contratar
        </button>

        <button
          onClick={() => {
            setMostrarReasignacion(false);
            setCandidatoPendiente(null);
            setNuevaVacanteId("");
          }}
          className="bg-gray-300 px-6 py-3 rounded-xl"
        >
          Cancelar
        </button>

      </div>

    </div>

  </div>
)}
    </main>
  );
}
