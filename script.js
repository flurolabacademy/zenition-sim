// ═══════════════════════════════════════════════════════════════
// PHILIPS ZENITION 70 - SIMULADOR C-ARM & ANGIOGRAFIA
// Logica principal
// ═══════════════════════════════════════════════════════════════

// Estado global
let pacientes = JSON.parse(localStorage.getItem('zenition_pacientes')) || [];
let examenesGuardados = JSON.parse(localStorage.getItem('zenition_examenes')) || [];
let pacienteSeleccionado = null;
let examenActual = null;
let anatomiaSeleccionada = '';
let contrasteSeleccionado = 'Yodo';

// Subtipos de examenes
const subtipos = {
    trauma: ['Cabeza', 'Torax', 'Columna', 'Pelvis/Raquis lumbar', 'Miembros Superiores', 'Cadera/Miembros Inferiores'],
    urologia: ['Rinon', 'Litotricia', 'Vejiga', 'Ureterografia'],
    endoscopia: ['ERCP', 'Esofago', 'Bronquios'],
    vascular: ['Cerebral', 'Cayado aortico', 'Abdominal', 'Brazo', 'Pierna', 'Bolo tecnica'],
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
// INICIALIZACION
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function() {
    renderTablaPacientes();
    renderTablaRevision();
    setupTabs();
    setupProcedureButtons();

    // Cargar pacientes de ejemplo si esta vacio
    if (pacientes.length === 0) {
        cargarPacientesEjemplo();
    }
});

function cargarPacientesEjemplo() {
    var ejemplos = [
        { nombre: 'TEST 01', sexo: 'D', fechaNac: '', id: '0001', tipoPrincipal: 'urologia', tipoSubtipo: 'Rinon', medico: '', fechaExamen: '27 abr 2026' }
    ];
    pacientes = ejemplos;
    guardarPacientes();
    renderTablaPacientes();
}

// ═══════════════════════════════════════════════════════════════
// NAVEGACION ENTRE PANTALLAS
// ═══════════════════════════════════════════════════════════════

function showScreen(screenId) {
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) {
        screens[i].classList.remove('active');
    }
    var target = document.getElementById('screen-' + screenId);
    if (target) target.classList.add('active');
}

function setupTabs() {
    var tabs = document.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].addEventListener('click', function() {
            var tabName = this.dataset.tab;
            var allTabs = document.querySelectorAll('.tab');
            for (var j = 0; j < allTabs.length; j++) {
                allTabs[j].classList.remove('active');
            }
            this.classList.add('active');

            if (tabName === 'programa') {
                showScreen('programa');
                renderTablaPacientes();
            } else if (tabName === 'revision') {
                showScreen('revision');
                renderTablaRevision();
            }
        });
    }
}

// ═══════════════════════════════════════════════════════════════
// PANTALLA PROGRAMA - TABLA DE PACIENTES
// ═══════════════════════════════════════════════════════════════

function renderTablaPacientes() {
    var tbody = document.getElementById('tabla-pacientes');
    if (!tbody) return;

    if (pacientes.length === 0) {
        tbody.innerHTML = '<div class="empty-message">No hay pacientes programados. Haga clic en "Agregar" para crear uno.</div>';
        return;
    }

    var html = '';
    for (var i = 0; i < pacientes.length; i++) {
        var p = pacientes[i];
        var selectedClass = (pacienteSeleccionado === i) ? 'selected' : '';
        var tipoText = p.tipoPrincipal ? (p.tipoPrincipal + '-' + p.tipoSubtipo) : '';
        html += '<div class="table-row ' + selectedClass + '" onclick="seleccionarPaciente(' + i + ')">' +
            '<div class="col-checkbox">☐</div>' +
            '<div class="col-nombre">' + (p.nombre || 'Sin nombre') + '</div>' +
            '<div class="col-sexo">' + (p.sexo || 'D') + '</div>' +
            '<div class="col-fecha">' + (p.fechaNac || '') + '</div>' +
            '<div class="col-id">' + (p.id || '') + '</div>' +
            '<div class="col-tipo">' + tipoText + '</div>' +
            '<div class="col-medico">' + (p.medico || '') + '</div>' +
        '</div>';
    }
    tbody.innerHTML = html;
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
    var principal = document.getElementById('tipo-examen-principal').value;
    var subtipoSelect = document.getElementById('tipo-examen-subtipo');

    subtipoSelect.innerHTML = '<option value="">Seleccionar subtipo...</option>';

    if (principal && subtipos[principal]) {
        for (var i = 0; i < subtipos[principal].length; i++) {
            var opt = document.createElement('option');
            opt.value = subtipos[principal][i];
            opt.textContent = subtipos[principal][i];
            subtipoSelect.appendChild(opt);
        }
    }
}

