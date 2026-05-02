// ═══════════════════════════════════════════════════════════════
// PHILIPS ZENITION 70 - SIMULADOR C-ARM & ANGIOGRAFÍA
// Lógica principal
// ═══════════════════════════════════════════════════════════════

// Estado global
let pacientes = JSON.parse(localStorage.getItem('zenition_pacientes')) || [];
let examenesGuardados = JSON.parse(localStorage.getItem('zenition_examenes')) || [];
let pacienteSeleccionado = null;
let examenActual = null;
let anatomiaSeleccionada = '';
let contrasteSeleccionado = 'Yodo';

// Subtipos de exámenes
const subtipos = {
    trauma: ['Cabeza', 'Tórax', 'Columna', 'Pelvis/Raquis lumbar', 'Miembros Superiores', 'Cadera/Miembros Inferiores'],
    urologia: ['Riñón', 'Litotricia', 'Vejiga', 'Ureterografía'],
    endoscopia: ['ERCP', 'Esófago', 'Bronquios'],
    vascular: ['Cerebral', 'Cayado aórtico', 'Abdominal', 'Brazo', 'Pierna', 'Bolo técnica'],
    cardio: ['Marcapasos'],
    'trat-dolor': ['Cabeza', 'Cuello', 'Columna', 'Pelvis/Raquis lumbar', 'Brazo', 'Cadera/Miembros Inferiores']
};

// Iconos por tipo de examen
const iconosExamenes = {
    endoscopia: '🫚',
    vascular: '🩸',
    cardio: '❤️',
    urologia: '🫘',
    trauma: '🦴',
    'trat-dolor': '⚡'
};

// ═══════════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    renderTablaPacientes();
    renderTablaRevision();
    setupTabs();
    setupProcedureButtons();

    // Cargar pacientes de ejemplo si está vacío
    if (pacientes.length === 0) {
        cargarPacientesEjemplo();
    }
});

function cargarPacientesEjemplo() {
    const ejemplos = [
        { nombre: 'TEST 01', sexo: 'D', fechaNac: '', id: '0001', tipoPrincipal: 'urologia', tipoSubtipo: 'Riñón', medico: '', fechaExamen: '27 abr 2026' }
    ];
    pacientes = ejemplos;
    guardarPacientes();
    renderTablaPacientes();
}

// ═══════════════════════════════════════════════════════════════
// NAVEGACIÓN ENTRE PANTALLAS
// ═══════════════════════════════════════════════════════════════

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + screenId).classList.add('active');
}

function setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            if (tabName === 'programa') {
                showScreen('programa');
                renderTablaPacientes();
            } else if (tabName === 'revision') {
                showScreen('revision');
                renderTablaRevision();
            }
        });
    });
}

// ═══════════════════════════════════════════════════════════════
// PANTALLA PROGRAMA - TABLA DE PACIENTES
// ═══════════════════════════════════════════════════════════════

function renderTablaPacientes() {
    const tbody = document.getElementById('tabla-pacientes');
    if (pacientes.length === 0) {
        tbody.innerHTML = '<div class="empty-message">No hay pacientes programados. Haga clic en "Agregar" para crear uno.</div>';
        return;
    }

    tbody.innerHTML = pacientes.map((p, idx) => `
        <div class="table-row ${pacienteSeleccionado === idx ? 'selected' : ''}" onclick="seleccionarPaciente(${idx})">
            <div class="col-checkbox">☐</div>
            <div class="col-nombre">${p.nombre || 'Sin nombre'}</div>
            <div class="col-sexo">${p.sexo || 'D'}</div>
            <div class="col-fecha">${p.fechaNac || ''}</div>
            <div class="col-id">${p.id || ''}</div>
            <div class="col-tipo">${p.tipoPrincipal ? (p.tipoPrincipal + '-' + p.tipoSubtipo) : ''}</div>
            <div class="col-medico">${p.medico || ''}</div>
        </div>
    `).join('');
}

function seleccionarPaciente(idx) {
    pacienteSeleccionado = idx;
    renderTablaPacientes();
}

