// =============================================
// CONFIGURACIÓN DE FIREBASE
// =============================================
// 🔥 REEMPLAZA CON TU CONFIGURACIÓN 🔥
const firebaseConfig = {
    apiKey: "AIzaSyCOuNbjlGbFmO_v1XXlOrv28TcNNrzhqJ0",
    authDomain: "bodas-65995.firebaseapp.com",
    projectId: "bodas-65995",
    storageBucket: "bodas-65995.firebasestorage.app",
    messagingSenderId: "697327379541",
    appId: "1:697327379541:web:f175f278ae4e2815ce60dc"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// =============================================
// VARIABLES GLOBALES
// =============================================
const BASE_URL = 'https://klaudcore.github.io/boda/';
let guests = [];
let menuItems = [];

// =============================================
// ESCUCHAR CAMBIOS EN FIRESTORE (INVITADOS)
// =============================================
function listenToGuests() {
    db.collection('invitados')
        .orderBy('name')
        .onSnapshot((snapshot) => {
            guests = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                guests.push({ id: doc.id, ...data });
            });
            renderTable();
            document.getElementById('syncStatus').innerHTML = '🟢 Conectado a Firebase';
        }, (error) => {
            console.error('Error en la escucha de Firestore:', error);
            document.getElementById('syncStatus').innerHTML = '🔴 Error de conexión';
            showToast('⚠️ Error de conexión con Firebase.');
        });
}

// =============================================
// ESCUCHAR CAMBIOS EN FIRESTORE (MENÚ)
// =============================================
function listenToMenu() {
    db.collection('menu')
        .orderBy('nombre')
        .onSnapshot((snapshot) => {
            menuItems = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                menuItems.push({ id: doc.id, ...data });
            });
            renderMenuGrid();
        }, (error) => {
            console.error('Error al cargar el menú:', error);
            document.getElementById('menuGrid').innerHTML =
                `<p style="color:var(--text-secondary); grid-column:1/-1; text-align:center; padding:20px;">Error al cargar el menú.</p>`;
        });
}

