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
const targetDate = new Date('December 15, 2026 18:00:00').getTime();
let currentGuest = null;
let currentGuests = 0;
let maxAcomp = 0;
let menuItems = [];
let isLoading = false;

// =============================================
// LEER CÓDIGO DE LA URL
// =============================================
function getCodeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('codigo');
}

// =============================================
// CARGAR DATOS DEL INVITADO
// =============================================
function loadGuestData(callback) {
    const code = getCodeFromURL();
    if (!code) {
        if (callback) callback(null);
        return;
    }

    isLoading = true;
    db.collection('invitados')
        .where('code', '==', code)
        .get()
        .then((querySnapshot) => {
            isLoading = false;
            if (querySnapshot.empty) {
                if (callback) callback(null);
                return;
            }
            const doc = querySnapshot.docs[0];
            const data = doc.data();
            currentGuest = {
                id: doc.id,
                ...data
            };
            if (callback) callback(currentGuest);
        })
        .catch((error) => {
            isLoading = false;
            console.error('Error al cargar datos:', error);
            if (callback) callback(null);
        });
}

// =============================================
// CARGAR MENÚ DESDE FIRESTORE
// =============================================
function loadMenu() {
    db.collection('menu')
        .orderBy('nombre')
        .get()
        .then((snapshot) => {
            menuItems = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                menuItems.push({
                    id: doc.id,
                    ...data
                });
            });
            renderMenuOptions();
        })
        .catch((error) => {
            console.error('Error al cargar menú:', error);
            document.getElementById('menuOptions').innerHTML =
                `<p style="color:var(--text-secondary); grid-column:1/-1; text-align:center; padding:10px;">Error al cargar el menú.</p>`;
        });
}

// =============================================
// RENDERIZAR OPCIONES DE MENÚ
// =============================================
function renderMenuOptions() {
    const container = document.getElementById('menuOptions');
    if (menuItems.length === 0) {
        container.innerHTML =
            `<p style="color:var(--text-secondary); grid-column:1/-1; text-align:center; padding:10px;">No hay opciones de menú disponibles.</p>`;
        return;
    }

    container.innerHTML = '';
    const selectedMenu = currentGuest?.menu || null;

    menuItems.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'menu-item';
        if (selectedMenu && item.nombre === selectedMenu) {
            div.classList.add('selected');
        }
        const emoji = item.icono || '🍽️';
        div.innerHTML = `
                    <span style="font-size:2.2rem; display:block; line-height:1.2;">${emoji}</span>
                    ${item.nombre}
                    ${item.descripcion ? `<small>${item.descripcion}</small>` : ''}
                `;
        div.dataset.menu = item.nombre;
        div.addEventListener('click', function() {
            document.querySelectorAll('.menu-options .menu-item').forEach(m => m.classList.remove('selected'));
            this.classList.add('selected');
        });
        container.appendChild(div);
    });
}