function anadirALista() {
    var paciente = obtenerDatosFormulario();
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
    var paciente = obtenerDatosFormulario();
    if (!paciente.nombre) {
        alert('Ingrese al menos el nombre del paciente');
        return;
    }

    pacientes.push(paciente);
    guardarPacientes();
    pacienteSeleccionado = pacientes.length - 1;

    // Crear examenActual y preconfigurar
    examenActual = {
        paciente: paciente,
        anatomia: paciente.tipoSubtipo || '',
        contraste: 'Yodo',
        modo: 'fluoroscopia',
        dosis: 'normal',
        impulsos: '15',
        almacenamiento: 'sin'
    };
    preconfigurarExamen(paciente.tipoPrincipal);

    // Ir a seleccionar anatomía primero
    showScreen('seleccion');
    setupProcedureForPatient(paciente.tipoPrincipal);
}

function obtenerDatosFormulario() {
    var dia = document.getElementById('dia-nac').value;
    var mes = document.getElementById('mes-nac').value;
    var anio = document.getElementById('anio-nac').value;
    var fechaNac = '';
    if (dia || mes || anio) {
        fechaNac = (dia + ' ' + mes + ' ' + anio).trim();
    }

    var sexoRadio = document.querySelector('input[name="sexo"]:checked');

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
// SELECCION DE TIPO DE EXAMEN / ANATOMIA
// ═══════════════════════════════════════════════════════════════

function setupProcedureButtons() {
    var btns = document.querySelectorAll('.proc-btn');
    for (var i = 0; i < btns.length; i++) {
        btns[i].addEventListener('click', function() {
            var allBtns = document.querySelectorAll('.proc-btn');
            for (var j = 0; j < allBtns.length; j++) {
                allBtns[j].classList.remove('active');
            }
            this.classList.add('active');
            mostrarAnatomia(this.dataset.proc);
        });
    }
}

function setupProcedureForPatient(tipoPrincipal) {
    var btns = document.querySelectorAll('.proc-btn');
    for (var i = 0; i < btns.length; i++) {
        btns[i].classList.remove('active');
        if (btns[i].dataset.proc === tipoPrincipal) {
            btns[i].classList.add('active');
        }
    }
    mostrarAnatomia(tipoPrincipal || 'trauma');
}

function mostrarAnatomia(proc) {
    var panels = document.querySelectorAll('.anatomy-panel');
    for (var i = 0; i < panels.length; i++) {
        panels[i].classList.remove('active');
    }
    var panel = document.getElementById('anatomy-' + proc);
    if (panel) panel.classList.add('active');
}

function selectAnatomy(part) {
    anatomiaSeleccionada = part;

    var points = document.querySelectorAll('.anatomy-point');
    for (var i = 0; i < points.length; i++) {
        points[i].style.fill = '#666';
        points[i].style.opacity = '0.5';
    }
    if (event && event.target) {
        event.target.style.fill = 'var(--accent-orange)';
        event.target.style.opacity = '1';
    }

    if (pacienteSeleccionado !== null && pacientes[pacienteSeleccionado]) {
        pacientes[pacienteSeleccionado].anatomia = part;
        guardarPacientes();
    }
}

function selectContrast(tipo) {
    contrasteSeleccionado = tipo;
    var btns = document.querySelectorAll('.contrast-btn');
    for (var i = 0; i < btns.length; i++) {
        btns[i].classList.remove('active');
    }
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

function aceptarSeleccion() {
    if (!anatomiaSeleccionada) {
        alert('Seleccione una anatomia');
        return;
    }

    var p = pacientes[pacienteSeleccionado];

    // Si ya existe examenActual, actualizar anatomía, si no, crear nuevo
    if (!examenActual) {
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
    } else {
        examenActual.anatomia = anatomiaSeleccionada;
        examenActual.contraste = contrasteSeleccionado;
    }

    preconfigurarExamen(p.tipoPrincipal);
    showScreen('examen');
    renderExamenVivo();
}

function cancelarSeleccion() {
    anatomiaSeleccionada = '';
    showScreen('programa');
}

function preconfigurarExamen(tipo) {
    var configs = {
        endoscopia: { modo: 'fluoroscopia', dosis: 'normal', impulsos: '15', almac: 'sin' },
        vascular: { modo: 'sustraccion', dosis: 'normal', impulsos: '7.5', almac: 'todo' },
        cardio: { modo: 'serie', dosis: 'normal', impulsos: '15', almac: 'todo' },
        trauma: { modo: 'serie', dosis: 'normal', impulsos: '15', almac: 'todo' },
        urologia: { modo: 'fluoroscopia', dosis: 'normal', impulsos: '15', almac: 'sin' },
        'trat-dolor': { modo: 'fluoroscopia', dosis: 'bajo', impulsos: '7.5', almac: 'sin' }
    };

    var config = configs[tipo] || configs.endoscopia;

    // Actualizar DOM
    document.getElementById('modo-examen').value = config.modo;
    document.getElementById('dosis-examen').value = config.dosis;
    document.getElementById('impulsos-examen').value = config.impulsos;
    document.getElementById('almac-examen').value = config.almac;

    // Actualizar objeto examenActual si existe
    if (examenActual) {
        examenActual.modo = config.modo;
        examenActual.dosis = config.dosis;
        examenActual.impulsos = config.impulsos;
        examenActual.almacenamiento = config.almac;
    }
}

// ═══════════════════════════════════════════════════════════════
// EXAMEN EN VIVO
// ═══════════════════════════════════════════════════════════════

function renderExamenVivo() {
    if (!examenActual) return;

    var p = examenActual.paciente;

    document.getElementById('patient-name-display').textContent = p.nombre || 'SIN NOMBRE';
    document.getElementById('mini-nombre').textContent = p.nombre || 'Sin nombre';
    document.getElementById('mini-id').textContent = p.id || '---';

    var tipoText = (p.tipoPrincipal || 'Endoscopia').charAt(0).toUpperCase() + (p.tipoPrincipal || 'endoscopia').slice(1);
    document.getElementById('study-type-display').innerHTML = tipoText + '<br>' + (examenActual.anatomia || 'ERCP');

    var icono = iconosExamenes[p.tipoPrincipal] || '🫚';
    document.getElementById('study-icon').textContent = icono;

    updateConfig();
}

function updateConfig() {
    if (!examenActual) return;

    var modo = document.getElementById('modo-examen').value;
    var impulsos = document.getElementById('impulsos-examen').value;
    var almacSelect = document.getElementById('almac-examen');
    var almacText = almacSelect.options[almacSelect.selectedIndex].text;

    examenActual.modo = modo;
    examenActual.impulsos = impulsos;
    examenActual.almacenamiento = document.getElementById('almac-examen').value;

    var sectionTitle = document.querySelector('.section-title:not(.collapsed) .subtitle');
    if (sectionTitle) {
        sectionTitle.textContent = impulsos + '/s ' + almacText;
    }

    var modoSelect = document.getElementById('modo-examen');
    var modoText = modoSelect.options[modoSelect.selectedIndex].text;
    document.getElementById('modo-secundario').textContent = modoText;
    document.getElementById('modo-sec-sub').textContent = impulsos + '/s ' + almacText;
}

function toggleSection(title) {
    title.classList.toggle('collapsed');
    var content = title.nextElementSibling;
    if (content) {
        content.classList.toggle('hidden');
    }
}

function toggleBtn(btn) {
    btn.classList.toggle('active');
}

function reducirDistorsion() {
    alert('Reduccion de distorsion activada');
}

function reducirRuido() {
    alert('Reduccion de ruido activada');
}

function togglePanelFisico() {
    var panel = document.getElementById('panel-fisico');
    var btn = document.getElementById('show-panel-btn');

    panel.classList.toggle('visible');
    btn.classList.toggle('hidden');
}

function guardarExamen() {
    if (!examenActual) return;

    examenesGuardados.push({
        paciente: examenActual.paciente,
        anatomia: examenActual.anatomia,
        contraste: examenActual.contraste,
        modo: examenActual.modo,
        dosis: examenActual.dosis,
        impulsos: examenActual.impulsos,
        almacenamiento: examenActual.almacenamiento,
        fecha: new Date().toISOString(),
        id: Date.now()
    });

    localStorage.setItem('zenition_examenes', JSON.stringify(examenesGuardados));

    var existe = false;
    for (var i = 0; i < pacientes.length; i++) {
        if (pacientes[i].id === examenActual.paciente.id) {
            existe = true;
            break;
        }
    }
    if (!existe) {
        pacientes.push(examenActual.paciente);
        guardarPacientes();
    }
}

// ═══════════════════════════════════════════════════════════════
// MODO REVISION
// ═══════════════════════════════════════════════════════════════

function renderTablaRevision() {
    var tbody = document.getElementById('tabla-revision');
    if (!tbody) return;

    if (examenesGuardados.length === 0) {
        tbody.innerHTML = '<div class="empty-message">No hay examenes guardados.</div>';
        return;
    }

    var html = '';
    for (var i = 0; i < examenesGuardados.length; i++) {
        var e = examenesGuardados[i];
        var tipoText = (e.paciente.tipoPrincipal || '') + '-' + (e.anatomia || '');
        html += '<div class="table-row" onclick="seleccionarExamen(' + i + ')">' +
            '<div class="col-checkbox">☐</div>' +
            '<div class="col-nombre">' + (e.paciente.nombre || 'Sin nombre') + '</div>' +
            '<div class="col-sexo">' + (e.paciente.sexo || 'D') + '</div>' +
            '<div class="col-fecha">' + (e.paciente.fechaNac || '') + '</div>' +
            '<div class="col-id">' + (e.paciente.id || '') + '</div>' +
            '<div class="col-fecha-ex">' + (e.paciente.fechaExamen || '') + '</div>' +
            '<div class="col-tipo">' + tipoText + '</div>' +
            '<div class="col-medico">' + (e.paciente.medico || '') + '</div>' +
            '<div class="col-num">' + (i + 1) + '</div>' +
        '</div>';
    }
    tbody.innerHTML = html;
}

function seleccionarExamen(idx) {
    examenActual = examenesGuardados[idx];
}

// ═══════════════════════════════════════════════════════════════
// FUNCIONES DEL MENU LATERAL
// ═══════════════════════════════════════════════════════════════

function editarPaciente() {
    if (pacienteSeleccionado === null) {
        alert('Seleccione un paciente primero');
        return;
    }
    var p = pacientes[pacienteSeleccionado];

    document.getElementById('nombre-paciente').value = p.nombre || '';
    document.getElementById('id-paciente').value = p.id || '';
    document.getElementById('peso').value = p.peso || '';
    document.getElementById('altura').value = p.altura || '';
    document.getElementById('referencia').value = p.referencia || '';

    var sexoRadio = document.querySelector('input[name="sexo"][value="' + p.sexo + '"]');
    if (sexoRadio) sexoRadio.checked = true;

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
    if (confirm('Eliminar este paciente?')) {
        pacientes.splice(pacienteSeleccionado, 1);
        pacienteSeleccionado = null;
        guardarPacientes();
        renderTablaPacientes();
    }
}

function obtenerListaTrabajo() {
    alert('Obteniendo lista de trabajo del servidor... (Esto es una simulacion)');
}

function infoExamen() {
    if (pacienteSeleccionado === null) {
        alert('Seleccione un paciente primero');
        return;
    }
    var p = pacientes[pacienteSeleccionado];
    alert('Informacion del examen: Paciente: ' + p.nombre + ', ID: ' + p.id + ', Tipo: ' + p.tipoPrincipal + '-' + p.tipoSubtipo + ', Medico: ' + (p.medico || 'No asignado'));
}

function iniciarExamen() {
    if (pacienteSeleccionado === null) {
        alert('Seleccione un paciente primero');
        return;
    }

    var p = pacientes[pacienteSeleccionado];
    examenActual = {
        paciente: p,
        anatomia: p.tipoSubtipo || '',
        contraste: 'Yodo',
        modo: 'fluoroscopia',
        dosis: 'normal',
        impulsos: '15',
        almacenamiento: 'sin'
    };

    // Preconfigurar según tipo de estudio (sobreescribirá los valores por defecto)
    preconfigurarExamen(p.tipoPrincipal);

    // Ir a seleccionar anatomía primero
    showScreen('seleccion');
    setupProcedureForPatient(p.tipoPrincipal);
}

// ═══════════════════════════════════════════════════════════════
// MODO REVISION - FUNCIONES
// ═══════════════════════════════════════════════════════════════

function mostrarExamen() {
    if (!examenActual && examenesGuardados.length > 0) {
        examenActual = examenesGuardados[examenesGuardados.length - 1];
    }
    if (examenActual) {
        showScreen('examen');
        renderExamenVivo();
    } else {
        alert('No hay examenes para mostrar');
    }
}

function modificarExamen() {
    alert('Funcion de modificacion de examen (Esto es una simulacion)');
}

function borrarExamen() {
    if (confirm('Eliminar este examen de la lista?')) {
        examenesGuardados.pop();
        localStorage.setItem('zenition_examenes', JSON.stringify(examenesGuardados));
        renderTablaRevision();
    }
}

function informeDosis() {
    var dosisTotal = examenesGuardados.length * 0.5;
    alert('Informe de Dosis Acumulada. Total de examenes: ' + examenesGuardados.length + ', Dosis acumulada estimada: ' + dosisTotal.toFixed(3) + ' mGy, DAP acumulado: ' + (dosisTotal * 2.5).toFixed(2) + ' cGy·cm2');
}

function cerrarRevision() {
    showScreen('programa');
    var tabs = document.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove('active');
    }
    var progTab = document.querySelector('[data-tab="programa"]');
    if (progTab) progTab.classList.add('active');
}

function infoExamenRevision() {
    informeDosis();
}

function volverAdquisicion() {
    showScreen('examen');
    if (examenActual) renderExamenVivo();
}

function seleccionarAnatomiaDesdeExamen() {
    if (!examenActual) {
        alert('No hay examen activo');
        return;
    }
    // Guardar configuración actual antes de cambiar
    showScreen('seleccion');
    setupProcedureForPatient(examenActual.paciente.tipoPrincipal);
}

function guardarExamenYVolver() {
    guardarExamen();
    alert('Examen guardado correctamente');
    showScreen('programa');
    renderTablaPacientes();
    // Actualizar tabs
    var tabs = document.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove('active');
    }
    var progTab = document.querySelector('[data-tab="programa"]');
    if (progTab) progTab.classList.add('active');
}

