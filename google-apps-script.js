/**
 * =========================================================================
 * SISTEMA DE CORRESPONDENCIA - BACKEND GOOGLE APPS SCRIPT
 * =========================================================================
 * 
 * INSTRUCCIONES DE INSTALACIÓN:
 * 1. Crea una hoja de cálculo nueva en Google Drive (ej: "Sistema Correspondencia").
 * 2. En el menú superior de la hoja, ve a: Extensiones -> Apps Script.
 * 3. Borra cualquier código existente en el editor de Apps Script y pega TODO este archivo.
 * 4. Haz clic en "Guardar" (icono de disquete).
 * 5. Ejecuta una vez la función "setupDatabase" desde el editor seleccionándola
 *    en el selector de funciones y haciendo clic en "Ejecutar" (acepta los permisos requeridos).
 *    Esto creará todas las pestañas, columnas y datos iniciales automáticamente.
 * 6. Haz clic en el botón azul superior "Implementar" -> "Nueva implementación".
 * 7. En "Tipo", selecciona el engrane -> "Aplicación web".
 * 8. Configura:
 *    - Descripción: Backend Correspondencia
 *    - Ejecutar como: "Yo" (tu cuenta de Google)
 *    - Quién tiene acceso: "Cualquier persona" (Anyone)  <--- ¡MUY IMPORTANTE!
 * 9. Haz clic en "Implementar" y COPIA la URL de la aplicación web (termina en /exec).
 * 10. Pega esa URL en el archivo app.js en la variable GOOGLE_SCRIPT_URL (o en la ventana de configuración).
 * =========================================================================
 */

const FOLDER_NAME = 'Correspondencia_Adjuntos';

const SCHEMAS = {
    recibida: ['id', 'Fecha_Recibido', 'Remite', 'Asunto', 'Recibio', 'fecha_evento', 'HORA', 'Lugar', 'TELEFONO', 'CORREO', 'PDF-Imagen'],
    despachada: ['id', 'Fecha', 'Elaboro', 'Dirigido', 'Asunto', 'Estatus', 'Recibió', 'Fecha_recepcion', 'TELEFONO', 'CORREO', 'Archivos y multimedia'],
    iniciativas: ['id', 'fecha_oficio', 'fecha_presentacion_oficialia', 'texto', 'comision', 'fecha_turno_legis', 'fecha_pleno', 'dictaminada_favor_contra', 'opinion', 'decreto', 'objeto', 'pdf', 'opinion_consultoria', 'proyecto_dictamen', 'proyecto_decreto'],
    proposiciones: ['id', 'fecha_ingreso_procepar', 'fecha_pleno', 'proposicion', 'resultado_votacion', 'fecha_acuse_recibido_autoridad', 'fecha_respuesta_autoridad', 'tipo', 'objetivo', 'turnado_comision', 'acuerdo', 'respuesta_acuerdo', 'anotaciones', 'pdf_foto'],
    fisca: ['id', 'ano', 'fecha_sesion', 'dictamen_no', 'dependencia', 'observaciones', 'dictamen', 'voto_diputada', 'voto_final', 'fallo'],
    autorizados: ['nombre'],
    status: ['status'],
    tipo: ['tipo'],
    usuarios: ['usuario', 'contrasena', 'rol']
};

/**
 * Función para inicializar la base de datos con hojas y encabezados.
 */
