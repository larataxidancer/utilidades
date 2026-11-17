"use strict";
(() => {
  I18N.ajouter({
    "Notes rapides": "Quick notes",
    "Notes, extraits de code et commandes épinglés pour les retrouver rapidement.":
      "Pinned notes, code snippets and commands for quick access.",
    "Toutes": "All",
    "Notes": "Notes",
    "Code": "Code",
    "Commandes": "Commands",
    "Rechercher dans les notes rapides…": "Search quick notes…",
    "＋ Nouvelle note": "＋ New note",
    "Aucune note ne correspond.": "No matching note.",
    "Aucune note rapide. Créez une note, un extrait de code ou une commande à garder sous la main.":
      "No quick notes yet. Create a note, code snippet or command to keep handy.",
    "Titre": "Title",
    "Contenu": "Content",
    "Catégorie": "Category",
    "Note": "Note",
    "Commande": "Command",
    "Épingler sur l'accueil": "Pin to Home",
    "Nouvelle note rapide": "New quick note",
    "Modifier la note rapide": "Edit quick note",
    "ex. Raccourcis utiles": "e.g. Useful shortcuts",
    "Texte, code ou commande…": "Text, code or command…",
    "Annuler": "Cancel",
    "Enregistrer": "Save",
    "Ajouter": "Add",
    "Copier": "Copy",
    "Modifier": "Edit",
    "Supprimer": "Delete",
    "Épingler": "Pin",
    "Désépingler": "Unpin",
    "Épinglée": "Pinned",
    "Afficher le contenu": "Show content",
    "Masquer le contenu": "Hide content",
    "Supprimer cette note rapide ?": "Delete this quick note?",
    "Cette note sera supprimée définitivement.": "This note will be deleted permanently.",
    "La note rapide a été enregistrée.": "Quick note saved.",
    "La note rapide a été supprimée.": "Quick note deleted.",
    "Contenu copié.": "Content copied.",
    "Copier : {titre}": "Copy: {titre}",
    "Copier le contenu de cette note rapide": "Copy this quick note's content",
    "Créer une note rapide": "Create a quick note",
    "Donnez un titre à la note rapide.": "Give the quick note a title.",
    "Le titre ne peut pas dépasser 160 caractères.": "The title cannot exceed 160 characters.",
    "Le contenu ne peut pas être vide.": "The content cannot be empty.",
    "Le contenu ne peut pas dépasser 100 000 caractères.": "The content cannot exceed 100,000 characters.",
    "La catégorie de la note rapide est invalide.": "The quick note category is invalid.",
    "L'état de l'épingle est invalide.": "The pin state is invalid.",
    "La note rapide est invalide.": "The quick note is invalid.",
    "Les données des notes rapides sont invalides.": "Quick notes data is invalid.",
    "L'identifiant de la note rapide est invalide.": "The quick note ID is invalid.",
    "Note rapide introuvable.": "Quick note not found.",
  });
  I18N.ajouterEspanol({
    "Notes rapides": "Notas rápidas",
    "Notes, extraits de code et commandes épinglés pour les retrouver rapidement.":
      "Notas, fragmentos de código y comandos fijados para encontrarlos rápidamente.",
    "Toutes": "Todas",
    "Notes": "Notas",
    "Code": "Código",
    "Commandes": "Comandos",
    "Rechercher dans les notes rapides…": "Buscar en las notas rápidas…",
    "＋ Nouvelle note": "＋ Nueva nota",
    "Aucune note ne correspond.": "No hay notas que coincidan.",
    "Aucune note rapide. Créez une note, un extrait de code ou une commande à garder sous la main.":
      "Todavía no hay notas rápidas. Crea una nota, un fragmento de código o un comando para tenerlo a mano.",
    "Titre": "Título",
    "Contenu": "Contenido",
    "Catégorie": "Categoría",
    "Note": "Nota",
    "Commande": "Comando",
    "Épingler sur l'accueil": "Fijar en Inicio",
    "Nouvelle note rapide": "Nueva nota rápida",
    "Modifier la note rapide": "Editar nota rápida",
    "ex. Raccourcis utiles": "p. ej., Atajos útiles",
    "Texte, code ou commande…": "Texto, código o comando…",
    "Annuler": "Cancelar",
    "Enregistrer": "Guardar",
    "Ajouter": "Añadir",
    "Copier": "Copiar",
    "Modifier": "Editar",
    "Supprimer": "Eliminar",
    "Épingler": "Fijar",
    "Désépingler": "Quitar de Inicio",
    "Épinglée": "Fijada",
    "Afficher le contenu": "Mostrar contenido",
    "Masquer le contenu": "Ocultar contenido",
    "Supprimer cette note rapide ?": "¿Eliminar esta nota rápida?",
    "Cette note sera supprimée définitivement.": "Esta nota se eliminará de forma permanente.",
    "La note rapide a été enregistrée.": "La nota rápida se guardó.",
    "La note rapide a été supprimée.": "La nota rápida se eliminó.",
    "Contenu copié.": "Contenido copiado.",
    "Copier : {titre}": "Copiar: {titre}",
    "Copier le contenu de cette note rapide": "Copiar el contenido de esta nota rápida",
    "Créer une note rapide": "Crear una nota rápida",
    "Donnez un titre à la note rapide.": "Escribe un título para la nota rápida.",
    "Le titre ne peut pas dépasser 160 caractères.": "El título no puede superar los 160 caracteres.",
    "Le contenu ne peut pas être vide.": "El contenido no puede estar vacío.",
    "Le contenu ne peut pas dépasser 100 000 caractères.": "El contenido no puede superar los 100 000 caracteres.",
    "La catégorie de la note rapide est invalide.": "La categoría de la nota rápida no es válida.",
    "L'état de l'épingle est invalide.": "El estado de fijación no es válido.",
    "La note rapide est invalide.": "La nota rápida no es válida.",
    "Les données des notes rapides sont invalides.": "Los datos de las notas rápidas no son válidos.",
    "L'identifiant de la note rapide est invalide.": "El identificador de la nota rápida no es válido.",
    "Note rapide introuvable.": "No se encontró la nota rápida.",
  });

  const N = { notes: [], recherche: "", categorie: "tous", etendue: new Set() };
  let minuterie = null;

  const style = document.createElement("style");
  style.textContent = `
    .nr-filtres { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin:0 0 14px; }
    .nr-filtres .puce { cursor:pointer; }
    .nr-filtres .puce.actif { background:var(--violet); color:var(--sur-violet); }
    .nr-liste { display:flex; flex-direction:column; gap:8px; }
    .nr-ligne { align-items:flex-start; }
    .nr-ligne .ligne-ic { margin-top:2px; }
    .nr-contenu { display:block; margin:6px 0 2px; padding:10px 12px; max-height:320px; overflow:auto;
      border:1px solid var(--ligne); border-radius:var(--rayon); background:var(--code); color:var(--code-texte);
      font:13px/1.5 var(--mono); white-space:pre-wrap; overflow-wrap:anywhere; }
    .nr-accueil { display:flex; width:100%; align-items:center; gap:8px; padding:5px 0; border:0;
      background:transparent; color:var(--encre); font:inherit; text-align:left; cursor:pointer; }
    .nr-accueil:hover { color:var(--violet); }
  `;
  document.head.append(style);

  const categorieIcone = categorie => categorie === "code" ? "file-code" : categorie === "commande" ? "terminal" : "sticky-note";
  const categorieTexte = categorie => categorie === "code" ? "Code" : categorie === "commande" ? "Commande" : "Note";
  const texteBrut = valeur => document.createTextNode(String(valeur ?? ""));
  const normaliser = texte => String(texte ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  async function charger() {
    const r = await api("/api/notes_rapides/liste", {});
    N.notes = r.notes;
    dessiner();
    return N.notes;
  }

  function visibles() {
    const recherche = normaliser(N.recherche.trim());
    return N.notes.filter(note =>
      (N.categorie === "tous" || note.categorie === N.categorie) &&
      (!recherche || normaliser(`${note.titre} ${note.contenu}`).includes(recherche)));
  }

  function dessiner() {
    const vue = $("#vue-notes_rapides");
    const ancien = vue.querySelector(".nr-recherche");
    const avaitFocus = ancien && document.activeElement === ancien;
    const recherche = el("input", {
      class: "nr-recherche",
      placeholder: "Rechercher dans les notes rapides…",
      value: N.recherche,
      oninput: e => {
        N.recherche = e.target.value;
        clearTimeout(minuterie);
        minuterie = setTimeout(dessiner, 100);
      },
    });
    const filtres = [["tous", "Toutes"], ["note", "Notes"], ["code", "Code"], ["commande", "Commandes"]];
    vue.replaceChildren(
      el("div", { class: "barre-vue" },
        el("h2", {}, icone("notebook-pen"), " ", t("Notes rapides"),
          el("span", { class: "compte" }, String(N.notes.length))),
        el("div", { class: "espace" }),
        el("div", { class: "champ-recherche" }, icone("search"), recherche),
        el("button", { class: "btn principal", onclick: () => editer(null) }, icone("plus"), " ", t("＋ Nouvelle note"))),
      el("div", { class: "nr-filtres" }, filtres.map(([code, libelle]) =>
        el("button", {
          class: "puce" + (N.categorie === code ? " actif" : ""),
          onclick: () => { N.categorie = code; dessiner(); },
        }, t(libelle)))),
      liste());
    if (avaitFocus) {
      recherche.focus();
      recherche.setSelectionRange(recherche.value.length, recherche.value.length);
    }
  }

  function liste() {
    const notes = visibles();
    if (!notes.length) {
      return el("div", { class: "vide" }, icone("search"), " ",
        t(N.notes.length ? "Aucune note ne correspond."
          : "Aucune note rapide. Créez une note, un extrait de code ou une commande à garder sous la main."));
    }
    return el("div", { class: "nr-liste" }, notes.map(ligne));
  }

  function ligne(note) {
    const ouverte = N.etendue.has(note.id);
    const detail = el("div", { class: "ligne-detail nr-contenu", hidden: !ouverte }, texteBrut(note.contenu));
    const boutonDetail = el("button", {
      class: "icone-btn",
      title: t(ouverte ? "Masquer le contenu" : "Afficher le contenu"),
      "aria-label": t(ouverte ? "Masquer le contenu" : "Afficher le contenu"),
      onclick: () => { N.etendue.has(note.id) ? N.etendue.delete(note.id) : N.etendue.add(note.id); dessiner(); },
    }, el("span", { style: ouverte ? "display:inline-flex;transform:rotate(180deg)" : "display:inline-flex" },
      icone("chevron-down")));
    return el("div", { class: "ligne nr-ligne" },
      el("span", { class: "ligne-ic", title: t(categorieTexte(note.categorie)) }, icone(categorieIcone(note.categorie))),
      el("div", { class: "ligne-corps" },
        el("div", { class: "ligne-titre" },
          texteBrut(note.titre),
          el("span", { class: "tag" }, t(categorieTexte(note.categorie))),
          note.epingle ? el("span", { class: "tag" }, icone("pin"), " ", t("Épinglée")) : null),
        el("div", { class: "ligne-meta" }, new Date(note.modifie_le).toLocaleString(I18N.locale())),
        detail),
      el("div", { class: "ligne-actions" },
        boutonDetail,
        el("button", { class: "icone-btn", title: t("Copier"), "aria-label": t("Copier"), onclick: () => copierNote(note) }, icone("copy")),
        el("button", { class: "icone-btn", title: t(note.epingle ? "Désépingler" : "Épingler"),
          "aria-label": t(note.epingle ? "Désépingler" : "Épingler"), onclick: () => epingler(note) },
        icone("pin")),
        el("button", { class: "icone-btn", title: t("Modifier"), "aria-label": t("Modifier"), onclick: () => editer(note) }, icone("pencil")),
        el("button", { class: "icone-btn danger", title: t("Supprimer"), "aria-label": t("Supprimer"), onclick: () => supprimer(note) }, icone("trash-2"))));
  }

  async function copierNote(note) {
    await copier(note.contenu, t("Contenu copié."));
  }

  async function epingler(note) {
    try {
      await api("/api/notes_rapides/epingler", { id: note.id, epingle: !note.epingle });
      await charger();
    } catch (e) {
      toast(e.message, "erreur");
    }
  }

  async function supprimer(note) {
    if (!(await confirmer(icone("trash-2"), "Supprimer cette note rapide ?",
      "Cette note sera supprimée définitivement.", "Supprimer"))) return;
    try {
      await api("/api/notes_rapides/supprimer", { id: note.id });
      N.notes = N.notes.filter(element => element.id !== note.id);
      dessiner();
      toast(t("La note rapide a été supprimée."), "succes");
    } catch (e) {
      toast(e.message, "erreur");
    }
  }

  function editer(note) {
    const brouillon = note ? { ...note } : { titre: "", contenu: "", categorie: "note", epingle: false };
    const titre = el("input", { value: brouillon.titre, maxlength: 160, placeholder: "ex. Raccourcis utiles" });
    const categorie = el("select", {}, [
      ["note", "Note"], ["code", "Code"], ["commande", "Commande"],
    ].map(([valeur, libelle]) => el("option", { value: valeur, selected: brouillon.categorie === valeur ? "" : null }, t(libelle))));
    const contenu = el("textarea", { value: brouillon.contenu, rows: 10, maxlength: 100000,
      placeholder: "Texte, code ou commande…", spellcheck: "false" });
    const epingle = el("input", { type: "checkbox", checked: brouillon.epingle ? "" : null });
    const sauvegarder = async () => {
      const donnees = { ...brouillon, titre: titre.value, contenu: contenu.value, categorie: categorie.value, epingle: epingle.checked };
      try {
        await api("/api/notes_rapides/enregistrer", { note: donnees });
        fermer();
        await charger();
        toast(t("La note rapide a été enregistrée."), "succes", 1600);
      } catch (e) {
        toast(e.message, "erreur");
      }
    };
    fenetre([el("div", { class: "nr-editeur" },
      el("h3", {}, t(note ? "Modifier la note rapide" : "Nouvelle note rapide")),
      el("label", { class: "champ" }, t("Titre"), titre),
      el("label", { class: "champ" }, t("Catégorie"), categorie),
      el("label", { class: "champ" }, t("Contenu"), contenu),
      el("label", { class: "nr-epingle" }, epingle, " ", t("Épingler sur l'accueil")),
      el("div", { class: "actions" },
        el("button", { class: "btn", onclick: fermer }, t("Annuler")),
        el("button", { class: "btn principal", onclick: sauvegarder }, t(note ? "Enregistrer" : "Ajouter"))))]);
    $("#fenetre").style.width = "min(680px, 94vw)";
    setTimeout(() => titre.focus(), 50);
  }

  async function carteAccueil() {
    const r = await api("/api/notes_rapides/liste", {});
    N.notes = r.notes;
    const notes = N.notes;
    const epinglees = notes.filter(note => note.epingle).slice(0, 4);
    if (!epinglees.length) return null;
    return el("div", { onclick: () => montrerVue("notes_rapides") },
      el("h4", {}, icone("pin"), " ", t("Notes rapides")),
      ...epinglees.map(note => el("button", {
        class: "nr-accueil",
        title: t("Copier : {titre}", { titre: note.titre }),
        onclick: async e => { e.stopPropagation(); await copierNote(note); },
      }, icone(categorieIcone(note.categorie)), texteBrut(note.titre))));
  }

  document.addEventListener("keydown", e => {
    const vue = $("#vue-notes_rapides");
    const cible = document.activeElement;
    if (!vue?.classList.contains("actif") || cible?.matches("input, textarea, select") ||
        $("#voile").classList.contains("visible")) return;

    if (e.key === "/") {
      e.preventDefault();
      vue.querySelector(".champ-recherche input")?.focus();
    } else if (e.key.toLowerCase() === "n") {
      e.preventDefault();
      editer(null);
    } else if (e.key === "Escape" && (N.recherche || N.categorie !== "tous")) {
      N.recherche = "";
      N.categorie = "tous";
      dessiner();
    }
  });

  function commandes() {
    return [
      { icone: icone("plus"), titre: t("Créer une note rapide"), detail: t("Notes rapides"), action: () => editer(null) },
      ...N.notes.map(note => ({
        icone: icone(categorieIcone(note.categorie)),
        titre: t("Copier : {titre}", { titre: note.titre }),
        detail: t("Copier le contenu de cette note rapide"),
        action: () => copierNote(note),
      })),
    ];
  }

  VUES.notes_rapides = {
    afficher: () => charger().catch(e => toast(e.message, "erreur")),
    titre: "Notes rapides",
    icone: icone("notebook-pen"),
    groupe: "outils",
    ordre: 21,
    description: "Notes, extraits de code et commandes épinglés pour les retrouver rapidement.",
    profils: ["freelance", "assistant_virtuel", "assistant_direction", "developpeur"],
    carteAccueil,
    commandes,
  };
})();