function guardarPacientes() {
    localStorage.setItem('zenition_pacientes', JSON.stringify(pacientes));
}

// ═══════════════════════════════════════════════════════════════
// AGREGAR PACIENTE
// ═══════════════════════════════════════════════════════════════

function actualizarSubtipos() {
    const principal = document.getElementById('tipo-examen-principal').value;
    const subtipoSelect = document.getElementById('tipo-examen-subtipo');

    subtipoSelect.innerHTML = '<option value="">Seleccionar subtipo...</option>';

    if (principal && subtipos[principal]) {
        subtipos[principal].forEach(sub => {
            const opt = document.createElement('option');
            opt.value = sub;
            opt.textContent = sub;
            subtipoSelect.appendChild(opt);
        });
    }
}

function anadirALista() {
    const paciente = obtenerDatosFormulario();
    if (!paciente.nombre) {
        alert('Ingrese al menos el nombre del paciente');
        return;
    }

    pacientes.push(paciente);
    guardarPacientes();
    renderTablaPacientes();
    cancelarFormulario();
}

function iniciarExamenDesdeForm() {
    const paciente = obtenerDatosFormulario();
    if (!paciente.nombre) {
        alert('Ingrese al menos el nombre del paciente');
        return;
    }

    pacientes.push(paciente);
    guardarPacientes();
    pacienteSeleccionado = pacientes.length - 1;

    // Ir a selección de anatomía
    showScreen('seleccion');
    setupProcedureForPatient(paciente.tipoPrincipal);
}

function obtenerDatosFormulario() {
    const dia = document.getElementById('dia-nac').value;
    const mes = document.getElementById('mes-nac').value;
    const anio = document.getElementById('anio-nac').value;
    let fechaNac = '';
    if (dia || mes || anio) {
        fechaNac = `${dia} ${mes} ${anio}`.trim();
    }

    const sexoRadio = document.querySelector('input[name="sexo"]:checked');

    return {
        nombre: document.getElementById('nombre-paciente').value,
        fechaNac: fechaNac,
        peso: document.getElementById('peso').value,
        altura: document.getElementById('altura').value,
        sexo: sexoRadio ? sexoRadio.value : 'D',
        id: document.getElementById('id-paciente').value,
        tipoPrincipal: document.getElementById('tipo-examen-principal').value,
        tipoSubtipo: document.getElementById('tipo-examen-subtipo').value,
        medico: document.getElementById('medico').value,
        referencia: document.getElementById('referencia').value,
        fechaExamen: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    };
}

function cancelarFormulario() {
    document.getElementById('form-paciente').reset();
    showScreen('programa');
    renderTablaPacientes();
}

// ═══════════════════════════════════════════════════════════════
// SELECCIÓN DE TIPO DE EXAMEN / ANATOMÍA
// ═══════════════════════════════════════════════════════════════

function setupProcedureButtons() {
    document.querySelectorAll('.proc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.proc-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const proc = btn.dataset.proc;
            mostrarAnatomia(proc);
        });
    });
}

function setupProcedureForPatient(tipoPrincipal) {
    document.querySelectorAll('.proc-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.proc === tipoPrincipal) {
            btn.classList.add('active');
        }
    });
    mostrarAnatomia(tipoPrincipal || 'trauma');
}