function setupDatabase() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Crear o asegurar hojas y encabezados
    for (const [sheetName, headers] of Object.entries(SCHEMAS)) {
        let sheet = ss.getSheetByName(sheetName);
        if (!sheet) {
            sheet = ss.insertSheet(sheetName);
        }
        if (sheet.getLastRow() === 0) {
            sheet.appendRow(headers);
            sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f4f6');
            sheet.setFrozenRows(1);
        }
    }

    // Datos iniciales si están vacíos
    const userSheet = ss.getSheetByName('usuarios');
    if (userSheet.getLastRow() <= 1) {
        userSheet.appendRow(['admin', 'admin123', 'admin']);
        userSheet.appendRow(['usuario', '123456', 'usuario']);
    }

    const statusSheet = ss.getSheetByName('status');
    if (statusSheet.getLastRow() <= 1) {
        const defaultStatus = ['PENDIENTE', 'EN PROCESO', 'TURNADO', 'ATENDIDO', 'CONCLUIDO', 'CANCELADO'];
        defaultStatus.forEach(s => statusSheet.appendRow([s]));
    }

    const tipoSheet = ss.getSheetByName('tipo');
    if (tipoSheet.getLastRow() <= 1) {
        const defaultTipos = ['EXHORTO', 'ACUERDO', 'INICIATIVA', 'DICTAMEN', 'SOLICITUD', 'INFORME'];
        defaultTipos.forEach(t => tipoSheet.appendRow([t]));
    }

    const autorizadosSheet = ss.getSheetByName('autorizados');
    if (autorizadosSheet.getLastRow() <= 1) {
        const defaultAutorizados = ['MAYOLA GAONA', 'ASISTENTE 1', 'OFICIALÍA DE PARTES'];
        defaultAutorizados.forEach(a => autorizadosSheet.appendRow([a]));
    }

    // Eliminar "Hoja 1" o "Sheet1" si existe por defecto y no es necesaria
    const defaultSheet = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1');
    if (defaultSheet && ss.getSheets().length > 1) {
        try { ss.deleteSheet(defaultSheet); } catch (e) { }
    }

    return 'Base de datos configurada exitosamente.';
}

/**
 * Manejador de solicitudes GET
 */
function doGet(e) {
    try {
        const params = e ? e.parameter : {};
        const action = params.action || 'read';

        if (action === 'setup') {
            const msg = setupDatabase();
            return createJsonResponse({ success: true, message: msg });
        }

        if (action === 'init') {
            return handleInit();
        }

        if (action === 'read') {
            const table = params.table;
            if (!table) return createJsonResponse({ success: false, error: 'Falta parámetro "table"' });
            return handleRead(table);
        }

        if (action === 'login') {
            return handleLogin(params.user, params.pass);
        }

        return createJsonResponse({ success: false, error: 'Acción GET no reconocida: ' + action });
    } catch (err) {
        return createJsonResponse({ success: false, error: err.toString() });
    }
}

/**
 * Manejador de solicitudes POST
 */
function doPost(e) {
    try {
        let payload = {};
        if (e && e.postData && e.postData.contents) {
            payload = JSON.parse(e.postData.contents);
        } else if (e && e.parameter) {
            payload = e.parameter;
        }

        const action = payload.action;

        if (action === 'login') {
            return handleLogin(payload.user, payload.pass);
        }

        if (action === 'create') {
            return handleCreate(payload.table, payload.data);
        }

        if (action === 'update') {
            return handleUpdate(payload.table, payload.id, payload.data);
        }

        if (action === 'delete') {
            return handleDelete(payload.table, payload.id);
        }

        if (action === 'upload_batch' || (action === 'upload' && Array.isArray(payload.files))) {
            return handleUploadBatch(payload.files, payload.section);
        }

        if (action === 'upload') {
            return handleUpload(payload.filename, payload.mimeType, payload.base64, payload.section);
        }

        return createJsonResponse({ success: false, error: 'Acción POST no reconocida: ' + action });
    } catch (err) {
        return createJsonResponse({ success: false, error: err.toString() });
    }
}

/**
 * Retorna catálogos en una sola petición para optimizar tiempos de carga
 */
function handleInit() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    const getColumnValues = (sheetName) => {
        const sheet = ss.getSheetByName(sheetName);
        if (!sheet || sheet.getLastRow() <= 1) return [];
        const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
        return values.map(r => r[0]).filter(Boolean).map(v => String(v).trim().toUpperCase());
    };

    const autorizados = getColumnValues('autorizados');
    const statuses = getColumnValues('status');
    const tipos = getColumnValues('tipo');

    return createJsonResponse({
        success: true,
        autorizados: autorizados,
        statuses: statuses,
        tipos: tipos
    });
}

/**
 * Lee todos los registros de una tabla
 */
