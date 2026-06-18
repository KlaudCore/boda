// =============================================
// QR CODE CON FALLBACK
// =============================================
function generateQR(code, name) {
    const container = document.getElementById('qrcode');
    if (!container) {
        console.warn('⚠️ Contenedor QR no encontrado.');
        return;
    }

    // Limpiar contenedor
    container.innerHTML = '';

    // Verificar si la librería QR está disponible
    if (typeof QRCode === 'undefined') {
        console.warn('⚠️ Librería QRCode no cargada. Mostrando fallback.');
        container.innerHTML = `<div style="background:white; padding:12px; border-radius:8px; color:black; font-weight:bold;">Código: ${code}</div>`;
        return;
    }

    try {
        new QRCode(container, {
            text: `Invitado: ${name} | Código: ${code}`,
            width: 180,
            height: 180,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    } catch (e) {
        console.error('Error al generar QR:', e);
        container.innerHTML = `<div style="background:white; padding:12px; border-radius:8px; color:black; font-weight:bold;">Código: ${code}</div>`;
    }
}