function volverAPrograma() {
    showScreen('programa');
    renderTablaPacientes();
    // Actualizar tabs
    var tabs = document.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove('active');
    }
    var progTab = document.querySelector('[data-tab="programa"]');
    if (progTab) progTab.classList.add('active');
}

// ═══════════════════════════════════════════════════════════════
// TECLADO - ATAJOS
// ═══════════════════════════════════════════════════════════════

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        var examenScreen = document.getElementById('screen-examen');
        var programaScreen = document.getElementById('screen-programa');
        if (examenScreen && examenScreen.classList.contains('active')) {
            guardarExamen();
            showScreen('programa');
        } else if (programaScreen && !programaScreen.classList.contains('active')) {
            showScreen('programa');
        }
    }

    if (e.key === 'F1') {
        e.preventDefault();
        alert('Atajos de teclado: ESC - Volver/Cancelar, F1 - Esta ayuda. En examen: Espacio - Activar/desactivar rayos X (simulado)');
    }
});

// Reloj en barra inferior
setInterval(function() {
    var horaEl = document.getElementById('hora-val');
    if (horaEl) {
        var now = new Date();
        horaEl.textContent = now.getHours() + ':' + now.getMinutes().toString().padStart(2, '0');
    }
}, 1000);

// Simulacion de dosis acumulada
var dosisSimulada = 0;
setInterval(function() {
    var examenScreen = document.getElementById('screen-examen');
    if (examenScreen && examenScreen.classList.contains('active')) {
        dosisSimulada += 0.001;
        var mgyEl = document.getElementById('mgy-val');
        if (mgyEl) mgyEl.textContent = dosisSimulada.toFixed(3);
    }
}, 2000);

console.log('Zenition 70 Simulador cargado. Listo para usar.');