function handleRead(tableName) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(tableName);

    if (!sheet) {
        return createJsonResponse({ success: false, error: `La hoja "${tableName}" no existe.` });
    }

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    if (lastRow <= 1 || lastCol === 0) {
        return createJsonResponse({ success: true, data: [] });
    }

    const rawData = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    const headers = rawData[0];
    const rows = rawData.slice(1);

    const items = rows.map((row, index) => {
        const item = {};
        headers.forEach((header, colIdx) => {
            let val = row[colIdx];
            if (val instanceof Date) {
                // Formato YYYY-MM-DD usando la zona horaria de la hoja para evitar desfase de días
                try {
                    const tz = ss.getSpreadsheetTimeZone() || Session.getScriptTimeZone() || 'GMT';
                    val = Utilities.formatDate(val, tz, 'yyyy-MM-dd');
                } catch (e) {
                    const y = val.getFullYear();
                    const m = String(val.getMonth() + 1).padStart(2, '0');
                    const d = String(val.getDate()).padStart(2, '0');
                    val = `${y}-${m}-${d}`;
                }
            } else if (val === null || val === undefined) {
                val = '';
            }
            item[header] = val;
        });

        // Asegurar que exista id
        if (!item.id) {
            item.id = index + 1;
        } else if (!isNaN(item.id)) {
            item.id = Number(item.id);
        }

        return item;
    });

    // Ordenar descendente por id por defecto
    items.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));

    return createJsonResponse({ success: true, data: items });
}

/**
 * Autenticación de usuarios
 */
function handleLogin(username, password) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('usuarios') || ss.getSheetByName('Usuarios') || ss.getSheetByName('USUARIOS');

    const userClean = String(username || '').trim().toLowerCase();
    const passClean = String(password || '').trim();

    if (!sheet || sheet.getLastRow() <= 1) {
        // Si no hay usuarios configurados, permitir acceso de emergencia si es admin
        if (userClean === 'admin' && passClean === 'admin123') {
            return createJsonResponse({ success: true, user: 'ADMIN', rol: 'admin' });
        }
        return createJsonResponse({ success: false, error: 'No hay usuarios registrados en el sistema.' });
    }

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    const rawData = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    const headers = rawData[0].map(h => String(h || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
    const rows = rawData.slice(1);

    let userIdx = headers.findIndex(h => h.includes('usuario') || h.includes('user') || h.includes('nombre'));
    let passIdx = headers.findIndex(h => h.includes('contrasena') || h.includes('password') || h.includes('pass') || h.includes('clave'));
    let rolIdx = headers.findIndex(h => h.includes('rol') || h.includes('role') || h.includes('tipo') || h.includes('perfil'));

    if (userIdx === -1) userIdx = 0;
    if (passIdx === -1) passIdx = 1;
    if (rolIdx === -1) rolIdx = 2;

    for (let i = 0; i < rows.length; i++) {
        const u = String(rows[i][userIdx] || '').trim().toLowerCase();
        const p = String(rows[i][passIdx] || '').trim();
        const r = String(rows[i][rolIdx] || 'usuario').trim().toLowerCase();

        if (u === userClean && p === passClean) {
            return createJsonResponse({
                success: true,
                user: (rows[i][userIdx] || username).toString().toUpperCase(),
                rol: r || 'usuario'
            });
        }
    }

    // Acceso de emergencia si es admin
    if (userClean === 'admin' && passClean === 'admin123') {
        return createJsonResponse({ success: true, user: 'ADMIN', rol: 'admin' });
    }

    return createJsonResponse({ success: false, error: 'Usuario o contraseña incorrectos' });
}

/**
 * Crea un nuevo registro en una tabla
 */
function handleCreate(tableName, data) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(tableName);

    if (!sheet) {
        setupDatabase();
        sheet = ss.getSheetByName(tableName);
        if (!sheet) return createJsonResponse({ success: false, error: `La hoja "${tableName}" no existe.` });
    }

    const lastCol = sheet.getLastColumn();
    const headers = sheet.getRange(1, 1, 1, Math.max(lastCol, 1)).getValues()[0];

    // Calcular el siguiente ID numérico
    let nextId = 1;
    if (sheet.getLastRow() > 1) {
        const idColIdx = headers.indexOf('id') + 1;
        if (idColIdx > 0) {
            const idValues = sheet.getRange(2, idColIdx, sheet.getLastRow() - 1, 1).getValues();
            const numericIds = idValues.map(r => Number(r[0])).filter(n => !isNaN(n) && n > 0);
            if (numericIds.length > 0) {
                nextId = Math.max(...numericIds) + 1;
            }
        }
    }

    data.id = nextId;

    const rowToAppend = headers.map(header => {
        const val = data[header];
        if (val === undefined || val === null) return '';
        return val;
    });

    sheet.appendRow(rowToAppend);

    return createJsonResponse({ success: true, data: data, id: nextId });
}