// =============================================
// RENDERIZAR INVITACIÓN
// =============================================
function renderInvitation(guest) {
    if (!guest) {
        document.getElementById('main-app').innerHTML = `
                    <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; color:var(--texto-principal); text-align:center; padding:40px;">
                        <i class="bi bi-exclamation-triangle" style="font-size:3rem; color:var(--dorado); margin-bottom:20px;"></i>
                        <h2>Invitación no válida</h2>
                        <p style="color:var(--texto-secundario); margin-top:10px;">El código no es válido o ha expirado.</p>
                        <p style="color:var(--texto-secundario); font-size:0.8rem; margin-top:20px;">Código: ${getCodeFromURL() || 'Ninguno'}</p>
                    </div>
                `;
        document.getElementById('splash').classList.add('hide');
        document.getElementById('main-app').classList.add('active');
        return;
    }

    currentGuests = guest.maxGuests || 0;
    maxAcomp = guest.maxGuests || 0;

    document.getElementById('guestName').innerHTML = `${guest.name} <i class="bi bi-crown"></i>`;
    document.getElementById('badgeMesa').textContent = `Mesa ${guest.table}`;
    document.getElementById('homeMesa').textContent = guest.table;
    document.getElementById('homeAcomp').textContent = guest.maxGuests;
    document.getElementById('qrName').textContent = guest.name;
    document.getElementById('qrMesa').textContent = guest.table;
    document.getElementById('maxAcompLabel').textContent = guest.maxGuests;

    const savedGuests = guest.acompanantes || guest.maxGuests;
    currentGuests = savedGuests;
    document.getElementById('guestCount').textContent = currentGuests;

    generateQR(guest.code, guest.name);

    if (menuItems.length === 0) {
        loadMenu();
    } else {
        renderMenuOptions();
    }

    const confirmBtn = document.getElementById('confirmRsvp');
    const rsvpYes = document.getElementById('rsvpYes');
    const rsvpNo = document.getElementById('rsvpNo');
    const rsvpDetails = document.getElementById('rsvpDetails');

    if (guest.status === 'confirmado') {
        rsvpYes.className = 'active-yes';
        rsvpNo.className = '';
        rsvpDetails.style.display = 'block';
        confirmBtn.innerHTML = '<i class="bi bi-check-circle"></i> Ya confirmaste ✅';
        confirmBtn.className = 'btn-confirm confirmed';
        confirmBtn.disabled = true;
    } else if (guest.status === 'rechazado') {
        rsvpNo.className = 'active-no';
        rsvpYes.className = '';
        rsvpDetails.style.display = 'none';
        confirmBtn.innerHTML = '<i class="bi bi-x-circle"></i> No asistirás ❌';
        confirmBtn.className = 'btn-confirm rejected';
        confirmBtn.disabled = true;
    } else {
        rsvpYes.className = 'active-yes';
        rsvpNo.className = '';
        rsvpDetails.style.display = 'block';
        confirmBtn.innerHTML = '<i class="bi bi-save"></i> Guardar confirmación';
        confirmBtn.className = 'btn-confirm';
        confirmBtn.disabled = false;
    }

    document.getElementById('splash').classList.add('hide');
    document.getElementById('main-app').classList.add('active');

    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// =============================================
// COUNTDOWN
// =============================================
function updateCountdown() {
    const now = new Date().getTime();
    const diff = targetDate - now;
    if (diff <= 0) {
        ['days', 'hours', 'minutes', 'seconds'].forEach(id => document.getElementById(id).textContent = '00');
        return;
    }
    document.getElementById('days').textContent = String(Math.floor(diff / (1000 * 60 * 60 * 24))).padStart(2, '0');
    document.getElementById('hours').textContent = String(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0');
    document.getElementById('minutes').textContent = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
    document.getElementById('seconds').textContent = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0');
}

// =============================================
// QR CODE: Generación local + fallback de texto
// =============================================
function generateQR(code, name) {
    console.log('🔍 generateQR ejecutado para:', name, 'código:', code);
    
    const container = document.getElementById('qr-container');
    if (!container) {
        console.error('❌ Contenedor QR no encontrado.');
        return;
    }

    // Buscar o crear el contenedor para el QR (donde se pintará la librería)
    let qrCanvas = document.getElementById('qrCanvasContainer');
    if (!qrCanvas) {
        qrCanvas = document.createElement('div');
        qrCanvas.id = 'qrCanvasContainer';
        qrCanvas.style.display = 'flex';
        qrCanvas.style.justifyContent = 'center';
        qrCanvas.style.alignItems = 'center';
        qrCanvas.style.width = '100%';
        qrCanvas.style.minHeight = '220px';
        // Insertar al inicio del contenedor
        container.prepend(qrCanvas);
    }

    // Limpiar el contenedor del QR (sin eliminar el elemento)
    qrCanvas.innerHTML = '';

    // Asegurar que el fallback esté visible por defecto (si existe)
    const fallback = document.getElementById('qrFallback');
    if (fallback) fallback.style.display = 'block';

    if (!code || !name) {
        // Si no hay datos, mostrar fallback con mensaje
        if (fallback) {
            const codeText = document.getElementById('qrCodeText');
            if (codeText) codeText.textContent = 'Sin código';
            fallback.style.display = 'block';
        }
        console.warn('⚠️ Datos insuficientes para generar QR.');
        return;
    }

    // 1. Intentar usar la librería QRCode.js (local)
    try {
        if (typeof QRCode !== 'undefined') {
            console.log('🔄 Generando QR con QRCode.js...');
            new QRCode(qrCanvas, {
                text: `Invitado: ${name} | Código: ${code}`,
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
            // Si llegamos aquí, el QR se generó bien → ocultar fallback
            if (fallback) fallback.style.display = 'none';
            console.log('✅ QR generado con éxito.');
            return;
        } else {
            console.warn('⚠️ QRCode no definido, usando fallback de texto.');
        }
    } catch (e) {
        console.error('❌ Error al generar QR con QRCode.js:', e);
    }

    // 2. Fallback: mostrar el código en texto
    if (fallback) {
        const codeText = document.getElementById('qrCodeText');
        if (codeText) codeText.textContent = code;
        fallback.style.display = 'block';
        console.log('📝 Mostrando fallback de texto para el QR.');
    }
}

// =============================================
// NAVEGACIÓN TABS (incluye actualización del QR)
// =============================================
document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelectorAll('.bottom-nav .nav-item').forEach(n => n.classList.remove('active'));
        this.classList.add('active');
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(this.dataset.target).classList.add('active');
        if (this.dataset.target === 'page-qr') {
            // Pequeño retraso para asegurar que el DOM se actualice
            setTimeout(() => {
                if (currentGuest) {
                    generateQR(currentGuest.code, currentGuest.name);
                } else {
                    console.warn('⚠️ No hay invitado cargado para generar QR.');
                }
            }, 400);
        }
    });
});

