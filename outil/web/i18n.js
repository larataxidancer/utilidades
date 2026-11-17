"use strict";
/* Traduction de l'interface (français → anglais ou espagnol).

   Le texte source est écrit en français. Chaque onglet ajoute ses traductions :
     I18N.ajouter({ "Texte en français": "English text", ... });
     I18N.ajouterEspanol({ "Texte en français": "Texto en español", ... });
     I18N.motifs([[/^(\d+) dépôts?$/, "$1 repositories"], ...]);   // textes variables
   Puis :
     t("Bonjour {nom}", { nom })   → traduit, puis remplace {nom}
   el() (hub.html) traduit tout seul les textes simples, title et placeholder ;
   toast() et confirmer() aussi. La langue vient des Réglages (outils.json). */
window.I18N = (() => {
  const dico = {};
  const dicoEs = {};
  const listeMotifs = [];
  let langue = "fr";

  const PICTO = /[\p{Extended_Pictographic}←-⇿■-◿⌀-⏿]️?/gu;
  const sansPicto = x => typeof x === "string" ? x.replace(PICTO, "").replace(/\s{2,}/g, " ").trim() : x;
  // Début d'un texte qui n'est pas à traduire : emojis, espaces, ponctuation.
  const PREFIXE = /^[^\p{L}\p{N}«"(]+/u;

  function chercher(texte) {
    if (dico[texte] !== undefined) return dico[texte];
    for (const [motif, remplacement] of listeMotifs) {
      if (motif.test(texte)) return texte.replace(motif, remplacement);
    }
    return undefined;
  }

  function buscarEspanol(texte) {
    return dicoEs[texte] !== undefined ? dicoEs[texte] : chercher(texte);
  }

  function buscarIngles(texte) {
    return chercher(texte);
  }

  function traduire(texte) {
    if (langue === "fr" || typeof texte !== "string" || !texte.trim()) return texte;
    const buscar = langue === "es" ? buscarEspanol : buscarIngles;
    const direct = buscar(texte);
    if (direct !== undefined) return direct;
    // « 😕 Message » : on traduit la partie après l'emoji.
    const m = texte.match(PREFIXE);
    if (m && m[0].length < texte.length) {
      const reste = buscar(texte.slice(m[0].length));
      if (reste !== undefined) return m[0] + reste;
    }
    // « Titre : détail » : chaque moitié séparément (messages d'erreur).
    const i = texte.indexOf(" : ");
    if (i > 0) {
      const a = traduire(texte.slice(0, i)), b = traduire(texte.slice(i + 3));
      if (a !== texte.slice(0, i) || b !== texte.slice(i + 3)) return `${a}: ${b}`;
    }
    return texte;
  }

  function t(texte, vars) {
    let s = traduire(texte);
    if (vars) s = s.replace(/\{(\w+)\}/g, (tout, k) => (vars[k] !== undefined ? vars[k] : tout));
    return s;
  }

  return {
    ajouter(d) {
      Object.assign(dico, d);
      // Les emojis des textes sont remplacés par des icônes à l'affichage
      // (hub.html) : chaque traduction existe aussi sans eux.
      for (const [k, v] of Object.entries(d)) {
        const k2 = sansPicto(k), v2 = sansPicto(v);
        if (k2 && k2 !== k && dico[k2] === undefined) dico[k2] = v2;
      }
    },
    ajouterEspanol(d) {
      Object.assign(dicoEs, d);
      for (const [k, v] of Object.entries(d)) {
        const k2 = sansPicto(k), v2 = sansPicto(v);
        if (k2 && k2 !== k && dicoEs[k2] === undefined) dicoEs[k2] = v2;
      }
    },
    motifs(liste) { listeMotifs.push(...liste); },
    t, traduire,
    get langue() { return langue; },
    set langue(v) { langue = ["en", "es"].includes(v) ? v : "fr"; document.documentElement.lang = langue; },
    /** Locale des dates et des nombres. */
    locale() { return langue === "en" ? "en-GB" : langue === "es" ? "es-ES" : "fr-FR"; },
    /** Traduit les textes déjà écrits dans la page (hub.html). */
    traduirePage(racine = document.body) {
      if (langue === "fr") return;
      const marcheur = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT);
      const noeuds = [];
      while (marcheur.nextNode()) noeuds.push(marcheur.currentNode);
      for (const n of noeuds) {
        const brut = n.nodeValue, coupe = brut.trim();
        // translate="no" : un nom propre (le nom de l'application) ne se traduit pas.
        if (!coupe || n.parentElement?.closest("script,style,[translate='no']")) continue;
        const tr = traduire(coupe);
        if (tr !== coupe) n.nodeValue = brut.replace(coupe, tr);
      }
      const attributs = ["title", "placeholder", "aria-label"];
      [racine, ...racine.querySelectorAll("[title],[placeholder],[aria-label]")].forEach(e => {
        for (const a of attributs) if (e.hasAttribute?.(a)) e.setAttribute(a, traduire(e.getAttribute(a)));
      });
    },
  };
})();
window.t = window.I18N.t;