/**
 * Actualiza un registro existente por id
 */
function handleUpdate(tableName, id, data) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(tableName);

    if (!sheet) return createJsonResponse({ success: false, error: `La hoja "${tableName}" no existe.` });

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow <= 1) return createJsonResponse({ success: false, error: 'No hay registros para actualizar.' });

    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const idColIdx = headers.indexOf('id');
    if (idColIdx === -1) return createJsonResponse({ success: false, error: 'Columna ID no encontrada.' });

    const allRows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    let targetRowIndex = -1;

    for (let i = 0; i < allRows.length; i++) {
        if (String(allRows[i][idColIdx]) === String(id)) {
            targetRowIndex = i + 2; // Fila real en la hoja (1-indexed, + header)
            break;
        }
    }

    if (targetRowIndex === -1) {
        return createJsonResponse({ success: false, error: `Registro con ID ${id} no encontrado.` });
    }

    const currentRow = sheet.getRange(targetRowIndex, 1, 1, lastCol).getValues()[0];
    const updatedRow = headers.map((header, idx) => {
        if (header === 'id') return currentRow[idx]; // Mantener ID original
        if (data[header] !== undefined && data[header] !== null) {
            return data[header];
        }
        return currentRow[idx];
    });

    sheet.getRange(targetRowIndex, 1, 1, lastCol).setValues([updatedRow]);

    return createJsonResponse({ success: true, data: data });
}

/**
 * Elimina un registro por id
 */
function handleDelete(tableName, id) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(tableName);

    if (!sheet) return createJsonResponse({ success: false, error: `La hoja "${tableName}" no existe.` });

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow <= 1) return createJsonResponse({ success: false, error: 'No hay registros.' });

    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const idColIdx = headers.indexOf('id');
    if (idColIdx === -1) return createJsonResponse({ success: false, error: 'Columna ID no encontrada.' });

    const idValues = sheet.getRange(2, idColIdx + 1, lastRow - 1, 1).getValues();

    for (let i = 0; i < idValues.length; i++) {
        if (String(idValues[i][0]) === String(id)) {
            const rowIndex = i + 2;
            sheet.deleteRow(rowIndex);
            return createJsonResponse({ success: true, message: `Registro con ID ${id} eliminado.` });
        }
    }

    return createJsonResponse({ success: false, error: `Registro con ID ${id} no encontrado.` });
}

/**
 * Cache en memoria por ciclo de ejecución
 */
const FOLDER_CACHE = {};

/**
 * Obtiene la carpeta de destino en Google Drive utilizando caché en ScriptProperties
 * para evitar búsquedas repetitivas y lentas en todo Google Drive.
 */
