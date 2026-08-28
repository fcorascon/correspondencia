(function () {
    const SUPABASE_URL = "https://ehsbhaepkknxdpvcttaz.supabase.co";
    const SUPABASE_KEY = "sb_publishable_wpFKOfWfFJ4jb9NIEJ4_qQ__c1H3mIh";
    let _supabase;

    let currentSection = 'recibida';
    let currentEditId = null;
    let allData = [];
    let currentFilteredData = [];
    let autorizadosData = []; // Para el select de Recibió / Elaboró
    let statusesData = []; // Para el select de Estatus
    let tiposData = []; // Para el select de Tipo

    let currentPage = 1;
    const pageSize = 20;
    let currentFilter = 'todos';

    const schemas = {
        recibida: [
            { id: 'Fecha_Recibido', name: 'FECHA RECIBIDO', type: 'date' },
            { id: 'Remite', name: 'REMITE', type: 'text', full: true },
            { id: 'Asunto', name: 'ASUNTO', type: 'text', full: true },
            { id: 'Recibio', name: 'RECIBIÓ', type: 'select', source: 'autorizados' },
            { id: 'fecha_evento', name: 'FECHA EVENTO', type: 'date' },
            { id: 'HORA', name: 'HORA', type: 'time' },
            { id: 'Lugar', name: 'LUGAR', type: 'text', full: true },
            { id: 'TELEFONO', name: 'TELÉFONO', type: 'text' },
            { id: 'CORREO', name: 'CORREO', type: 'email' },
            { id: 'PDF-Imagen', name: 'ARCHIVO/PDF', type: 'file' }
        ],
        despachada: [
            { id: 'Fecha', name: 'FECHA', type: 'date' },
            { id: 'Elaboro', name: 'ELABORÓ', type: 'select', source: 'autorizados' },
            { id: 'Dirigido', name: 'DIRIGIDO', type: 'text' },
            { id: 'Asunto', name: 'ASUNTO', type: 'text', full: true },
            { id: 'Estatus', name: 'ESTATUS', type: 'select', source: 'status' },
            { id: 'Recibió', name: 'RECIBIÓ', type: 'text' },
            { id: 'Fecha_recepcion', name: 'FECHA RECEPCIÓN', type: 'date' },
            { id: 'TELEFONO', name: 'TELÉFONO', type: 'text' },
            { id: 'CORREO', name: 'CORREO', type: 'email' },
            { id: 'Archivos y multimedia', name: 'ARCHIVOS', type: 'file' }
        ],
        iniciativas: [
            { id: 'fecha_oficio', name: 'FECHA OFICIO', type: 'date' },
            { id: 'fecha_presentacion_oficialia', name: 'OFICIALÍA', type: 'date' },
            { id: 'texto', name: 'INICIATIVA', type: 'text', full: true },
            { id: 'comision', name: 'COMISIÓN', type: 'text' },
            { id: 'fecha_turno_legis', name: 'TURNO LEGIS', type: 'date' },
            { id: 'fecha_pleno', name: 'PLENO', type: 'date' },
            { id: 'dictaminada_favor_contra', name: 'DICTAMEN', type: 'text' },
            { id: 'decreto', name: 'DECRETO', type: 'text' },
            { id: 'objeto', name: 'OBJETO', type: 'text', full: true },
            { id: 'pdf', name: 'PDF', type: 'file', maxFiles: 10 },
            { id: 'opinion_consultoria', name: 'OPINIÓN CONSULTORÍA', type: 'file', maxFiles: 5 },
            { id: 'proyecto_dictamen', name: 'PROYECTO DICTAMEN', type: 'file', maxFiles: 5 },
            { id: 'proyecto_decreto', name: 'PROYECTO DECRETO', type: 'file', maxFiles: 5 }
        ],
        proposiciones: [
            { id: 'fecha_ingreso_procepar', name: 'INGRESO PROCEPAR', type: 'date' },
            { id: 'fecha_pleno', name: 'FECHA PLENO', type: 'date' },
            { id: 'proposicion', name: 'PROPOSICIÓN', type: 'text', full: true },
            { id: 'resultado_votacion', name: 'VOTACIÓN', type: 'text' },
            { id: 'fecha_acuse_recibido_autoridad', name: 'ACUSE AUTORIDAD', type: 'date' },
            { id: 'fecha_respuesta_autoridad', name: 'RESPUESTA AUTORIDAD', type: 'date' },
            { id: 'tipo', name: 'TIPO', type: 'select', source: 'tipo' },
            { id: 'objetivo', name: 'OBJETIVO', type: 'text', full: true },
            { id: 'turnado_comision', name: 'TURNADO COMISIÓN', type: 'text' },
            { id: 'acuerdo', name: 'ACUERDO', type: 'file' },
            { id: 'respuesta_acuerdo', name: 'RESPUESTA ACUERDO', type: 'file' },
            { id: 'anotaciones', name: 'ANOTACIONES', type: 'text', full: true },
            { id: 'pdf_foto', name: 'ARCHIVO', type: 'file' }
        ],
        fiscalizacion: [
            { id: 'ano', name: 'AÑO', type: 'select', options: ['2024', '2025', '2026', '2027', '2028', '2029', '2030'] },
            { id: 'fecha_sesion', name: 'FECHA SESIÓN', type: 'date' },
            { id: 'dictamen_no', name: 'NO. DICTAMEN', type: 'text' },
            { id: 'dependencia', name: 'DEPENDENCIA / ORGANISMO', type: 'text', full: true },
            { id: 'observaciones', name: 'OBSERVACIONES', type: 'textarea', full: true },
            { id: 'dictamen', name: 'DICTAMEN', type: 'textarea', full: true },
            { id: 'voto_diputada', name: 'VOTO DIPUTADA', type: 'select', options: ['A FAVOR', 'EN CONTRA', 'NO VOTO'] },
            { id: 'voto_final', name: 'VOTO FINAL', type: 'text' },
            { id: 'fallo', name: 'FALLO', type: 'text' }
        ]
    };

    function escapeHTML(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function getItemValue(item, key) {
        if (!item) return '';
        if (item[key] !== undefined && item[key] !== null) return item[key];
        const upperKey = key.toUpperCase();
        if (item[upperKey] !== undefined && item[upperKey] !== null) return item[upperKey];
        const lowerKey = key.toLowerCase();
        if (item[lowerKey] !== undefined && item[lowerKey] !== null) return item[lowerKey];

        const aliases = {
            'ano': ['ano', 'AÑO', 'año', 'ejercicio', 'ANIO'],
            'fecha_sesion': ['fecha_sesion', 'FECHA_SESION', 'fecha', 'FECHA'],
            'dictamen_no': ['dictamen_no', 'DICTAMEN_NO', 'no_dictamen', 'NO_DICTAMEN', 'num_dictamen', 'numero_dictamen', 'num_dict'],
            'dependencia': ['dependencia', 'DEPENDENCIA', 'organismo', 'ORGANISMO', 'ente', 'ENTE'],
            'observaciones': ['observaciones', 'OBSERVACIONES', 'recomendaciones', 'RECOMENDACIONES'],
            'dictamen': ['dictamen', 'DICTAMEN', 'texto_dictamen', 'TEXTO_DICTAMEN', 'sentido', 'SENTIDO', 'resolucion', 'RESOLUCION'],
            'voto_diputada': ['voto_diputada', 'VOTO-DIPUTADA', 'voto-diputada', 'VOTO_DIPUTADA', 'voto', 'VOTO'],
            'voto_final': ['voto_final', 'VOTO_FINAL', 'VOTO-FINAL', 'voto-final', 'sentido_final'],
            'fallo': ['fallo', 'FALLO', 'resultado', 'RESULTADO'],
            'pdf': ['pdf', 'PDF', 'archivo', 'ARCHIVO', 'archivos', 'ARCHIVOS', 'PDF-Imagen']
        };

        if (aliases[key]) {
            for (let alt of aliases[key]) {
                if (item[alt] !== undefined && item[alt] !== null) return item[alt];
            }
        }
        return '';
    }

    function parseDate(str) {
        if (!str) return null;
        str = String(str).trim();
        if (/^\d{4}$/.test(str)) {
            return new Date(parseInt(str, 10), 0, 1);
        }
        if (str.includes('/')) {
            const parts = str.split('/');
            if (parts.length === 3) {
                const d = parseInt(parts[0], 10);
                const m = parseInt(parts[1], 10) - 1;
                const y = parseInt(parts[2], 10);
                const dt = new Date(y, m, d);
                return isNaN(dt.getTime()) ? null : dt;
            }
        } else if (str.includes('-')) {
            const parts = str.split('T')[0].split('-');
            if (parts.length === 3) {
                const y = parseInt(parts[0], 10);
                const m = parseInt(parts[1], 10) - 1;
                const d = parseInt(parts[2], 10);
                const dt = new Date(y, m, d);
                return isNaN(dt.getTime()) ? null : dt;
            }
        }
        const dt = new Date(str);
        return isNaN(dt.getTime()) ? null : dt;
    }

    function formatDateToYMD(date) {
        if (!date || isNaN(date.getTime())) return '';
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function initSupabase() {
        if (typeof supabase === 'undefined') return false;
        try {
            _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            return true;
        } catch (e) {
            return false;
        }
    }

    async function fetchAutorizados() {
        if (!_supabase && !initSupabase()) {
            console.error('Supabase no inicializado para fetchAutorizados');
            return;
        }
        try {
            console.log('Iniciando fetch de autorizados...');
            const { data, error } = await _supabase.from('autorizados').select('nombre');
            if (error) {
                console.error('Error en Supabase (autorizados):', error.message);
                return;
            }
            if (!data || data.length === 0) {
                console.warn('La tabla autorizados está vacía o no devolvió datos.');
                return;
            }
            autorizadosData = (data || []).map(d => d.nombre ? d.nombre.toString().toUpperCase().trim() : '').filter(Boolean);
            console.log('Autorizados cargados exitosamente:', autorizadosData);
        } catch (e) {
            console.error('Excepción crítica en fetchAutorizados:', e);
        }
    }

    async function fetchStatuses() {
        if (!_supabase && !initSupabase()) return;
        try {
            console.log('Iniciando fetch de estatus...');
            const { data, error } = await _supabase.from('status').select('status');
            if (error) {
                console.error('Error en Supabase (status):', error.message);
                return;
            }
            statusesData = (data || []).map(d => d.status ? d.status.toString().toUpperCase().trim() : '').filter(Boolean);
            console.log('Estatus cargados:', statusesData.length);
        } catch (e) {
            console.error('Excepción en fetchStatuses:', e);
        }
    }

    async function fetchTipos() {
        if (!_supabase && !initSupabase()) return;
        try {
            console.log('Iniciando fetch de tipos...');
            const { data, error } = await _supabase.from('tipo').select('tipo');
            if (error) {
                console.error('Error en Supabase (tipo):', error.message);
                return;
            }
            tiposData = (data || []).map(d => d.tipo ? d.tipo.toString().toUpperCase().trim() : '').filter(Boolean);
            console.log('Tipos cargados:', tiposData.length);
        } catch (e) {
            console.error('Excepción en fetchTipos:', e);
        }
    }

    async function initApp() {
        if (window._appInitialized) return;
        window._appInitialized = true;

        console.log('Iniciando aplicación...');
        if (!initSupabase()) return;

        // Cargamos nombres y datos en paralelo para velocidad
        await Promise.all([
            fetchAutorizados(),
            fetchStatuses(),
            fetchTipos(),
            checkSession() ? loadData() : Promise.resolve()
        ]);
    }

    function getTableName(section) {
        if (section === 'fiscalizacion') return 'fisca';
        return section;
    }

    async function loadData() {
        const grid = document.getElementById('dataGrid');
        if (grid) grid.innerHTML = '<div style="text-align: center; padding: 4rem;"><i class="bi bi-arrow-repeat spin" style="font-size: 2rem; color: var(--primary);"></i><p style="margin-top: 1rem; color: var(--text-muted);">Cargando registros...</p></div>';

        if (!_supabase && !initSupabase()) return;

        const tableName = getTableName(currentSection);
        let query = _supabase
            .from(tableName)
            .select('*')
            .order('id', { ascending: false });

        const { data, error } = await query;

        if (error) {
            console.error('Error:', error);
            if (grid) grid.innerHTML = `<div style="text-align: center; padding: 2rem; color: #ff4444;">Error de acceso a "${escapeHTML(currentSection)}": ${escapeHTML(error.message)}</div>`;
            return;
        }

        allData = data || [];

        if (currentSection === 'recibida' || currentSection === 'despachada' || currentSection === 'fiscalizacion') {
            const dateField = currentSection === 'recibida' ? 'Fecha_Recibido' : (currentSection === 'despachada' ? 'Fecha' : 'fecha_sesion');
            allData.sort((a, b) => {
                const rawDateA = getItemValue(a, dateField) || getItemValue(a, 'ano');
                const rawDateB = getItemValue(b, dateField) || getItemValue(b, 'ano');
                const dateA = parseDate(rawDateA)?.getTime() || 0;
                const dateB = parseDate(rawDateB)?.getTime() || 0;
                if (dateB === dateA) {
                    return (b.id || 0) - (a.id || 0);
                }
                return dateB - dateA;
            });
        }

        updateStats(allData);
        currentPage = 1;
        applyFiltersAndRender(true);
    }

    function updateStats(data) {
        const stats = document.querySelectorAll('.stat-count');
        if (!stats.length) return;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let thisMonthCount = 0;
        let pendientesCount = 0;
        let urgentesCount = 0;

        let dateField = '';
        if (currentSection === 'recibida') dateField = 'Fecha_Recibido';
        else if (currentSection === 'despachada') dateField = 'Fecha';
        else if (currentSection === 'iniciativas') dateField = 'fecha_oficio';
        else if (currentSection === 'proposiciones') dateField = 'fecha_ingreso_procepar';
        else if (currentSection === 'fiscalizacion') dateField = 'fecha_sesion';

        data.forEach(item => {
            // Este Mes logic
            const dateStr = getItemValue(item, dateField);
            if (dateStr) {
                const dt = parseDate(dateStr);
                if (dt && dt.getMonth() === currentMonth && dt.getFullYear() === currentYear) {
                    thisMonthCount++;
                }
            }

            // Pendientes / Urgentes logic (búsqueda genérica)
            let isPendiente = false;
            let isUrgente = false;

            const estatusVal = getItemValue(item, 'Estatus') || getItemValue(item, 'fallo') || '';
            if (estatusVal) {
                const estatus = String(estatusVal).toLowerCase();
                if (estatus.includes('pendiente') || estatus.includes('en contra') || estatus.includes('observaciones')) isPendiente = true;
                if (estatus.includes('urgente')) isUrgente = true;
            }

            if (!isPendiente || !isUrgente) {
                const allValues = Object.values(item).map(v => String(v).toLowerCase()).join(' ');
                if (!isPendiente && (allValues.includes('pendiente') || allValues.includes('en contra'))) isPendiente = true;
                if (!isUrgente && allValues.includes('urgente')) isUrgente = true;
            }

            if (isPendiente) pendientesCount++;
            if (isUrgente) urgentesCount++;
        });

        if (stats.length >= 1) stats[0].innerText = data.length.toLocaleString();
        if (stats.length >= 2) stats[1].innerText = thisMonthCount.toLocaleString();
        if (stats.length >= 3) stats[2].innerText = pendientesCount.toLocaleString();
        if (stats.length >= 4) stats[3].innerText = urgentesCount.toLocaleString();
    }

    function renderFileLinks(val) {
        if (!val) return '-';
        let urls = [];
        try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) urls = parsed;
            else if (typeof parsed === 'string') urls = [parsed];
        } catch (e) {
            urls = [val];
        }

        const validLinks = urls
            .filter(url => typeof url === 'string' && url.trim() !== '')
            .map((url, i) => {
                const safeUrl = encodeURI(url.trim());
                return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="file-link" title="Archivo ${i + 1}"><i class="bi bi-file-earmark-arrow-down"></i>${urls.length > 1 ? (i + 1) : ''}</a>`;
            });

        return validLinks.length > 0 ? validLinks.join(' ') : '-';
    }

    async function uploadFiles(files, limit = 10) {
        if (!files || files.length === 0) return null;
        const uploadPromises = Array.from(files).slice(0, limit).map(async (file) => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${currentSection}/${fileName}`;

            const { data, error } = await _supabase.storage
                .from('attachments')
                .upload(filePath, file);

            if (error) throw error;

            const { data: { publicUrl } } = _supabase.storage
                .from('attachments')
                .getPublicUrl(filePath);

            return publicUrl;
        });

        const urls = await Promise.all(uploadPromises);
        return JSON.stringify(urls);
    }

    function renderGrid() {
        const grid = document.getElementById('dataGrid');
        if (!grid) return;
        grid.innerHTML = '';

        const totalItems = currentFilteredData.length;
        const totalPages = Math.ceil(totalItems / pageSize) || 1;

        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        // Actualizar controles de paginación
        const pageInfo = document.getElementById('pageInfo');
        if (pageInfo) {
            pageInfo.innerText = totalItems > 0 
                ? `Página ${currentPage} de ${totalPages} (${totalItems} registros)` 
                : '0 registros';
        }

        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        if (prevBtn) prevBtn.disabled = (currentPage <= 1);
        if (nextBtn) nextBtn.disabled = (currentPage >= totalPages);

        if (totalItems === 0) {
            grid.innerHTML = '<div style="text-align: center; padding: 4rem; color: var(--text-muted);"><i class="bi bi-inbox" style="font-size: 3rem; display: block; margin-bottom: 1rem; opacity: 0.5;"></i>No se encontraron registros.</div>';
            return;
        }

        const startIndex = (currentPage - 1) * pageSize;
        const pageData = currentFilteredData.slice(startIndex, startIndex + pageSize);

        const table = document.createElement('table');
        table.className = 'data-table';

        // Table Header
        let headerHtml = '<thead><tr>';
        if (currentSection === 'fiscalizacion') {
            headerHtml += '<th style="width: 100px;">Acciones</th>';
            headerHtml += '<th style="width: 80px;">Año</th>';
            headerHtml += '<th style="width: 120px;">No. Dictamen</th>';
            headerHtml += '<th style="width: 130px;">Fecha Sesión</th>';
            headerHtml += '<th>Dependencia</th>';
            headerHtml += '<th style="width: 130px;">Voto Diputada</th>';
            headerHtml += '<th>Fallo</th>';
            headerHtml += '<th style="width: 130px;">Voto Final</th>';
        } else {
            headerHtml += '<th style="width: 110px;">Acciones</th>';
            headerHtml += '<th>Registro / Asunto</th>';
            headerHtml += `<th>${currentSection === 'recibida' ? 'RECIBIÓ' : 'Detalle Principal'}</th>`;
            headerHtml += '<th>Estado / Meta</th>';
            headerHtml += '<th>Archivo</th>';
        }
        headerHtml += '</tr></thead>';
        table.innerHTML = headerHtml;

        const tbody = document.createElement('tbody');
        pageData.forEach(item => {
            const tr = document.createElement('tr');
            const rowId = item.id;

            if (currentSection === 'fiscalizacion') {
                const ano = getItemValue(item, 'ano') || '2024';
                const dictamenNo = getItemValue(item, 'dictamen_no') || '—';
                const fechaSesion = getItemValue(item, 'fecha_sesion') || '—';
                const dependencia = getItemValue(item, 'dependencia') || 'Sin Dependencia';
                const fallo = getItemValue(item, 'fallo') || '—';
                
                let votoDiputada = getItemValue(item, 'voto_diputada');
                if (!votoDiputada && fallo) {
                    if (fallo.toUpperCase().includes('A FAVOR')) votoDiputada = 'A FAVOR';
                    else if (fallo.toUpperCase().includes('EN CONTRA')) votoDiputada = 'EN CONTRA';
                }
                if (!votoDiputada) votoDiputada = '—';

                let votoFinal = getItemValue(item, 'voto_final');
                if (!votoFinal && fallo) {
                    if (fallo.toUpperCase().includes('A FAVOR')) votoFinal = 'A FAVOR';
                    else if (fallo.toUpperCase().includes('EN CONTRA')) votoFinal = 'EN CONTRA';
                }
                if (!votoFinal) votoFinal = votoDiputada;

                const getBadge = (val) => {
                    const v = String(val).toUpperCase();
                    if (v.includes('FAVOR')) return `<span class="badge badge-success">${escapeHTML(val)}</span>`;
                    if (v.includes('CONTRA')) return `<span class="badge" style="background:#FEF3F2; color:#B42318;">${escapeHTML(val)}</span>`;
                    if (v.includes('NO VOTO') || v === 'NO VOTO') return `<span class="badge" style="background:#F2F4F7; color:#667085;">${escapeHTML(val)}</span>`;
                    if (v.includes('ABST')) return `<span class="badge badge-warning">${escapeHTML(val)}</span>`;
                    return `<span style="color: var(--text-muted);">${escapeHTML(val)}</span>`;
                };

                const initialLetter = escapeHTML((dependencia || '?')[0].toUpperCase());

                tr.innerHTML = `
                    <td class="action-cell" style="text-align: left; white-space: nowrap;">
                        <i class="bi bi-eye action-icon" onclick="viewEntry(${rowId})" title="Ver detalles"></i>
                        <i class="bi bi-pencil action-icon" onclick="editEntry(${rowId})" title="Editar"></i>
                        <i class="bi bi-trash action-icon" style="color: #D92D20;" onclick="deleteEntry(${rowId})" title="Eliminar"></i>
                    </td>
                    <td><span class="badge badge-info" style="font-weight: 600;">${escapeHTML(String(ano))}</span></td>
                    <td><span style="font-weight: 600; color: var(--primary);">${escapeHTML(dictamenNo)}</span></td>
                    <td><span style="color: var(--text-muted); font-size: 0.875rem;">${escapeHTML(fechaSesion)}</span></td>
                    <td>
                        <div class="row-item">
                            <div class="avatar">${initialLetter}</div>
                            <div class="item-main">
                                <span class="item-title" style="font-size: 0.875rem;">${escapeHTML(dependencia)}</span>
                            </div>
                        </div>
                    </td>
                    <td>${getBadge(votoDiputada)}</td>
                    <td><span style="font-size: 0.875rem; font-weight: 500;">${escapeHTML(fallo)}</span></td>
                    <td>${getBadge(votoFinal)}</td>
                `;
            } else {
                let titleVal = '';
                let subtitleVal = '';
                let detailVal = '';
                let metaHtml = '';
                let fileHtml = '';

                if (currentSection === 'recibida') {
                    titleVal = getItemValue(item, 'Remite');
                    subtitleVal = getItemValue(item, 'Asunto');
                    detailVal = getItemValue(item, 'Recibio') || 'N/A';
                    metaHtml = `<span class="badge badge-success">${escapeHTML(getItemValue(item, 'Fecha_Recibido') || 'FECHA')}</span>`;
                    fileHtml = renderFileLinks(getItemValue(item, 'PDF-Imagen'));
                }
                else if (currentSection === 'despachada') {
                    titleVal = getItemValue(item, 'Dirigido');
                    subtitleVal = getItemValue(item, 'Asunto');
                    detailVal = getItemValue(item, 'Elaboro') || 'N/A';
                    metaHtml = `<span class="badge badge-info">${escapeHTML(getItemValue(item, 'Estatus') || 'ENVIADO')}</span>`;
                    fileHtml = renderFileLinks(getItemValue(item, 'Archivos y multimedia'));
                }
                else if (currentSection === 'iniciativas') {
                    titleVal = `Iniciativa #${item.id || ''}`;
                    subtitleVal = getItemValue(item, 'texto') || getItemValue(item, 'INICIATIVA');
                    detailVal = getItemValue(item, 'comision') || 'SIN COMISIÓN';
                    metaHtml = `<span class="badge badge-warning">${escapeHTML(getItemValue(item, 'fecha_oficio') || 'OFICIO')}</span>`;
                    const inicFileFields = [
                        ['pdf', 'PDF'],
                        ['opinion_consultoria', 'OP. CONSULTORÍA'],
                        ['proyecto_dictamen', 'PROY. DICTAMEN'],
                        ['proyecto_decreto', 'PROY. DECRETO']
                    ];
                    const inicFiles = inicFileFields
                        .map(([f, label]) => {
                            const links = renderFileLinks(getItemValue(item, f));
                            const content = (links && links !== '-') ? links : '<span style="color:var(--text-muted)">—</span>';
                            return `<span class="inic-file"><small>${escapeHTML(label)}</small> ${content}</span>`;
                        })
                        .join(' ');
                    fileHtml = inicFiles;
                }
                else if (currentSection === 'proposiciones') {
                    titleVal = `Proposición #${item.id || ''}`;
                    subtitleVal = getItemValue(item, 'proposicion');
                    detailVal = getItemValue(item, 'tipo') || 'N/A';
                    metaHtml = `<span class="badge badge-info">${escapeHTML(getItemValue(item, 'fecha_pleno') || 'PLENO')}</span>`;
                    fileHtml = renderFileLinks(getItemValue(item, 'pdf_foto'));
                }

                const initialLetter = escapeHTML((titleVal || '?')[0].toUpperCase());

                tr.innerHTML = `
                    <td class="action-cell" style="text-align: left; white-space: nowrap;">
                        <i class="bi bi-eye action-icon" onclick="viewEntry(${rowId})" title="Ver detalles"></i>
                        <i class="bi bi-pencil action-icon" onclick="editEntry(${rowId})" title="Editar"></i>
                        <i class="bi bi-trash action-icon" style="color: #D92D20;" onclick="deleteEntry(${rowId})" title="Eliminar"></i>
                    </td>
                    <td>
                        <div class="row-item">
                            <div class="avatar">${initialLetter}</div>
                            <div class="item-main">
                                <span class="item-title">${escapeHTML(titleVal || 'Sin Título')}</span>
                                <span class="item-subtitle">${escapeHTML(subtitleVal || 'Sin descripción')}</span>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="item-subtitle">${escapeHTML(detailVal)}</span>
                    </td>
                    <td>
                        ${metaHtml}
                    </td>
                    <td>
                        ${fileHtml}
                    </td>
                `;
            }

            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        grid.appendChild(table);
    }

    function applyFiltersAndRender(resetPage = false) {
        let filtered = allData;

        const searchInput = document.getElementById('searchInput');
        const tableSearchInput = document.getElementById('tableSearchInput');
        const term = (searchInput?.value || tableSearchInput?.value || '').toLowerCase().trim();

        if (term) {
            filtered = filtered.filter(item => {
                return Object.values(item).some(val => String(val).toLowerCase().includes(term));
            });
        }

        const yearFilter = document.getElementById('yearFilter');
        if (yearFilter && yearFilter.value) {
            const y = String(yearFilter.value).trim();
            filtered = filtered.filter(item => {
                const itemYear = String(getItemValue(item, 'ano') || getItemValue(item, 'fecha_sesion') || getItemValue(item, 'fecha') || getItemValue(item, 'Fecha_Recibido') || '');
                return itemYear.includes(y);
            });
        }

        if (currentFilter === 'recientes') {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            
            let dateField = '';
            if (currentSection === 'recibida') dateField = 'Fecha_Recibido';
            else if (currentSection === 'despachada') dateField = 'Fecha';
            else if (currentSection === 'iniciativas') dateField = 'fecha_oficio';
            else if (currentSection === 'proposiciones') dateField = 'fecha_ingreso_procepar';
            else if (currentSection === 'fiscalizacion') dateField = 'fecha_sesion';

            filtered = filtered.filter(item => {
                const dateStr = getItemValue(item, dateField) || getItemValue(item, 'ano');
                if (!dateStr) return false;
                const itemDate = parseDate(dateStr);
                return itemDate && itemDate >= thirtyDaysAgo;
            });
        } else if (currentFilter === 'archivados') {
            filtered = filtered.filter(item => {
                const allValues = Object.values(item).map(v => String(v).toLowerCase()).join(' ');
                return allValues.includes('archivado') || allValues.includes('concluido') || allValues.includes('atendido') || allValues.includes('entregada') || allValues.includes('a favor');
            });
        }

        currentFilteredData = filtered;
        if (resetPage) currentPage = 1;
        renderGrid();
    }

    function switchSection(section) {
        currentSection = section;
        const titleElem = document.getElementById('sectionTitle');
        if (titleElem) {
            const sectionLabels = {
                'recibida': 'Recibida',
                'despachada': 'Despachada',
                'iniciativas': 'Iniciativas',
                'proposiciones': 'Proposiciones',
                'fiscalizacion': 'Fiscalización'
            };
            titleElem.innerText = sectionLabels[section] || (section.charAt(0).toUpperCase() + section.slice(1));
        }

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === section) item.classList.add('active');
        });

        currentFilter = 'todos';
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        const allBtn = Array.from(document.querySelectorAll('.filter-btn')).find(b => b.innerText.toLowerCase().includes('todos'));
        if (allBtn) allBtn.classList.add('active');

        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
        const tableSearchInput = document.getElementById('tableSearchInput');
        if (tableSearchInput) tableSearchInput.value = '';
        const yearFilter = document.getElementById('yearFilter');
        if (yearFilter) yearFilter.value = '';

        loadData();
    }

    window.viewEntry = function (id) {
        const item = allData.find(d => d.id === id);
        if (!item) return;

        let details = '';
        schemas[currentSection].forEach(field => {
            const val = getItemValue(item, field.id);
            const content = field.type === 'file' 
                ? renderFileLinks(val) 
                : escapeHTML(val || 'N/A');
            details += `
                <div class="form-group ${field.full ? 'full' : ''}">
                    <label>${escapeHTML(field.name)}</label>
                    <div style="padding: 0.625rem; background: #F9FAFB; border: 1px solid var(--border); border-radius: 8px; font-size: 0.875rem; word-break: break-word; white-space: pre-wrap;">
                        ${content}
                    </div>
                </div>
            `;
        });

        const overlay = document.getElementById('modalOverlay');
        const fields = document.getElementById('formFields');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('dataForm');

        title.innerText = "Detalles del Registro";
        fields.innerHTML = details;
        form.querySelector('button[type="submit"]').style.display = 'none';
        overlay.style.display = 'flex';
    };

    window.editEntry = function (id) {
        const item = allData.find(d => d.id === id);
        if (!item) return;
        openModal(true, item);
    };

    window.deleteEntry = async function (id) {
        if (!confirm('¿Estás seguro de que deseas borrar este registro?')) return;
        const tableName = getTableName(currentSection);
        const { error } = await _supabase.from(tableName).delete().eq('id', id);
        if (error) alert('Error al borrar: ' + error.message);
        else loadData();
    };

    window.openModal = function (isEdit = false, item = null) {
        const overlay = document.getElementById('modalOverlay');
        const fields = document.getElementById('formFields');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('dataForm');

        if (!overlay || !fields) return;

        currentEditId = isEdit ? item.id : null;
        title.innerText = isEdit ? "Editar Registro" : "Nuevo Registro";
        form.querySelector('button[type="submit"]').style.display = 'block';
        fields.innerHTML = '';

        schemas[currentSection].forEach(field => {
            const div = document.createElement('div');
            div.className = `form-group ${field.full ? 'full' : ''}`;
            const rawValue = isEdit ? getItemValue(item, field.id) : '';
            const safeValue = escapeHTML(rawValue);

            if (field.type === 'file') {
                const maxFiles = field.maxFiles || 10;
                div.innerHTML = `
                    <label>${escapeHTML(field.name)}</label>
                    <input type="file" name="${field.id}" accept="image/*,.pdf" multiple onchange="if(this.files.length>${maxFiles}){const dt=new DataTransfer();Array.from(this.files).slice(0,${maxFiles}).forEach(f=>dt.items.add(f));this.files=dt.files;alert('Solo se permiten hasta ${maxFiles} archivos. Se cargarán los primeros ${maxFiles}.');}">
                    ${isEdit && rawValue ? `<small style="margin-top:0.25rem; display:block; color:var(--text-muted)">Archivos actuales: ${renderFileLinks(rawValue)}</small>` : ''}
                    <small style="color:var(--text-muted); font-size: 0.75rem;">Máximo ${maxFiles} archivos (PDF, imágenes, etc.).</small>
                `;
            } else if (field.type === 'select') {
                const valTarget = String(rawValue || '').toUpperCase().trim();
                let sourceData = [];
                if (field.options && Array.isArray(field.options)) {
                    sourceData = field.options;
                } else if (field.source === 'status') {
                    sourceData = statusesData;
                } else if (field.source === 'tipo') {
                    sourceData = tiposData;
                } else {
                    sourceData = autorizadosData;
                }

                const options = sourceData.map(opt => {
                    const optUpper = String(opt).toUpperCase().trim();
                    const isSelected = (valTarget === optUpper) || 
                                       (valTarget.includes('FAVOR') && optUpper.includes('FAVOR')) ||
                                       (valTarget.includes('CONTRA') && optUpper.includes('CONTRA'));
                    return `<option value="${escapeHTML(opt)}" ${isSelected ? 'selected' : ''}>${escapeHTML(opt)}</option>`;
                }).join('');

                div.innerHTML = `
                    <label>${escapeHTML(field.name)}</label>
                    <select name="${field.id}">
                        <option value="">${(!field.options && sourceData.length === 0) ? 'CARGANDO LISTA...' : 'SELECCIONE...'}</option>
                        ${options}
                    </select>
                `;

                if (!field.options && sourceData.length === 0) {
                    let fetchMethod = fetchAutorizados;
                    if (field.source === 'status') fetchMethod = fetchStatuses;
                    else if (field.source === 'tipo') fetchMethod = fetchTipos;

                    fetchMethod().then(() => {
                        let currentData = autorizadosData;
                        if (field.source === 'status') currentData = statusesData;
                        else if (field.source === 'tipo') currentData = tiposData;

                        if (currentData.length > 0) {
                            const select = div.querySelector('select');
                            if (select) {
                                select.innerHTML = `<option value="">SELECCIONE...</option>` +
                                    currentData.map(opt => `<option value="${escapeHTML(opt)}" ${valTarget === opt ? 'selected' : ''}>${escapeHTML(opt)}</option>`).join('');
                            }
                        }
                    });
                }
            } else if (field.type === 'textarea') {
                div.innerHTML = `
                    <label>${escapeHTML(field.name)}</label>
                    <textarea name="${field.id}" placeholder="Ingresa ${escapeHTML(field.name.toLowerCase())}">${safeValue}</textarea>
                `;
            } else if (field.type === 'date' || field.type === 'time') {
                div.innerHTML = `
                    <label>${escapeHTML(field.name)}</label>
                    <input type="${field.type}" name="${field.id}" value="${safeValue}">
                `;
            } else {
                div.innerHTML = `
                    <label>${escapeHTML(field.name)}</label>
                    <input type="${field.type === 'email' ? 'email' : 'text'}" name="${field.id}" value="${safeValue}" 
                           placeholder="${field.readonly ? 'ID autogenerado' : 'Ingresa ' + escapeHTML(field.name.toLowerCase())}" 
                           ${field.readonly ? 'readonly' : ''}>
                `;
            }
            fields.appendChild(div);
        });

        overlay.style.display = 'flex';
    };

    window.closeModal = function () {
        const overlay = document.getElementById('modalOverlay');
        if (overlay) overlay.style.display = 'none';
        currentEditId = null;
    };

    window.exportDailyExcel = function () {
        if (!allData || allData.length === 0) {
            alert('No hay datos para exportar.');
            return;
        }

        let selectedDateStr = document.getElementById('exportDate').value;
        if (!selectedDateStr) {
            const today = new Date();
            selectedDateStr = formatDateToYMD(today);
        }

        let dateField = '';
        if (currentSection === 'recibida') dateField = 'Fecha_Recibido';
        else if (currentSection === 'despachada') dateField = 'Fecha';
        else if (currentSection === 'iniciativas') dateField = 'fecha_oficio';
        else if (currentSection === 'proposiciones') dateField = 'fecha_ingreso_procepar';
        else if (currentSection === 'fiscalizacion') dateField = 'fecha_sesion';

        const dailyData = allData.filter(item => {
            const itemDateStr = getItemValue(item, dateField) || getItemValue(item, 'ano');
            if (!itemDateStr) return false;
            const parsed = parseDate(itemDateStr);
            if (!parsed) {
                // If it's just year comparison or text
                return String(itemDateStr).includes(selectedDateStr) || String(itemDateStr) === selectedDateStr;
            }
            return formatDateToYMD(parsed) === selectedDateStr;
        });

        if (dailyData.length === 0) {
            alert(`No hay registros del día (${selectedDateStr}) en esta sección.`);
            return;
        }

        const exportData = dailyData.map(item => {
            const row = {};
            schemas[currentSection].forEach(field => {
                if (field.type !== 'file') {
                    row[field.name] = getItemValue(item, field.id) || '';
                }
            });
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reporte");

        XLSX.writeFile(wb, `Reporte_${currentSection}_${selectedDateStr}.xlsx`);
    };

    function checkSession() {
        const loggedUser = localStorage.getItem('loggedUser');
        const loggedUserRole = localStorage.getItem('loggedUserRole') || 'usuario';
        if (loggedUser) {
            document.getElementById('loginOverlay').style.display = 'none';
            document.querySelector('.user-name').innerText = loggedUser;
            document.querySelector('.user-role').innerText = (loggedUserRole === 'admin' || loggedUserRole === '1') ? 'Administrador' : 'Usuario';
            return true;
        }
        return false;
    }

    document.addEventListener('DOMContentLoaded', () => {
        // Set default date for export
        const dateInput = document.getElementById('exportDate');
        if (dateInput) {
            dateInput.value = formatDateToYMD(new Date());
        }

        // Paginación
        const prevPageBtn = document.getElementById('prevPageBtn');
        if (prevPageBtn) {
            prevPageBtn.onclick = () => {
                if (currentPage > 1) {
                    currentPage--;
                    renderGrid();
                }
            };
        }

        const nextPageBtn = document.getElementById('nextPageBtn');
        if (nextPageBtn) {
            nextPageBtn.onclick = () => {
                const totalPages = Math.ceil(currentFilteredData.length / pageSize) || 1;
                if (currentPage < totalPages) {
                    currentPage++;
                    renderGrid();
                }
            };
        }

        // Cerrar modal al dar click fuera o con Escape
        const modalOverlay = document.getElementById('modalOverlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) window.closeModal();
            });
        }
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') window.closeModal();
        });

        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.onsubmit = async (e) => {
                e.preventDefault();
                const user = document.getElementById('loginUser').value.trim();
                const pass = document.getElementById('loginPass').value;
                const errorMsg = document.getElementById('loginError');

                if (!_supabase && !initSupabase()) return;

                const { data, error } = await _supabase
                    .from('usuarios')
                    .select('*')
                    .eq('usuario', user)
                    .eq('contrasena', pass)
                    .single();

                if (data) {
                    localStorage.setItem('loggedUser', user.toUpperCase());
                    localStorage.setItem('loggedUserRole', data.rol ? String(data.rol).toLowerCase() : 'usuario');
                    document.getElementById('loginOverlay').style.display = 'none';
                    document.querySelector('.user-name').innerText = user.toUpperCase();
                    document.querySelector('.user-role').innerText = (String(data.rol) === 'admin' || String(data.rol) === '1') ? 'Administrador' : 'Usuario';
                    loadData();
                } else {
                    errorMsg.style.display = 'block';
                }
            };
        }

        const logoutBtn = document.querySelector('.btn-logout');
        if (logoutBtn) {
            logoutBtn.onclick = () => {
                if (confirm('¿CERRAR SESIÓN?')) {
                    localStorage.removeItem('loggedUser');
                    localStorage.removeItem('loggedUserRole');
                    location.reload();
                }
            };
        }

        // Mobile Sidebar Controls
        const menuToggle = document.getElementById('menuToggle');
        const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
        const sidebarBackdrop = document.getElementById('sidebarBackdrop');
        const sidebar = document.getElementById('sidebar');

        function openMobileSidebar() {
            if (sidebar) sidebar.classList.add('open');
            if (sidebarBackdrop) sidebarBackdrop.classList.add('active');
        }

        function closeMobileSidebar() {
            if (sidebar) sidebar.classList.remove('open');
            if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
        }

        if (menuToggle) menuToggle.onclick = openMobileSidebar;
        if (sidebarCloseBtn) sidebarCloseBtn.onclick = closeMobileSidebar;
        if (sidebarBackdrop) sidebarBackdrop.onclick = closeMobileSidebar;

        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.dataset.section) {
                item.onclick = function () {
                    closeMobileSidebar();
                    switchSection(this.dataset.section);
                };
            }
        });

        const searchInput = document.getElementById('searchInput');
        const tableSearchInput = document.getElementById('tableSearchInput');

        if (searchInput) {
            searchInput.oninput = (e) => {
                if (tableSearchInput) tableSearchInput.value = e.target.value;
                applyFiltersAndRender(true);
            };
        }

        if (tableSearchInput) {
            tableSearchInput.oninput = (e) => {
                if (searchInput) searchInput.value = e.target.value;
                applyFiltersAndRender(true);
            };
        }

        const yearFilter = document.getElementById('yearFilter');
        if (yearFilter) {
            yearFilter.onchange = () => applyFiltersAndRender(true);
        }

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.onclick = (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                const text = e.target.innerText.toLowerCase();
                if (text.includes('todos')) currentFilter = 'todos';
                else if (text.includes('recientes')) currentFilter = 'recientes';
                else if (text.includes('archivados')) currentFilter = 'archivados';

                applyFiltersAndRender(true);
            };
        });

        const dataForm = document.getElementById('dataForm');
        if (dataForm) {
            dataForm.addEventListener('input', (e) => {
                const target = e.target;
                const isText = (target.tagName === 'INPUT' && (!target.type || target.type === 'text')) || target.tagName === 'TEXTAREA';
                if (isText) {
                    const start = target.selectionStart;
                    const end = target.selectionEnd;
                    target.value = target.value.toUpperCase();
                    if (start !== null && end !== null) {
                        target.setSelectionRange(start, end);
                    }
                }
            });

            dataForm.onsubmit = async (e) => {
                e.preventDefault();
                const btn = e.target.querySelector('button[type="submit"]');
                const originalText = btn.innerText;
                btn.innerText = "Guardando...";
                btn.disabled = true;

                try {
                    const formData = new FormData(e.target);
                    const entry = {};

                    for (let fieldDef of schemas[currentSection]) {
                        const key = fieldDef.id;
                        if (fieldDef.readonly) continue; // Skip read-only fields from the payload

                        const input = e.target.querySelector(`[name="${key}"]`);

                        if (fieldDef.type === 'file') {
                            const maxFiles = fieldDef.maxFiles || 10;
                            const files = input ? input.files : null;
                            if (files && files.length > 0) {
                                const uploaded = await uploadFiles(files, maxFiles);
                                if (uploaded) {
                                    const newUrls = JSON.parse(uploaded);
                                    let existingUrls = [];
                                    if (currentEditId) {
                                        const existingItem = allData.find(d => d.id === currentEditId);
                                        const existingRaw = existingItem ? getItemValue(existingItem, key) : null;
                                        if (existingRaw) {
                                            try {
                                                existingUrls = JSON.parse(existingRaw);
                                                if (!Array.isArray(existingUrls)) existingUrls = [existingRaw];
                                            } catch (e) {
                                                existingUrls = [existingRaw];
                                            }
                                        }
                                    }
                                    const combined = existingUrls.concat(newUrls).slice(0, maxFiles);
                                    entry[key] = JSON.stringify(combined);
                                }
                            } else if (currentEditId) {
                                const existingItem = allData.find(d => d.id === currentEditId);
                                const existingVal = existingItem ? getItemValue(existingItem, key) : null;
                                if (existingVal) {
                                    entry[key] = existingVal;
                                }
                            }
                        } else {
                            const val = formData.get(key);
                            if (typeof val === 'string') {
                                const trimmed = val.trim();
                                if (fieldDef.type === 'email' || key.toLowerCase().includes('correo')) {
                                    entry[key] = trimmed.toLowerCase();
                                } else {
                                    entry[key] = trimmed.toUpperCase();
                                }
                            } else {
                                entry[key] = val;
                            }
                        }
                    }

                    if (!_supabase && !initSupabase()) return;

                    const tableName = getTableName(currentSection);
                    let result;
                    if (currentEditId) result = await _supabase.from(tableName).update(entry).eq('id', currentEditId);
                    else result = await _supabase.from(tableName).insert([entry]);

                    if (result.error) alert('Error al guardar: ' + result.error.message);
                    else {
                        window.closeModal();
                        loadData();
                    }
                } catch (err) {
                    alert('Error en la operación: ' + err.message);
                } finally {
                    btn.innerText = originalText;
                    btn.disabled = false;
                }
            };
        }

        initApp();
    });
})();