/* ---------------------------------------------------------------------------
   hub.html : en-tête, accueil, tuiles, serveurs Odoo, fenêtres communes.
   (Les onglets ont leur propre dictionnaire dans outil/web/<nom>.js.)
   --------------------------------------------------------------------------- */
I18N.ajouter({
  // descriptions des applications (page Applications, assistant de démarrage)
  "Votre boîte mail (Gmail, Yahoo, OVH…) : lire, répondre, écrire.": "Your mailbox (Gmail, Yahoo, OVH…): read, reply, write.",
  "Notes en cartes ou listes à cocher, épinglées, avec rappel.": "Notes as cards or checklists, pinned, with reminders.",
  "Rendez-vous de la semaine et du mois, rappels par la bulle.": "Appointments for the week and month, reminders from the bubble.",
  "Coffre chiffré pour vos mots de passe et codes.": "Encrypted vault for your passwords and codes.",
  "Chrono par projet ou client, Pomodoro, export pour la facturation.": "Timer per project or client, Pomodoro, export for invoicing.",
  "Les derniers textes copiés, pour les retrouver en un clic.": "Your latest copied texts, one click away.",
  "Vos commandes et bouts de code favoris.": "Your favourite commands and code snippets.",
  "JWT, JSON, Base64, UUID, expressions régulières…": "JWT, JSON, Base64, UUID, regular expressions…",
  "Vos serveurs de dev et vos serveurs Odoo : démarrer, arrêter, journal.": "Your dev servers and Odoo servers: start, stop, log.",
  "Vos projets : VS Code, terminal, serveurs de dev, état Git.": "Your projects: VS Code, terminal, dev servers, Git status.",
  "Dépôts, pull requests, issues, état des tests GitHub.": "Repositories, pull requests, issues, GitHub test status.",
  "Quel programme occupe tel port, et l'arrêter.": "Which program uses a port, and stop it.",
  "Conteneurs Docker : démarrer, arrêter, journaux.": "Docker containers: start, stop, logs.",
  "Tester une API : requêtes, réponses, historique.": "Test an API: requests, responses, history.",
  "Une clé par serveur, posée en un clic.": "One key per server, installed in one click.",
  "Réunions et trajets": "Meetings and trips",
  "{n} mails non lus": "{n} unread emails",
  // en-tête
  "Coucou !": "Hi there!",
  "Bonjour": "Hello",
  "Bonne nuit": "Good night",
  "Bon après-midi": "Good afternoon",
  "Bonsoir": "Good evening",
  "Arrêter le tableau de bord": "Close the dashboard",
  "Que fait-on aujourd'hui ?": "What are we doing today?",
  "Tout est prêt, à vous de jouer ✨": "Everything is ready, over to you ✨",
  "Une facture à envoyer ? 🧾": "An invoice to send? 🧾",
  "Les serveurs vous attendent 🐘": "The servers are waiting for you 🐘",
  "Un café, et c'est parti ☕": "A coffee, and off we go ☕",
  "Belle journée de code ! 🚀": "Have a great coding day! 🚀",
  // menu
  "Accueil": "Home",
  "Mails": "Mail",
  "Notes": "Notes",
  "Agenda": "Calendar",
  "Mots de passe": "Passwords",
  "GitHub": "GitHub",
  "SSH": "SSH",
  "Au quotidien": "Everyday",
  "Développement": "Development",
  "Petits outils": "Handy tools",
  // accueil
  "Mes outils": "My tools",
  "Mes outils · tout tourne sur ce PC ·": "Mes outils · everything runs on this PC ·",
  "Ajouter, modifier ou retirer des outils": "Add, edit or remove tools",
  "✏️ Modifier": "✏️ Edit",
  "✅ Terminé": "✅ Done",
  "Aujourd'hui": "Today",
  "Demain": "Tomorrow",
  "Jour": "Day",
  "Rendez-vous": "Appointment",
  "Rien de prévu, profitez-en 🌴": "Nothing planned, enjoy 🌴",
  "Notes épinglées": "Pinned notes",
  "Note": "Note",
  "Épinglez une note pour la retrouver ici": "Pin a note to find it here",
  "mail non lu": "unread email",
  "mails non lus": "unread emails",
  // tuiles
  "En marche": "Running",
  "Prêt à lancer": "Ready to launch",
  "Introuvable": "Not found",
  "Introuvable.": "Not found.",
  "Sans nom": "Untitled",
  "Modifier": "Edit",
  "Retirer": "Remove",
  "Ajouter un outil": "Add a tool",
  "c'est parti !": "here we go!",
  "Retirer « {nom} » ?": "Remove “{nom}”?",
  "La tuile disparaît du tableau de bord. Le dossier ou le programme n'est pas touché.":
    "The tile disappears from the dashboard. The folder or program is not touched.",
  "Tuile retirée": "Tile removed",
  "Dossier": "Folder",
  "Fichier / programme": "File / program",
  "Page web": "Web page",
  "Appli locale": "Local app",
  "Chemin du dossier, ex. C:\\Users\\vous\\Documents": "Folder path, e.g. C:\\Users\\you\\Documents",
  "Chemin d'un fichier, d'un .exe ou d'un .bat": "Path of a file, an .exe or a .bat",
  "Adresse, ex. https://www.odoo.com": "Address, e.g. https://www.odoo.com",
  "Adresse de l'appli, ex. http://127.0.0.1:8765/": "App address, e.g. http://127.0.0.1:8765/",
  "Adresse": "Address",
  "Chemin": "Path",
  "Ouvrir dans sa propre fenêtre (sans barre d'adresse), comme une application":
    "Open in its own window (no address bar), like an app",
  "Port de l'appli": "App port",
  "ex. 8765": "e.g. 8765",
  "Commande de démarrage (un élément par ligne)": "Start command (one item per line)",
  "Lancée seulement si rien ne répond sur le port.": "Only run if nothing answers on the port.",
  "✏️ Modifier l'outil": "✏️ Edit the tool",
  "✨ Nouvel outil": "✨ New tool",
  "Nom": "Name",
  "ex. Comptes rendus": "e.g. Meeting minutes",
  "Petite description": "Short description",
  "ex. Mes notes de réunion": "e.g. My meeting notes",
  "Emoji": "Emoji",
  "Couleur": "Colour",
  "Ce qu'il ouvre": "What it opens",
  "Donnez-lui un nom 😉": "Give it a name 😉",
  "Indiquez ce qu'il faut ouvrir": "Say what to open",
  "✏️ Outil modifié": "✏️ Tool updated",
  "🎉 Nouvel outil ajouté !": "🎉 New tool added!",
  "WhatsApp Web dans sa propre fenêtre": "WhatsApp Web in its own window",
  // serveurs Odoo
  "Serveurs Odoo": "Odoo servers",
  "Ouvrir le gadget « Serveurs Odoo » (ajouter un serveur, comptes…)": "Open the “Odoo servers” gadget (add a server, accounts…)",
  "🧩 Gadget complet": "🧩 Full gadget",
  "Lecture des serveurs…": "Reading the servers…",
  "serveurs vérifiés à {heure}": "servers checked at {heure}",
  "Impossible de lire les serveurs": "Unable to read the servers",
  "Aucun serveur : ajoutez-en depuis le gadget complet.": "No server: add some from the full gadget.",
  "{n} / {total} en marche": "{n} / {total} running",
  "Démarrage…": "Starting…",
  "Arrêté": "Stopped",
  "Port occupé (autre programme)": "Port in use (another program)",
  "référence": "reference",
  "Fichier de configuration": "Configuration file",
  "Démarrer": "Start",
  "Arrêter": "Stop",
  "Ouvrir dans le navigateur": "Open in the browser",
  "Journal": "Log",
  "Base de référence": "Reference database",
  "« {base} » ne doit pas être modifiée. Démarrer quand même son serveur ?": "“{base}” must not be modified. Start its server anyway?",
  "Arrêter {base} ?": "Stop {base}?",
  "Seul le serveur Odoo du port {port} est arrêté.": "Only the Odoo server on port {port} is stopped.",
  "Serveur pas prêt": "Server not ready",
  "Il ne répond pas encore. Ouvrir quand même ?": "It is not answering yet. Open anyway?",
  "Ouvrir": "Open",
  "{base} démarre…": "{base} is starting…",
  "{base} arrêté": "{base} stopped",
  // fermeture
  "Fermer le tableau de bord ?": "Close the dashboard?",
  "Les serveurs Odoo et les outils déjà lancés continuent de tourner.": "Odoo servers and tools already launched keep running.",
  "Fermer": "Close",
  "À bientôt !": "See you soon!",
  "Vous pouvez fermer cette fenêtre.": "You can close this window.",
  // fenêtres et messages communs
  "Annuler": "Cancel",
  "Oui": "Yes",
  "Enregistrer": "Save",
  "Ajouter": "Add",
  "Choisir un dossier": "Choose a folder",
  "📋 Copié": "📋 Copied",
  "Copie impossible": "Copy failed",
  "Accès refusé.": "Access denied.",
  "Erreur inattendue": "Unexpected error",
});
I18N.motifs([[/^Erreur (\d+)$/, "Error $1"]]);

