# Mis herramientas

**[Descargar para Windows (Setup.exe)](https://github.com/rarianaAina/mes-outils/releases/latest/download/Mes-outils-Setup.exe)** · **[Descargar para Linux (AppImage)](https://github.com/rarianaAina/mes-outils/releases/latest/download/Mes-outils-x86_64.AppImage)** · nada más que instalar

**[Guía de uso ilustrada](docs/GUIDE.md)** · **[Illustrated guide (English)](docs/GUIDE.en.md)**

![Inicio de Mis herramientas](docs/images/fr/accueil.webp)

Un panel de trabajo para Windows y Linux, pensado para quienes gestionan su
actividad de forma independiente: freelancers, asistentes virtuales,
asistentes de dirección, desarrolladores. Una pequeña burbuja flota en la
pantalla y abre, con un clic, tus tareas, contactos, presupuestos y
facturas, gastos, correo, agenda y demás.

En el primer arranque eliges tu perfil profesional y las aplicaciones que
necesitas, como en un ERP. Las demás siguen disponibles en la página
**Aplicaciones**: activarlas o desactivarlas no elimina ningún dato.

Todo funciona en tu PC: un pequeño servidor local (`127.0.0.1:8760`,
inaccesible desde fuera) y una página mostrada en una ventana de Edge sin barra
de direcciones. Ninguna cuenta, ningún servicio en línea. Interfaz en español,
inglés o francés, tema claro, oscuro o rosa, paleta de comandos (Ctrl + K).

## Las aplicaciones

**Cotidiano**
- **Correo**: Gmail, Yahoo, iCloud, Zoho, Fastmail, GMX, OVH, Orange, Free,
  La Poste o cualquier servidor IMAP/SMTP; contraseña en la caja fuerte de
  Windows. Botón «Plantilla» para insertar texto listo para usar.
- **Tareas**: vencimientos, prioridades, etiquetas, subtareas, repeticiones;
  en lista o en tablero (arrastrar y soltar); recordatorio mediante la burbuja.
- **Notas**, **Agenda** (recordatorios por la burbuja), **Contraseñas**
  (caja fuerte cifrada AES-256-GCM, clave derivada de la contraseña maestra
  mediante scrypt).

**Clientes y ventas**
- **Misiones**: ofertas freelance y teletrabajo (Remotive, Remote OK,
  Himalayas, Jobicy, We Work Remotely) ordenadas según lo que buscas
  (ámbitos, tipo, zonas, nivel, salario, palabras clave), seguimiento de
  candidaturas.
- **Contactos**: personas y empresas, historial de mensajes, recordatorios,
  importación y exportación CSV.
- **Presupuestos y facturas**: numeración automática, IVA con varios tipos,
  descuentos, notas de crédito, pagos parciales, PDF, recordatorio de impagos,
  importación de horas de Tiempo. Incluye impuestos canadienses (TPS, TVQ, TVH,
  TVP) y dólar canadiense. Cantidades calculadas hasta el último céntimo.
- **Gastos**: presupuesto del mes, gastos fijos, ahorro, estadísticas, gastos
  con justificantes y exportación CSV.
- **Tiempo**: cronómetro por proyecto o cliente, Pomodoro y exportación para
  facturación.

**Organización**
- **Documentos**: un archivador con documentos importantes (contratos,
  presupuestos firmados, certificados), ordenados por cliente y con recordatorio
  antes de caducar.
- **Reuniones y desplazamientos**: orden del día, acta enviada por correo,
  acciones transformadas en tareas, trayectos y hoja de ruta.
- **Vencimientos**: suscripciones, contratos, seguros, nombres de dominio;
  recordatorio antes de cada fecha de vencimiento y antes del plazo de
  cancelación.
- **Plantillas de mensajes**: respuestas tipo, recordatorios, confirmaciones,
  con variables completadas al momento del envío.
- **Portapapeles**: los 50 últimos textos copiados (solo en memoria).

**Desarrollo**
- **Proyectos**: proyectos detectados (Node, Python, Django, Docker, Odoo...),
  abiertos en VS Code, terminal o navegador; servidores de desarrollo; estado de
  Git; archivos `.env` guardados en la caja fuerte cifrada.
- **Servidores**, **GitHub** (repositorios, pull requests, incidencias, GitHub
  Actions), **Puertos**, **Docker**, **Probador de API**, **SSH**.

**Herramientas pequeñas**
- **Caja de herramientas** (JWT, Base64, JSON, UUID, expresiones regulares...) y
  **Extractos** (comandos favoritos copiados con un clic).

## Instalación

**Lo más sencillo**: descarga **[Mes-outils-Setup.exe](https://github.com/rarianaAina/mes-outils/releases/latest/download/Mes-outils-Setup.exe)** y
lánzalo. Python y todo lo necesario vienen incluidos, sin permisos de
administrador. Windows puede mostrar «Windows protegió este equipo» (instalador
no firmado): **Información adicional › Ejecutar de todos modos**. Tus ajustes y
datos estarán en `%APPDATA%\Mis herramientas`.

**Linux** (Ubuntu 24.04 y otros): descarga
**[Mes-outils-x86_64.AppImage](https://github.com/rarianaAina/mes-outils/releases/latest/download/Mes-outils-x86_64.AppImage)**, hazlo ejecutable (`chmod +x`) y luego
doble clic. Los datos estarán en `~/.config/mes-outils`, los secretos en el
cajón de claves del escritorio. Se recomienda Google Chrome o Chromium (ventana
sin barra de direcciones, PDF de facturas).

**Desde el código fuente** (para contribuir): Python 3.10+ con tkinter, luego:

```bat
git clone https://github.com/rarianaAina/mes-outils.git
cd mes-outils
installer.bat
```

Los datos quedarán junto al código (`outils.json`, `donnees\`, excluidos del
repositorio). Para usar otro Python que no esté en el PATH: variable
`MES_OUTILS_PYTHON` (ruta a `pythonw.exe`).

**Construir el instalador**: `pip install pyinstaller`, Inno Setup 6 y luego
`powershell -ExecutionPolicy Bypass -File packaging\construire.ps1`. Una etiqueta
`vX.Y.Z` enviada a GitHub lo construye y publica solo (`.github/workflows/version.yml`).

## Añadir una aplicación

Una aplicación es un archivo Python y un archivo JavaScript, sin tocar el resto:
ver [docs/MODULES.md](docs/MODULES.md).

## Pruebas

```bat
python -m unittest discover -s tests
```

## Modo de uso

- [Guía de uso ilustrada](docs/GUIDE.md) ([English](docs/GUIDE.en.md))
- Todo el detalle, pestaña por pestaña: [LISEZMOI.txt](LISEZMOI.txt)

## Licencia

[MIT](LICENSE)
