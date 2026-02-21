(function () {
    const SUPABASE_URL = "https://ehsbhaepkknxdpvcttaz.supabase.co";
    const SUPABASE_KEY = "sb_publishable_wpFKOfWfFJ4jb9NIEJ4_qQ__c1H3mIh";
    let _supabase;

    let currentSection = 'recibida';
    let allData = [];

    // Esquemas completos con todos los campos de la base de datos
    const schemas = {
        recibida: [
            { id: 'Fecha_Recibido', name: 'FECHA RECIBIDO', type: 'text' },
            { id: 'Remite', name: 'REMITE', type: 'text' },
            { id: 'Asunto', name: 'ASUNTO', type: 'text', full: true },
            { id: 'Recibio', name: 'RECIBIÓ', type: 'text' },
            { id: 'fecha_evento', name: 'FECHA EVENTO', type: 'text' },
            { id: 'HORA', name: 'HORA', type: 'text' },
            { id: 'Lugar', name: 'LUGAR', type: 'text' },
            { id: 'TELEFONO', name: 'TELÉFONO', type: 'text' },
            { id: 'CORREO', name: 'CORREO', type: 'text' },
            { id: 'PDF-Imagen', name: 'ARCHIVO/PDF', type: 'file' }
        ],
        despachada: [
            { id: 'Fecha', name: 'FECHA', type: 'text' },
            { id: 'Elaboro', name: 'ELABORÓ', type: 'text' },
            { id: 'Dirigido', name: 'DIRIGIDO', type: 'text' },
            { id: 'Asunto', name: 'ASUNTO', type: 'text', full: true },
            { id: 'Estatus', name: 'ESTATUS', type: 'text' },
            { id: 'Recibió', name: 'RECIBIÓ', type: 'text' },
            { id: 'Fecha_recepcion', name: 'FECHA RECEPCIÓN', type: 'text' },
            { id: 'TELEFONO', name: 'TELÉFONO', type: 'text' },
            { id: 'CORREO', name: 'CORREO', type: 'text' },
            { id: 'Archivos y multimedia', name: 'ARCHIVOS', type: 'file' }
        ],
        iniciativas: [
            { id: 'no', name: 'NO.', type: 'number' },
            { id: 'fecha_oficio', name: 'FECHA OFICIO', type: 'text' },
            { id: 'fecha_presentacion_oficialia', name: 'OFICIALÍA', type: 'text' },
            { id: 'texto', name: 'INICIATIVA', type: 'text', full: true },
            { id: 'comision', name: 'COMISIÓN', type: 'text' },
            { id: 'fecha_turno_legis', name: 'TURNO LEGIS', type: 'text' },
            { id: 'fecha_pleno', name: 'PLENO', type: 'text' },
            { id: 'dictaminada_favor_contra', name: 'DICTAMEN', type: 'text' },
            { id: 'decreto', name: 'DECRETO', type: 'text' },
            { id: 'objeto', name: 'OBJETO', type: 'text', full: true },
            { id: 'pdf', name: 'PDF', type: 'file' }
        ],
        proposiciones: [
            { id: 'no', name: 'NO.', type: 'number' },
            { id: 'fecha_ingreso_procepar', name: 'INGRESO PROCEPAR', type: 'text' },
            { id: 'fecha_pleno', name: 'FECHA PLENO', type: 'text' },
            { id: 'proposicion', name: 'PROPOSICIÓN', type: 'text', full: true },
            { id: 'resultado_votacion', name: 'VOTACIÓN', type: 'text' },
            { id: 'fecha_acuse_recibido_autoridad', name: 'ACUSE AUTORIDAD', type: 'text' },
            { id: 'fecha_respuesta_autoridad', name: 'RESPUESTA AUTORIDAD', type: 'text' },
            { id: 'tipo', name: 'TIPO', type: 'text' },
            { id: 'objetivo', name: 'OBJETIVO', type: 'text', full: true },
            { id: 'turnado_comision', name: 'TURNADO COMISIÓN', type: 'text' },
            { id: 'acuerdo', name: 'ACUERDO', type: 'text' },
            { id: 'respuesta_acuerdo', name: 'RESPUESTA ACUERDO', type: 'text' },
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

    async function loadData() {
        const grid = document.getElementById('dataGrid');
        if (grid) grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem;">Cargando registros...</div>';

        if (!_supabase && !initSupabase()) return;

        const { data, error } = await _supabase
            .from(currentSection)
            .select('*')
            .order('id', { ascending: false });

        if (error) {
            console.error('Error:', error);
            if (grid) grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #ff4444;">Error de acceso: ${error.message}</div>`;
            return;
        }

        allData = data || [];
        renderGrid(allData);
    }

    async function uploadFile(file) {
        if (!file) return null;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${currentSection}/${fileName}`;

        const { data, error } = await _supabase.storage
            .from('attachments')
            .upload(filePath, file);

        if (error) {
            console.error('Error uploading:', error);
            // Si el bucket no existe, es muy probable que falle.
            // En una app real, el bucket ya debe estar configurado.
            throw error;
        }

        const { data: { publicUrl } } = _supabase.storage
            .from('attachments')
            .getPublicUrl(filePath);

        return publicUrl;
    }

    function renderGrid(data) {
        const grid = document.getElementById('dataGrid');
        if (!grid) return;
        grid.innerHTML = '';

        if (data.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">No se encontraron registros.</div>';
            return;
        }

        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card';

            const rowId = item.id;
            const schema = schemas[currentSection];

            let titleVal = '';
            let subtitleVal = '';

            if (currentSection === 'recibida') { titleVal = item.Remite; subtitleVal = item.Asunto; }
            else if (currentSection === 'despachada') { titleVal = item.Dirigido; subtitleVal = item.Asunto; }
            else if (currentSection === 'iniciativas') { titleVal = `Iniciativa #${item.no || ''}`; subtitleVal = item.texto || item.INICIATIVA; }
            else if (currentSection === 'proposiciones') { titleVal = `Proposición #${item.no || ''}`; subtitleVal = item.proposicion; }

            let bodyContent = '';
            schema.forEach(field => {
                const value = item[field.id];
                if (value) {
                    if (field.type === 'file') {
                        const isImg = value.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                        bodyContent += `<p><strong>${field.name}:</strong> 
                            <a href="${value}" target="_blank" class="file-link">
                                ${isImg ? `<img src="${value}" style="display:block; max-height: 50px; border-radius: 4px; margin-top: 5px;">` : '<i class="bi bi-file-earmark-pdf"></i> Ver Documento'}
                            </a></p>`;
                    } else {
                        bodyContent += `<p><strong>${field.name}:</strong> ${value}</p>`;
                    }
                }
            });

            let metaHtml = '';
            if (currentSection === 'recibida') { metaHtml = `<span>${item.Fecha_Recibido || ''}</span><span>${item.TELEFONO || ''}</span>`; }
            else if (currentSection === 'despachada') { metaHtml = `<span>${item.Fecha || ''}</span><span>${item.Estatus || ''}</span>`; }
            else if (currentSection === 'iniciativas') { metaHtml = `<span>${item.fecha_oficio || ''}</span><span>${item.comision || ''}</span>`; }
            else if (currentSection === 'proposiciones') { metaHtml = `<span>${item.fecha_pleno || ''}</span><span>${item.tipo || ''}</span>`; }

            card.innerHTML = `
                <div>
                    <div class="card-title">${titleVal || 'Sin Título'}</div>
                    <div class="card-subtitle">${subtitleVal || 'Sin Descripción'}</div>
                </div>
                <div class="card-body">
                    ${bodyContent}
                </div>
                <div class="meta">
                    ${metaHtml}
                </div>
                <div class="card-actions">
                    <button class="action-btn view" onclick="viewEntry(${rowId})"><i class="bi bi-eye"></i></button>
                    <button class="action-btn edit" onclick="editEntry(${rowId})"><i class="bi bi-pencil"></i></button>
                    <button class="action-btn delete" onclick="deleteEntry(${rowId})"><i class="bi bi-trash"></i></button>
                </div>
            `;

            grid.appendChild(card);
        });
    }

    function switchSection(section) {
        currentSection = section;
        const titleElem = document.getElementById('sectionTitle');
        if (titleElem) titleElem.innerText = section.charAt(0).toUpperCase() + section.slice(1);

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === section) item.classList.add('active');
        });

        loadData();
    }

    window.viewEntry = function (id) {
        const item = allData.find(d => d.id === id);
        if (!item) return;

        let details = '<div style="display: flex; flex-direction: column; gap: 1rem;">';
        schemas[currentSection].forEach(field => {
            const val = item[field.id];
            if (field.type === 'file' && val) {
                details += `<div><strong>${field.name}:</strong> <a href="${val}" target="_blank" style="color:var(--primary)">Ver Archivo</a></div>`;
            } else {
                details += `<div><strong>${field.name}:</strong> <span style="color: var(--text-muted)">${val || 'N/A'}</span></div>`;
            }
        });
        details += '</div>';

        const overlay = document.getElementById('modalOverlay');
        const fields = document.getElementById('formFields');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('dataForm');

        title.innerText = "Ver Detalles";
        fields.innerHTML = details;
        form.querySelector('button[type="submit"]').style.display = 'none';
        overlay.style.display = 'flex';
    };

    window.editEntry = function (id) {
        currentEditId = id;
        const item = allData.find(d => d.id === id);
        if (!item) return;

        openModal(true, item);
    };

    window.deleteEntry = async function (id) {
        if (!confirm('¿Estás seguro de que deseas borrar este registro?')) return;

        const { error } = await _supabase.from(currentSection).delete().eq('id', id);

        if (error) {
            alert('Error al borrar: ' + error.message);
        } else {
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
        fields.innerHTML = '';

        schemas[currentSection].forEach(field => {
            const div = document.createElement('div');
            div.className = `form-group ${field.full ? 'full' : ''}`;
            const value = isEdit ? (item[field.id] || '') : '';

            if (field.type === 'file') {
                div.innerHTML = `
                    <label>${field.name} ${isEdit ? '(Opcional: subir nuevo)' : ''}</label>
                    <input type="file" name="${field.id}" accept="image/*,.pdf">
                    ${isEdit && value ? `<small style="color:var(--text-muted)">Archivo actual: <a href="${value}" target="_blank">Ver</a></small>` : ''}
                `;
            } else {
                div.innerHTML = `
                    <label>${field.name}</label>
                    <input type="${field.type}" name="${field.id}" value="${value}">
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

    function checkSession() {
        const loggedUser = localStorage.getItem('loggedUser');
        if (loggedUser) {
            document.getElementById('loginOverlay').style.display = 'none';
            document.querySelector('.user-profile span').innerText = loggedUser;
            return true;
        }
        return false;
    }

    document.addEventListener('DOMContentLoaded', () => {
        // Manejo de Login
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
                    document.getElementById('loginOverlay').style.display = 'none';
                    document.querySelector('.user-profile span').innerText = user.toUpperCase();
                    loadData();
                } else {
                    errorMsg.style.display = 'block';
                }
            };
        }

        // Logout
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
            item.onclick = function () { switchSection(this.dataset.section); };
        });

        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.oninput = function (e) {
                const term = e.target.value.toLowerCase();
                const filtered = allData.filter(item => {
                    return Object.values(item).some(val => String(val).toLowerCase().includes(term));
                });
                renderGrid(filtered);
            };
        }

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

                    // Manejar archivos primero
                    for (let [key, value] of formData.entries()) {
                        const field = schemas[currentSection].find(f => f.id === key);
                        if (field && field.type === 'file') {
                            if (value && value.size > 0) {
                                entry[key] = await uploadFile(value);
                            } else if (currentEditId) {
                                const existingItem = allData.find(d => d.id === currentEditId);
                                if (existingItem && existingItem[key]) {
                                    entry[key] = existingItem[key];
                                }
                            }
                        } else {
                            // Convertir a MAYÚSCULAS si es texto
                            entry[key] = typeof value === 'string' ? value.toUpperCase() : value;
                        }
                    }


                    if (!_supabase && !initSupabase()) return;

                    let result;
                    if (currentEditId) {
                        result = await _supabase.from(currentSection).update(entry).eq('id', currentEditId);
                    } else {
                        result = await _supabase.from(currentSection).insert([entry]);
                    }

                    if (result.error) {
                        alert('Error al guardar: ' + result.error.message);
                    } else {
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

        if (initSupabase()) {
            if (checkSession()) {
                loadData();
            }
        }
    });
})();
