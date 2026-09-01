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
    let pageSize = 20;
    let currentFilter = 'todos';
    let sortField = null;
    let sortDir = 'asc';
    const schemas = {
        recibida: [
            { id: 'Fecha_Recibido', name: 'FECHA RECIBIDO', type: 'date', required: true },
            { id: 'Remite', name: 'REMITE', type: 'text', full: true, required: true },
            { id: 'Asunto', name: 'ASUNTO', type: 'text', full: true, required: true },
            { id: 'Recibio', name: 'RECIBIÓ', type: 'select', source: 'autorizados' },
            { id: 'fecha_evento', name: 'FECHA EVENTO', type: 'date' },
            { id: 'HORA', name: 'HORA', type: 'time' },
            { id: 'Lugar', name: 'LUGAR', type: 'text', full: true },
            { id: 'TELEFONO', name: 'TELÉFONO', type: 'text' },
            { id: 'CORREO', name: 'CORREO', type: 'email' },
            { id: 'PDF-Imagen', name: 'ARCHIVO/PDF', type: 'file' }
        ],
        despachada: [
            { id: 'Fecha', name: 'FECHA', type: 'date', required: true },
            { id: 'Elaboro', name: 'ELABORÓ', type: 'select', source: 'autorizados' },
            { id: 'Dirigido', name: 'DIRIGIDO', type: 'text', required: true },
            { id: 'Asunto', name: 'ASUNTO', type: 'text', full: true, required: true },
            { id: 'Estatus', name: 'ESTATUS', type: 'select', source: 'status' },
            { id: 'Recibíó', name: 'RECIBIÓ', type: 'text' },
            { id: 'Fecha_recepcion', name: 'FECHA RECEPCIÓN', type: 'date' },
            { id: 'TELEFONO', name: 'TELÉFONO', type: 'text' },
            { id: 'CORREO', name: 'CORREO', type: 'email' },
            { id: 'Archivos y multimedia', name: 'ARCHIVOS', type: 'file' }
        ],
        iniciativas: [
            { id: 'fecha_oficio', name: 'FECHA OFICIO', type: 'date', required: true },
            { id: 'fecha_presentacion_oficialia', name: 'OFICIALIÁ', type: 'date' },
            { id: 'texto', name: 'INICIATIVA', type: 'text', full: true, required: true },
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
            { id: 'fecha_ingreso_procepar', name: 'INGRESO PROCEPAR', type: 'date', required: true },
            { id: 'fecha_pleno', name: 'FECHA PLENO', type: 'date' },
            { id: 'proposicion', name: 'PROPOSICIÓN', type: 'text', full: true, required: true },
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
            { id: 'ano', name: 'AÑO', type: 'select', options: ['2024', '2025', '2026', '2027', '2028', '2029', '2030'], required: true },
            { id: 'fecha_sesion', name: 'FECHA SESIÓN', type: 'date', required: true },
            { id: 'dictamen_no', name: 'NO. DICTAMEN', type: 'text', required: true },
            { id: 'dependencia', name: 'DEPENDENCIA / ORGANISMO', type: 'text', full: true, required: true },
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

    // Formatea cualquier cadena de fecha al formato dd-mm-aaaa para mostrar en pantalla y PDF
    function formatDateDMY(str) {
        if (!str) return '—';
        const dt = parseDate(String(str).trim());
        if (!dt || isNaN(dt.getTime())) return String(str).trim();
        const d = String(dt.getDate()).padStart(2, '0');
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const y = dt.getFullYear();
        return `${d}-${m}-${y}`;
    }

    // ================================================
    // TOAST NOTIFICATIONS
    // ================================================
    function showToast(message, type = 'info', duration = 4500) {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const icons = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' };
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<i class="bi ${icons[type] || icons.info}"></i><span>${escapeHTML(message)}</span>`;
        toast.onclick = () => dismissToast(toast);
        container.appendChild(toast);
        setTimeout(() => dismissToast(toast), duration);
    }
    function dismissToast(toast) {
        if (!toast.parentElement) return;
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }

    // ================================================
    // CUSTOM CONFIRM DIALOG (Promise-based)
    // ================================================
    function showConfirm(title, message, okLabel = 'Eliminar') {
        return new Promise(resolve => {
            const overlay = document.getElementById('confirmOverlay');
            if (!overlay) { resolve(window.confirm(message)); return; }
            document.getElementById('confirmTitle').textContent = title;
            document.getElementById('confirmMessage').textContent = message;
            document.getElementById('confirmOkBtn').textContent = okLabel;
            overlay.classList.add('active');
            const cleanup = (result) => {
                overlay.classList.remove('active');
                document.getElementById('confirmOkBtn').removeEventListener('click', handleOk);
                document.getElementById('confirmCancelBtn').removeEventListener('click', handleCancel);
                resolve(result);
            };
            const handleOk = () => cleanup(true);
            const handleCancel = () => cleanup(false);
            document.getElementById('confirmOkBtn').addEventListener('click', handleOk, { once: true });
            document.getElementById('confirmCancelBtn').addEventListener('click', handleCancel, { once: true });
        });
    }

    // ================================================
    // SEARCH HIGHLIGHTING
    // ================================================
    function highlightText(str, term) {
        if (!str) return '';
        const raw = String(str);
        if (!term || !term.trim()) return escapeHTML(raw);
        const safeTerm = term.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${safeTerm})`, 'gi');
        return raw.split(regex).map((part, i) =>
            i % 2 === 1 ? `<mark class="hl">${escapeHTML(part)}</mark>` : escapeHTML(part)
        ).join('');
    }

    // ================================================
    // SKELETON LOADER
    // ================================================
    function renderSkeletonGrid() {
        const grid = document.getElementById('dataGrid');
        if (!grid) return;
        const cols = currentSection === 'fiscalizacion' ? 9 : 5;
        const widths = [80, 100, 160, 200, 120, 100, 100, 100, 50];
        let html = '<table class="data-table"><tbody>';
        for (let r = 0; r < 8; r++) {
            html += '<tr class="skeleton-row">';
            for (let c = 0; c < cols; c++) {
                const w = widths[c] || 120;
                html += `<td><span class="skeleton skeleton-cell" style="width:${w}px;"></span></td>`;
            }
            html += '</tr>';
        }
        html += '</tbody></table>';
        grid.innerHTML = html;
    }

    // ================================================
    // SORTING
    // ================================================
    function applySortToData(data) {
        if (!sortField) return data;
        let field = sortField;
        if (field === '_title') {
            if (currentSection === 'recibida') field = 'Remite';
            else if (currentSection === 'despachada') field = 'Dirigido';
            else if (currentSection === 'iniciativas') field = 'texto';
            else if (currentSection === 'proposiciones') field = 'proposicion';
        }
        return [...data].sort((a, b) => {
            let vA = String(getItemValue(a, field) || '');
            let vB = String(getItemValue(b, field) || '');
            const dA = parseDate(vA), dB = parseDate(vB);
            if (dA && dB && !isNaN(dA) && !isNaN(dB)) return sortDir === 'asc' ? dA - dB : dB - dA;
            const cmp = vA.localeCompare(vB, 'es', { numeric: true, sensitivity: 'base' });
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }

    window.sortBy = function(field) {
        sortField = (sortField === field && sortDir === 'desc') ? null : field;
        if (sortField) sortDir = (sortField === field && sortDir === 'asc') ? 'desc' : 'asc';
        renderGrid();
    };

    // ================================================
    // DYNAMIC YEAR FILTER
    // ================================================
    function populateYearFilter(data) {
        const yearFilter = document.getElementById('yearFilter');
        if (!yearFilter) return;
        const years = new Set();
        data.forEach(item => {
            const candidates = ['ano', 'fecha_sesion', 'Fecha_Recibido', 'Fecha', 'fecha_oficio', 'fecha_ingreso_procepar'];
            for (const f of candidates) {
                const v = String(getItemValue(item, f) || '');
                if (!v) continue;
                if (/^\d{4}$/.test(v)) { years.add(parseInt(v)); break; }
                const dt = parseDate(v);
                if (dt && !isNaN(dt)) { years.add(dt.getFullYear()); break; }
            }
        });
        const currentVal = yearFilter.value;
        const sorted = [...years].sort((a, b) => b - a);
        yearFilter.innerHTML = '<option value="">Todos los Años</option>' +
            sorted.map(y => `<option value="${y}"${String(y) === currentVal ? ' selected' : ''}>${y}</option>`).join('');
    }

    // ================================================
    // DARK MODE
    // ================================================
    window.toggleDarkMode = function() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark ? '1' : '0');
        const btn = document.getElementById('darkModeBtn');
        if (btn) btn.innerHTML = isDark ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon"></i>';
    };

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
        renderSkeletonGrid();

        if (!_supabase && !initSupabase()) return;

        const tableName = getTableName(currentSection);
        let query = _supabase
            .from(tableName)
            .select('*')
            .order('id', { ascending: false });

        const { data, error } = await query;

        if (error) {
            console.error('Error:', error);
            const grid = document.getElementById('dataGrid');
            if (grid) grid.innerHTML = `<div style="text-align: center; padding: 2rem; color: #ff4444;">Error de acceso a "${escapeHTML(currentSection)}": ${escapeHTML(error.message)}</div>`;
            showToast(`Error al cargar datos: ${error.message}`, 'error');
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

        populateYearFilter(allData);
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

        const searchInput = document.getElementById('searchInput');
        const tableSearchInput = document.getElementById('tableSearchInput');
        const activeSearchTerm = (searchInput?.value || tableSearchInput?.value || '').trim();

        const sortedData = applySortToData(currentFilteredData);
        const totalItems = sortedData.length;
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
        const pageData = sortedData.slice(startIndex, startIndex + pageSize);

        const table = document.createElement('table');
        table.className = 'data-table';

        const getSortHeader = (fieldKey, label, widthStyle = '') => {
            const isSorted = sortField === fieldKey;
            const iconClass = isSorted 
                ? (sortDir === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down') 
                : 'bi-arrow-down-up';
            const sortClass = isSorted ? `sort-${sortDir}` : '';
            return `<th class="sortable ${sortClass}" style="${widthStyle}" onclick="sortBy('${fieldKey}')" title="Ordenar por ${escapeHTML(label)}">
                ${escapeHTML(label)} <i class="bi ${iconClass} sort-icon"></i>
            </th>`;
        };

        // Table Header
        let headerHtml = '<thead><tr>';
        if (currentSection === 'fiscalizacion') {
            headerHtml += '<th style="width: 100px;">Acciones</th>';
            headerHtml += getSortHeader('ano', 'Año', 'width: 80px;');
            headerHtml += getSortHeader('dictamen_no', 'No. Dictamen', 'width: 120px;');
            headerHtml += getSortHeader('fecha_sesion', 'Fecha Sesión', 'width: 130px;');
            headerHtml += getSortHeader('dependencia', 'Dependencia');
            headerHtml += getSortHeader('voto_diputada', 'Voto Diputada', 'width: 130px;');
            headerHtml += getSortHeader('fallo', 'Fallo');
            headerHtml += getSortHeader('voto_final', 'Voto Final', 'width: 130px;');
            headerHtml += '<th style="width: 50px;">Ficha</th>';
        } else {
            headerHtml += '<th style="width: 110px;">Acciones</th>';
            headerHtml += getSortHeader('_title', 'Registro / Asunto');
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
                const fechaSesion = formatDateDMY(getItemValue(item, 'fecha_sesion'));
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
                        <i class="bi bi-file-pdf action-icon-pdf" onclick="viewPDF(${rowId})" title="Ficha PDF"></i>
                    </td>
                    <td><span class="badge badge-info" style="font-weight: 600;">${highlightText(String(ano), activeSearchTerm)}</span></td>
                    <td><span style="font-weight: 600; color: var(--primary);">${highlightText(dictamenNo, activeSearchTerm)}</span></td>
                    <td><span style="color: var(--text-muted); font-size: 0.875rem;">${escapeHTML(fechaSesion)}</span></td>
                    <td>
                        <div class="row-item">
                            <div class="avatar">${initialLetter}</div>
                            <div class="item-main">
                                <span class="item-title" style="font-size: 0.875rem;">${highlightText(dependencia, activeSearchTerm)}</span>
                            </div>
                        </div>
                    </td>
                    <td>${getBadge(votoDiputada)}</td>
                    <td><span style="font-size: 0.875rem; font-weight: 500;">${highlightText(fallo, activeSearchTerm)}</span></td>
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
                    metaHtml = `<span class="badge badge-success">${escapeHTML(formatDateDMY(getItemValue(item, 'Fecha_Recibido')) || 'FECHA')}</span>`;
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
                    metaHtml = `<span class="badge badge-warning">${escapeHTML(formatDateDMY(getItemValue(item, 'fecha_oficio')) || 'OFICIO')}</span>`;
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
                    metaHtml = `<span class="badge badge-info">${escapeHTML(formatDateDMY(getItemValue(item, 'fecha_pleno')) || 'PLENO')}</span>`;
                    fileHtml = renderFileLinks(getItemValue(item, 'pdf_foto'));
                }

                const initialLetter = escapeHTML((titleVal || '?')[0].toUpperCase());

                tr.innerHTML = `
                    <td class="action-cell" style="text-align: left; white-space: nowrap;">
                        <i class="bi bi-eye action-icon" onclick="viewEntry(${rowId})" title="Ver detalles"></i>
                        <i class="bi bi-pencil action-icon" onclick="editEntry(${rowId})" title="Editar"></i>
                        <i class="bi bi-trash action-icon" style="color: #D92D20;" onclick="deleteEntry(${rowId})" title="Eliminar"></i>
                        <i class="bi bi-file-pdf action-icon-pdf" onclick="viewPDF(${rowId})" title="Ficha PDF"></i>
                    </td>
                    <td>
                        <div class="row-item">
                            <div class="avatar">${initialLetter}</div>
                            <div class="item-main">
                                <span class="item-title">${highlightText(titleVal || 'Sin Título', activeSearchTerm)}</span>
                                <span class="item-subtitle">${highlightText(subtitleVal || 'Sin descripción', activeSearchTerm)}</span>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="item-subtitle">${highlightText(detailVal, activeSearchTerm)}</span>
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

        const btnFichaPDF = document.getElementById('btnFichaPDF');
        if (btnFichaPDF) {
            btnFichaPDF.style.display = section === 'fiscalizacion' ? 'inline-flex' : 'none';
        }

        loadData();
    }

    window.viewEntry = function (id) {
        const item = allData.find(d => d.id === id);
        if (!item) return;

        let details = '';
        schemas[currentSection].forEach(field => {
            const val = getItemValue(item, field.id);
            let content;
            if (field.type === 'file') {
                content = renderFileLinks(val);
            } else if (field.type === 'date') {
                content = escapeHTML(formatDateDMY(val) || 'N/A');
            } else {
                content = escapeHTML(val || 'N/A');
            }
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
        const cancelBtn = form.querySelector('button[type="button"]');

        title.innerText = "Detalles del Registro";
        fields.innerHTML = details;
        form.querySelector('button[type="submit"]').style.display = 'none';
        if (cancelBtn) cancelBtn.innerText = 'Cerrar';
        overlay.style.display = 'flex';
    };

    window.editEntry = function (id) {
        const item = allData.find(d => d.id === id);
        if (!item) return;
        openModal(true, item);
    };

    window.deleteEntry = async function (id) {
        const confirmed = await showConfirm(
            'Eliminar Registro',
            '¿Estás seguro de que deseas borrar este registro? Esta acción no se puede deshacer.',
            'Eliminar'
        );
        if (!confirmed) return;

        const tableName = getTableName(currentSection);
        const { error } = await _supabase.from(tableName).delete().eq('id', id);
        if (error) {
            showToast('Error al borrar: ' + error.message, 'error');
        } else {
            showToast('Registro eliminado exitosamente', 'success');
            loadData();
        }
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
        // Restaurar el texto del botón cancelar (puede haber sido cambiado por viewEntry)
        const cancelBtn = form.querySelector('button[type="button"]');
        if (cancelBtn) cancelBtn.innerText = 'Cancelar';
        fields.innerHTML = '';

        // Limpiar errores previos
        form.querySelectorAll('.field-error').forEach(el => el.remove());
        form.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));

        schemas[currentSection].forEach(field => {
            const div = document.createElement('div');
            div.className = `form-group ${field.full ? 'full' : ''}`;
            const rawValue = isEdit ? getItemValue(item, field.id) : '';
            const safeValue = escapeHTML(rawValue);
            const reqStar = field.required ? '<span class="required-star" title="Obligatorio">*</span>' : '';

            // Para inputs de fecha, normalizar al formato yyyy-MM-dd que requiere <input type="date">
            let dateValue = '';
            if (field.type === 'date' && rawValue) {
                const dt = parseDate(String(rawValue).trim());
                if (dt && !isNaN(dt.getTime())) {
                    dateValue = formatDateToYMD(dt);
                } else {
                    dateValue = rawValue; // dejar como está si no se puede parsear
                }
            }

            if (field.type === 'file') {
                const maxFiles = field.maxFiles || 10;
                div.innerHTML = `
                    <label>${escapeHTML(field.name)} ${reqStar}</label>
                    <input type="file" name="${field.id}" accept="image/*,.pdf" multiple onchange="if(this.files.length>${maxFiles}){const dt=new DataTransfer();Array.from(this.files).slice(0,${maxFiles}).forEach(f=>dt.items.add(f));this.files=dt.files;showToast('Solo se permiten hasta ${maxFiles} archivos. Se cargarán los primeros ${maxFiles}.', 'warning');}">
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
                    <label>${escapeHTML(field.name)} ${reqStar}</label>
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
                    <label>${escapeHTML(field.name)} ${reqStar}</label>
                    <textarea name="${field.id}" placeholder="Ingresa ${escapeHTML(field.name.toLowerCase())}">${safeValue}</textarea>
                `;
            } else if (field.type === 'date' || field.type === 'time') {
                const inputVal = field.type === 'date' ? escapeHTML(dateValue) : safeValue;
                div.innerHTML = `
                    <label>${escapeHTML(field.name)} ${reqStar}</label>
                    <input type="${field.type}" name="${field.id}" value="${inputVal}">
                `;
            } else {
                div.innerHTML = `
                    <label>${escapeHTML(field.name)} ${reqStar}</label>
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
            showToast('No hay datos para exportar.', 'warning');
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

        let exportSubset = allData.filter(item => {
            const itemDateStr = getItemValue(item, dateField) || getItemValue(item, 'ano');
            if (!itemDateStr) return false;
            const parsed = parseDate(itemDateStr);
            if (!parsed) {
                return String(itemDateStr).includes(selectedDateStr) || String(itemDateStr) === selectedDateStr;
            }
            return formatDateToYMD(parsed) === selectedDateStr;
        });

        if (exportSubset.length === 0) {
            // Si no hay registros de esa fecha exacta, exportamos la vista filtrada actual
            exportSubset = currentFilteredData.length > 0 ? currentFilteredData : allData;
            showToast(`Exportando ${exportSubset.length} registros de la vista actual`, 'info');
        } else {
            showToast(`Exportando ${exportSubset.length} registros del día ${selectedDateStr}`, 'success');
        }

        const exportData = exportSubset.map(item => {
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

    let currentPdfDoc = null;
    let currentPdfFilename = 'Ficha.pdf';

    window.downloadCurrentPdf = function () {
        if (currentPdfDoc) {
            currentPdfDoc.save(currentPdfFilename);
        }
    };

    window.closePdfPreview = function () {
        const overlay = document.getElementById('pdfPreviewOverlay');
        if (overlay) overlay.style.display = 'none';
        const iframe = document.getElementById('pdfPreviewIframe');
        if (iframe) iframe.src = 'about:blank';
        currentPdfDoc = null;
    };

    function renderFichaPage(doc, item, section, isBatch, currentIdx, totalCount) {
        const pageWidth = 215.9; // Letter width in mm
        const pageHeight = 279.4; // Letter height in mm
        const margin = 12;
        const contentWidth = pageWidth - margin * 2; // 191.9 mm

        // 1. Top Header Banner
        doc.setFillColor(14, 55, 215); // #0e37d7
        doc.rect(0, 0, pageWidth, 12.5, 'F');
        doc.setFillColor(10, 40, 159); // #0a289f
        doc.rect(0, 12.5, pageWidth, 1.5, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11.5);
        
        let mainTitle = 'FICHA EJECUTIVA DE ' + section.toUpperCase();
        if (section === 'fiscalizacion') mainTitle = 'FICHA EJECUTIVA DE FISCALIZACIÓN';
        if (isBatch) mainTitle += ` (${currentIdx} de ${totalCount})`;
        
        doc.text(mainTitle, pageWidth / 2, 8.5, { align: 'center' });

        let y = 17;

        if (section === 'fiscalizacion') {
            const ano = String(getItemValue(item, 'ano') || '2024');
            const dictamenNo = String(getItemValue(item, 'dictamen_no') || '—');
            const fechaSesion = formatDateDMY(getItemValue(item, 'fecha_sesion'));
            const dependencia = String(getItemValue(item, 'dependencia') || 'Sin Dependencia');
            const votoDip = String(getItemValue(item, 'voto_diputada') || '—');
            const votoFin = String(getItemValue(item, 'voto_final') || '—');
            const fallo = String(getItemValue(item, 'fallo') || '—');
            const obs = String(getItemValue(item, 'observaciones') || 'Sin observaciones.');
            const dict = String(getItemValue(item, 'dictamen') || 'Sin dictamen.');

            // Top Metadata Card (2 rows)
            const cardH = 27;
            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.3);
            doc.roundedRect(margin, y, contentWidth, cardH, 2, 2, 'FD');

            // Row 1
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6.5);
            doc.setTextColor(100, 116, 139);
            doc.text('NO. DICTAMEN', margin + 3.5, y + 4.2);
            doc.setFontSize(9.5);
            doc.setTextColor(14, 55, 215);
            doc.text(dictamenNo, margin + 3.5, y + 9.2);

            doc.setFontSize(6.5);
            doc.setTextColor(100, 116, 139);
            doc.text('AÑO', margin + 32, y + 4.2);
            doc.setFontSize(8.5);
            doc.setTextColor(30, 41, 59);
            doc.text(ano, margin + 32, y + 9.2);

            doc.setFontSize(6.5);
            doc.setTextColor(100, 116, 139);
            doc.text('FECHA SESIÓN', margin + 52, y + 4.2);
            doc.setFontSize(8.5);
            doc.setTextColor(30, 41, 59);
            doc.text(fechaSesion, margin + 52, y + 9.2);

            doc.setFontSize(6.5);
            doc.setTextColor(100, 116, 139);
            doc.text('DEPENDENCIA / ORGANISMO', margin + 84, y + 4.2);
            doc.setFontSize(8);
            doc.setTextColor(30, 41, 59);
            const depLines = doc.splitTextToSize(dependencia, contentWidth - 86);
            doc.text(depLines, margin + 84, y + 9.2);

            // Divider between rows
            doc.setDrawColor(226, 232, 240);
            doc.line(margin + 2, y + 13.5, margin + contentWidth - 2, y + 13.5);

            // Row 2
            doc.setFontSize(6.5);
            doc.setTextColor(100, 116, 139);
            doc.text('VOTO DIPUTADA', margin + 3.5, y + 17.5);
            doc.setFontSize(8);
            if (votoDip.toUpperCase().includes('FAVOR')) doc.setTextColor(18, 183, 106);
            else if (votoDip.toUpperCase().includes('CONTRA')) doc.setTextColor(240, 68, 56);
            else doc.setTextColor(30, 41, 59);
            doc.text(votoDip, margin + 3.5, y + 23);

            doc.setFontSize(6.5);
            doc.setTextColor(100, 116, 139);
            doc.text('VOTO FINAL', margin + 52, y + 17.5);
            doc.setFontSize(8);
            if (votoFin.toUpperCase().includes('FAVOR')) doc.setTextColor(18, 183, 106);
            else if (votoFin.toUpperCase().includes('CONTRA')) doc.setTextColor(240, 68, 56);
            else doc.setTextColor(30, 41, 59);
            doc.text(votoFin, margin + 52, y + 23);

            doc.setFontSize(6.5);
            doc.setTextColor(100, 116, 139);
            doc.text('FALLO', margin + 84, y + 17.5);
            doc.setFontSize(8);
            doc.setTextColor(30, 41, 59);
            const falloLines = doc.splitTextToSize(fallo, contentWidth - 86);
            doc.text(falloLines, margin + 84, y + 23);

            y += cardH + 3.5;

            // Auto-fit calculation for Observaciones and Dictamen
            const maxBottomY = 269;
            const availableHeight = maxBottomY - y; // ~220 mm

            let fontSize = 7.5;
            let lineHeight = 3.3;
            let padding = 2.5;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(fontSize);
            let obsLines = doc.splitTextToSize(obs, contentWidth - (padding * 2));
            let dictLines = doc.splitTextToSize(dict, contentWidth - (padding * 2));
            let totalNeeded = (obsLines.length + dictLines.length) * lineHeight + 22;

            if (totalNeeded > availableHeight) {
                fontSize = 7.0;
                lineHeight = 3.0;
                doc.setFontSize(fontSize);
                obsLines = doc.splitTextToSize(obs, contentWidth - (padding * 2));
                dictLines = doc.splitTextToSize(dict, contentWidth - (padding * 2));
                totalNeeded = (obsLines.length + dictLines.length) * lineHeight + 20;
            }

            if (totalNeeded > availableHeight) {
                fontSize = 6.5;
                lineHeight = 2.75;
                doc.setFontSize(fontSize);
                obsLines = doc.splitTextToSize(obs, contentWidth - (padding * 2));
                dictLines = doc.splitTextToSize(dict, contentWidth - (padding * 2));
                totalNeeded = (obsLines.length + dictLines.length) * lineHeight + 18;
            }

            if (totalNeeded > availableHeight) {
                fontSize = 6.0;
                lineHeight = 2.5;
                doc.setFontSize(fontSize);
                obsLines = doc.splitTextToSize(obs, contentWidth - (padding * 2));
                dictLines = doc.splitTextToSize(dict, contentWidth - (padding * 2));
            }

            // Section 1: Observaciones
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(30, 41, 59);
            doc.setFillColor(14, 55, 215);
            doc.rect(margin, y, 2.2, 4.2, 'F');
            doc.text('OBSERVACIONES', margin + 4.5, y + 3.5);
            y += 5.5;

            const obsBoxH = (obsLines.length * lineHeight) + (padding * 2);
            doc.setFillColor(252, 252, 253);
            doc.setDrawColor(234, 236, 240);
            doc.setLineWidth(0.25);
            doc.roundedRect(margin, y, contentWidth, obsBoxH, 1.5, 1.5, 'FD');

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(fontSize);
            doc.setTextColor(51, 65, 85);
            doc.text(obsLines, margin + padding, y + padding + (fontSize * 0.28));

            y += obsBoxH + 3.5;

            // Section 2: Dictamen
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(30, 41, 59);
            doc.setFillColor(14, 55, 215);
            doc.rect(margin, y, 2.2, 4.2, 'F');
            doc.text('DICTAMEN', margin + 4.5, y + 3.5);
            y += 5.5;

            const dictBoxH = Math.min((dictLines.length * lineHeight) + (padding * 2), maxBottomY - y);
            doc.setFillColor(252, 252, 253);
            doc.setDrawColor(234, 236, 240);
            doc.setLineWidth(0.25);
            doc.roundedRect(margin, y, contentWidth, dictBoxH, 1.5, 1.5, 'FD');

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(fontSize);
            doc.setTextColor(51, 65, 85);
            doc.text(dictLines, margin + padding, y + padding + (fontSize * 0.28));

        } else {
            // Other sections (Recibida, Despachada, Iniciativas, Proposiciones)
            const fields = (schemas[section] || []).filter(f => f.type !== 'file');
            
            const cardH = 14;
            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.3);
            doc.roundedRect(margin, y, contentWidth, cardH, 2, 2, 'FD');

            const regId = item.id ? `ID #${item.id}` : 'REGISTRO';
            const fechaRec = formatDateDMY(getItemValue(item, 'Fecha_Recibido') || getItemValue(item, 'Fecha') || getItemValue(item, 'fecha_oficio') || getItemValue(item, 'fecha_ingreso_procepar'));

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6.5);
            doc.setTextColor(100, 116, 139);
            doc.text('IDENTIFICADOR', margin + 3.5, y + 4.2);
            doc.setFontSize(9);
            doc.setTextColor(14, 55, 215);
            doc.text(String(regId), margin + 3.5, y + 9.5);

            doc.setFontSize(6.5);
            doc.setTextColor(100, 116, 139);
            doc.text('FECHA PRINCIPAL', margin + 45, y + 4.2);
            doc.setFontSize(8.5);
            doc.setTextColor(30, 41, 59);
            doc.text(String(fechaRec), margin + 45, y + 9.5);

            y += cardH + 4;

            const maxBottomY = 269;
            const availableHeight = maxBottomY - y;
            let fontSize = 7.5;
            let lineHeight = 3.3;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(fontSize);

            let totalLines = 0;
            fields.forEach(f => {
                let val = String(getItemValue(item, f.id) || '—');
                const lines = doc.splitTextToSize(val, contentWidth - 45);
                totalLines += Math.max(lines.length, 1);
            });

            if ((totalLines * lineHeight) + (fields.length * 3.5) > availableHeight) {
                fontSize = 7.0;
                lineHeight = 3.0;
            }
            if ((totalLines * lineHeight) + (fields.length * 3.5) > availableHeight) {
                fontSize = 6.5;
                lineHeight = 2.75;
            }

            fields.forEach(field => {
                const label = field.name;
                let value = String(getItemValue(item, field.id) || '—');
                const labelWidth = 42;
                const valueWidth = contentWidth - labelWidth - 4;

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(7);
                doc.setTextColor(100, 116, 139);
                doc.text(label, margin, y + 2.5);

                doc.setDrawColor(234, 236, 240);
                doc.setLineWidth(0.2);
                doc.line(margin, y + 4.5, margin + labelWidth - 2, y + 4.5);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(fontSize);
                doc.setTextColor(30, 41, 59);

                const lines = doc.splitTextToSize(value, valueWidth);
                doc.text(lines, margin + labelWidth + 2, y + 2.5);

                const blockH = Math.max(lines.length * lineHeight, 4.5) + 2.5;
                y += blockH;
            });
        }

        // Single Page Footer (strictly at bottom of Letter page)
        doc.setFillColor(248, 250, 252);
        doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');
        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')} - Correspondencia Mayola Gaona`, margin, pageHeight - 3);
        const pageLabel = isBatch ? `Página ${currentIdx} de ${totalCount}` : 'Página 1 de 1';
        doc.text(pageLabel, pageWidth - margin, pageHeight - 3, { align: 'right' });
    }

    window.viewPDF = function (id) {
        const item = allData.find(function (d) { return d.id === id; });
        if (!item) return;
        if (!window.jspdf || !window.jspdf.jsPDF) {
            alert('Librería jsPDF no disponible. Por favor verifique su conexión a internet.');
            return;
        }

        const { jsPDF } = window.jspdf;
        // Letter vertical (portrait)
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

        renderFichaPage(doc, item, currentSection, false, 1, 1);

        const safeDep = String(getItemValue(item, 'dependencia') || getItemValue(item, 'Remite') || getItemValue(item, 'Dirigido') || 'Ficha').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
        const safeDict = String(getItemValue(item, 'dictamen_no') || item.id || '').replace(/[^a-zA-Z0-9_-]/g, '_');
        currentPdfFilename = `Ficha_${currentSection}_${safeDep}_${safeDict}.pdf`;
        currentPdfDoc = doc;

        const pdfDataUri = doc.output('datauristring');
        const overlay = document.getElementById('pdfPreviewOverlay');
        const iframe = document.getElementById('pdfPreviewIframe');
        const titleSpan = document.getElementById('pdfPreviewTitle');

        if (titleSpan) {
            titleSpan.innerText = `Previsualización: ${currentPdfFilename}`;
        }

        if (overlay && iframe) {
            iframe.src = pdfDataUri;
            overlay.style.display = 'flex';
        } else {
            doc.save(currentPdfFilename);
        }
    };

    window.exportFichaPDF = function () {
        if (!currentFilteredData || currentFilteredData.length === 0) {
            alert('No hay datos en la vista actual para generar la ficha.');
            return;
        }
        if (!window.jspdf || !window.jspdf.jsPDF) {
            alert('Librería jsPDF no disponible. Por favor verifique su conexión a internet.');
            return;
        }

        const { jsPDF } = window.jspdf;
        // Letter vertical (portrait)
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
        const total = currentFilteredData.length;

        currentFilteredData.forEach(function (item, idx) {
            if (idx > 0) doc.addPage('letter', 'portrait');
            renderFichaPage(doc, item, currentSection, true, idx + 1, total);
        });

        currentPdfFilename = `Fichas_${currentSection}_${new Date().toISOString().slice(0, 10)}.pdf`;
        currentPdfDoc = doc;

        const pdfDataUri = doc.output('datauristring');
        const overlay = document.getElementById('pdfPreviewOverlay');
        const iframe = document.getElementById('pdfPreviewIframe');
        const titleSpan = document.getElementById('pdfPreviewTitle');

        if (titleSpan) {
            titleSpan.innerText = `Previsualización: ${currentPdfFilename} (${total} páginas/registros)`;
        }

        if (overlay && iframe) {
            iframe.src = pdfDataUri;
            overlay.style.display = 'flex';
        } else {
            doc.save(currentPdfFilename);
        }
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

        // Selector de tamaño de página
        const pageSizeSelect = document.getElementById('pageSizeSelect');
        if (pageSizeSelect) {
            pageSizeSelect.onchange = (e) => {
                pageSize = parseInt(e.target.value, 10) || 20;
                currentPage = 1;
                renderGrid();
            };
        }

        // Restaurar modo oscuro guardado
        if (localStorage.getItem('darkMode') === '1') {
            document.body.classList.add('dark-mode');
            const dmBtn = document.getElementById('darkModeBtn');
            if (dmBtn) dmBtn.innerHTML = '<i class="bi bi-sun"></i>';
        }

        // Cerrar modal al dar click fuera o con Escape
        const modalOverlay = document.getElementById('modalOverlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) window.closeModal();
            });
        }

        const pdfPreviewOverlay = document.getElementById('pdfPreviewOverlay');
        if (pdfPreviewOverlay) {
            pdfPreviewOverlay.addEventListener('click', (e) => {
                if (e.target === pdfPreviewOverlay) window.closePdfPreview();
            });
        }

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                window.closeModal();
                window.closePdfPreview();
            }
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
                    showToast(`¡Bienvenido, ${user.toUpperCase()}!`, 'success');
                    loadData();
                } else {
                    errorMsg.style.display = 'block';
                }
            };
        }

        const logoutBtn = document.querySelector('.btn-logout');
        if (logoutBtn) {
            logoutBtn.onclick = async () => {
                const confirmed = await showConfirm('Cerrar Sesión', '¿Deseas cerrar tu sesión actual en el sistema?', 'Cerrar Sesión');
                if (confirmed) {
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
                // Remover error visual al escribir
                target.classList.remove('invalid');
                const existingErr = target.parentElement.querySelector('.field-error');
                if (existingErr) existingErr.remove();

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

                // Limpiar errores visuales previos
                e.target.querySelectorAll('.field-error').forEach(el => el.remove());
                e.target.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));

                // Validación de campos requeridos
                let hasErrors = false;
                let firstInvalidElem = null;

                for (let fieldDef of schemas[currentSection]) {
                    if (!fieldDef.required || fieldDef.readonly) continue;
                    const el = e.target.querySelector(`[name="${fieldDef.id}"]`);
                    if (!el) continue;

                    let isFilled = false;
                    if (fieldDef.type === 'file') {
                        const existingFiles = currentEditId ? getItemValue(allData.find(d => d.id === currentEditId), fieldDef.id) : null;
                        isFilled = (el.files && el.files.length > 0) || Boolean(existingFiles);
                    } else {
                        isFilled = el.value && el.value.trim() !== '';
                    }

                    if (!isFilled) {
                        hasErrors = true;
                        el.classList.add('invalid');
                        const errMsg = document.createElement('div');
                        errMsg.className = 'field-error';
                        errMsg.innerHTML = '<i class="bi bi-exclamation-circle-fill"></i> Campo obligatorio';
                        el.parentElement.appendChild(errMsg);
                        if (!firstInvalidElem) firstInvalidElem = el;
                    }
                }

                if (hasErrors) {
                    showToast('Por favor completa todos los campos obligatorios.', 'warning');
                    if (firstInvalidElem) firstInvalidElem.focus();
                    return;
                }

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

                    if (result.error) {
                        showToast('Error al guardar: ' + result.error.message, 'error');
                    } else {
                        showToast(currentEditId ? 'Registro actualizado correctamente' : 'Registro creado exitosamente', 'success');
                        window.closeModal();
                        loadData();
                    }
                } catch (err) {
                    showToast('Error en la operación: ' + err.message, 'error');
                } finally {
                    btn.innerText = originalText;
                    btn.disabled = false;
                }
            };
        }

        initApp();
    });
})();