// =============================================
// RENDERIZAR TABLA DE INVITADOS
// =============================================
function renderTable() {
    const tbody = document.getElementById('guestTableBody');
    tbody.innerHTML = '';
    if (guests.length === 0) {
        tbody.innerHTML =
            `<tr><td colspan="10" style="text-align:center; padding:40px; color:var(--text-secondary);">No hay invitados.</td></tr>`;
        updateStats();
        return;
    }

    guests.forEach((guest, index) => {
        const link = `${BASE_URL}?codigo=${guest.code}`;
        let badgeClass = 'badge-status';
        let statusText = '⏳ Pendiente';
        switch (guest.status) {
            case 'sent':
                badgeClass += ' badge-sent';
                statusText = '📨 Enviado';
                break;
            case 'confirmado':
                badgeClass += ' badge-confirmed';
                statusText = '✅ Confirmado';
                break;
            case 'rechazado':
                badgeClass += ' badge-declined';
                statusText = '❌ No asistirá';
                break;
            default:
                badgeClass += ' badge-pending';
                statusText = '⏳ Pendiente';
        }

        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>${index + 1}</td>
                    <td><strong>${guest.name}</strong></td>
                    <td>Mesa ${guest.table}</td>
                    <td style="font-size:0.8rem; color:var(--text-secondary);">${guest.phone}</td>
                    <td><span class="link-preview" title="${link}">${link}</span></td>
                    <td><span class="${badgeClass}">${statusText}</span></td>
                    <td>${guest.acompanantes || guest.maxGuests || 0}</td>
                    <td>${guest.menu || '—'}</td>
                    <td style="font-size:0.7rem; max-width:100px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${guest.alergias || '—'}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-sm copy-sm" onclick="copyLink('${link}', '${guest.name}')"><i class="fas fa-copy"></i> Link</button>
                            <button class="btn-sm whatsapp-sm" onclick="sendWhatsApp('${guest.phone}', '${guest.name}', '${link}', '${guest.id}')"><i class="fab fa-whatsapp"></i> WhatsApp</button>
                            <button class="btn-sm reset-sm" onclick="resetGuestStatus('${guest.id}')"><i class="fas fa-undo"></i></button>
                            <button class="btn-sm delete-sm" onclick="deleteGuest('${guest.id}')"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    </td>
                `;
        tbody.appendChild(row);
    });
    updateStats();
}

// =============================================
// ACTUALIZAR ESTADÍSTICAS
// =============================================
function updateStats() {
    const total = guests.length;
    const sent = guests.filter(g => g.status === 'sent').length;
    const confirmed = guests.filter(g => g.status === 'confirmado').length;
    const pending = guests.filter(g => g.status === 'pending' || g.status === 'pensando').length;
    const declined = guests.filter(g => g.status === 'rechazado').length;
    document.getElementById('totalCount').textContent = total;
    document.getElementById('sentCount').textContent = sent;
    document.getElementById('confirmedCount').textContent = confirmed;
    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('declinedCount').textContent = declined;
}

// =============================================
// RENDERIZAR GRID DEL MENÚ (CON EMOJIS)
// =============================================
function renderMenuGrid() {
    const grid = document.getElementById('menuGrid');
    if (menuItems.length === 0) {
        grid.innerHTML =
            `<p style="color:var(--text-secondary); grid-column:1/-1; text-align:center; padding:20px;">No hay opciones de menú.</p>`;
        return;
    }

    grid.innerHTML = '';
    menuItems.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'menu-card';
        const emoji = item.icono || '🍽️';
        card.innerHTML = `
                    <div class="menu-icon">${emoji}</div>
                    <div class="menu-name">${item.nombre}</div>
                    <div class="menu-desc">${item.descripcion || ''}</div>
                    <button class="btn-sm" onclick="deleteMenuItem('${item.id}')"><i class="fas fa-trash-alt"></i> Eliminar</button>
                `;
        grid.appendChild(card);
    });
}

// =============================================
// AÑADIR OPCIÓN DE MENÚ
// =============================================
function addMenuItem() {
    const nombre = document.getElementById('menuName').value.trim();
    const descripcion = document.getElementById('menuDesc').value.trim();
    const icono = document.getElementById('menuIcon').value.trim() || '🍽️';

    if (!nombre) {
        showToast('⚠️ El nombre del plato es obligatorio.');
        return;
    }

    db.collection('menu').add({
        nombre,
        descripcion,
        icono,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        showToast(`✅ "${nombre}" añadido al menú.`);
        document.getElementById('menuName').value = '';
        document.getElementById('menuDesc').value = '';
        document.getElementById('menuIcon').value = '🍽️';
    }).catch((error) => {
        console.error('Error al añadir menú:', error);
        showToast('⚠️ Error al añadir la opción de menú.');
    });
}

// =============================================
// ELIMINAR OPCIÓN DE MENÚ
// =============================================
function deleteMenuItem(id) {
    const item = menuItems.find(i => i.id === id);
    if (!item) return;
    if (confirm(`¿Eliminar "${item.nombre}" del menú?`)) {
        db.collection('menu').doc(id).delete()
            .then(() => showToast(`🗑️ "${item.nombre}" eliminado.`))
            .catch(() => showToast('⚠️ Error al eliminar.'));
    }
}

// =============================================
// FUNCIONES CRUD PARA INVITADOS
// =============================================
function generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function addGuestToFirestore(guestData) {
    return db.collection('invitados').add({
        ...guestData,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
}

function updateGuestStatus(id, newStatus) {
    return db.collection('invitados').doc(id).update({
        status: newStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
}

function deleteGuestFromFirestore(id) {
    return db.collection('invitados').doc(id).delete();
}

// =============================================
// ACCIONES DE LA UI (INVITADOS)
// =============================================
function copyLink(link, name) {
    navigator.clipboard.writeText(link).then(() => {
        showToast(`🔗 Link de ${name} copiado`);
    }).catch(() => {
        const input = document.createElement('input');
        input.value = link;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        showToast(`🔗 Link de ${name} copiado`);
    });
}

function sendWhatsApp(phone, name, link, id) {
    const mensaje = `Hola ${name},

Has sido invitado a la boda de Rebeca y Juan.

Fecha: 15 de Diciembre de 2026
Lugar: Jardín del Lago

Confirma tu asistencia aquí:
${link}

¡Te esperamos!`;

    const mensajeCodificado = encodeURIComponent(mensaje);
    window.open(`https://wa.me/${phone}?text=${mensajeCodificado}`, '_blank');

    const guest = guests.find(g => g.id === id);
    if (guest && (guest.status === 'pending' || guest.status === 'pensando')) {
        updateGuestStatus(id, 'sent')
            .then(() => showToast(`📨 Mensaje enviado a ${name}. Estado: Enviado`))
            .catch(() => showToast('⚠️ Error al actualizar el estado.'));
    } else if (guest) {
        showToast(`💬 Chat abierto con ${name} (${guest.status})`);
    } else {
        showToast(`💬 Chat abierto con ${name}`);
    }
}

function resetGuestStatus(id) {
    const guest = guests.find(g => g.id === id);
    if (!guest) return;
    if (confirm(`¿Reiniciar estado de ${guest.name} a "Pendiente"?`)) {
        updateGuestStatus(id, 'pending')
            .then(() => showToast(`↩️ ${guest.name} reiniciado a Pendiente`))
            .catch(() => showToast('⚠️ Error al reiniciar el estado.'));
    }
}

function deleteGuest(id) {
    const guest = guests.find(g => g.id === id);
    if (!guest) return;
    if (confirm(`⚠️ ¿Estás seguro de eliminar a ${guest.name}?`)) {
        deleteGuestFromFirestore(id)
            .then(() => showToast(`🗑️ ${guest.name} eliminado.`))
            .catch(() => showToast('⚠️ Error al eliminar el invitado.'));
    }
}

// =============================================
// REINICIAR DATOS (EJEMPLO)
// =============================================
function resetAllData() {
    if (!confirm('⚠️ ¿Seguro que quieres reiniciar los datos de ejemplo? Esto eliminará todos los invitados actuales.'))
        return;

    const batch = db.batch();
    guests.forEach(guest => {
        const docRef = db.collection('invitados').doc(guest.id);
        batch.delete(docRef);
    });
    batch.commit().then(() => {
        const sampleGuests = [
            { code: 'ABX92', name: 'Carlos Pérez', table: 12, phone: '5215512345678',
                email: 'carlos@mail.com', maxGuests: 2, status: 'pending' },
            { code: 'CDY33', name: 'Ana García', table: 8, phone: '5215587654321', email: 'ana@mail.com',
                maxGuests: 1, status: 'pensando' },
            { code: 'EFZ44', name: 'Pedro Ruiz', table: 12, phone: '5215533221144', email: 'pedro@mail.com',
                maxGuests: 0, status: 'rechazado' },
            { code: 'GHW77', name: 'Marta López', table: 5, phone: '5215544112233', email: 'marta@mail.com',
                maxGuests: 1, status: 'pending' },
            { code: 'JKL88', name: 'Luis Fernández', table: 7, phone: '5215566778899', email: 'luis@mail.com',
                maxGuests: 2, status: 'sent' },
            { code: 'MNO99', name: 'Sofía Ramírez', table: 3, phone: '5215599887766', email: 'sofia@mail.com',
                maxGuests: 1, status: 'confirmado' }
        ];

        const promises = sampleGuests.map(g => db.collection('invitados').add({
            ...g,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }));

        Promise.all(promises)
            .then(() => showToast('🔄 Datos de ejemplo cargados.'))
            .catch(() => showToast('⚠️ Error al cargar datos de ejemplo.'));
    }).catch(() => showToast('⚠️ Error al reiniciar datos.'));
}

// =============================================
// DESCARGA DE PLANTILLA CSV
// =============================================
function downloadTemplate() {
    const content = 'Nombre,Email,Teléfono,Mesa Asignada,Máximo Acompañantes\nJuan Pérez,juan@mail.com,5215512345678,1,2\nMaría Gómez,maria@mail.com,5215587654321,2,1\nCarlos Ruiz,carlos@mail.com,5215533221144,3,0';
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_invitados.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📥 Plantilla descargada.');
}

// =============================================
// MODAL AÑADIR INVITADO
// =============================================
const modal = document.getElementById('addModal');
document.getElementById('openAddModal').addEventListener('click', () => modal.classList.add('active'));
document.getElementById('closeModalBtn').addEventListener('click', () => modal.classList.remove('active'));
modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });

document.getElementById('addManualBtn').addEventListener('click', () => {
    const name = document.getElementById('newName').value.trim();
    const phone = document.getElementById('newPhone').value.trim();
    const email = document.getElementById('newEmail').value.trim();
    const table = parseInt(document.getElementById('newTable').value) || 1;
    const maxGuests = parseInt(document.getElementById('newMaxGuests').value) || 0;

    if (!name || !phone) { showToast('⚠️ Nombre y teléfono son obligatorios.'); return; }

    const newGuest = {
        code: generateCode(),
        name,
        phone,
        email: email || 'sin-email@mail.com',
        table,
        maxGuests,
        status: 'pending'
    };

    addGuestToFirestore(newGuest)
        .then(() => {
            modal.classList.remove('active');
            showToast(`✅ ${name} añadido correctamente.`);
            document.getElementById('newName').value = '';
            document.getElementById('newPhone').value = '';
            document.getElementById('newEmail').value = '';
            document.getElementById('newTable').value = '';
            document.getElementById('newMaxGuests').value = '';
        })
        .catch(() => showToast('⚠️ Error al añadir el invitado.'));
});

const fileInput = document.getElementById('fileInput');
const fileUploadArea = document.getElementById('fileUploadArea');
fileUploadArea.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', function(e) {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) { showToast('⚠️ Archivo vacío.'); return; }
        const imported = [];
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim());
            if (cols.length < 5) continue;
            const name = cols[0],
                email = cols[1],
                phone = cols[2];
            const table = parseInt(cols[3]) || 1;
            const maxGuests = parseInt(cols[4]) || 0;
            if (name) {
                imported.push({
                    code: generateCode(),
                    name,
                    phone,
                    email: email || 'sin-email@mail.com',
                    table,
                    maxGuests,
                    status: 'pending'
                });
            }
        }
        if (imported.length === 0) { showToast('⚠️ No se encontraron datos.'); return; }

        const promises = imported.map(g => db.collection('invitados').add(g));
        Promise.all(promises)
            .then(() => {
                modal.classList.remove('active');
                showToast(`✅ ${imported.length} invitados importados.`);
                fileInput.value = '';
            })
            .catch(() => showToast('⚠️ Error al importar.'));
    };
    reader.readAsText(file);
});

