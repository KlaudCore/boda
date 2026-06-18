// =============================================
// CONFIGURACIÓN DE FIREBASE
// =============================================
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
// RENDERIZAR INVITACIÓN (VERSIÓN MEJORADA)
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

    // Guardar datos del invitado
    currentGuests = guest.maxGuests || 0;
    maxAcomp = guest.maxGuests || 0;

    // Actualizar elementos de la interfaz
    document.getElementById('guestName').innerHTML = `${guest.name} <i class="bi bi-crown"></i>`;
    document.getElementById('badgeMesa').textContent = `Mesa ${guest.table}`;
    document.getElementById('homeMesa').textContent = guest.table;
    document.getElementById('homeAcomp').textContent = guest.maxGuests;
    document.getElementById('qrName').textContent = guest.name;
    document.getElementById('qrMesa').textContent = guest.table;
    document.getElementById('maxAcompLabel').textContent = guest.maxGuests;

    // Configurar acompañantes
    const savedGuests = guest.acompanantes || guest.maxGuests;
    currentGuests = savedGuests;
    document.getElementById('guestCount').textContent = currentGuests;

    // Generar QR
    generateQR(guest.code, guest.name);

    // CARGAR MENÚ INMEDIATAMENTE
    console.log('🔄 Cargando menú...');
    loadMenu(); // <-- Esto es clave, debe ejecutarse siempre

    // Configurar estado del RSVP
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

    // Mostrar la app
    document.getElementById('splash').classList.add('hide');
    document.getElementById('main-app').classList.add('active');

    // Iniciar cuenta regresiva
    updateCountdown();
    setInterval(updateCountdown, 1000);
    
    console.log('✅ Invitación renderizada correctamente');
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
// QR CODE POR API EXTERNA + FALLBACK
// =============================================
function generateQR(code, name) {
    const img = document.getElementById('qrImage');
    const fallback = document.getElementById('qrFallback');
    const codeText = document.getElementById('qrCodeText');

    // Ocultar todo al inicio
    if (img) img.style.display = 'none';
    if (fallback) fallback.style.display = 'none';

    if (!code || !name) {
        if (fallback) {
            codeText.textContent = 'Sin código';
            fallback.style.display = 'block';
        }
        return;
    }

    // Intentar cargar la imagen QR desde API externa
    const data = `Invitado: ${name} | Código: ${code}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}&margin=10`;

    if (img) {
        img.onload = function() {
            img.style.display = 'block';
            if (fallback) fallback.style.display = 'none';
        };
        img.onerror = function() {
            img.style.display = 'none';
            if (fallback) {
                codeText.textContent = code;
                fallback.style.display = 'block';
            }
        };
        img.src = qrUrl;
    } else {
        // Si no hay elemento img, mostrar fallback
        if (fallback) {
            codeText.textContent = code;
            fallback.style.display = 'block';
        }
    }
}

// =============================================
// NAVEGACIÓN TABS
// =============================================
document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelectorAll('.bottom-nav .nav-item').forEach(n => n.classList.remove('active'));
        this.classList.add('active');
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(this.dataset.target).classList.add('active');
        if (this.dataset.target === 'page-qr') {
            setTimeout(() => {
                if (currentGuest) {
                    generateQR(currentGuest.code, currentGuest.name);
                }
            }, 300);
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
// CARGA AUTOMÁTICA MEJORADA
// =============================================
window.addEventListener('load', function() {
    const code = getCodeFromURL();
    
    if (code) {
        // Si hay código, cargamos los datos y mostramos la app directamente
        loadGuestData((guest) => {
            // Esto oculta el splash y muestra #main-app
            renderInvitation(guest);
            
            if (guest) {
                // Si el invitado es válido, cargamos el menú
                loadMenu();
            }
        });
    } else {
        // Si no hay código, mostramos mensaje de error
        renderInvitation(null);
    }
});