I18N.ajouterEspanol({
  "Peso colombien (COP)": "Peso colombiano (COP)",
  "Peso colombien": "Peso colombiano",
  "Votre boîte mail (Gmail, Yahoo, OVH…) : lire, répondre, écrire.": "Tu correo (Gmail, Yahoo, OVH…): leer, responder y escribir.",
  "Notes en cartes ou listes à cocher, épinglées, avec rappel.": "Notas en tarjetas o listas de tareas, fijadas y con recordatorios.",
  "Rendez-vous de la semaine et du mois, rappels par la bulle.": "Citas de la semana y del mes, con recordatorios en la burbuja.",
  "Coffre chiffré pour vos mots de passe et codes.": "Bóveda cifrada para tus contraseñas y códigos.",
  "Chrono par projet ou client, Pomodoro, export pour la facturation.": "Temporizador por proyecto o cliente, Pomodoro y exportación para facturar.",
  "Les derniers textes copiés, pour les retrouver en un clic.": "Los últimos textos copiados, para encontrarlos con un clic.",
  "Vos commandes et bouts de code favoris.": "Tus comandos y fragmentos de código favoritos.",
  "JWT, JSON, Base64, UUID, expressions régulières…": "JWT, JSON, Base64, UUID, expresiones regulares…",
  "Vos serveurs de dev et vos serveurs Odoo : démarrer, arrêter, journal.": "Tus servidores de desarrollo y Odoo: iniciar, detener y consultar el registro.",
  "Vos projets : VS Code, terminal, serveurs de dev, état Git.": "Tus proyectos: VS Code, terminal, servidores de desarrollo y estado de Git.",
  "Dépôts, pull requests, issues, état des tests GitHub.": "Repositorios, pull requests, incidencias y estado de las pruebas de GitHub.",
  "Quel programme occupe tel port, et l'arrêter.": "Qué programa está usando un puerto y cómo detenerlo.",
  "Conteneurs Docker : démarrer, arrêter, journaux.": "Contenedores Docker: iniciar, detener y consultar los registros.",
  "Tester une API : requêtes, réponses, historique.": "Probar una API: solicitudes, respuestas e historial.",
  "Une clé par serveur, posée en un clic.": "Una clave por servidor, instalada con un clic.",
  "Réunions et trajets": "Reuniones y desplazamientos",
  "{n} mails non lus": "{n} correos sin leer",
  "Coucou !": "¡Hola!",
  "Bonjour": "Buenos días",
  "Bonne nuit": "Buenas noches",
  "Bon après-midi": "Buenas tardes",
  "Bonsoir": "Buenas noches",
  "Arrêter le tableau de bord": "Cerrar el panel",
  "Que fait-on aujourd'hui ?": "¿Qué hacemos hoy?",
  "Tout est prêt, à vous de jouer ✨": "Todo está listo, ¡adelante! ✨",
  "Une facture à envoyer ? 🧾": "¿Hay alguna factura que enviar? 🧾",
  "Les serveurs vous attendent 🐘": "Los servidores te esperan 🐘",
  "Un café, et c'est parti ☕": "Un café y empezamos ☕",
  "Belle journée de code ! 🚀": "¡Que tengas un gran día de código! 🚀",
  "Accueil": "Inicio",
  "Mails": "Correo",
  "Notes": "Notas",
  "Agenda": "Agenda",
  "Mots de passe": "Contraseñas",
  "Au quotidien": "Día a día",
  "Développement": "Desarrollo",
  "Petits outils": "Herramientas",
  "Mes outils": "Mis herramientas",
  "Mes outils · tout tourne sur ce PC ·": "Mes outils · todo funciona en este equipo ·",
  "Ajouter, modifier ou retirer des outils": "Añadir, modificar o quitar herramientas",
  "✏️ Modifier": "✏️ Modificar",
  "✅ Terminé": "✅ Listo",
  "Aujourd'hui": "Hoy",
  "Demain": "Mañana",
  "Jour": "Día",
  "Rendez-vous": "Cita",
  "Rien de prévu, profitez-en 🌴": "No hay nada previsto, ¡disfrútalo! 🌴",
  "Notes épinglées": "Notas fijadas",
  "Épinglez une note pour la retrouver ici": "Fija una nota para encontrarla aquí",
  "mail non lu": "correo sin leer",
  "mails non lus": "correos sin leer",
  "En marche": "En ejecución",
  "Prêt à lancer": "Listo para iniciar",
  "Introuvable": "No encontrado",
  "Introuvable.": "No encontrado.",
  "Sans nom": "Sin título",
  "Modifier": "Modificar",
  "Retirer": "Quitar",
  "Ajouter un outil": "Añadir una herramienta",
  "c'est parti !": "¡adelante!",
  "Retirer « {nom} » ?": "¿Quitar « {nom} »?",
  "Tuile retirée": "Acceso quitado",
  "Dossier": "Carpeta",
  "Fichier / programme": "Archivo / programa",
  "Page web": "Página web",
  "Appli locale": "Aplicación local",
  "Adresse": "Dirección",
  "Chemin": "Ruta",
  "Port de l'appli": "Puerto de la aplicación",
  "ex. 8765": "p. ej., 8765",
  "Commande de démarrage (un élément par ligne)": "Comando de inicio (un elemento por línea)",
  "Nom": "Nombre",
  "Emoji": "Emoji",
  "Couleur": "Color",
  "Ce qu'il ouvre": "Qué abre",
  "Démarrer": "Iniciar",
  "Arrêter": "Detener",
  "Ouvrir dans le navigateur": "Abrir en el navegador",
  "Journal": "Registro",
  "Base de référence": "Base de referencia",
  "Serveurs Odoo": "Servidores Odoo",
  "🧩 Gadget complet": "🧩 Panel completo",
  "Lecture des serveurs…": "Leyendo los servidores…",
  "Impossible de lire les serveurs": "No se pudieron leer los servidores",
  "Démarrage…": "Iniciando…",
  "Arrêté": "Detenido",
  "Port occupé (autre programme)": "Puerto ocupado (otro programa)",
  "Fermer le tableau de bord ?": "¿Cerrar el panel?",
  "Fermer": "Cerrar",
  "À bientôt !": "¡Hasta pronto!",
  "Vous pouvez fermer cette fenêtre.": "Puedes cerrar esta ventana.",
  "Thème clair ou sombre": "Tema claro u oscuro",
  "Thème : clair": "Tema: claro",
  "Thème : sombre": "Tema: oscuro",
  "Thème : rosa": "Tema: rosa",
  "Thème clair": "Tema claro",
  "Thème sombre": "Tema oscuro",
  "Thème rose": "Tema rosa",
  "Thème : automatique (comme le système)": "Tema: automático (como el sistema)",
  "Thème automatique (comme le système)": "Tema automático (como el sistema)",
  "Rechercher…": "Buscar…",
  "Rechercher un onglet, un outil, une action (Ctrl + K)": "Buscar una pestaña, una herramienta o una acción (Ctrl + K)",
  "Aller à un onglet, lancer un outil, une action…": "Ir a una pestaña, abrir una herramienta o ejecutar una acción…",
  "Onglets": "Pestañas",
  "Mes outils": "Mis herramientas",
  "Actions": "Acciones",
  "Rien trouvé": "No se encontró nada",
  "choisir": "seleccionar",
  "ouvrir": "abrir",
  "fermer": "cerrar",
  "Entrée": "Intro",
  "Échap": "Esc",
  "Palette de commandes": "Paleta de comandos",
  "Serveurs des projets": "Servidores de proyectos",
  "Serveurs": "Servidores",
  "🔄 Actualiser": "🔄 Actualizar",
  "Aucun serveur pour l'instant. Dans l'onglet Projets, ouvrez un projet puis « Configurer » pour ajouter ses serveurs de dev.":
    "Todavía no hay servidores. En la pestaña Proyectos, abre un proyecto y usa «Configurar» para añadir sus servidores de desarrollo.",
  "Le gadget « Serveurs Odoo » ne se charge pas : {e}": "El complemento de «Servidores Odoo» no carga: {e}",
  "📦 Projets": "📦 Proyectos",
  "Code": "Código",
  "projet à envoyer": "proyecto para enviar",
  "projets à envoyer": "proyectos para enviar",
  "projet modifié": "proyecto modificado",
  "projets modifiés": "proyectos modificados",
  "projet en retard": "proyecto atrasado",
  "projets en retard": "proyectos atrasados",
  "test GitHub en échec": "comprobación de GitHub fallida",
  "tests GitHub en échec": "comprobaciones de GitHub fallidas",
  "Tout est envoyé, rien en attente ✨": "Todo está enviado, no hay nada pendiente ✨",
  "Chrono en cours": "Temporizador en curso",
  "Le programme lancé par Mes outils est arrêté.": "El programa iniciado por Mes outils se ha detenido.",
  "Annuler": "Cancelar",
  "Oui": "Sí",
  "Enregistrer": "Guardar",
  "Ajouter": "Añadir",
  "Choisir un dossier": "Elegir una carpeta",
  "📋 Copié": "📋 Copiado",
  "Copie impossible": "No se pudo copiar",
  "Accès refusé.": "Acceso denegado.",
  "Erreur inattendue": "Error inesperado",
  "GitHub": "GitHub",
  "La tuile disparaît du tableau de bord. Le dossier ou le programme n'est pas touché.":
    "El acceso desaparece del panel. No se modifica la carpeta ni el programa.",
  "Chemin du dossier, ex. C:\\Users\\vous\\Documents": "Ruta de la carpeta, p. ej., C:\\Users\\usuario\\Documents",
  "Chemin d'un fichier, d'un .exe ou d'un .bat": "Ruta de un archivo, un .exe o un .bat",
  "Adresse, ex. https://www.odoo.com": "Dirección, p. ej., https://www.odoo.com",
  "Adresse de l'appli, ex. http://127.0.0.1:8765/": "Dirección de la aplicación, p. ej., http://127.0.0.1:8765/",
  "Ouvrir dans sa propre fenêtre (sans barre d'adresse), comme une application":
    "Abrir en su propia ventana (sin barra de direcciones), como una aplicación",
  "Lancée seulement si rien ne répond sur le port.":
    "Se inicia solo si no hay ningún servicio respondiendo en el puerto.",
  "✏️ Modifier l'outil": "✏️ Editar la herramienta",
  "✨ Nouvel outil": "✨ Nueva herramienta",
  "ex. Comptes rendus": "p. ej., Actas",
  "ex. Mes notes de réunion": "p. ej., Mis notas de reuniones",
  "Petite description": "Descripción breve",
  "Donnez-lui un nom 😉": "Ponle un nombre 😉",
  "Indiquez ce qu'il faut ouvrir": "Indica qué se debe abrir",
  "✏️ Outil modifié": "✏️ Herramienta modificada",
  "🎉 Nouvel outil ajouté !": "🎉 ¡Se añadió una nueva herramienta!",
  "WhatsApp Web dans sa propre fenêtre": "WhatsApp Web en su propia ventana",
  "Ouvrir le gadget « Serveurs Odoo » (ajouter un serveur, comptes…)":
    "Abrir el panel «Servidores Odoo» (añadir un servidor, cuentas…)",
  "serveurs vérifiés à {heure}": "servidores verificados a las {heure}",
  "Aucun serveur : ajoutez-en depuis le gadget complet.": "No hay servidores: añade uno desde el panel completo.",
  "Fichier de configuration": "Archivo de configuración",
  "référence": "referencia",
  "« {base} » ne doit pas être modifiée. Démarrer quand même son serveur ?":
    "No se debe modificar «{base}». ¿Iniciar su servidor de todos modos?",
  "Arrêter {base} ?": "¿Detener {base}?",
  "Seul le serveur Odoo du port {port} est arrêté.": "Solo se detiene el servidor Odoo del puerto {port}.",
  "Serveur pas prêt": "El servidor aún no está listo",
  "Il ne répond pas encore. Ouvrir quand même ?": "El servidor todavía no responde. ¿Abrir de todos modos?",
  "{base} démarre…": "{base} está iniciando…",
  "{base} arrêté": "{base} detenido",
  "{n} / {total} en marche": "{n} / {total} en ejecución",
  "Les serveurs Odoo et les outils déjà lancés continuent de tourner.":
    "Los servidores Odoo y las herramientas que ya están en ejecución seguirán funcionando.",
});