// =============================================
// RSVP LOGIC
// =============================================
const rsvpYes = document.getElementById('rsvpYes');
const rsvpNo = document.getElementById('rsvpNo');
const rsvpDetails = document.getElementById('rsvpDetails');
const confirmBtn = document.getElementById('confirmRsvp');

rsvpYes.addEventListener('click', () => {
    rsvpYes.className = 'active-yes';
    rsvpNo.className = '';
    rsvpDetails.style.display = 'block';
    confirmBtn.innerHTML = '<i class="bi bi-save"></i> Guardar confirmación';
    confirmBtn.className = 'btn-confirm';
    confirmBtn.disabled = false;
});

rsvpNo.addEventListener('click', () => {
    rsvpNo.className = 'active-no';
    rsvpYes.className = '';
    rsvpDetails.style.display = 'none';
    confirmBtn.innerHTML = '<i class="bi bi-x-circle"></i> Confirmar que no asistiré';
    confirmBtn.className = 'btn-confirm';
    confirmBtn.disabled = false;
});

document.getElementById('incGuest').addEventListener('click', () => {
    if (currentGuests < maxAcomp) {
        currentGuests++;
        document.getElementById('guestCount').textContent = currentGuests;
    }
});
document.getElementById('decGuest').addEventListener('click', () => {
    if (currentGuests > 0) {
        currentGuests--;
        document.getElementById('guestCount').textContent = currentGuests;
    }
});

confirmBtn.addEventListener('click', function() {
    if (!currentGuest || this.disabled) return;

    const isAttending = rsvpYes.className.includes('active-yes');
    const newStatus = isAttending ? 'confirmado' : 'rechazado';
    const menuSelected = document.querySelector('.menu-options .menu-item.selected')?.dataset.menu || 'No definido';
    const alergias = document.getElementById('alergiasText').value || 'Ninguna';
    const acompanantes = currentGuests;

    const docRef = db.collection('invitados').doc(currentGuest.id);
    docRef.update({
            status: newStatus,
            menu: menuSelected,
            alergias: alergias,
            acompanantes: acompanantes,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            if (newStatus === 'confirmado') {
                this.innerHTML = '<i class="bi bi-check-circle"></i> Confirmado ✅';
                this.className = 'btn-confirm confirmed';
                showToast('✅ ¡Asistencia confirmada!', `Menú: ${menuSelected}`);
            } else {
                this.innerHTML = '<i class="bi bi-x-circle"></i> No asistirás ❌';
                this.className = 'btn-confirm rejected';
                showToast('❌ Asistencia rechazada', 'Lamentamos no poder contar contigo.');
            }
            this.disabled = true;
        })
        .catch((error) => {
            console.error('Error al actualizar:', error);
            showToast('⚠️ Error', 'No se pudo guardar tu confirmación. Intenta de nuevo.');
        });
});

// =============================================
// TOAST
// =============================================
function showToast(title, detail) {
    const toast = document.getElementById('toast');
    const toastTitle = toast.querySelector('.toast-text h4');
    const toastMsg = toast.querySelector('.toast-text p');
    toastTitle.textContent = title;
    toastMsg.textContent = detail || 'Gracias por tu respuesta.';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
}

document.getElementById('closeToast').addEventListener('click', () => {
    document.getElementById('toast').classList.remove('show');
});

// =============================================
// BOTÓN "ABRIR INVITACIÓN"
// =============================================
document.getElementById('enterApp').addEventListener('click', function() {
    if (isLoading) return;

    if (currentGuest) {
        renderInvitation(currentGuest);
        return;
    }

    if (!getCodeFromURL()) {
        renderInvitation(null);
        return;
    }

    this.textContent = 'Cargando...';
    this.disabled = true;
    loadGuestData((guest) => {
        this.innerHTML = '<i class="bi bi-chevron-right"></i> Abrir invitación';
        this.disabled = false;
        renderInvitation(guest);
    });
});

// =============================================
// PRECARGA SILENCIOSA
// =============================================
window.addEventListener('load', function() {
    if (getCodeFromURL()) {
        loadGuestData(() => {});
        loadMenu();
    }
});

console.log('📱 Página de invitación con Bootstrap Icons y QR local.');