// =============================================
// TEMA OSCURO / CLARO
// =============================================
const themeToggle = document.getElementById('themeToggle');
const iconTheme = themeToggle.querySelector('i');

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        iconTheme.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark-mode');
        iconTheme.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
    }
}
applyTheme(localStorage.getItem('theme') || 'light');
themeToggle.addEventListener('click', () => {
    applyTheme(document.body.classList.contains('dark-mode') ? 'light' : 'dark');
});

// =============================================
// TOAST
// =============================================
function showToast(message) {
    const toast = document.getElementById('toastDash');
    document.getElementById('toastMessage').textContent = message;
    toast.classList.add('show');
    clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(() => toast.classList.remove('show'), 3500);
}

// =============================================
// INICIALIZAR CON AUTENTICACIÓN ANÓNIMA ✅
// =============================================

// 🔥 PASO 1: Autenticamos al usuario anónimo
firebase.auth().signInAnonymously()
    .then((userCredential) => {
        console.log('✅ Autenticación anónima exitosa. UID:', userCredential.user.uid);
        document.getElementById('syncStatus').innerHTML = '🟢 Conectado (Anónimo)';
        
        // 🔥 PASO 2: SOLO DESPUÉS de autenticar, conectamos a Firestore
        listenToGuests();
        listenToMenu();

        // 🔥 PASO 3: Configuramos los eventos de los botones
        document.getElementById('resetDataBtn').addEventListener('click', resetAllData);
        document.getElementById('downloadTemplateBtn').addEventListener('click', downloadTemplate);
        document.getElementById('addMenuBtn').addEventListener('click', addMenuItem);
        document.getElementById('menuName').addEventListener('keypress', (e) => { if (e.key === 'Enter') addMenuItem(); });
        document.getElementById('menuDesc').addEventListener('keypress', (e) => { if (e.key === 'Enter') addMenuItem(); });

        console.log('🚀 Dashboard con gestión de menú conectado a Firebase vía Auth Anónima.');
    })
    .catch((error) => {
        console.error('❌ Error en autenticación anónima:', error);
        document.getElementById('syncStatus').innerHTML = '🔴 Error de autenticación';
        showToast('⚠️ No se pudo autenticar. Revisa la consola.');
    });