function getTargetFolder(section) {
    const key = section ? String(section).trim() : 'root';
    if (FOLDER_CACHE[key]) return FOLDER_CACHE[key];

    const props = PropertiesService.getScriptProperties();
    const propKey = 'FOLDER_ID_' + key;
    const cachedId = props.getProperty(propKey);

    if (cachedId) {
        try {
            const folder = DriveApp.getFolderById(cachedId);
            if (folder) {
                FOLDER_CACHE[key] = folder;
                return folder;
            }
        } catch (e) {
            // El ID guardado ya no es válido o fue borrado, se procede a re-buscar
        }
    }

    // Carpeta principal
    let mainFolder;
    const mainId = props.getProperty('FOLDER_ID_root');
    if (mainId) {
        try {
            mainFolder = DriveApp.getFolderById(mainId);
        } catch (e) {}
    }

    if (!mainFolder) {
        const folders = DriveApp.getFoldersByName(FOLDER_NAME);
        if (folders.hasNext()) {
            mainFolder = folders.next();
        } else {
            mainFolder = DriveApp.createFolder(FOLDER_NAME);
            try { mainFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (_) {}
        }
        props.setProperty('FOLDER_ID_root', mainFolder.getId());
    }

    // Subcarpeta por sección si aplica
    let targetFolder = mainFolder;
    if (section) {
        const subFolders = mainFolder.getFoldersByName(section);
        if (subFolders.hasNext()) {
            targetFolder = subFolders.next();
        } else {
            targetFolder = mainFolder.createFolder(section);
            try { targetFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (_) {}
        }
    }

    // Asegurar permiso de lectura pública una sola vez en la carpeta para herencia automática
    if (!props.getProperty('FOLDER_SHARED_' + key)) {
        try {
            targetFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            props.setProperty('FOLDER_SHARED_' + key, 'true');
        } catch (_) {}
    }

    props.setProperty(propKey, targetFolder.getId());
    FOLDER_CACHE[key] = targetFolder;
    return targetFolder;
}

/**
 * Carga de múltiples archivos a Google Drive en una sola llamada (Batch Upload)
 * Optimizado para máxima velocidad: herencia de permisos y URLs ligeras /preview
 */
function handleUploadBatch(files, section) {
    try {
        if (!files || !Array.isArray(files) || files.length === 0) {
            return createJsonResponse({ success: false, error: 'No se recibieron archivos para subir.' });
        }

        const targetFolder = getTargetFolder(section);
        const urls = [];
        const timestamp = new Date().getTime();

        for (let i = 0; i < files.length; i++) {
            const item = files[i];
            if (!item || !item.base64) continue;

            const decodedBytes = Utilities.base64Decode(item.base64);
            const cleanFilename = (item.filename || 'archivo').replace(/[^a-zA-Z0-9._\-áéíóúÁÉÍÓÚñÑ ]/g, '_');
            const uniqueName = `${timestamp}_${i + 1}_${cleanFilename}`;
            const blob = Utilities.newBlob(decodedBytes, item.mimeType || 'application/octet-stream', uniqueName);

            // Crear el archivo en la carpeta (hereda los permisos públicos de la carpeta sin demoras RPC)
            const file = targetFolder.createFile(blob);
            const fileId = file.getId();
            // Vista ligera directa (/preview) que carga en ~300ms
            const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
            urls.push(previewUrl);
        }

        return createJsonResponse({
            success: true,
            urls: urls
        });
    } catch (err) {
        return createJsonResponse({ success: false, error: 'Error en carga por lote a Google Drive: ' + err.toString() });
    }
}

/**
 * Carga individual de archivos a Google Drive
 */
function handleUpload(filename, mimeType, base64Data, section) {
    try {
        if (!base64Data) return createJsonResponse({ success: false, error: 'No se recibieron datos del archivo.' });

        const targetFolder = getTargetFolder(section);

        // Decodificar Base64
        const decodedBytes = Utilities.base64Decode(base64Data);
        const cleanFilename = (filename || 'archivo').replace(/[^a-zA-Z0-9._\-áéíóúÁÉÍÓÚñÑ ]/g, '_');
        const uniqueName = `${new Date().getTime()}_${cleanFilename}`;
        const blob = Utilities.newBlob(decodedBytes, mimeType || 'application/octet-stream', uniqueName);

        const file = targetFolder.createFile(blob);
        const fileId = file.getId();
        const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
        const viewUrl = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;

        return createJsonResponse({
            success: true,
            publicUrl: previewUrl,
            fileId: fileId,
            previewUrl: previewUrl,
            viewUrl: previewUrl
        });
    } catch (err) {
        return createJsonResponse({ success: false, error: 'Error al subir a Google Drive: ' + err.toString() });
    }
}

/**
 * Helper para respuesta JSON con cabeceras CORS
 */
function createJsonResponse(obj) {
    return ContentService
        .createTextOutput(JSON.stringify(obj))
        .setMimeType(ContentService.MimeType.JSON);
}
