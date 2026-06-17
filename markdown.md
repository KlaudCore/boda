# Invitación Digital PWA · Rebeca & Juan

Sistema completo de invitaciones digitales con panel de administración y página para invitados.  
Ideal para bodas, eventos corporativos o fiestas privadas.

## 🚀 Características

- **Dashboard** con lista de invitados, estados (pendiente, enviado, confirmado, pensando, rechazado).
- **Envío de invitaciones por WhatsApp** con enlace personalizado.
- **Página del invitado** con diseño elegante (glassmorphism), cuenta regresiva, menú, alergias y código QR.
- **Actualización en tiempo real** mediante polling (cada 5 segundos).
- **Tema oscuro/claro** con persistencia.
- **Importación de CSV** y añadido manual de invitados.
- **Almacenamiento local** (localStorage) para pruebas rápidas.

## 📦 Despliegue en GitHub Pages

1. Sube estos archivos a un repositorio en GitHub.
2. Ve a **Settings > Pages** y selecciona la rama `main` o `master`.
3. La página estará disponible en `https://<tu-usuario>.github.io/<nombre-repo>/`
4. El Dashboard se abrirá automáticamente al acceder a la raíz.

## 🔧 Uso

1. Abre `admin.html` (o la URL de GitHub Pages).
2. Añade invitados manualmente o importa un CSV.
3. Copia el enlace de cada invitado y envíalo por WhatsApp usando el botón correspondiente.
4. Los invitados abren su enlace, confirman asistencia y el Dashboard se actualiza automáticamente.

## 📁 Estructura de archivos

- `index.html` – Redirige al Dashboard.
- `admin.html` – Panel de control.
- `invitacion.html` – Página del invitado.
- `plantilla.csv` – Ejemplo de importación.
- `README.md` – Este archivo.

## 🛠️ Personalización

- Cambia la imagen de fondo en `:root { --bg-image: url(...) }`.
- Ajusta la fecha del evento en `targetDate` (ambos archivos).
- Modifica los nombres de los novios en el título y en el mensaje de WhatsApp.

## 📝 Nota

Para uso en producción, se recomienda reemplazar `localStorage` por una base de datos real (Firebase, MySQL, etc.) para que los datos persistan entre dispositivos.