function mostrarAnatomia(proc) {
    document.querySelectorAll('.anatomy-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById('anatomy-' + proc);
    if (panel) panel.classList.add('active');
}

function selectAnatomy(part) {
    anatomiaSeleccionada = part;

    // Feedback visual
    document.querySelectorAll('.anatomy-point').forEach(p => {
        p.style.fill = '#666';
        p.style.opacity = '0.5';
    });
    event.target.style.fill = 'var(--accent-orange)';
    event.target.style.opacity = '1';

    // Guardar selección
    if (pacienteSeleccionado !== null && pacientes[pacienteSeleccionado]) {
        pacientes[pacienteSeleccionado].anatomia = part;
        guardarPacientes();
    }
}

function selectContrast(tipo) {
    contrasteSeleccionado = tipo;
    document.querySelectorAll('.contrast-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
}

function aceptarSeleccion() {
    if (!anatomiaSeleccionada) {
        alert('Seleccione una anatomía');
        return;
    }

    // Configurar examen según tipo
    const p = pacientes[pacienteSeleccionado];
    examenActual = {
        paciente: p,
        anatomia: anatomiaSeleccionada,
        contraste: contrasteSeleccionado,
        modo: 'fluoroscopia',
        dosis: 'normal',
        impulsos: '15',
        almacenamiento: 'sin',
        fecha: new Date().toISOString()
    };

    // Preconfigurar según tipo de estudio
    preconfigurarExamen(p.tipoPrincipal);

    showScreen('examen');
    renderExamenVivo();
}

function cancelarSeleccion() {
    anatomiaSeleccionada = '';
    showScreen('programa');
}

function preconfigurarExamen(tipo) {
    const configs = {
        endoscopia: { modo: 'fluoroscopia', dosis: 'normal', impulsos: '15', almac: 'sin' },
        vascular: { modo: 'fluoroscopia', dosis: 'normal', impulsos: '7.5', almac: 'sin' },
        cardio: { modo: 'serie', dosis: 'normal', impulsos: '15', almac: 'todo' },
        trauma: { modo: 'serie', dosis: 'normal', impulsos: '15', almac: 'todo' },
        urologia: { modo: 'fluoroscopia', dosis: 'normal', impulsos: '15', almac: 'sin' },
        'trat-dolor': { modo: 'fluoroscopia', dosis: 'bajo', impulsos: '7.5', almac: 'sin' }
    };

    const config = configs[tipo] || configs.endoscopia;

    document.getElementById('modo-examen').value = config.modo;
    document.getElementById('dosis-examen').value = config.dosis;
    document.getElementById('impulsos-examen').value = config.impulsos;
    document.getElementById('almac-examen').value = config.almac;
}

// ═══════════════════════════════════════════════════════════════
// EXAMEN EN VIVO
// ═══════════════════════════════════════════════════════════════

function renderExamenVivo() {
    if (!examenActual) return;

    const p = examenActual.paciente;

    // Actualizar nombre del paciente
    document.getElementById('patient-name-display').textContent = p.nombre || 'SIN NOMBRE';

    // Actualizar info en panel
    document.getElementById('mini-nombre').textContent = p.nombre || 'Sin nombre';
    document.getElementById('mini-id').textContent = p.id || '---';

    // Actualizar tipo de estudio
    const tipoText = (p.tipoPrincipal || 'Endoscopia').charAt(0).toUpperCase() + (p.tipoPrincipal || 'endoscopia').slice(1);
    document.getElementById('study-type-display').innerHTML = `${tipoText}<br>${examenActual.anatomia || 'ERCP'}`;

    const icono = iconosExamenes[p.tipoPrincipal] || '🫚';
    document.getElementById('study-icon').textContent = icono;

    updateConfig();
}

function updateConfig() {
    if (!examenActual) return;

    const modo = document.getElementById('modo-examen').value;
    const dosis = document.getElementById('dosis-examen').value;
    const impulsos = document.getElementById('impulsos-examen').value;
    const almac = document.getElementById('almac-examen').value;

    examenActual.modo = modo;
    examenActual.dosis = dosis;
    examenActual.impulsos = impulsos;
    examenActual.almacenamiento = almac;

    // Actualizar títulos de sección
    const modoText = document.getElementById('modo-examen').options[document.getElementById('modo-examen').selectedIndex].text;
    const almacText = document.getElementById('almac-examen').options[document.getElementById('almac-examen').selectedIndex].text;

    const sectionTitle = document.querySelector('.section-title:not(.collapsed) .subtitle');
    if (sectionTitle) {
        sectionTitle.textContent = `${impulsos}/s ${almacText}`;
    }

    // Actualizar modo secundario
    document.getElementById('modo-secundario').textContent = modoText;
    document.getElementById('modo-sec-sub').textContent = `${impulsos}/s ${almacText}`;
}

function toggleSection(title) {
    title.classList.toggle('collapsed');
    const content = title.nextElementSibling;
    if (content) {
        content.classList.toggle('hidden');
    }
}

function toggleBtn(btn) {
    btn.classList.toggle('active');
}

function reducirDistorsion() {
    alert('Reducción de distorsión activada');
}

function reducirRuido() {
    alert('Reducción de ruido activada');
}

function togglePanelFisico() {
    const panel = document.getElementById('panel-fisico');
    const btn = document.getElementById('show-panel-btn');

    panel.classList.toggle('visible');
    btn.classList.toggle('hidden');
}

// Guardar examen
function guardarExamen() {
    if (!examenActual) return;

    examenesGuardados.push({
        ...examenActual,
        id: Date.now()
    });

    localStorage.setItem('zenition_examenes', JSON.stringify(examenesGuardados));

    // Agregar a lista de pacientes si no existe
    const existe = pacientes.find(p => p.id === examenActual.paciente.id);
    if (!existe) {
        pacientes.push(examenActual.paciente);
        guardarPacientes();
    }
}

// ═══════════════════════════════════════════════════════════════
// MODO REVISIÓN
// ═══════════════════════════════════════════════════════════════

function renderTablaRevision() {
    const tbody = document.getElementById('tabla-revision');
    if (examenesGuardados.length === 0) {
        tbody.innerHTML = '<div class="empty-message">No hay exámenes guardados.</div>';
        return;
    }

    tbody.innerHTML = examenesGuardados.map((e, idx) => `
        <div class="table-row" onclick="seleccionarExamen(${idx})">
            <div class="col-checkbox">☐</div>
            <div class="col-nombre">${e.paciente.nombre || 'Sin nombre'}</div>
            <div class="col-sexo">${e.paciente.sexo || 'D'}</div>
            <div class="col-fecha">${e.paciente.fechaNac || ''}</div>
            <div class="col-id">${e.paciente.id || ''}</div>
            <div class="col-fecha-ex">${e.paciente.fechaExamen || ''}</div>
            <div class="col-tipo">${e.paciente.tipoPrincipal || ''}-${e.anatomia || ''}</div>
            <div class="col-medico">${e.paciente.medico || ''}</div>
            <div class="col-num">${idx + 1}</div>
        </div>
    `).join('');
}

function seleccionarExamen(idx) {
    examenActual = examenesGuardados[idx];
}

// ═══════════════════════════════════════════════════════════════
// FUNCIONES DEL MENÚ LATERAL
// ═══════════════════════════════════════════════════════════════

function editarPaciente() {
    if (pacienteSeleccionado === null) {
        alert('Seleccione un paciente primero');
        return;
    }
    const p = pacientes[pacienteSeleccionado];

    // Rellenar formulario
    document.getElementById('nombre-paciente').value = p.nombre || '';
    document.getElementById('id-paciente').value = p.id || '';
    document.getElementById('peso').value = p.peso || '';
    document.getElementById('altura').value = p.altura || '';
    document.getElementById('referencia').value = p.referencia || '';

    // Sexo
    const sexoRadio = document.querySelector(`input[name="sexo"][value="${p.sexo}"]`);
    if (sexoRadio) sexoRadio.checked = true;

    // Tipo
    document.getElementById('tipo-examen-principal').value = p.tipoPrincipal || '';
    actualizarSubtipos();
    document.getElementById('tipo-examen-subtipo').value = p.tipoSubtipo || '';

    document.getElementById('medico').value = p.medico || '';

    showScreen('agregar');
}

function borrarPaciente() {
    if (pacienteSeleccionado === null) {
        alert('Seleccione un paciente primero');
        return;
    }
    if (confirm('¿Eliminar este paciente?')) {
        pacientes.splice(pacienteSeleccionado, 1);
        pacienteSeleccionado = null;
        guardarPacientes();
        renderTablaPacientes();
    }
}

function obtenerListaTrabajo() {
    alert('Obteniendo lista de trabajo del servidor...
(Esto es una simulación)');
    // Aquí se podría cargar desde una API real
}

function infoExamen() {
    if (pacienteSeleccionado === null) {
        alert('Seleccione un paciente primero');
        return;
    }
    const p = pacientes[pacienteSeleccionado];
    alert(`Información del examen:

Paciente: ${p.nombre}
ID: ${p.id}
Tipo: ${p.tipoPrincipal}-${p.tipoSubtipo}
Médico: ${p.medico || 'No asignado'}`);
}

function iniciarExamen() {
    if (pacienteSeleccionado === null) {
        alert('Seleccione un paciente primero');
        return;
    }

    const p = pacientes[pacienteSeleccionado];
    examenActual = {
        paciente: p,
        anatomia: p.tipoSubtipo || '',
        contraste: 'Yodo',
        modo: 'fluoroscopia',
        dosis: 'normal',
        impulsos: '15',
        almacenamiento: 'sin'
    };

    preconfigurarExamen(p.tipoPrincipal);
    showScreen('examen');
    renderExamenVivo();
}

// ═══════════════════════════════════════════════════════════════
// MODO REVISIÓN - FUNCIONES
// ═══════════════════════════════════════════════════════════════

function mostrarExamen() {
    if (!examenActual && examenesGuardados.length > 0) {
        examenActual = examenesGuardados[examenesGuardados.length - 1];
    }
    if (examenActual) {
        showScreen('examen');
        renderExamenVivo();
    } else {
        alert('No hay exámenes para mostrar');
    }
}

function modificarExamen() {
    alert('Función de modificación de examen
(Esto es una simulación)');
}

function borrarExamen() {
    if (confirm('¿Eliminar este examen de la lista?')) {
        examenesGuardados.pop();
        localStorage.setItem('zenition_examenes', JSON.stringify(examenesGuardados));
        renderTablaRevision();
    }
}

function informeDosis() {
    const dosisTotal = examenesGuardados.length * 0.5;
    alert(`Informe de Dosis Acumulada

Total de exámenes: ${examenesGuardados.length}
Dosis acumulada estimada: ${dosisTotal.toFixed(3)} mGy
DAP acumulado: ${(dosisTotal * 2.5).toFixed(2)} cGy·cm²`);
}

function cerrarRevision() {
    showScreen('programa');
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector('[data-tab="programa"]').classList.add('active');
}

function infoExamenRevision() {
    informeDosis();
}

function volverAdquisicion() {
    showScreen('examen');
    if (examenActual) renderExamenVivo();
}

// ═══════════════════════════════════════════════════════════════
// TECLADO - ATAJOS
// ═══════════════════════════════════════════════════════════════

document.addEventListener('keydown', (e) => {
    // ESC - Volver a programa
    if (e.key === 'Escape') {
        if (document.getElementById('screen-examen').classList.contains('active')) {
            guardarExamen();
            showScreen('programa');
        } else if (!document.getElementById('screen-programa').classList.contains('active')) {
            showScreen('programa');
        }
    }

    // F1 - Ayuda
    if (e.key === 'F1') {
        e.preventDefault();
        alert('Atajos de teclado:

ESC - Volver/Cancelar
F1 - Esta ayuda

En examen:
Espacio - Activar/desactivar rayos X (simulado)');
    }
});

// Reloj en barra inferior
setInterval(() => {
    const horaEl = document.getElementById('hora-val');
    if (horaEl) {
        const now = new Date();
        horaEl.textContent = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    }
}, 1000);

// Simulación de dosis acumulada
let dosisSimulada = 0;
setInterval(() => {
    if (document.getElementById('screen-examen').classList.contains('active')) {
        dosisSimulada += 0.001;
        const mgyEl = document.getElementById('mgy-val');
        if (mgyEl) mgyEl.textContent = dosisSimulada.toFixed(3);
    }
}, 2000);

console.log('Zenition 70 Simulador cargado. Listo para usar.');
