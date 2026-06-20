(function () {
    const SUPABASE_URL = "https://ehsbhaepkknxdpvcttaz.supabase.co";
    const SUPABASE_KEY = "sb_publishable_wpFKOfWfFJ4jb9NIEJ4_qQ__c1H3mIh";
    let _supabase;

    let currentSection = 'recibida';
    let currentEditId = null;
    let allData = [];
    let autorizadosData = []; // Para el select de Recibió / Elaboró
    let statusesData = []; // Para el select de Estatus
    let tiposData = []; // Para el select de Tipo

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
            { id: 'CORREO', name: 'CORREO', type: 'text' },
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
            { id: 'CORREO', name: 'CORREO', type: 'text' },
            { id: 'Archivos y multimedia', name: 'ARCHIVOS', type: 'file' }
        ],
        iniciativas: [
            { id: 'id', name: 'ID', type: 'text', readonly: true },
            { id: 'fecha_oficio', name: 'FECHA OFICIO', type: 'date' },
            { id: 'fecha_presentacion_oficialia', name: 'OFICIALÍA', type: 'date' },
            { id: 'texto', name: 'INICIATIVA', type: 'text', full: true },
            { id: 'comision', name: 'COMISIÓN', type: 'text' },
            { id: 'fecha_turno_legis', name: 'TURNO LEGIS', type: 'date' },
            { id: 'fecha_pleno', name: 'PLENO', type: 'date' },
            { id: 'dictaminada_favor_contra', name: 'DICTAMEN', type: 'text' },
            { id: 'decreto', name: 'DECRETO', type: 'text' },
            { id: 'objeto', name: 'OBJETO', type: 'text', full: true },
            { id: 'pdf', name: 'PDF', type: 'file' }
        ],
        proposiciones: [
            { id: 'id', name: 'ID', type: 'text', readonly: true },
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
        ]
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

    async function loadData() {
        const grid = document.getElementById('dataGrid');
        if (grid) grid.innerHTML = '<div style="text-align: center; padding: 4rem;"><i class="bi bi-arrow-repeat spin" style="font-size: 2rem; color: var(--primary);"></i><p style="margin-top: 1rem; color: var(--text-muted);">Cargando registros...</p></div>';

        if (!_supabase && !initSupabase()) return;

        let query = _supabase
            .from(currentSection)
            .select('*')
            .order('id', { ascending: false });

        const { data, error } = await query;

        if (error) {
            console.error('Error:', error);
            if (grid) grid.innerHTML = `<div style="text-align: center; padding: 2rem; color: #ff4444;">Error de acceso: ${error.message}</div>`;
            return;
        }

        allData = data || [];

        if (currentSection === 'recibida' || currentSection === 'despachada') {
            const dateField = currentSection === 'recibida' ? 'Fecha_Recibido' : 'Fecha';
            allData.sort((a, b) => {
                function parseDateStr(str) {
                    if (!str) return 0;
                    if (str.includes('/')) {
                        const parts = str.split('/');
                        if (parts.length === 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
                    }
                    return new Date(str).getTime() || 0;
                }
                const dateA = parseDateStr(a[dateField]);
                const dateB = parseDateStr(b[dateField]);
                // If dates are equal, sort by ID descending as fallback
                if (dateB === dateA) {
                    return (b.id || 0) - (a.id || 0);
                }
                return dateB - dateA;
            });
        }

        updateStats(allData);
        applyFiltersAndRender();
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

        data.forEach(item => {
            // Este Mes logic
            const dateStr = item[dateField];
            if (dateStr) {
                let m = -1, y = -1;
                if (dateStr.includes('/')) {
                    const parts = dateStr.split('/');
                    if (parts.length === 3) {
                        m = parseInt(parts[1], 10) - 1;
                        y = parseInt(parts[2], 10);
                    }
                } else if (dateStr.includes('-')) {
                    const parts = dateStr.split('-');
                    if (parts.length >= 3) {
                        y = parseInt(parts[0], 10);
                        m = parseInt(parts[1], 10) - 1;
                    }
                }
                if (m === currentMonth && y === currentYear) {
                    thisMonthCount++;
                }
            }

            // Pendientes / Urgentes logic (búsqueda genérica)
            let isPendiente = false;
            let isUrgente = false;

            if (item.Estatus) {
                const estatus = String(item.Estatus).toLowerCase();
                if (estatus.includes('pendiente')) isPendiente = true;
                if (estatus.includes('urgente')) isUrgente = true;
            }

            if (!isPendiente || !isUrgente) {
                const allValues = Object.values(item).map(v => String(v).toLowerCase()).join(' ');
                if (!isPendiente && allValues.includes('pendiente')) isPendiente = true;
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

    function renderFileLinks(val, label = 'Ver') {
        if (!val) return '-';
        try {
            const urls = JSON.parse(val);
            if (Array.isArray(urls)) {
                return urls.map((url, i) => `<a href="${url}" target="_blank" class="file-link" title="Archivo ${i + 1}"><i class="bi bi-file-earmark-arrow-down"></i>${urls.length > 1 ? (i + 1) : ''}</a>`).join(' ');
            }
        } catch (e) {
            // No es JSON, asumimos link único
            return `<a href="${val}" target="_blank" class="file-link"><i class="bi bi-file-earmark-arrow-down"></i></a>`;
        }
        return '-';
    }

    async function uploadFiles(files) {
        if (!files || files.length === 0) return null;
        const uploadPromises = Array.from(files).slice(0, 5).map(async (file) => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
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

    function renderGrid(data) {
        const grid = document.getElementById('dataGrid');
        if (!grid) return;
        grid.innerHTML = '';

        if (data.length === 0) {
            grid.innerHTML = '<div style="text-align: center; padding: 4rem; color: var(--text-muted);"><i class="bi bi-inbox" style="font-size: 3rem; display: block; margin-bottom: 1rem; opacity: 0.5;"></i>No se encontraron registros.</div>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'data-table';

        // Table Header
        let headerHtml = '<thead><tr>';
        headerHtml += '<th>Acciones</th>';
        headerHtml += '<th>Registro / Asunto</th>';
        headerHtml += `<th>${currentSection === 'recibida' ? 'RECIBIÓ' : 'Detalle Principal'}</th>`;
        headerHtml += '<th>Estado / Meta</th>';
        headerHtml += '<th>Archivo</th>';
        headerHtml += '</tr></thead>';
        table.innerHTML = headerHtml;

        const tbody = document.createElement('tbody');
        data.forEach(item => {
            const tr = document.createElement('tr');
            const rowId = item.id;

            let titleVal = '';
            let subtitleVal = '';
            let detailVal = '';
            let metaHtml = '';
            let fileHtml = '';

            if (currentSection === 'recibida') {
                titleVal = item.Remite;
                subtitleVal = item.Asunto;
                detailVal = item.Recibio || 'N/A';
                metaHtml = `<span class="badge badge-success">${item.Fecha_Recibido || 'FECHA'}</span>`;
                fileHtml = renderFileLinks(item['PDF-Imagen']);
            }
            else if (currentSection === 'despachada') {
                titleVal = item.Dirigido;
                subtitleVal = item.Asunto;
                detailVal = item.Elaboro || 'N/A';
                metaHtml = `<span class="badge badge-info">${item.Estatus || 'ENVIADO'}</span>`;
                fileHtml = renderFileLinks(item['Archivos y multimedia']);
            }
            else if (currentSection === 'iniciativas') {
                titleVal = `Iniciativa #${item.id || ''}`;
                subtitleVal = item.texto || item.INICIATIVA;
                detailVal = item.comision || 'SIN COMISIÓN';
                metaHtml = `<span class="badge badge-warning">${item.fecha_oficio || 'OFICIO'}</span>`;
                fileHtml = renderFileLinks(item.pdf);
            }
            else if (currentSection === 'proposiciones') {
                titleVal = `Proposición #${item.id || ''}`;
                subtitleVal = item.proposicion;
                detailVal = item.tipo || 'N/A';
                metaHtml = `<span class="badge badge-info">${item.fecha_pleno || 'PLENO'}</span>`;
                fileHtml = renderFileLinks(item.pdf_foto);
            }

            tr.innerHTML = `
                <td class="action-cell" style="text-align: left; white-space: nowrap;">
                    <i class="bi bi-eye action-icon" onclick="viewEntry(${rowId})"></i>
                    <i class="bi bi-pencil action-icon" onclick="editEntry(${rowId})"></i>
                    <i class="bi bi-trash action-icon" style="color: #D92D20;" onclick="deleteEntry(${rowId})"></i>
                </td>
                <td>
                    <div class="row-item">
                        <div class="avatar">${(titleVal || '?')[0].toUpperCase()}</div>
                        <div class="item-main">
                            <span class="item-title">${titleVal || 'Sin Título'}</span>
                            <span class="item-subtitle">${subtitleVal || 'Sin descripción'}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="item-subtitle">${detailVal}</span>
                </td>
                <td>
                    ${metaHtml}
                </td>
                <td>
                    ${fileHtml}
                </td>
            `;
            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        grid.appendChild(table);

        // Update page info
        document.querySelector('.page-info').innerText = `Mostrando ${data.length} registros`;
    }

    let currentFilter = 'todos';

    function applyFiltersAndRender() {
        let filtered = allData;

        const searchInput = document.getElementById('searchInput');
        if (searchInput && searchInput.value) {
            const term = searchInput.value.toLowerCase();
            filtered = filtered.filter(item => {
                return Object.values(item).some(val => String(val).toLowerCase().includes(term));
            });
        }

        if (currentFilter === 'recientes') {
            const now = new Date();
            const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
            
            let dateField = '';
            if (currentSection === 'recibida') dateField = 'Fecha_Recibido';
            else if (currentSection === 'despachada') dateField = 'Fecha';
            else if (currentSection === 'iniciativas') dateField = 'fecha_oficio';
            else if (currentSection === 'proposiciones') dateField = 'fecha_ingreso_procepar';

            filtered = filtered.filter(item => {
                const dateStr = item[dateField];
                if (!dateStr) return false;
                let itemDate;
                if (dateStr.includes('/')) {
                    const parts = dateStr.split('/');
                    if (parts.length === 3) itemDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                } else {
                    itemDate = new Date(dateStr);
                }
                return itemDate && !isNaN(itemDate.getTime()) && itemDate >= thirtyDaysAgo;
            });
        } else if (currentFilter === 'archivados') {
            filtered = filtered.filter(item => {
                const allValues = Object.values(item).map(v => String(v).toLowerCase()).join(' ');
                return allValues.includes('archivado') || allValues.includes('concluido') || allValues.includes('atendido') || allValues.includes('entregada');
            });
        }

        renderGrid(filtered);
    }

    function switchSection(section) {
        currentSection = section;
        const titleElem = document.getElementById('sectionTitle');
        if (titleElem) titleElem.innerText = section.charAt(0).toUpperCase() + section.slice(1);

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

        loadData();
    }

    window.viewEntry = function (id) {
        const item = allData.find(d => d.id === id);
        if (!item) return;

        let details = '';
        schemas[currentSection].forEach(field => {
            const val = item[field.id];
            details += `
                <div class="form-group ${field.full ? 'full' : ''}">
                    <label>${field.name}</label>
                    <div style="padding: 0.625rem; background: #F9FAFB; border: 1px solid var(--border); border-radius: 8px; font-size: 0.875rem;">
                        ${field.type === 'file' ? renderFileLinks(val) : (val || 'N/A')}
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
        const { error } = await _supabase.from(currentSection).delete().eq('id', id);
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
            const value = isEdit ? (item[field.id] || '') : '';

            if (field.type === 'file') {
                div.innerHTML = `
                    <label>${field.name}</label>
                    <input type="file" name="${field.id}" accept="image/*,.pdf" multiple>
                    ${isEdit && value ? `<small style="margin-top:0.25rem; display:block; color:var(--text-muted)">Archivos: ${renderFileLinks(value)}</small>` : ''}
                    <small style="color:var(--text-muted); font-size: 0.75rem;">Máximo 5 archivos.</small>
                `;
            } else if (field.type === 'select') {
                const valTarget = String(value || '').toUpperCase().trim();
                let sourceData = autorizadosData;
                if (field.source === 'status') sourceData = statusesData;
                else if (field.source === 'tipo') sourceData = tiposData;

                console.log(`Campo: ${field.id}, Fuente: ${field.source}, Buscando match para: "${valTarget}"`);

                const options = sourceData.map(opt => {
                    const isSelected = (valTarget === opt);
                    return `<option value="${opt}" ${isSelected ? 'selected' : ''}>${opt}</option>`;
                }).join('');

                div.innerHTML = `
                    <label>${field.name}</label>
                    <select name="${field.id}">
                        <option value="">${sourceData.length === 0 ? 'CARGANDO LISTA...' : 'SELECCIONE...'}</option>
                        ${options}
                    </select>
                `;

                if (sourceData.length === 0) {
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
                                    currentData.map(opt => `<option value="${opt}" ${valTarget === opt ? 'selected' : ''}>${opt}</option>`).join('');
                            }
                        }
                    });
                }
            } else if (field.type === 'date' || field.type === 'time') {
                div.innerHTML = `
                    <label>${field.name}</label>
                    <input type="${field.type}" name="${field.id}" value="${value || ''}">
                `;
            } else {
                div.innerHTML = `
                    <label>${field.name}</label>
                    <input type="${field.type}" name="${field.id}" value="${value}" 
                           placeholder="${field.readonly ? 'ID autogenerado' : 'Ingresa ' + field.name.toLowerCase()}" 
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
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            selectedDateStr = `${yyyy}-${mm}-${dd}`;
        }

        let dateField = '';
        if (currentSection === 'recibida') dateField = 'Fecha_Recibido';
        else if (currentSection === 'despachada') dateField = 'Fecha';
        else if (currentSection === 'iniciativas') dateField = 'fecha_oficio';
        else if (currentSection === 'proposiciones') dateField = 'fecha_ingreso_procepar';

        const dailyData = allData.filter(item => {
            const itemDate = item[dateField];
            return itemDate && itemDate.startsWith(selectedDateStr);
        });

        if (dailyData.length === 0) {
            alert(`No hay registros del día (${selectedDateStr}) en esta sección.`);
            return;
        }

        const exportData = dailyData.map(item => {
            const row = {};
            schemas[currentSection].forEach(field => {
                if (field.type !== 'file') {
                    row[field.name] = item[field.id];
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
        const todayForExport = new Date();
        const exportYyyy = todayForExport.getFullYear();
        const exportMm = String(todayForExport.getMonth() + 1).padStart(2, '0');
        const exportDd = String(todayForExport.getDate()).padStart(2, '0');
        const dateInput = document.getElementById('exportDate');
        if (dateInput) {
            dateInput.value = `${exportYyyy}-${exportMm}-${exportDd}`;
        }

        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.onsubmit = async (e) => {
                e.preventDefault();
                const user = document.getElementById('loginUser').value;
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
                    location.reload();
                }
            };
        }

        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.dataset.section) {
                item.onclick = function () { switchSection(this.dataset.section); };
            }
        });

        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.oninput = () => applyFiltersAndRender();
        }

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.onclick = (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                const text = e.target.innerText.toLowerCase();
                if (text.includes('todos')) currentFilter = 'todos';
                else if (text.includes('recientes')) currentFilter = 'recientes';
                else if (text.includes('archivados')) currentFilter = 'archivados';

                applyFiltersAndRender();
            };
        });

        const dataForm = document.getElementById('dataForm');
        if (dataForm) {
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
                            const files = input ? input.files : null;
                            if (files && files.length > 0) {
                                entry[key] = await uploadFiles(files);
                            } else if (currentEditId) {
                                const existingItem = allData.find(d => d.id === currentEditId);
                                if (existingItem && existingItem[key]) {
                                    entry[key] = existingItem[key];
                                }
                            }
                        } else {
                            const val = formData.get(key);
                            entry[key] = typeof val === 'string' ? val.toUpperCase().trim() : val;
                        }
                    }

                    if (!_supabase && !initSupabase()) return;

                    let result;
                    if (currentEditId) result = await _supabase.from(currentSection).update(entry).eq('id', currentEditId);
                    else result = await _supabase.from(currentSection).insert([entry]);

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
