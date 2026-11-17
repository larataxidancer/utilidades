"use strict";
/* Application « Devis et factures » (voir factures.py) : réglages de
   l'entreprise, devis, factures et avoirs, paiements, PDF, mail, import des
   heures de Temps, export CSV. Les calculs sont faits côté PC (Decimal) : la
   page n'additionne jamais de montants elle-même. */
(() => {
  const F = { r: null, filtre: "tout", recherche: "", ecran: "liste", doc: null, fiche: null, contacts: null,
    modifie: false, calcul: 0, minuteur: null };

  const style = document.createElement("style");
  style.textContent = `
    .fa-chiffres { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); background: var(--carte); border: 1px solid var(--ligne);
      border-radius: var(--rayon); margin-bottom: 16px; }
    .fa-chiffre { padding: 12px 16px; border-left: 1px solid var(--ligne); min-width: 0; }
    .fa-chiffre:first-child { border-left: 0; }
    .fa-chiffre .lib { font-size: 12.5px; color: var(--doux); }
    .fa-chiffre .val { font-size: 19px; font-weight: 500; letter-spacing: -.02em; font-variant-numeric: tabular-nums; white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
    .fa-chiffre .val.rouge { color: var(--rouge-texte); }
    .fa-chiffre .sous { font-size: 12px; color: var(--gris); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    @media (max-width: 900px) { .fa-chiffres { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .fa-chiffre:nth-child(3) { border-left: 0; } .fa-chiffre:nth-child(n+3) { border-top: 1px solid var(--ligne); } }
    .fa-outils { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
    .fa-outils .espace { flex: 1; }
    .fa-montant { font-variant-numeric: tabular-nums; color: var(--encre); font-weight: 500; min-width: 104px; text-align: right; }
    .fa-cote-etat { min-width: 132px; justify-content: flex-end; }
    .fa-actions-ligne { width: 96px; justify-content: flex-end; }
    .fa-numero { font-variant-numeric: tabular-nums; }
    .ligne-titre .fa-client { color: var(--doux); font-weight: 400; }
    .fa-grille { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 16px; align-items: start; }
    .fa-grille.large { grid-template-columns: minmax(0, 1fr) 360px; }
    @media (max-width: 1150px) { .fa-grille, .fa-grille.large { grid-template-columns: minmax(0, 1fr); } }
    .fa-section { margin-bottom: 16px; }
    .fa-section h3 { margin: 0 0 12px; font-size: 12px; font-weight: 600; color: var(--gris); text-transform: uppercase; letter-spacing: .04em;
      display: flex; align-items: center; gap: 8px; }
    .fa-section h3 .espace { flex: 1; }
    .fa-section > p.aide { color: var(--doux); font-size: 12.5px; margin: -6px 0 12px; }
    .fa-deux { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 0 12px; }
    .fa-trois { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0 12px; }
    .fa-section label.champ textarea { resize: vertical; min-height: 64px; }
    .fa-intro { color: var(--doux); margin: -8px 0 18px; max-width: 720px; }
    .fa-choix { display: flex; flex-direction: column; gap: 2px; margin-bottom: 12px; }
    .fa-choix label { display: flex; align-items: center; gap: 8px; padding: 5px 0; color: var(--encre); font-size: 13.5px; cursor: pointer; }
    .fa-taux { display: flex; align-items: center; gap: 8px; margin: 0 0 6px 26px; color: var(--doux); font-size: 13px; }
    .fa-section > textarea { width: 100%; resize: vertical; min-height: 70px; }
    .fa-taxe { display: grid; grid-template-columns: 44px 80px 14px minmax(0, 1fr); gap: 8px; align-items: center; margin-bottom: 8px; font-size: 13.5px; }
    .fa-taxe span { color: var(--doux); }
    .fa-ident { display: grid; grid-template-columns: 140px minmax(0, 1fr) 30px; gap: 8px; margin-bottom: 8px; align-items: center; }
    .fa-logo { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
    .fa-logo .cadre { width: 150px; height: 72px; border: 1px dashed var(--ligne-forte); border-radius: 8px; display: grid; place-items: center;
      background: var(--surface); color: var(--gris); font-size: 12px; overflow: hidden; flex: none; }
    .fa-logo .cadre img { max-width: 140px; max-height: 64px; }
    .fa-lignes-table { width: 100%; border-collapse: collapse; }
    .fa-lignes-table th { text-align: left; font-size: 11.5px; font-weight: 600; color: var(--gris); text-transform: uppercase; letter-spacing: .04em;
      padding: 0 4px 6px; white-space: nowrap; }
    .fa-lignes-table th.d, .fa-lignes-table td.d { text-align: right; }
    .fa-lignes-table td { padding: 3px 4px; vertical-align: middle; }
    .fa-lignes-table input, .fa-lignes-table select { width: 100%; }
    .fa-lignes-table input.d { text-align: right; font-variant-numeric: tabular-nums; }
    .fa-lignes-table td.total { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; padding-right: 6px; color: var(--encre); width: 110px; }
    .fa-lignes-table .icone-btn { opacity: .55; }
    .fa-lignes-table tr:hover .icone-btn { opacity: 1; }
    .fa-pied-lignes { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; align-items: center; }
    .fa-pied-lignes .espace { flex: 1; }
    .fa-remise { display: flex; gap: 8px; align-items: center; }
    .fa-remise select { width: 170px; } .fa-remise input { width: 110px; text-align: right; }
    .fa-totaux .l { display: flex; justify-content: space-between; gap: 12px; padding: 4px 0; color: var(--doux); font-variant-numeric: tabular-nums; }
    .fa-totaux .l span:last-child { color: var(--encre); white-space: nowrap; }
    .fa-totaux .l.fort { color: var(--encre); font-weight: 600; font-size: 16px; border-top: 1px solid var(--ligne); margin-top: 6px; padding-top: 10px; }
    .fa-totaux .l.fort:first-child { border-top: 0; margin-top: 0; padding-top: 4px; }
    .fa-totaux .l.reste span { color: var(--encre); font-weight: 600; }
    .fa-erreur { color: var(--rouge-texte); font-size: 12.5px; margin-top: 8px; }
    .fa-papier { background: var(--surface); border: 1px solid var(--ligne); border-radius: var(--rayon); padding: 18px; }
    .fa-papier iframe { display: block; width: 100%; max-width: 820px; margin: 0 auto; aspect-ratio: 210 / 297; border: 0; border-radius: 2px;
      box-shadow: var(--ombre-forte); }
    .fa-fenetre-apercu { width: min(900px, 94vw) !important; }
    .fa-fenetre-apercu iframe { display: block; width: 100%; height: 72vh; border: 1px solid var(--ligne); border-radius: 6px; }
    .fa-infos { display: grid; grid-template-columns: auto 1fr; gap: 4px 14px; font-size: 13.5px; }
    .fa-infos dt { color: var(--doux); } .fa-infos dd { margin: 0; text-align: right; font-variant-numeric: tabular-nums; }
    .fa-infos dd a { cursor: pointer; }
    .fa-actions { display: flex; flex-direction: column; gap: 6px; }
    .fa-actions .btn { justify-content: flex-start; }
    .fa-sessions { max-height: 46vh; overflow: auto; border: 1px solid var(--ligne); border-radius: 8px; margin: 4px 0 12px; }
    .fa-sessions .ligne { min-height: 38px; cursor: pointer; }
    .fa-sessions input[type=checkbox] { width: 16px; height: 16px; }
    .fa-somme { color: var(--doux); font-size: 13px; }
    .fenetre .fa-deux label.champ, .fenetre .fa-trois label.champ { margin-bottom: 12px; }
  `;
  document.head.append(style);

  // --------------------------------------------------------------- outils
  const racine = () => $("#vue-factures");
  const ICONES_TYPES = { devis: "file-text", facture: "receipt-text", avoir: "undo-2" };
  const NOMS_TYPES = { devis: "Devis", facture: "Facture", avoir: "Avoir" };
  // Code d'état (factures.py) → libellé et couleur (la couleur est réservée aux états).
  const ETATS = {
    brouillon: ["Brouillon", "gris"], envoye: ["Envoyé", ""], envoyee: ["Envoyée", ""], accepte: ["Accepté", "vert"],
    refuse: ["Refusé", "gris"], facture: ["Facturé", "vert"], expire: ["Expiré", "ambre"],
    partielle: ["Payée partiellement", "ambre"], payee: ["Payée", "vert"], retard: ["En retard", "rouge"],
    annulee: ["Annulée", "gris"], emis: ["Émis", ""],
  };
  const MOYENS = [["virement", "Virement"], ["especes", "Espèces"], ["cheque", "Chèque"], ["carte", "Carte bancaire"],
    ["mobile_money", "Mobile Money"], ["paypal", "PayPal"], ["autre", "Autre"]];
  const UNITES = ["h", "jour", "forfait", "unité", "mois", "page", "mot"];

  function etatTxt(code) {
    const [lib, couleur] = ETATS[code] || [code, "gris"];
    return el("span", { class: "etat-txt " + couleur, style: couleur ? "" : "color:var(--doux)" }, lib);
  }

  /** Affichage d'un montant reçu en texte exact (« 1080.00 ») : jamais de calcul ici. */
  function montant(valeur, devise) {
    const d = devise || F.r?.devise || { code: "EUR", symbole: "€", decimales: 2 };
    const n = Number(valeur || 0);
    try {
      // Dollar canadien : « 150,00 $ » comme au Québec et sur le PDF (et non « $CA »).
      return espaces(new Intl.NumberFormat(I18N.locale(), { style: "currency", currency: d.code,
        ...(d.code === "CAD" ? { currencyDisplay: "narrowSymbol" } : d.code === "COP" ? { currencyDisplay: "code" } : {}),
        minimumFractionDigits: d.decimales, maximumFractionDigits: d.decimales }).format(n));
    } catch {
      return espaces(new Intl.NumberFormat(I18N.locale(), { minimumFractionDigits: d.decimales, maximumFractionDigits: d.decimales }).format(n))
        + " " + (d.symbole || d.code);
    }
  }
  const espaces = s => s.replace(/ /g, " ");
  function dateCourte(iso) {
    if (!iso) return "";
    return new Date(iso.slice(0, 10) + "T00:00").toLocaleDateString(I18N.locale(), { day: "2-digit", month: "2-digit", year: "numeric" });
  }
  const jourIso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const nombreAffiche = s => (I18N.langue === "en" ? String(s ?? "") : String(s ?? "").replace(".", ","));
  const erreur = e => toast(e.message, "erreur", 5000);
  const champ = (libelle, controle, aide) => el("label", { class: "champ" }, libelle, controle, aide ? el("small", {}, aide) : null);
  const bouton = (nomIcone, texte, action, classe = "btn") => el("button", { class: classe, onclick: action }, icone(nomIcone, "av"), texte);
  const iconeBtn = (nomIcone, titre, action, classe = "") => el("button", { class: "icone-btn " + classe, title: titre,
    onclick: e => { e.stopPropagation(); action(e); } }, icone(nomIcone));
  // Pas de flèche « retour » dans icones.js : chevron tourné.
  const boutonRetour = (titre, action) => el("button", { class: "icone-btn", title: titre, onclick: action }, icone("chevron-left"));

  function telecharger(nom, texte) {
    const lien = el("a", { href: URL.createObjectURL(new Blob([texte], { type: "text/csv;charset=utf-8" })), download: nom });
    document.body.append(lien); lien.click(); lien.remove();
    setTimeout(() => URL.revokeObjectURL(lien.href), 5000);
  }

  // -------------------------------------------------------------- données
  async function charger() {
    F.r = await api("/api/factures/liste", {});
    return F.r;
  }

  async function afficher() {
    try { await charger(); } catch (e) { erreur(e); return; }
    if (!F.r.configuree) return ecranReglages(true);
    if (F.aCreer) { const type = F.aCreer; F.aCreer = null; return nouveau(type); }
    if (F.ecran === "edition" && F.doc) return ecranEdition();
    if (F.ecran === "fiche" && F.fiche) return ouvrirFiche(F.fiche.id);
    if (F.ecran === "reglages") return ecranReglages(false);
    ecranListe();
  }

  async function chargerContacts() {
    if (F.contacts) return F.contacts;
    try { F.contacts = (await api("/api/contacts/liste", {})).contacts || []; } catch { F.contacts = []; }
    return F.contacts;
  }

  // ---------------------------------------------------------------- liste
  function filtrer(docs) {
    const mots = F.recherche.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return docs.filter(x => {
      if (F.filtre === "devis" && x.type !== "devis") return false;
      if (F.filtre === "factures" && x.type === "devis") return false;
      if (F.filtre === "impayees" && !(x.type === "facture" && x.numero && Number(x.reste) > 0)) return false;
      if (F.filtre === "retard" && x.etat !== "retard") return false;
      if (F.filtre === "brouillons" && x.numero) return false;
      const texte = `${x.numero || ""} ${x.client} ${x.objet}`.toLowerCase();
      return mots.every(m => texte.includes(m));
    });
  }

  function chiffres() {
    const r = F.r.resume, devises = r.devises.length ? r.devises : [{ devise: F.r.devise, facture_mois: "0", encaisse_mois: "0", impaye: "0", retard: "0" }];
    const somme = cle => devises.map(x => montant(x[cle], x.devise)).join(" · ");
    const mois = new Date(r.mois + "-01T00:00").toLocaleDateString(I18N.locale(), { month: "long", year: "numeric" });
    const enRetard = r.nb_retard > 0;
    return el("div", { class: "fa-chiffres" },
      el("div", { class: "fa-chiffre" }, el("div", { class: "lib" }, "Facturé ce mois"), el("div", { class: "val" }, somme("facture_mois")),
        el("div", { class: "sous" }, mois.charAt(0).toUpperCase() + mois.slice(1))),
      el("div", { class: "fa-chiffre" }, el("div", { class: "lib" }, "Encaissé ce mois"), el("div", { class: "val" }, somme("encaisse_mois")),
        el("div", { class: "sous" }, "paiements enregistrés")),
      el("div", { class: "fa-chiffre" }, el("div", { class: "lib" }, "Impayé"), el("div", { class: "val" }, somme("impaye")),
        el("div", { class: "sous" }, r.devis_attente ? t(r.devis_attente > 1 ? "{n} devis en attente" : "{n} devis en attente", { n: r.devis_attente }) : t("factures émises non réglées"))),
      el("div", { class: "fa-chiffre" }, el("div", { class: "lib" }, "En retard"),
        el("div", { class: "val" + (enRetard ? " rouge" : "") }, enRetard ? somme("retard") : "—"),
        el("div", { class: "sous" }, t(r.nb_retard > 1 ? "{n} factures" : "{n} facture", { n: r.nb_retard }))));
  }

  function ecranListe() {
    F.ecran = "liste";
    const docs = F.r.documents;
    const compte = f => { const ancien = F.filtre; F.filtre = f; const n = filtrer(docs).length; F.filtre = ancien; return n; };
    const pluriel = I18N.langue === "en" ? "Quotes" : "Devis";  // « Devis » est aussi un pluriel en français
    const puces = [["tout", "Tout"], ["devis", pluriel], ["factures", "Factures"], ["impayees", "Impayées"], ["retard", "En retard"], ["brouillons", "Brouillons"]];
    const zone = el("div");
    const recherche = el("input", { type: "search", placeholder: "Client, numéro, objet…", value: F.recherche,
      oninput: e => { F.recherche = e.target.value; dessinerLignes(zone); } });
    racine().replaceChildren(
      el("div", { class: "barre-vue" },
        el("h2", {}, icone("receipt-text"), "Devis et factures"), el("div", { class: "espace" }),
        bouton("download", "Exporter CSV", exporter, "btn discret"),
        iconeBtn("settings", "Réglages de l'entreprise", () => ecranReglages(false)),
        bouton("file-plus", "Nouveau devis", () => nouveau("devis")),
        bouton("plus", "Nouvelle facture", () => nouveau("facture"), "btn principal")),
      chiffres(),
      el("div", { class: "fa-outils" },
        el("div", { class: "puces" }, puces.map(([v, lib]) => {
          const n = v === "tout" ? docs.length : compte(v);
          return el("button", { class: "puce" + (F.filtre === v ? " actif" : ""), onclick: () => { F.filtre = v; ecranListe(); } },
            lib, n ? el("span", { class: "compteur" }, String(n)) : null);
        })),
        el("div", { class: "espace" }),
        el("div", { class: "champ-recherche" }, el("span", {}, icone("search")), recherche)),
      zone);
    dessinerLignes(zone);
  }

  function dessinerLignes(zone) {
    const docs = filtrer(F.r.documents);
    if (!docs.length) {
      zone.replaceChildren(F.r.documents.length
        ? el("div", { class: "vide" }, icone("search"), "Aucun document pour ce filtre.")
        : el("div", { class: "vide" }, icone("receipt-text"), "Aucun devis ni facture pour l'instant.",
          el("div", { style: "display:flex;gap:8px;justify-content:center;margin-top:14px" },
            bouton("file-plus", "Nouveau devis", () => nouveau("devis")),
            bouton("plus", "Nouvelle facture", () => nouveau("facture"), "btn principal"))));
      return;
    }
    zone.replaceChildren(el("div", { class: "lignes" }, docs.map(ligneDoc)));
  }

  function ligneDoc(x) {
    const meta = [t(NOMS_TYPES[x.type])];
    if (x.numero) meta.push(dateCourte(x.date));
    if (x.type === "facture" && x.echeance) meta.push(t("échéance {date}", { date: dateCourte(x.echeance) }));
    if (x.type === "devis" && x.validite) meta.push(t("valable jusqu'au {date}", { date: dateCourte(x.validite) }));
    if (x.type === "avoir" && x.origine) meta.push(t("sur {numero}", { numero: x.origine }));
    if (x.type === "facture" && x.numero && Number(x.paye) > 0 && Number(x.reste) > 0) meta.push(t("reste {montant}", { montant: montant(x.reste, x.devise) }));
    if (x.objet) meta.push(x.objet);
    const actions = [];
    if (x.numero) {
      actions.push(iconeBtn("file-down", "Ouvrir le PDF", () => ouvrirPdf(x.id)));
      actions.push(iconeBtn("mail", "Envoyer par mail", () => envoyerMail(x.id)));
      if (x.type === "facture" && Number(x.reste) > 0) actions.push(iconeBtn("banknote", "Enregistrer un paiement", () => saisirPaiement(x.id, x.reste, x.devise)));
    } else {
      actions.push(iconeBtn("pencil", "Modifier", () => ouvrir(x)));
      actions.push(iconeBtn("trash-2", "Supprimer le brouillon", () => supprimerBrouillon(x.id), "danger"));
    }
    return el("div", { class: "ligne cliquable", onclick: () => ouvrir(x) },
      el("span", { class: "ligne-ic" }, icone(ICONES_TYPES[x.type])),
      el("div", { class: "ligne-corps" },
        el("div", { class: "ligne-titre" },
          x.numero ? el("span", { class: "fa-numero" }, x.numero) : el("span", { class: "tag" }, "Brouillon"),
          el("span", { class: "fa-client" }, x.client || t("Client à indiquer"))),
        el("div", { class: "ligne-meta" }, meta.join(" · "))),
      el("div", { class: "ligne-cote" },
        el("span", { class: "fa-montant" }, (x.type === "avoir" ? "−" : "") + montant(x.total_ttc, x.devise)),
        el("span", { class: "etat-txt fa-cote-etat" }, etatTxt(x.etat))),
      el("div", { class: "ligne-actions fa-actions-ligne" }, actions));
  }

  function ouvrir(x) {
    if (x.numero) return ouvrirFiche(x.id);
    api("/api/factures/document", { id: x.id }).then(doc => { F.doc = brouillonDepuis(doc); F.modifie = false; ecranEdition(); }).catch(erreur);
  }

  async function exporter() {
    try {
      const ids = filtrer(F.r.documents).map(x => x.id);
      const r = await api("/api/factures/export", F.filtre === "tout" && !F.recherche ? {} : { ids });
      telecharger(r.nom, r.csv);
    } catch (e) { erreur(e); }
  }

  async function supprimerBrouillon(id) {
    if (!(await confirmer(icone("trash-2"), "Supprimer ce brouillon ?", "Il n'a pas encore de numéro : il disparaît simplement.", "Supprimer"))) return false;
    try { await api("/api/factures/supprimer", { id }); toast("Brouillon supprimé", "succes", 1800); } catch (e) { erreur(e); return false; }
    if (F.ecran !== "liste") { F.ecran = "liste"; F.doc = null; }
    await afficher();
    return true;
  }

  // ------------------------------------------------------------ réglages
  async function ecranReglages(premiere) {
    F.ecran = "reglages";
    let r;
    try { r = await api("/api/factures/reglages", {}); } catch (e) { erreur(e); return; }
    const e = r.entreprise;
    const v = { ...e, identifiants: (e.identifiants || []).map(x => ({ ...x })) };
    if (!v.identifiants.length) v.identifiants.push({ libelle: "SIRET", valeur: "" });
    if (/^[A-Z]{2}\d{2}/.test(v.iban || "")) v.iban = v.iban.replace(/(.{4})(?=.)/g, "$1 ");  // lisible par groupes de 4
    const entree = (cle, attrs = {}) => el("input", { value: v[cle] ?? "", ...attrs, oninput: ev => { v[cle] = ev.target.value; majProchains(); } });
    const zoneTexte = (cle, attrs = {}) => { const z = el("textarea", { rows: 3, ...attrs, oninput: ev => { v[cle] = ev.target.value; } }); z.value = v[cle] || ""; return z; };

    // Logo
    const cadre = el("div", { class: "cadre" });
    const dessinerLogo = data => cadre.replaceChildren(data ? el("img", { src: data, alt: "" }) : el("span", {}, "Aucun logo"));
    dessinerLogo(r.logo_data);
    const fichier = el("input", { type: "file", accept: ".png,.jpg,.jpeg,.gif,.webp", hidden: "", onchange: async ev => {
      const f = ev.target.files[0];
      ev.target.value = "";
      if (!f) return;
      if (f.size > 1024 * 1024) { toast("Logo trop lourd (1 Mo au plus).", "erreur"); return; }
      const contenu = await new Promise(ok => { const lecteur = new FileReader(); lecteur.onload = () => ok(lecteur.result); lecteur.readAsDataURL(f); });
      try { const n = await api("/api/factures/logo", { nom: f.name, contenu }); dessinerLogo(n.logo_data); toast("Logo enregistré", "succes", 1500); }
      catch (err) { erreur(err); }
    } });

    // Identifiants
    const zoneIds = el("div");
    const dessinerIds = () => zoneIds.replaceChildren(...v.identifiants.map((x, i) => el("div", { class: "fa-ident" },
      el("input", { value: x.libelle, placeholder: "SIRET", "aria-label": t("Libellé"), oninput: ev => { x.libelle = ev.target.value; } }),
      el("input", { value: x.valeur, placeholder: "Numéro", "aria-label": t("Numéro"), oninput: ev => { x.valeur = ev.target.value; } }),
      iconeBtn("x", "Retirer", () => { v.identifiants.splice(i, 1); dessinerIds(); }, "danger"))));
    dessinerIds();

    // TVA
    const taux = entree("tva_taux", { inputmode: "decimal", style: "width:90px;text-align:right" });
    const texteTva = zoneTexte("tva_texte", { rows: 2, placeholder: "ex. TVA non applicable – Exonération" });
    const penalites = zoneTexte("penalites", { rows: 3 });
    const blocTaux = el("div", { class: "fa-taux" }, el("span", {}, "Taux par défaut"), taux, el("span", {}, "%"));
    const radio = (mode, libelle, nom = "fa-tva") => el("label", {},
      el("input", { type: "radio", name: nom, value: mode, checked: v.tva_mode === mode ? "" : null, onchange: () => { v.tva_mode = mode; majTva(); } }), libelle);

    // Taxes canadiennes : province, taux (modifiables) et numéros d'inscription.
    v.regime = v.regime || "tva";
    v.province = v.province || "QC";
    v.taxes = (v.taxes || []).map(x => ({ ...x }));
    const zoneTaxes = el("div", { class: "fa-taxes" });
    function taxesDeLaProvince() {
      const p = r.provinces.find(x => x.code === v.province) || r.provinces[0];
      const numeros = Object.fromEntries(v.taxes.map(x => [x.code, x.numero || ""]));
      v.taxes = p.taxes.map(x => ({ code: x.code, taux: x.taux, numero: numeros[x.code] || "" }));
      dessinerTaxes();
    }
    function dessinerTaxes() {
      zoneTaxes.replaceChildren(...v.taxes.map(x => el("div", { class: "fa-taxe" },
        el("b", {}, r.noms_taxes[x.code] || x.code),
        el("input", { value: nombreAffiche(x.taux), inputmode: "decimal", "aria-label": t("Taux"), style: "width:80px;text-align:right",
          oninput: ev => { x.taux = ev.target.value; } }),
        el("span", {}, "%"),
        el("input", { value: x.numero || "", maxlength: 40, "aria-label": t("N° d'inscription"),
          placeholder: x.code === "TVQ" ? "ex. 1234567890 TQ0001" : x.code === "TPS" || x.code === "TVH" ? "ex. 123456789 RT0001" : t("N° d'inscription"),
          oninput: ev => { x.numero = ev.target.value; } }))));
    }
    if (!v.taxes.length) taxesDeLaProvince(); else dessinerTaxes();
    const choixProvince = el("select", { onchange: ev => { v.province = ev.target.value; taxesDeLaProvince(); } },
      r.provinces.map(p => el("option", { value: p.code, selected: v.province === p.code ? "" : null }, t(p.nom))));
    const blocTvaFr = el("div", { class: "fa-choix" },
      radio("assujetti", "Assujetti à la TVA"), blocTaux,
      radio("franchise", r.mention_293b),
      radio("libre", "Autre mention"));
    const blocCanada = el("div", {},
      champ("Province ou territoire", choixProvince),
      el("div", { class: "fa-choix" },
        radio("assujetti", "Inscrit aux taxes", "fa-tva-ca"),
        radio("libre", "Non inscrit (autre mention)", "fa-tva-ca")),
      zoneTaxes,
      el("p", { class: "aide" }, "Les taux sont ceux de la province ; vous pouvez les modifier. Les numéros d'inscription sont imprimés sur chaque facture."));
    const choixRegime = el("select", { onchange: ev => {
      v.regime = ev.target.value;
      if (v.regime === "canada") {
        if (v.tva_mode === "franchise") v.tva_mode = "assujetti";
        // Les mentions propres à la France ne valent pas au Canada.
        if (v.penalites === r.penalites_fr) { v.penalites = ""; penalites.value = ""; }
        if (v.devise_choix === "EUR") { v.devise_choix = "CAD"; devise.value = "CAD"; blocAutre.hidden = true; }
      }
      for (const b of document.querySelectorAll('input[name="fa-tva"], input[name="fa-tva-ca"]')) b.checked = b.value === v.tva_mode;
      majTva();
    } }, [["tva", "TVA (France, Europe, Madagascar…)"], ["canada", "Canada (TPS, TVQ, TVH…)"]].map(([c, lib]) =>
      el("option", { value: c, selected: v.regime === c ? "" : null }, lib)));
    const majTva = () => {
      const canada = v.regime === "canada";
      blocTvaFr.hidden = canada;
      blocCanada.hidden = !canada;
      blocTaux.hidden = v.tva_mode !== "assujetti";
      zoneTaxes.hidden = v.tva_mode !== "assujetti";
      texteTva.parentElement.hidden = v.tva_mode !== "libre";
      texteTva.placeholder = t(canada ? "ex. Petit fournisseur non inscrit aux fins de la TPS et de la TVQ" : "ex. TVA non applicable – Exonération");
    };

    // Devise
    const autre = !["EUR", "USD", "CAD", "COP", "MGA"].includes(v.devise);
    v.devise_choix = autre ? "AUTRE" : v.devise;
    v.devise_code = autre ? v.devise : "";
    const blocAutre = el("div", { class: "fa-trois" },
      champ("Code", entree("devise_code", { placeholder: "ex. CHF", maxlength: 8 })),
      champ("Symbole", entree("devise_symbole", { placeholder: "ex. CHF", maxlength: 8 })),
      champ("Décimales", entree("devise_decimales", { type: "number", min: 0, max: 3 })));
    blocAutre.hidden = !autre;
    const devise = el("select", { onchange: ev => { v.devise_choix = ev.target.value; blocAutre.hidden = v.devise_choix !== "AUTRE"; } },
      [["EUR", "Euro (€)"], ["USD", "Dollar américain ($)"], ["CAD", "Dollar canadien ($)"],
        ["COP", "Peso colombien (COP)"], ["MGA", "Ariary (Ar)"], ["AUTRE", "Autre devise"]].map(([c, lib]) =>
        el("option", { value: c, selected: v.devise_choix === c ? "" : null }, lib)));

    const prochains = el("div", { class: "fa-somme" });
    const annee = new Date().getFullYear();
    function majProchains() {
      const p = k => (v["prefixe_" + k] || "").toUpperCase().replace(/\s+/g, "");
      prochains.textContent = t("Prochains numéros : {d}, {f}, {a}", {
        d: r.prochains.devis.replace(/^[^-]+-\d+-/, `${p("devis")}-${annee}-`),
        f: r.prochains.facture.replace(/^[^-]+-\d+-/, `${p("facture")}-${annee}-`),
        a: r.prochains.avoir.replace(/^[^-]+-\d+-/, `${p("avoir")}-${annee}-`) });
    }
    majProchains();

    async function enregistrer() {
      const entreprise = { ...v, devise: v.devise_choix };
      try {
        await api("/api/factures/reglages/enregistrer", { entreprise });
        toast("Réglages enregistrés", "succes", 1600);
        F.ecran = "liste";
        await afficher();
      } catch (err) { erreur(err); }
    }

    const section = (titre, ...contenu) => el("div", { class: "carte fa-section" }, el("h3", {}, titre), ...contenu);
    racine().replaceChildren(
      el("div", { class: "barre-vue" },
        premiere ? null : boutonRetour("Retour", () => { F.ecran = "liste"; afficher(); }),
        el("h2", {}, icone("building-2"), premiere ? "Bienvenue dans Devis et factures" : "Réglages de l'entreprise"),
        el("div", { class: "espace" }),
        bouton("check", "Enregistrer", enregistrer, "btn principal")),
      premiere ? el("p", { class: "fa-intro" }, "Indiquez d'abord votre entreprise : ces informations figurent sur chaque devis et facture. Vous pourrez les modifier plus tard ; un document déjà émis garde celles du jour de son émission.") : null,
      el("div", { class: "fa-grille large" },
        el("div", {},
          section("Entreprise",
            champ("Nom ou raison sociale", entree("nom", { maxlength: 120, placeholder: "ex. Studio Exemple" })),
            champ("Adresse", zoneTexte("adresse", { placeholder: "Rue, code postal, ville, pays" })),
            el("div", { class: "fa-deux" },
              champ("E-mail", entree("email", { type: "email", maxlength: 120 })),
              champ("Téléphone", entree("telephone", { maxlength: 40 }))),
            el("div", { class: "fa-logo" }, cadre,
              el("div", { style: "display:flex;flex-direction:column;gap:6px" },
                bouton("image", "Choisir une image", () => fichier.click()),
                bouton("x", "Retirer le logo", async () => { try { dessinerLogo((await api("/api/factures/logo/retirer", {})).logo_data); } catch (err) { erreur(err); } }, "btn discret"),
                fichier)),
            champ("Mentions en bas de page (facultatif)", zoneTexte("pied", { rows: 2, placeholder: "ex. Capital social, RCS, assurance professionnelle…" }))),
          section("Identifiants",
            el("p", { class: "aide" }, "SIRET, NIF, STAT, n° de TVA intracommunautaire… : ils sont imprimés sous votre adresse."),
            zoneIds,
            bouton("plus", "Ajouter un identifiant", () => { v.identifiants.push({ libelle: "", valeur: "" }); dessinerIds(); }, "btn discret")),
          section("Paiement",
            el("div", { class: "fa-deux" },
              champ("IBAN ou RIB", entree("iban", { maxlength: 42, placeholder: "FR76 …" })),
              champ("BIC", entree("bic", { maxlength: 15 }))),
            champ("Autres coordonnées de paiement", zoneTexte("paiement_autre", { rows: 2, placeholder: "ex. Mobile Money, PayPal…" })),
            el("div", { class: "fa-deux" },
              champ("Délai de paiement (jours)", entree("delai_jours", { type: "number", min: 0, max: 365 }), "0 = à réception"),
              champ("Validité des devis (jours)", entree("validite_jours", { type: "number", min: 1, max: 365 }))),
            champ("Pénalités de retard", penalites))),
        el("div", {},
          section("Taxes",
            champ("Régime", choixRegime),
            blocTvaFr, blocCanada,
            champ("Mention imprimée", texteTva)),
          section("Devise",
            champ("Devise des documents", devise), blocAutre),
          section("Numérotation",
            el("div", { class: "fa-trois" },
              champ(I18N.langue === "en" ? "Quotes" : "Devis", entree("prefixe_devis", { maxlength: 10 })),
              champ("Factures", entree("prefixe_facture", { maxlength: 10 })),
              champ("Avoirs", entree("prefixe_avoir", { maxlength: 10 }))),
            prochains,
            el("p", { class: "fa-somme", style: "margin:8px 0 0" }, "Numéro attribué à l'émission, à la suite, et remis à 1 chaque année.")))));
    majTva();
  }

  // ------------------------------------------------------------ édition
  function brouillonDepuis(doc) {
    return { id: doc.id, type: doc.type, client: { ...(doc.client || {}) },
      lignes: (doc.lignes || []).map(l => ({ ...l })), remise: { ...(doc.remise || { type: "aucune", valeur: "0" }) },
      notes: doc.notes || "", objet: doc.objet || "", prestation: doc.prestation || "",
      delai_jours: doc.delai_jours ?? F.r.delai_jours, validite_jours: doc.validite_jours ?? F.r.validite_jours,
      origine_numero: doc.origine_numero || null, devis_numero: doc.devis_numero || null };
  }

  function ligneVide() {
    return { designation: "", quantite: "1", unite: "", prix: "", tva: F.r.tva_applicable ? F.r.tva_taux : "0", taxable: true };
  }

  function nouveau(type) {
    F.doc = { type, client: { nom: "", adresse: "", email: "", identifiant: "", contact_id: "" }, lignes: [ligneVide()],
      remise: { type: "aucune", valeur: "0" }, notes: "", objet: "", prestation: "",
      delai_jours: F.r?.delai_jours ?? 30, validite_jours: F.r?.validite_jours ?? 30 };
    F.modifie = false;
    ecranEdition();
  }

  const corpsDoc = () => {
    const d = F.doc;
    return { id: d.id, type: d.type, client: d.client, lignes: d.lignes, remise: d.remise, notes: d.notes, objet: d.objet,
      prestation: d.prestation, delai_jours: d.delai_jours, validite_jours: d.validite_jours };
  };

  function titreEdition() {
    const d = F.doc;
    if (d.type === "avoir") return t("Avoir sur la facture {numero}", { numero: d.origine_numero || "" });
    if (!d.id) return d.type === "devis" ? t("Nouveau devis") : t("Nouvelle facture");
    return d.type === "devis" ? t("Devis") : t("Facture");
  }

  async function ecranEdition() {
    F.ecran = "edition";
    const d = F.doc;
    // TVA par ligne (France…), ou taxes canadiennes : la ligne est taxable ou non.
    const canada = F.r.regime === "canada";
    const tva = F.r.tva_applicable && !canada;
    const taxes = F.r.tva_applicable && canada;
    const nomTaxe = code => (F.r.taxes || []).find(x => x.code === code)?.nom || code;
    const marquer = () => { F.modifie = true; };
    const sur = (objet, cle, attrs = {}) => el("input", { value: objet[cle] ?? "", ...attrs,
      oninput: e => { objet[cle] = e.target.value; marquer(); if (attrs["data-calcul"]) recalculer(); } });

    // Client : Contacts (si l'application est là), sinon saisie libre avec les clients déjà facturés.
    const champsClient = {
      nom: sur(d.client, "nom", { maxlength: 120, list: "fa-clients", placeholder: "Nom du client ou de l'entreprise",
        onchange: e => {
          const connu = F.r.clients.find(c => c.nom === e.target.value);
          if (connu && !d.client.adresse && !d.client.email) { Object.assign(d.client, { ...connu, contact_id: connu.contact_id || "" }); remplirClient(); }
        } }),
      adresse: (() => { const z = el("textarea", { rows: 3, oninput: e => { d.client.adresse = e.target.value; marquer(); } }); z.value = d.client.adresse || ""; return z; })(),
      email: sur(d.client, "email", { type: "email", maxlength: 120 }),
      identifiant: sur(d.client, "identifiant", { maxlength: 120, placeholder: "ex. SIRET ou n° de TVA du client" }),
    };
    function remplirClient() { for (const k of Object.keys(champsClient)) champsClient[k].value = d.client[k] || ""; marquer(); }
    const choixContact = el("select", { style: "max-width:260px", onchange: async e => {
      const c = (F.contacts || []).find(x => x.id === e.target.value);
      e.target.value = "";
      if (!c) return;
      d.client = { contact_id: c.id, nom: c.entreprise || c.nom, email: c.email || "", identifiant: d.client.identifiant || "", adresse: "" };
      try { const fiche = await api("/api/contacts/fiche", { id: c.id }); d.client.adresse = fiche.adresse || fiche.contact?.adresse || ""; } catch { /* Contacts sans fiche : adresse à saisir */ }
      remplirClient();
    } }, el("option", { value: "" }, "Choisir dans Contacts…"));
    choixContact.hidden = true;
    chargerContacts().then(liste => {
      if (!liste.length) return;
      choixContact.append(...liste.map(c => el("option", { value: c.id }, c.entreprise && c.entreprise !== c.nom ? `${c.nom} (${c.entreprise})` : c.nom)));
      choixContact.hidden = false;
    });

    // Lignes
    const corps = el("tbody");
    const totaux = el("div", { class: "fa-totaux" });
    const zoneErreur = el("div", { class: "fa-erreur", hidden: "" });
    function dessinerLignes() {
      corps.replaceChildren(...d.lignes.map((l, i) => el("tr", {},
        el("td", {}, sur(l, "designation", { maxlength: 600, placeholder: "Désignation", "data-calcul": 1 })),
        el("td", { style: "width:78px" }, sur(l, "quantite", { class: "d", inputmode: "decimal", "data-calcul": 1, value: nombreAffiche(l.quantite) })),
        el("td", { style: "width:92px" }, sur(l, "unite", { maxlength: 20, list: "fa-unites" })),
        el("td", { style: "width:112px" }, sur(l, "prix", { class: "d", inputmode: "decimal", placeholder: "0,00", "data-calcul": 1, value: nombreAffiche(l.prix) })),
        tva ? el("td", { style: "width:74px" }, sur(l, "tva", { class: "d", inputmode: "decimal", "data-calcul": 1, value: nombreAffiche(l.tva) })) : null,
        taxes ? el("td", { style: "width:74px;text-align:center" }, el("input", { type: "checkbox", "aria-label": t("Taxable"),
          checked: l.taxable !== false ? "" : null, onchange: e => { l.taxable = e.target.checked; marquer(); recalculer(); } })) : null,
        el("td", { class: "total", "data-ligne": i }, "—"),
        el("td", { style: "width:34px" }, iconeBtn("x", "Retirer la ligne", () => { d.lignes.splice(i, 1); if (!d.lignes.length) d.lignes.push(ligneVide()); marquer(); dessinerLignes(); recalculer(); }, "danger")))));
    }
    async function recalculer(immediat) {
      clearTimeout(F.minuteur);
      const tour = ++F.calcul;
      const lancer = async () => {
        try {
          const r = await api("/api/factures/calculer", { document: corpsDoc() });
          if (tour !== F.calcul) return;
          zoneErreur.hidden = true;
          // Les lignes vides sont ignorées par le serveur : on recolle les totaux aux lignes remplies.
          let j = 0;
          d.lignes.forEach((l, i) => {
            const vide = !String(l.designation || "").trim() && ["", "0"].includes(String(l.prix || "").trim());
            const cellule = corps.querySelector(`td[data-ligne="${i}"]`);
            if (cellule) cellule.textContent = vide ? "—" : montant(r.lignes[j++], r.devise);
          });
          dessinerTotaux(r);
        } catch (e) {
          if (tour !== F.calcul) return;
          zoneErreur.textContent = e.message; zoneErreur.hidden = false;
        }
      };
      if (immediat) return lancer();
      F.minuteur = setTimeout(lancer, 220);
    }
    function dessinerTotaux(r) {
      const l = (lib, val, classe = "") => el("div", { class: "l " + classe }, el("span", {}, lib), el("span", {}, val));
      const remise = Number(r.remise) > 0;
      totaux.replaceChildren(
        remise ? l(tva ? "Sous-total HT" : "Sous-total", montant(r.sous_total, r.devise)) : null,
        remise ? l(d.remise.type === "pourcent" ? t("Remise ({p} %)", { p: nombreAffiche(d.remise.valeur) }) : t("Remise"), "−" + montant(r.remise, r.devise)) : null,
        tva ? l("Total HT", montant(r.total_ht, r.devise)) : null,
        taxes ? l("Total avant taxes", montant(r.total_ht, r.devise)) : null,
        ...(tva ? r.tva.map(x => l(t("TVA {t} %", { t: nombreAffiche(x.taux) }), montant(x.montant, r.devise))) : []),
        ...(taxes ? r.tva.map(x => l(t("{nom} ({t} %)", { nom: nomTaxe(x.code), t: nombreAffiche(x.taux) }), montant(x.montant, r.devise))) : []),
        l(tva ? "Total TTC" : "Total", montant(r.total_ttc, r.devise), "fort"),
        tva || taxes ? null : el("div", { class: "fa-somme", style: "margin-top:6px" }, canada ? "Sans taxes (voir Réglages)." : "Sans TVA (voir Réglages)."));
    }

    // Remise
    const valeurRemise = el("input", { inputmode: "decimal", value: d.remise.type === "aucune" ? "" : nombreAffiche(d.remise.valeur),
      placeholder: "0", oninput: e => { d.remise.valeur = e.target.value; marquer(); recalculer(); } });
    valeurRemise.hidden = d.remise.type === "aucune";
    const typeRemise = el("select", { onchange: e => { d.remise.type = e.target.value; valeurRemise.hidden = d.remise.type === "aucune"; marquer(); recalculer(); } },
      [["aucune", "Pas de remise"], ["pourcent", "Remise en %"], ["montant", "Remise en montant"]].map(([v, lib]) =>
        el("option", { value: v, selected: d.remise.type === v ? "" : null }, lib)));

    const notes = el("textarea", { rows: 3, placeholder: "Imprimées sous les lignes (ex. remerciements, détail de la prestation)",
      oninput: e => { d.notes = e.target.value; marquer(); } });
    notes.value = d.notes || "";

    const options = [];
    if (d.type === "facture") {
      options.push(champ("Délai de paiement (jours)", sur(d, "delai_jours", { type: "number", min: 0, max: 365 }), "0 = à réception"));
      options.push(champ("Période de la prestation (facultatif)", sur(d, "prestation", { maxlength: 120, placeholder: "ex. octobre 2026" })));
    }
    if (d.type === "devis") options.push(champ("Validité (jours)", sur(d, "validite_jours", { type: "number", min: 1, max: 365 })));
    if (d.devis_numero) options.push(el("div", { class: "fa-somme" }, t("Issue du devis {numero}", { numero: d.devis_numero })));

    const libelleEmettre = { devis: "Émettre le devis", facture: "Émettre la facture", avoir: "Émettre l'avoir" }[d.type];
    racine().replaceChildren(
      el("datalist", { id: "fa-clients" }, F.r.clients.map(c => el("option", { value: c.nom }))),
      el("datalist", { id: "fa-unites" }, UNITES.map(u => el("option", { value: t(u) }))),
      el("div", { class: "barre-vue" },
        boutonRetour("Retour à la liste", quitterEdition),
        el("h2", {}, icone(ICONES_TYPES[d.type]), titreEdition()), el("span", { class: "tag" }, "Brouillon"),
        el("div", { class: "espace" }),
        d.id ? iconeBtn("trash-2", "Supprimer le brouillon", () => supprimerBrouillon(d.id), "danger") : null,
        bouton("eye", "Aperçu", apercuBrouillon),
        bouton("check", "Enregistrer", () => enregistrerBrouillon(true)),
        bouton("send", libelleEmettre, emettre, "btn principal")),
      el("div", { class: "fa-grille" },
        el("div", {},
          el("div", { class: "carte fa-section" },
            el("h3", {}, "Client", el("span", { class: "espace" }), choixContact),
            el("div", { class: "fa-deux" },
              el("div", {}, champ("Nom ou raison sociale", champsClient.nom), champ("E-mail", champsClient.email)),
              el("div", {}, champ("Adresse", champsClient.adresse))),
            el("div", { class: "fa-deux" },
              champ("Identifiant du client (facultatif)", champsClient.identifiant),
              champ("Objet (facultatif)", sur(d, "objet", { maxlength: 160, placeholder: "ex. Refonte du site vitrine" })))),
          el("div", { class: "carte fa-section" },
            el("h3", {}, "Lignes"),
            el("table", { class: "fa-lignes-table" },
              el("thead", {}, el("tr", {},
                el("th", {}, "Désignation"), el("th", { class: "d" }, "Qté"), el("th", {}, "Unité"),
                el("th", { class: "d" }, tva ? "Prix unit. HT" : "Prix unit."), tva ? el("th", { class: "d" }, "TVA %") : null,
                taxes ? el("th", { style: "text-align:center" }, "Taxable") : null,
                el("th", { class: "d" }, tva ? "Total HT" : "Montant"), el("th", {}))),
              corps),
            el("div", { class: "fa-pied-lignes" },
              bouton("plus", "Ajouter une ligne", () => { d.lignes.push(ligneVide()); marquer(); dessinerLignes(); recalculer();
                setTimeout(() => corps.querySelector("tr:last-child input")?.focus(), 30); }, "btn"),
              F.r.temps && VUES.temps ? bouton("clock", "Importer des heures", importerHeures, "btn discret") : null,
              el("div", { class: "espace" }),
              el("div", { class: "fa-remise" }, typeRemise, valeurRemise))),
          el("div", { class: "carte fa-section" },
            el("h3", {}, "Notes"), notes)),
        el("div", {},
          el("div", { class: "carte fa-section" }, el("h3", {}, "Totaux"), totaux, zoneErreur),
          options.length ? el("div", { class: "carte fa-section" }, el("h3", {}, "Conditions"), ...options) : null)));
    dessinerLignes();
    recalculer(true);

    // Heures de Temps → lignes (le serveur fait la conversion exacte).
    async function importerHeures() {
      let h;
      try { h = await api("/api/factures/heures", {}); } catch (e) { erreur(e); return; }
      if (!h.disponible) { toast("L'application Temps n'est pas disponible.", "erreur"); return; }
      if (!h.sessions.length) { toast("Aucune session enregistrée dans Temps."); return; }
      const choix = new Set(h.sessions.filter(s => !s.facturee).map(s => s.id));
      const filtre = { projet: "", debut: "", fin: "" };
      const liste = el("div", { class: "fa-sessions lignes" });
      const somme = el("span", { class: "fa-somme" });
      const visibles = () => h.sessions.filter(s => (!filtre.projet || s.projet === filtre.projet)
        && (!filtre.debut || s.debut.slice(0, 10) >= filtre.debut) && (!filtre.fin || s.debut.slice(0, 10) <= filtre.fin));
      const duree = m => `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`;
      function dessiner() {
        const v = visibles();
        liste.replaceChildren(...(v.length ? v.map(s => {
          const caseC = el("input", { type: "checkbox", checked: choix.has(s.id) ? "" : null,
            onclick: e => e.stopPropagation(), onchange: e => { e.target.checked ? choix.add(s.id) : choix.delete(s.id); majSomme(); } });
          return el("label", { class: "ligne" }, caseC,
            el("div", { class: "ligne-corps" },
              el("div", { class: "ligne-titre" }, el("span", {}, s.projet), s.facturee ? el("span", { class: "tag" }, "déjà facturée") : null),
              el("div", { class: "ligne-meta" }, [dateCourte(s.debut), `${s.debut.slice(11, 16)} – ${s.fin.slice(11, 16)}`, s.note].filter(Boolean).join(" · "))),
            el("div", { class: "ligne-cote" }, duree(s.minutes)));
        }) : [el("div", { class: "vide", style: "border:0" }, "Aucune session sur cette période.")]));
        majSomme();
      }
      function majSomme() {
        const ids = new Set(visibles().map(s => s.id));
        const minutes = h.sessions.filter(s => choix.has(s.id) && ids.has(s.id)).reduce((a, s) => a + s.minutes, 0);
        somme.textContent = t("{n} session(s) cochée(s) · {duree}", { n: h.sessions.filter(s => choix.has(s.id) && ids.has(s.id)).length, duree: duree(minutes) });
      }
      const taux = el("input", { inputmode: "decimal", placeholder: "ex. 45", style: "text-align:right" });
      const regrouper = el("select", {}, [["projet", "Une ligne par projet"], ["jour", "Une ligne par jour"], ["session", "Une ligne par session"]].map(([v, lib]) => el("option", { value: v }, lib)));
      const projet = el("select", { onchange: e => { filtre.projet = e.target.value; dessiner(); } },
        el("option", { value: "" }, "Tous les projets"), h.projets.map(p => el("option", { value: p }, p)));
      const date = cle => el("input", { type: "date", onchange: e => { filtre[cle] = e.target.value; dessiner(); } });
      fenetre([
        el("h3", {}, "Importer des heures"),
        el("p", {}, "Sessions enregistrées dans Temps. Les durées sont converties en heures au centième (10 min = 0,17 h)."),
        el("div", { class: "fa-trois" }, champ("Projet", projet), champ("Du", date("debut")), champ("Au", date("fin"))),
        el("div", { style: "display:flex;gap:8px;justify-content:flex-end;margin-bottom:4px" },
          el("button", { class: "btn petit discret", onclick: () => { visibles().forEach(s => choix.add(s.id)); dessiner(); } }, "Tout cocher"),
          el("button", { class: "btn petit discret", onclick: () => { visibles().forEach(s => choix.delete(s.id)); dessiner(); } }, "Tout décocher")),
        liste,
        el("div", { class: "fa-deux" }, champ("Taux horaire", taux), champ("Regroupement", regrouper)),
        el("div", { class: "actions", style: "align-items:center" }, somme, el("div", { style: "flex:1" }),
          el("button", { class: "btn", onclick: fermer }, "Annuler"),
          el("button", { class: "btn principal", onclick: async () => {
            const ids = visibles().map(s => s.id).filter(id => choix.has(id));
            try {
              const r = await api("/api/factures/heures/lignes", { ids, taux: taux.value, regrouper: regrouper.value });
              d.lignes = d.lignes.filter(l => String(l.designation || "").trim() || String(l.prix || "").trim()).concat(r.lignes);
              fermer(); marquer(); dessinerLignes(); recalculer(true);
              toast(t("{n} ligne(s) ajoutée(s)", { n: r.lignes.length }), "succes", 1800);
            } catch (e) { erreur(e); }
          } }, "Ajouter les lignes"))]);
      $("#fenetre").style.width = "min(720px, 94vw)";
      dessiner();
      setTimeout(() => taux.focus(), 60);
    }
  }

  async function enregistrerBrouillon(message) {
    const doc = await api("/api/factures/enregistrer", { document: corpsDoc() }).catch(e => { erreur(e); return null; });
    if (!doc) return null;
    const nouveau = !F.doc.id;
    F.doc.id = doc.id;
    F.modifie = false;
    if (message) toast("Brouillon enregistré", "succes", 1500);
    if (nouveau) ecranEdition();  // le bouton Supprimer et le titre changent
    return doc;
  }

  async function quitterEdition() {
    if (F.modifie && !(await confirmer(icone("triangle-alert"), "Quitter sans enregistrer ?", "Les modifications de ce brouillon seront perdues.", "Quitter"))) return;
    F.ecran = "liste"; F.doc = null; F.modifie = false;
    afficher();
  }

  async function apercuBrouillon() {
    try {
      const r = await api("/api/factures/apercu", { document: corpsDoc() });
      montrerApercu(r.html);
    } catch (e) { erreur(e); }
  }

  function montrerApercu(html) {
    const cadre = el("iframe", { sandbox: "", title: t("Aperçu du document") });
    cadre.srcdoc = html;
    fenetre([el("h3", {}, "Aperçu"), cadre, el("div", { class: "actions" }, el("button", { class: "btn", onclick: fermer }, "Fermer"))]);
    $("#fenetre").classList.add("fa-fenetre-apercu");
  }

  async function emettre() {
    const doc = await enregistrerBrouillon(false);
    if (!doc) return;
    let numero = "";
    try { numero = (await api("/api/factures/reglages", {})).prochains[doc.type]; } catch { /* numéro affiché seulement */ }
    const textes = {
      devis: ["Émettre le devis ?", "Il reçoit le numéro {numero} et ne pourra plus être modifié. Le PDF est enregistré dans Documents > Mes outils > Factures."],
      facture: ["Émettre la facture ?", "Elle reçoit le numéro {numero} et ne pourra plus être modifiée (pour la corriger : un avoir). Le PDF est enregistré dans Documents > Mes outils > Factures."],
      avoir: ["Émettre l'avoir ?", "Il reçoit le numéro {numero} et ne pourra plus être modifié. Le PDF est enregistré dans Documents > Mes outils > Factures."],
    }[doc.type];
    if (!(await confirmer(icone("send"), textes[0], t(textes[1], { numero }), "Émettre"))) return;
    try {
      const r = await api("/api/factures/emettre", { id: doc.id });
      toast(t("{numero} émis", { numero: r.document.numero }), "succes", 2200);
      if (r.pdf_erreur) toast(t("PDF non créé : {erreur}", { erreur: I18N.traduire(r.pdf_erreur) }), "erreur", 7000);
      F.doc = null; F.modifie = false;
      await charger();
      ouvrirFiche(r.document.id);
    } catch (e) { erreur(e); }
  }

  // ---------------------------------------------------------- document émis
  async function ouvrirFiche(id) {
    let doc, apercu;
    try {
      [doc, apercu] = await Promise.all([api("/api/factures/document", { id }), api("/api/factures/apercu", { id })]);
    } catch (e) { erreur(e); F.ecran = "liste"; F.fiche = null; return ecranListe(); }
    F.ecran = "fiche"; F.fiche = doc;
    const r = doc.resume, dev = doc.totaux.devise;
    const cadre = el("iframe", { sandbox: "", title: t("Aperçu du document") });
    cadre.srcdoc = apercu.html;
    const infos = [["Date d'émission", dateCourte(doc.date)]];
    if (doc.type === "facture") infos.push(["Échéance", dateCourte(doc.echeance)]);
    if (doc.type === "devis") infos.push(["Valable jusqu'au", dateCourte(doc.validite)]);
    infos.push([doc.totaux.avec_tva && doc.totaux.regime !== "canada" ? "Total TTC" : "Total", montant(doc.totaux.total_ttc, dev)]);
    if (doc.type === "facture") {
      if (Number(r.avoirs) > 0) infos.push(["Avoirs", "−" + montant(r.avoirs, dev)]);
      infos.push(["Payé", montant(r.paye, dev)]);
      infos.push(["Reste à payer", montant(r.reste, dev)]);
    }
    const lien = (texte, cible) => el("a", { onclick: () => ouvrirFiche(cible) }, texte);
    const liens = [];
    if (doc.devis_id && doc.devis_numero) liens.push(["Devis d'origine", lien(doc.devis_numero, doc.devis_id)]);
    if (doc.origine_id && doc.origine_numero) liens.push(["Facture d'origine", lien(doc.origine_numero, doc.origine_id)]);
    if (doc.type === "devis" && doc.facture_id) {
      const f = F.r.documents.find(x => x.id === doc.facture_id);
      if (f) liens.push(["Facture", f.numero ? lien(f.numero, f.id) : el("a", { onclick: () => ouvrir(f) }, t("Brouillon"))]);
    }
    for (const a of doc.avoirs_lies || []) {
      const x = F.r.documents.find(y => y.id === a.id);
      liens.push(["Avoir", a.numero ? lien(a.numero, a.id) : el("a", { onclick: () => x && ouvrir(x) }, t("Brouillon"))]);
    }

    const actions = [];
    if (doc.type === "devis") {
      const fini = ["facture", "refuse"].includes(r.etat);
      if (!fini) actions.push(bouton("receipt-text", "Transformer en facture", () => action("transformer", doc.id), "btn principal"));
      if (r.etat !== "accepte" && r.etat !== "facture") actions.push(bouton("check", "Marquer accepté", () => action("statut", doc.id, { statut: "accepte" })));
      if (!fini) actions.push(bouton("x", "Marquer refusé", () => action("statut", doc.id, { statut: "refuse" })));
      if (r.etat === "refuse" || r.etat === "accepte") actions.push(bouton("undo-2", "Revenir à « envoyé »", () => action("statut", doc.id, { statut: "emis" }), "btn discret"));
    }
    if (doc.type === "facture") {
      if (Number(r.reste) > 0) actions.push(bouton("banknote", "Enregistrer un paiement", () => saisirPaiement(doc.id, r.reste, dev), "btn principal"));
      if (r.etat !== "annulee") actions.push(bouton("undo-2", "Créer un avoir", async () => {
        if (!(await confirmer(icone("undo-2"), "Créer un avoir ?", "Un avoir en brouillon reprend les lignes de la facture : gardez seulement ce qui doit être annulé ou remboursé, puis émettez-le.", "Créer"))) return;
        action("avoir", doc.id);
      }));
    }
    actions.push(bouton("copy", "Dupliquer en brouillon", () => action("dupliquer", doc.id), "btn discret"));

    const paiements = doc.type === "facture" ? el("div", { class: "carte fa-section" },
      el("h3", {}, "Paiements"),
      (doc.paiements || []).length
        ? el("div", { class: "lignes" }, doc.paiements.map(p => el("div", { class: "ligne" },
          el("div", { class: "ligne-corps" },
            el("div", { class: "ligne-titre" }, montant(p.montant, dev)),
            el("div", { class: "ligne-meta" }, [dateCourte(p.date), t((MOYENS.find(m => m[0] === p.moyen) || [, p.moyen])[1]), p.note].filter(Boolean).join(" · "))),
          el("div", { class: "ligne-actions" }, iconeBtn("trash-2", "Supprimer ce paiement", async () => {
            if (!(await confirmer(icone("trash-2"), "Supprimer ce paiement ?", "Le reste à payer est recalculé.", "Supprimer"))) return;
            try { await api("/api/factures/paiement/supprimer", { id: doc.id, paiement_id: p.id }); await charger(); ouvrirFiche(doc.id); } catch (e) { erreur(e); }
          }, "danger")))))
        : el("div", { class: "fa-somme" }, "Aucun paiement enregistré.")) : null;

    racine().replaceChildren(
      el("div", { class: "barre-vue" },
        boutonRetour("Retour à la liste", () => { F.ecran = "liste"; F.fiche = null; afficher(); }),
        el("h2", {}, icone(ICONES_TYPES[doc.type]), `${t(NOMS_TYPES[doc.type])} ${doc.numero}`),
        etatTxt(r.etat),
        el("span", { class: "fa-somme" }, doc.client?.nom || ""),
        el("div", { class: "espace" }),
        bouton("file-down", "Ouvrir le PDF", () => ouvrirPdf(doc.id)),
        bouton("folder-open", "Ouvrir le dossier", () => ouvrirDossier(doc.id), "btn discret"),
        bouton("mail", "Envoyer par mail", () => envoyerMail(doc.id))),
      el("div", { class: "fa-grille large" },
        el("div", { class: "fa-papier" }, cadre),
        el("div", {},
          el("div", { class: "carte fa-section" },
            el("h3", {}, "Montants"),
            el("dl", { class: "fa-infos" }, infos.flatMap(([a, b]) => [el("dt", {}, a), el("dd", {}, b)])),
            liens.length ? el("dl", { class: "fa-infos", style: "margin-top:10px;padding-top:10px;border-top:1px solid var(--ligne)" },
              liens.flatMap(([a, b]) => [el("dt", {}, a), el("dd", {}, b)])) : null),
          el("div", { class: "carte fa-section" }, el("h3", {}, "Actions"), el("div", { class: "fa-actions" }, actions)),
          paiements)));
  }

  async function action(nom, id, extra = {}) {
    try {
      const doc = await api("/api/factures/" + nom, { id, ...extra });
      await charger();
      if (doc.numero) return ouvrirFiche(doc.id);
      F.doc = brouillonDepuis(doc); F.modifie = false;
      ecranEdition();
      toast(nom === "transformer" ? "Facture créée en brouillon" : nom === "avoir" ? "Avoir créé en brouillon" : "Brouillon créé", "succes", 1800);
    } catch (e) { erreur(e); }
  }

  function saisirPaiement(id, reste, devise) {
    const date = el("input", { type: "date", value: jourIso(new Date()) });
    const valeur = el("input", { inputmode: "decimal", value: nombreAffiche(reste), style: "text-align:right" });
    const moyen = el("select", {}, MOYENS.map(([v, lib]) => el("option", { value: v }, lib)));
    const note = el("input", { maxlength: 120, placeholder: "ex. référence du virement" });
    const valider = async () => {
      try {
        await api("/api/factures/paiement/ajouter", { id, paiement: { date: date.value, montant: valeur.value, moyen: moyen.value, note: note.value } });
        fermer(); toast("Paiement enregistré", "succes", 1600);
        await charger();
        if (F.ecran === "fiche") ouvrirFiche(id); else ecranListe();
      } catch (e) { erreur(e); }
    };
    fenetre([
      el("h3", {}, "Enregistrer un paiement"),
      el("p", {}, t("Reste à payer : {montant}", { montant: montant(reste, devise) })),
      el("div", { class: "fa-deux" }, champ("Date", date), champ("Montant", valeur)),
      champ("Moyen de paiement", moyen),
      champ("Note (facultatif)", note),
      el("div", { class: "actions" }, el("button", { class: "btn", onclick: fermer }, "Annuler"),
        el("button", { class: "btn principal", onclick: valider }, "Enregistrer"))], true);
    setTimeout(() => valeur.select(), 60);
  }

  async function ouvrirPdf(id) {
    try { await api("/api/factures/pdf/ouvrir", { id }); } catch (e) { erreur(e); }
  }
  async function ouvrirDossier(id) {
    try { await api("/api/factures/dossier/ouvrir", { id }); } catch (e) { erreur(e); }
  }

  async function envoyerMail(id) {
    let r;
    try { r = await api("/api/factures/mail", { id }); } catch (e) { erreur(e); return; }
    const lien = el("a", { href: r.mailto });
    document.body.append(lien); lien.click(); lien.remove();
    fenetre([
      el("div", { class: "gros" }, icone("paperclip")),
      el("h3", {}, "Pièce jointe à ajouter"),
      el("p", {}, t("Votre messagerie s'ouvre avec l'objet et le texte prêts. Joignez le PDF à la main : « {nom} ».", { nom: r.nom_pdf })),
      r.email ? null : el("p", {}, "Aucune adresse e-mail pour ce client : complétez le destinataire dans le message."),
      el("div", { class: "actions" },
        el("button", { class: "btn", onclick: () => copier(r.texte, "Texte copié") }, icone("copy", "av"), "Copier le texte"),
        el("button", { class: "btn", onclick: () => ouvrirDossier(id) }, icone("folder-open", "av"), "Ouvrir le dossier"),
        el("button", { class: "btn principal", onclick: fermer }, "OK"))], true);
  }

  // ---------------------------------------------------------- déclaration
  async function carteAccueil() {
    let r;
    try { r = await api("/api/factures/resume", {}); } catch { return null; }
    if (!r.configuree) return null;
    const dues = r.devises.filter(x => Number(x.impaye) > 0);
    if (!dues.length && !r.nb_retard) return null;
    return el("div", { class: "carte-jour", onclick: () => { F.ecran = "liste"; F.filtre = r.nb_retard ? "retard" : "impayees"; montrerVue("factures"); } },
      el("h4", {}, icone("receipt-text"), "Factures"),
      el("div", { class: "grand" }, dues.map(x => montant(x.impaye, x.devise)).join(" · ")),
      el("div", { class: "ligne-jour" }, "à encaisser"),
      r.nb_retard ? el("div", { class: "ligne-jour" }, el("span", { class: "etat-txt rouge" },
        t(r.nb_retard > 1 ? "{n} factures en retard" : "{n} facture en retard", { n: r.nb_retard }))) : null);
  }

  // Palette (Ctrl + K) : le nouveau document s'ouvre une fois la liste chargée.
  const commande = type => () => { F.aCreer = type; montrerVue("factures"); };

  VUES.factures = {
    afficher,
    titre: "Devis et factures", icone: icone("receipt-text"), groupe: "clients", ordre: 20,
    description: "Devis, factures et avoirs numérotés, totaux exacts, PDF, paiements et relances des impayés.",
    profils: ["freelance", "assistant_virtuel"],
    carteAccueil,
    commandes: () => [
      { icone: icone("plus"), titre: "Nouvelle facture", detail: "Devis et factures", action: commande("facture") },
      { icone: icone("file-plus"), titre: "Nouveau devis", detail: "Devis et factures", action: commande("devis") },
    ],
  };

  // ---------------------------------------------------------- traductions
  I18N.ajouter({
    "Devis et factures": "Quotes & invoices",
    "Devis, factures et avoirs numérotés, totaux exacts, PDF, paiements et relances des impayés.":
      "Numbered quotes, invoices and credit notes, exact totals, PDFs, payments and overdue reminders.",
    "Devis": "Quote", "Facture": "Invoice", "Avoir": "Credit note", "Factures": "Invoices", "Avoirs": "Credit notes",
    "Brouillon": "Draft", "Envoyé": "Sent", "Envoyée": "Sent", "Accepté": "Accepted", "Refusé": "Declined", "Facturé": "Invoiced",
    "Expiré": "Expired", "Payée partiellement": "Partly paid", "Payée": "Paid", "En retard": "Overdue", "Annulée": "Cancelled", "Émis": "Issued",
    "Virement": "Bank transfer", "Espèces": "Cash", "Chèque": "Cheque", "Carte bancaire": "Card", "Mobile Money": "Mobile Money",
    "PayPal": "PayPal", "Autre": "Other",
    "h": "h", "jour": "day", "forfait": "flat fee", "unité": "unit", "mois": "month", "page": "page", "mot": "word",
    "Facturé ce mois": "Invoiced this month", "Encaissé ce mois": "Received this month", "paiements enregistrés": "recorded payments",
    "Impayé": "Unpaid", "factures émises non réglées": "issued invoices not yet paid", "{n} devis en attente": "{n} pending quote(s)",
    "{n} facture": "{n} invoice", "{n} factures": "{n} invoices",
    "Tout": "All", "Impayées": "Unpaid", "Brouillons": "Drafts",
    "Client, numéro, objet…": "Client, number, subject…",
    "Exporter CSV": "Export CSV", "Réglages de l'entreprise": "Company settings",
    "Nouveau devis": "New quote", "Nouvelle facture": "New invoice",
    "Aucun document pour ce filtre.": "No document for this filter.",
    "Aucun devis ni facture pour l'instant.": "No quotes or invoices yet.",
    "échéance {date}": "due {date}", "valable jusqu'au {date}": "valid until {date}", "sur {numero}": "on {numero}",
    "reste {montant}": "{montant} outstanding", "Client à indiquer": "Client to fill in",
    "Ouvrir le PDF": "Open PDF", "Envoyer par mail": "Send by email", "Enregistrer un paiement": "Record a payment",
    "Modifier": "Edit", "Supprimer le brouillon": "Delete draft",
    "Supprimer ce brouillon ?": "Delete this draft?", "Il n'a pas encore de numéro : il disparaît simplement.": "It has no number yet: it simply disappears.",
    "Supprimer": "Delete", "Brouillon supprimé": "Draft deleted",
    // Réglages
    "Bienvenue dans Devis et factures": "Welcome to Quotes & invoices",
    "Indiquez d'abord votre entreprise : ces informations figurent sur chaque devis et facture. Vous pourrez les modifier plus tard ; un document déjà émis garde celles du jour de son émission.":
      "First, tell us about your business: this information appears on every quote and invoice. You can change it later; an issued document keeps the details of its issue date.",
    "Retour": "Back", "Enregistrer": "Save", "Entreprise": "Business", "Nom ou raison sociale": "Name or company name",
    "ex. Studio Exemple": "e.g. Example Studio", "Adresse": "Address", "Rue, code postal, ville, pays": "Street, postcode, city, country",
    "E-mail": "Email", "Téléphone": "Phone", "Aucun logo": "No logo", "Choisir une image": "Choose an image", "Retirer le logo": "Remove logo",
    "Logo enregistré": "Logo saved", "Mentions en bas de page (facultatif)": "Footer notes (optional)",
    "ex. Capital social, RCS, assurance professionnelle…": "e.g. share capital, registration, professional insurance…",
    "Identifiants": "Identifiers", "Libellé": "Label", "Numéro": "Number", "Retirer": "Remove",
    "SIRET, NIF, STAT, n° de TVA intracommunautaire… : ils sont imprimés sous votre adresse.":
      "Company number, tax ID, VAT number…: they are printed under your address.",
    "Ajouter un identifiant": "Add an identifier", "Paiement": "Payment", "IBAN ou RIB": "IBAN or account number", "BIC": "BIC",
    "Autres coordonnées de paiement": "Other payment details", "ex. Mobile Money, PayPal…": "e.g. Mobile Money, PayPal…",
    "Délai de paiement (jours)": "Payment term (days)", "0 = à réception": "0 = due on receipt",
    "Validité des devis (jours)": "Quote validity (days)", "Pénalités de retard": "Late payment penalties",
    "TVA": "VAT", "Assujetti à la TVA": "VAT registered", "Taux par défaut": "Default rate",
    "TVA non applicable, art. 293 B du CGI": "VAT not applicable, art. 293 B of the French General Tax Code",
    "Autre mention": "Other statement", "Mention imprimée": "Printed statement",
    "ex. TVA non applicable – Exonération": "e.g. VAT exempt",
    "Devise": "Currency", "Devise des documents": "Document currency", "Euro (€)": "Euro (€)", "Dollar américain ($)": "US dollar ($)",
    "Ariary (Ar)": "Ariary (Ar)", "Peso colombien (COP)": "Colombian peso (COP)",
    "Autre devise": "Other currency", "Code": "Code", "Symbole": "Symbol", "Décimales": "Decimals",
    "ex. CHF": "e.g. CHF", "Numérotation": "Numbering",
    "Dollar canadien ($)": "Canadian dollar ($)", "Taxes": "Taxes", "Régime": "Tax system",
    "TVA (France, Europe, Madagascar…)": "VAT (France, Europe, Madagascar…)", "Canada (TPS, TVQ, TVH…)": "Canada (GST, QST, HST…)",
    "Province ou territoire": "Province or territory", "Inscrit aux taxes": "Registered for sales taxes",
    "Non inscrit (autre mention)": "Not registered (other statement)", "Taux": "Rate", "N° d'inscription": "Registration number",
    "ex. 1234567890 TQ0001": "e.g. 1234567890 TQ0001", "ex. 123456789 RT0001": "e.g. 123456789 RT0001",
    "Les taux sont ceux de la province ; vous pouvez les modifier. Les numéros d'inscription sont imprimés sur chaque facture.":
      "Rates are the province's usual ones; you can change them. Registration numbers are printed on every invoice.",
    "ex. Petit fournisseur non inscrit aux fins de la TPS et de la TVQ": "e.g. Small supplier, not registered for GST/QST",
    "Québec": "Quebec", "Ontario": "Ontario", "Nouvelle-Écosse": "Nova Scotia", "Nouveau-Brunswick": "New Brunswick",
    "Terre-Neuve-et-Labrador": "Newfoundland and Labrador", "Île-du-Prince-Édouard": "Prince Edward Island",
    "Colombie-Britannique": "British Columbia", "Manitoba": "Manitoba", "Saskatchewan": "Saskatchewan", "Alberta": "Alberta",
    "Yukon, Territoires du Nord-Ouest, Nunavut": "Yukon, Northwest Territories, Nunavut",
    "Taxable": "Taxable", "Total avant taxes": "Total before tax", "{nom} ({t} %)": "{nom} ({t}%)",
    "Sans taxes (voir Réglages).": "No sales tax (see Settings).",
    "Prochains numéros : {d}, {f}, {a}": "Next numbers: {d}, {f}, {a}",
    "Numéro attribué à l'émission, à la suite, et remis à 1 chaque année.": "Numbers are given on issue, in sequence, and restart at 1 each year.",
    "Réglages enregistrés": "Settings saved",
    // Édition
    "Avoir sur la facture {numero}": "Credit note for invoice {numero}",
    "Client": "Client", "Choisir dans Contacts…": "Choose from Contacts…", "Nom du client ou de l'entreprise": "Client or company name",
    "Identifiant du client (facultatif)": "Client identifier (optional)", "ex. SIRET ou n° de TVA du client": "e.g. client's company or VAT number",
    "Objet (facultatif)": "Subject (optional)", "ex. Refonte du site vitrine": "e.g. Website redesign",
    "Lignes": "Lines", "Désignation": "Description", "Qté": "Qty", "Unité": "Unit", "Prix unit. HT": "Unit price excl. VAT",
    "Prix unit.": "Unit price", "TVA %": "VAT %", "Total HT": "Total excl. VAT", "Montant": "Amount", "Retirer la ligne": "Remove line",
    "Ajouter une ligne": "Add a line", "Importer des heures": "Import hours",
    "Pas de remise": "No discount", "Remise en %": "Discount in %", "Remise en montant": "Discount amount",
    "Notes": "Notes", "Imprimées sous les lignes (ex. remerciements, détail de la prestation)": "Printed under the lines (e.g. thanks, service details)",
    "Totaux": "Totals", "Conditions": "Terms", "Sous-total HT": "Subtotal excl. VAT", "Sous-total": "Subtotal",
    "Remise": "Discount", "Remise ({p} %)": "Discount ({p}%)", "TVA {t} %": "VAT {t}%", "Total TTC": "Total incl. VAT", "Total": "Total",
    "Sans TVA (voir Réglages).": "No VAT (see Settings).",
    "Période de la prestation (facultatif)": "Service period (optional)", "ex. octobre 2026": "e.g. October 2026",
    "Validité (jours)": "Validity (days)", "Issue du devis {numero}": "From quote {numero}",
    "Retour à la liste": "Back to the list", "Aperçu": "Preview", "Aperçu du document": "Document preview", "Fermer": "Close",
    "Émettre le devis": "Issue quote", "Émettre la facture": "Issue invoice", "Émettre l'avoir": "Issue credit note",
    "Brouillon enregistré": "Draft saved", "Quitter sans enregistrer ?": "Leave without saving?",
    "Les modifications de ce brouillon seront perdues.": "Changes to this draft will be lost.", "Quitter": "Leave",
    "Émettre le devis ?": "Issue the quote?", "Émettre la facture ?": "Issue the invoice?", "Émettre l'avoir ?": "Issue the credit note?",
    "Il reçoit le numéro {numero} et ne pourra plus être modifié. Le PDF est enregistré dans Documents > Mes outils > Factures.":
      "It gets number {numero} and can no longer be edited. The PDF is saved in Documents > Mes outils > Factures.",
    "Elle reçoit le numéro {numero} et ne pourra plus être modifiée (pour la corriger : un avoir). Le PDF est enregistré dans Documents > Mes outils > Factures.":
      "It gets number {numero} and can no longer be edited (to correct it: a credit note). The PDF is saved in Documents > Mes outils > Factures.",
    "Émettre": "Issue", "{numero} émis": "{numero} issued", "PDF non créé : {erreur}": "PDF not created: {erreur}",
    // Heures
    "L'application Temps n'est pas disponible.": "The Time app is not available.",
    "Aucune session enregistrée dans Temps.": "No session recorded in Time.",
    "Sessions enregistrées dans Temps. Les durées sont converties en heures au centième (10 min = 0,17 h).":
      "Sessions recorded in Time. Durations are converted to hours, rounded to the hundredth (10 min = 0.17 h).",
    "Projet": "Project", "Du": "From", "Au": "To", "Tous les projets": "All projects", "Tout cocher": "Select all", "Tout décocher": "Clear all",
    "déjà facturée": "already invoiced", "Aucune session sur cette période.": "No session in this period.",
    "{n} session(s) cochée(s) · {duree}": "{n} session(s) selected · {duree}",
    "Taux horaire": "Hourly rate", "ex. 45": "e.g. 45", "Regroupement": "Grouping", "Une ligne par projet": "One line per project",
    "Une ligne par jour": "One line per day", "Une ligne par session": "One line per session", "Ajouter les lignes": "Add lines",
    "{n} ligne(s) ajoutée(s)": "{n} line(s) added", "Annuler": "Cancel",
    // Document émis
    "Date d'émission": "Issue date", "Échéance": "Due date", "Valable jusqu'au": "Valid until", "Payé": "Paid", "Reste à payer": "Outstanding",
    "Devis d'origine": "Original quote", "Facture d'origine": "Original invoice", "Montants": "Amounts", "Actions": "Actions",
    "Transformer en facture": "Convert to invoice", "Marquer accepté": "Mark as accepted", "Marquer refusé": "Mark as declined",
    "Revenir à « envoyé »": "Back to “sent”", "Créer un avoir": "Create a credit note", "Créer un avoir ?": "Create a credit note?",
    "Un avoir en brouillon reprend les lignes de la facture : gardez seulement ce qui doit être annulé ou remboursé, puis émettez-le.":
      "A draft credit note copies the invoice lines: keep only what must be cancelled or refunded, then issue it.",
    "Créer": "Create", "Dupliquer en brouillon": "Duplicate as draft", "Paiements": "Payments", "Aucun paiement enregistré.": "No payment recorded.",
    "Supprimer ce paiement": "Delete this payment", "Supprimer ce paiement ?": "Delete this payment?",
    "Le reste à payer est recalculé.": "The outstanding amount is recalculated.", "Ouvrir le dossier": "Open folder",
    "Facture créée en brouillon": "Draft invoice created", "Avoir créé en brouillon": "Draft credit note created", "Brouillon créé": "Draft created",
    "Date": "Date", "Moyen de paiement": "Payment method", "Note (facultatif)": "Note (optional)", "ex. référence du virement": "e.g. transfer reference",
    "Reste à payer : {montant}": "Outstanding: {montant}", "Paiement enregistré": "Payment recorded",
    "Pièce jointe à ajouter": "Attachment to add",
    "Votre messagerie s'ouvre avec l'objet et le texte prêts. Joignez le PDF à la main : « {nom} ».":
      "Your email app opens with the subject and text ready. Attach the PDF yourself: “{nom}”.",
    "Aucune adresse e-mail pour ce client : complétez le destinataire dans le message.": "No email address for this client: fill in the recipient in the message.",
    "Copier le texte": "Copy text", "Texte copié": "Text copied", "OK": "OK",
    // Accueil
    "à encaisser": "to collect", "{n} facture en retard": "{n} overdue invoice", "{n} factures en retard": "{n} overdue invoices",
    // Messages du serveur
    "Indiquez le nom de l'entreprise.": "Enter the business name.", "Mention de TVA inconnue.": "Unknown VAT statement.",
    "Indiquez la mention de TVA.": "Enter the VAT statement.", "IBAN invalide (clé de contrôle).": "Invalid IBAN (check digits).",
    "Devise inconnue.": "Unknown currency.", "Code de devise invalide (lettres, ex. CHF).": "Invalid currency code (letters, e.g. CHF).",
    "Préfixe invalide (lettres et chiffres, 10 au plus).": "Invalid prefix (letters and digits, 10 at most).",
    "Les préfixes des devis, factures et avoirs doivent être différents.": "Quote, invoice and credit note prefixes must be different.",
    "Logo": "Logo", "image PNG, JPG, GIF ou WebP attendue.": "PNG, JPG, GIF or WebP image expected.",
    "le fichier n'est pas une image valide.": "the file is not a valid image.",
    "Logo illisible.": "Unreadable logo.", "Logo trop lourd (1 Mo au plus).": "Logo too large (1 MB max).",
    "Document introuvable.": "Document not found.", "Type de document inconnu.": "Unknown document type.",
    "Type de remise inconnu.": "Unknown discount type.", "La remise dépasse le sous-total.": "The discount exceeds the subtotal.",
    "Document émis": "Issued document", "il n'est plus modifiable. Pour corriger une facture, créez un avoir.": "it can no longer be edited. To correct an invoice, create a credit note.",
    "Un avoir se crée depuis la facture à corriger.": "A credit note is created from the invoice to correct.",
    "Un document émis ne se supprime pas.": "An issued document cannot be deleted.",
    "Ce document est déjà émis.": "This document has already been issued.",
    "Renseignez d'abord votre entreprise (Réglages).": "First fill in your business details (Settings).",
    "Indiquez le client.": "Enter the client.", "Ajoutez au moins une ligne avec une désignation.": "Add at least one line with a description.",
    "Chaque ligne doit avoir une désignation.": "Each line needs a description.", "Le total doit être supérieur à zéro.": "The total must be greater than zero.",
    "Facture d'origine introuvable.": "Original invoice not found.", "L'avoir dépasse le montant restant de la facture.": "The credit note exceeds the invoice's remaining amount.",
    "Un document de cette série porte une date postérieure à aujourd'hui": "A document in this series is dated after today",
    "vérifiez la date de l'ordinateur.": "check the computer's date.",
    "Statut inconnu.": "Unknown status.", "Seul un devis émis peut être accepté ou refusé.": "Only an issued quote can be accepted or declined.",
    "Ce devis a déjà été transformé en facture.": "This quote has already been converted to an invoice.",
    "Émettez d'abord le devis.": "Issue the quote first.", "Ce devis est refusé.": "This quote is declined.",
    "Un avoir se crée sur une facture émise.": "A credit note is created on an issued invoice.",
    "Un paiement s'enregistre sur une facture émise.": "A payment is recorded on an issued invoice.",
    "Date du paiement invalide.": "Invalid payment date.", "Moyen de paiement inconnu.": "Unknown payment method.",
    "Paiement introuvable.": "Payment not found.", "Trop de documents.": "Too many documents.",
    "Choisissez au moins une session.": "Select at least one session.", "Sessions introuvables.": "Sessions not found.",
    "Microsoft Edge est introuvable": "Microsoft Edge was not found", "impossible de créer le PDF.": "the PDF cannot be created.",
    "Edge n'a pas pu créer le PDF.": "Edge could not create the PDF.",
    // Linux : le PDF est créé par Chrome ou Chromium
    "Google Chrome ou Chromium est introuvable": "Google Chrome or Chromium was not found",
    "Le PDF est ouvert dans un autre programme": "The PDF is open in another program", "fermez-le puis recommencez.": "close it and try again.",
    "Émettez d'abord le document (un brouillon n'a pas de numéro).": "Issue the document first (a draft has no number).",
    "Émettez d'abord le document.": "Issue the document first.",
    "Taux de TVA": "VAT rate", "Délai de paiement": "Payment term", "Validité des devis": "Quote validity", "Validité": "Validity",
    "nombre manquant.": "missing number.", "nombre invalide.": "invalid number.", "valeur trop petite.": "value too small.",
    "valeur trop grande.": "value too large.", "nombre entier attendu.": "whole number expected.",
    "Régime de taxes inconnu.": "Unknown tax system.", "Province inconnue.": "Unknown province.",
    "Deux taxes au plus.": "Two taxes at most.", "Taxe inconnue.": "Unknown tax.", "Une taxe est en double.": "A tax is listed twice.",
    "Au Canada, choisissez « Inscrit aux taxes » ou « Non inscrit ».": "In Canada, choose “Registered for sales taxes” or “Not registered”.",
  });
  I18N.motifs([
    [/^Ligne (\d+), quantité$/, (match, n) => I18N.langue === "es" ? `Línea ${n}, cantidad` : `Line ${n}, quantity`],
    [/^Ligne (\d+), prix$/, (match, n) => I18N.langue === "es" ? `Línea ${n}, precio` : `Line ${n}, price`],
    [/^Ligne (\d+), TVA$/, (match, n) => I18N.langue === "es" ? `Línea ${n}, IVA` : `Line ${n}, VAT`],
    [/^Taux de la (TPS|TVQ|TVH|TVP|TVD)$/, (match, taxe) => I18N.langue === "es" ? `Tasa de la ${taxe}` : "Rate"],
    [/^(\d) décimales au plus\.$/, (match, n) => I18N.langue === "es" ? `Máximo ${n} decimales.` : `${n} decimals at most.`],
    [/^entre (\d+) et (\d+)\.$/, (match, a, b) => I18N.langue === "es" ? `entre ${a} y ${b}.` : `between ${a} and ${b}.`],
    [/^(\d+) lignes au plus\.$/, (match, n) => I18N.langue === "es" ? `Máximo ${n} conceptos.` : `${n} lines at most.`],
    [/^Le montant dépasse le reste à payer \((.*)\)\.$/, (match, montant) => I18N.langue === "es" ? `El monto supera el saldo pendiente (${montant}).` : `The amount exceeds the outstanding balance (${montant}).`],
    [/^Chrome ou Chromium n'a pas pu créer le PDF\.$/, () => I18N.langue === "es" ? "Chrome o Chromium no pudo crear el PDF." : "Chrome or Chromium could not create the PDF."],
    [/^(Chrome|Chromium|Brave|Edge) n'a pas pu créer le PDF\.$/, (match, navigateur) => I18N.langue === "es" ? `${navigateur} no pudo crear el PDF.` : `${navigateur} could not create the PDF.`],
  ]);
  I18N.ajouterEspanol({
    "Devis et factures": "Cotizaciones y facturas",
    "Devis, factures et avoirs numérotés, totaux exacts, PDF, paiements et relances des impayés.":
      "Cotizaciones, facturas y notas de crédito numeradas, totales exactos, PDF, pagos y recordatorios de pagos pendientes.",
    "Devis": "Cotización", "Facture": "Factura", "Avoir": "Nota de crédito", "Factures": "Facturas", "Avoirs": "Notas de crédito",
    "Brouillon": "Borrador", "Envoyé": "Enviado", "Envoyée": "Enviada", "Accepté": "Aceptado", "Refusé": "Rechazado", "Facturé": "Facturado",
    "Expiré": "Vencido", "Payée partiellement": "Pagada parcialmente", "Payée": "Pagada", "En retard": "Atrasada", "Annulée": "Anulada", "Émis": "Emitido",
    "Virement": "Transferencia", "Espèces": "Efectivo", "Chèque": "Cheque", "Carte bancaire": "Tarjeta", "Mobile Money": "Mobile Money",
    "PayPal": "PayPal", "Autre": "Otro",
    "h": "h", "jour": "día", "forfait": "precio fijo", "unité": "unidad", "mois": "mes", "page": "página", "mot": "palabra",
    "Facturé ce mois": "Facturado este mes", "Encaissé ce mois": "Recibido este mes", "paiements enregistrés": "pagos registrados",
    "Impayé": "Pendiente de pago", "factures émises non réglées": "facturas emitidas sin pagar", "{n} devis en attente": "{n} cotizaciones pendientes",
    "{n} facture": "{n} factura", "{n} factures": "{n} facturas",
    "Tout": "Todo", "Impayées": "Pendientes de pago", "Brouillons": "Borradores",
    "Client, numéro, objet…": "Cliente, número, asunto…",
    "Exporter CSV": "Exportar CSV", "Réglages de l'entreprise": "Configuración de la empresa",
    "Nouveau devis": "Nueva cotización", "Nouvelle facture": "Nueva factura",
    "Aucun document pour ce filtre.": "No hay documentos para este filtro.",
    "Aucun devis ni facture pour l'instant.": "Todavía no hay cotizaciones ni facturas.",
    "échéance {date}": "vence el {date}", "valable jusqu'au {date}": "válida hasta el {date}", "sur {numero}": "sobre {numero}",
    "reste {montant}": "restan {montant}", "Client à indiquer": "Falta indicar el cliente",
    "Ouvrir le PDF": "Abrir el PDF", "Envoyer par mail": "Enviar por correo", "Enregistrer un paiement": "Registrar un pago",
    "Modifier": "Editar", "Supprimer le brouillon": "Eliminar el borrador",
    "Supprimer ce brouillon ?": "¿Eliminar este borrador?", "Il n'a pas encore de numéro : il disparaît simplement.": "Todavía no tiene número; simplemente desaparecerá.",
    "Supprimer": "Eliminar", "Brouillon supprimé": "Borrador eliminado",
    "Bienvenue dans Devis et factures": "Te damos la bienvenida a Cotizaciones y facturas",
    "Indiquez d'abord votre entreprise : ces informations figurent sur chaque devis et facture. Vous pourrez les modifier plus tard ; un document déjà émis garde celles du jour de son émission.":
      "Primero, indica los datos de tu empresa: aparecerán en cada cotización y factura. Puedes modificarlos después; los documentos emitidos conservarán los datos del día de su emisión.",
    "Retour": "Volver", "Enregistrer": "Guardar", "Entreprise": "Empresa", "Nom ou raison sociale": "Nombre o razón social",
    "ex. Studio Exemple": "p. ej., Estudio Ejemplo", "Adresse": "Dirección", "Rue, code postal, ville, pays": "Calle, código postal, ciudad, país",
    "E-mail": "Correo electrónico", "Téléphone": "Teléfono", "Aucun logo": "Sin logotipo", "Choisir une image": "Elegir una imagen", "Retirer le logo": "Quitar el logotipo",
    "Logo enregistré": "Logotipo guardado", "Mentions en bas de page (facultatif)": "Notas al pie (opcional)",
    "ex. Capital social, RCS, assurance professionnelle…": "p. ej., capital social, registro mercantil, seguro profesional…",
    "Identifiants": "Identificadores", "Libellé": "Etiqueta", "Numéro": "Número", "Retirer": "Quitar",
    "SIRET, NIF, STAT, n° de TVA intracommunautaire… : ils sont imprimés sous votre adresse.":
      "SIRET, NIF, STAT, número de IVA intracomunitario…: aparecerán debajo de tu dirección.",
    "Ajouter un identifiant": "Añadir un identificador", "Paiement": "Pago", "IBAN ou RIB": "IBAN o número de cuenta", "BIC": "BIC",
    "Autres coordonnées de paiement": "Otros datos de pago", "ex. Mobile Money, PayPal…": "p. ej., Mobile Money, PayPal…",
    "Délai de paiement (jours)": "Plazo de pago (días)", "0 = à réception": "0 = al recibir",
    "Validité des devis (jours)": "Vigencia de las cotizaciones (días)", "Pénalités de retard": "Recargos por mora",
    "TVA": "IVA", "Assujetti à la TVA": "Responsable del IVA", "Taux par défaut": "Tasa predeterminada",
    "TVA non applicable, art. 293 B du CGI": "IVA no aplicable, art. 293 B del CGI",
    "Autre mention": "Otra nota", "Mention imprimée": "Nota impresa",
    "ex. TVA non applicable – Exonération": "p. ej., IVA no aplicable – exención",
    "Devise": "Moneda", "Devise des documents": "Moneda de los documentos", "Euro (€)": "Euro (€)", "Dollar américain ($)": "Dólar estadounidense ($)",
    "Ariary (Ar)": "Ariary (Ar)", "Peso colombien (COP)": "Peso colombiano (COP)",
    "Autre devise": "Otra moneda", "Code": "Código", "Symbole": "Símbolo", "Décimales": "Decimales",
    "ex. CHF": "p. ej., CHF", "Numérotation": "Numeración",
    "Dollar canadien ($)": "Dólar canadiense ($)", "Taxes": "Impuestos", "Régime": "Régimen fiscal",
    "TVA (France, Europe, Madagascar…)": "IVA (Francia, Europa, Madagascar…)", "Canada (TPS, TVQ, TVH…)": "Canadá (TPS, TVQ, TVH…)",
    "Province ou territoire": "Provincia o territorio", "Inscrit aux taxes": "Inscrito para cobrar impuestos",
    "Non inscrit (autre mention)": "No inscrito (otra nota)", "Taux": "Tasa", "N° d'inscription": "Número de registro",
    "ex. 1234567890 TQ0001": "p. ej., 1234567890 TQ0001", "ex. 123456789 RT0001": "p. ej., 123456789 RT0001",
    "Les taux sont ceux de la province ; vous pouvez les modifier. Les numéros d'inscription sont imprimés sur chaque facture.":
      "Las tasas corresponden a las habituales de la provincia; puedes modificarlas. Los números de registro aparecerán en cada factura.",
    "ex. Petit fournisseur non inscrit aux fins de la TPS et de la TVQ": "p. ej., Pequeño proveedor no inscrito para TPS y TVQ",
    "Québec": "Quebec", "Ontario": "Ontario", "Nouvelle-Écosse": "Nueva Escocia", "Nouveau-Brunswick": "Nuevo Brunswick",
    "Terre-Neuve-et-Labrador": "Terranova y Labrador", "Île-du-Prince-Édouard": "Isla del Príncipe Eduardo",
    "Colombie-Britannique": "Columbia Británica", "Manitoba": "Manitoba", "Saskatchewan": "Saskatchewan", "Alberta": "Alberta",
    "Yukon, Territoires du Nord-Ouest, Nunavut": "Yukón, Territorios del Noroeste, Nunavut",
    "Taxable": "Gravable", "Total avant taxes": "Total antes de impuestos", "{nom} ({t} %)": "{nom} ({t} %)",
    "Sans taxes (voir Réglages).": "Sin impuestos (ver Configuración).",
    "Prochains numéros : {d}, {f}, {a}": "Próximos números: {d}, {f}, {a}",
    "Numéro attribué à l'émission, à la suite, et remis à 1 chaque année.": "El número se asigna al emitir el documento, en secuencia, y vuelve a 1 cada año.",
    "Réglages enregistrés": "Configuración guardada",
    "Avoir sur la facture {numero}": "Nota de crédito para la factura {numero}",
    "Client": "Cliente", "Choisir dans Contacts…": "Elegir de Contactos…", "Nom du client ou de l'entreprise": "Nombre del cliente o de la empresa",
    "Identifiant du client (facultatif)": "Identificador del cliente (opcional)", "ex. SIRET ou n° de TVA du client": "p. ej., SIRET o número de IVA del cliente",
    "Objet (facultatif)": "Asunto (opcional)", "ex. Refonte du site vitrine": "p. ej., Rediseño del sitio web",
    "Lignes": "Conceptos", "Désignation": "Descripción", "Qté": "Cant.", "Unité": "Unidad", "Prix unit. HT": "Precio unitario antes de impuestos",
    "Prix unit.": "Precio unitario", "TVA %": "IVA %", "Total HT": "Total antes de impuestos", "Montant": "Monto", "Retirer la ligne": "Quitar el concepto",
    "Ajouter une ligne": "Añadir un concepto", "Importer des heures": "Importar horas",
    "Pas de remise": "Sin descuento", "Remise en %": "Descuento en %", "Remise en montant": "Descuento por monto",
    "Notes": "Notas", "Imprimées sous les lignes (ex. remerciements, détail de la prestation)": "Se imprimirán debajo de los conceptos (p. ej., agradecimientos o detalles del servicio)",
    "Totaux": "Totales", "Conditions": "Condiciones", "Sous-total HT": "Subtotal antes de impuestos", "Sous-total": "Subtotal",
    "Remise": "Descuento", "Remise ({p} %)": "Descuento ({p} %)", "TVA {t} %": "IVA {t} %", "Total TTC": "Total con impuestos", "Total": "Total",
    "Sans TVA (voir Réglages).": "Sin IVA (ver Configuración).",
    "Période de la prestation (facultatif)": "Periodo del servicio (opcional)", "ex. octobre 2026": "p. ej., octubre de 2026",
    "Validité (jours)": "Vigencia (días)", "Issue du devis {numero}": "Generada a partir de la cotización {numero}",
    "Retour à la liste": "Volver a la lista", "Aperçu": "Vista previa", "Aperçu du document": "Vista previa del documento", "Fermer": "Cerrar",
    "Émettre le devis": "Emitir la cotización", "Émettre la facture": "Emitir la factura", "Émettre l'avoir": "Emitir la nota de crédito",
    "Brouillon enregistré": "Borrador guardado", "Quitter sans enregistrer ?": "¿Salir sin guardar?",
    "Les modifications de ce brouillon seront perdues.": "Se perderán los cambios de este borrador.", "Quitter": "Salir",
    "Émettre le devis ?": "¿Emitir la cotización?", "Émettre la facture ?": "¿Emitir la factura?", "Émettre l'avoir ?": "¿Emitir la nota de crédito?",
    "Il reçoit le numéro {numero} et ne pourra plus être modifié. Le PDF est enregistré dans Documents > Mes outils > Factures.":
      "Se le asignará el número {numero} y ya no se podrá modificar. El PDF se guardará en Documents > Mes outils > Factures.",
    "Elle reçoit le numéro {numero} et ne pourra plus être modifiée (pour la corriger : un avoir). Le PDF est enregistré dans Documents > Mes outils > Factures.":
      "Se le asignará el número {numero} y ya no se podrá modificar (para corregirla, crea una nota de crédito). El PDF se guardará en Documents > Mes outils > Factures.",
    "Émettre": "Emitir", "{numero} émis": "{numero} emitido", "PDF non créé : {erreur}": "No se creó el PDF: {erreur}",
    "L'application Temps n'est pas disponible.": "La aplicación Temps no está disponible.",
    "Aucune session enregistrée dans Temps.": "No hay sesiones registradas en Temps.",
    "Sessions enregistrées dans Temps. Les durées sont converties en heures au centième (10 min = 0,17 h).":
      "Sesiones registradas en Temps. Las duraciones se convierten a horas con dos decimales (10 min = 0,17 h).",
    "Projet": "Proyecto", "Du": "Desde", "Au": "Hasta", "Tous les projets": "Todos los proyectos", "Tout cocher": "Seleccionar todo", "Tout décocher": "Deseleccionar todo",
    "déjà facturée": "ya facturada", "Aucune session sur cette période.": "No hay sesiones en este periodo.",
    "{n} session(s) cochée(s) · {duree}": "{n} sesión(es) seleccionada(s) · {duree}",
    "Taux horaire": "Tarifa por hora", "ex. 45": "p. ej., 45", "Regroupement": "Agrupar", "Une ligne par projet": "Un concepto por proyecto",
    "Une ligne par jour": "Un concepto por día", "Une ligne par session": "Un concepto por sesión", "Ajouter les lignes": "Añadir los conceptos",
    "{n} ligne(s) ajoutée(s)": "{n} concepto(s) añadido(s)", "Annuler": "Cancelar",
    "Date d'émission": "Fecha de emisión", "Échéance": "Fecha de vencimiento", "Valable jusqu'au": "Válida hasta", "Payé": "Pagado", "Reste à payer": "Saldo pendiente",
    "Devis d'origine": "Cotización original", "Facture d'origine": "Factura original", "Montants": "Montos", "Actions": "Acciones",
    "Transformer en facture": "Convertir en factura", "Marquer accepté": "Marcar como aceptada", "Marquer refusé": "Marcar como rechazada",
    "Revenir à « envoyé »": "Volver al estado «enviada»", "Créer un avoir": "Crear una nota de crédito", "Créer un avoir ?": "¿Crear una nota de crédito?",
    "Un avoir en brouillon reprend les lignes de la facture : gardez seulement ce qui doit être annulé ou remboursé, puis émettez-le.":
      "La nota de crédito en borrador copia los conceptos de la factura: conserva solo lo que se debe anular o reembolsar y luego emítela.",
    "Créer": "Crear", "Dupliquer en brouillon": "Duplicar como borrador", "Paiements": "Pagos", "Aucun paiement enregistré.": "No hay pagos registrados.",
    "Supprimer ce paiement": "Eliminar este pago", "Supprimer ce paiement ?": "¿Eliminar este pago?",
    "Le reste à payer est recalculé.": "Se volverá a calcular el saldo pendiente.", "Ouvrir le dossier": "Abrir la carpeta",
    "Facture créée en brouillon": "Factura creada como borrador", "Avoir créé en brouillon": "Nota de crédito creada como borrador", "Brouillon créé": "Borrador creado",
    "Date": "Fecha", "Moyen de paiement": "Método de pago", "Note (facultatif)": "Nota (opcional)", "ex. référence du virement": "p. ej., referencia de la transferencia",
    "Reste à payer : {montant}": "Saldo pendiente: {montant}", "Paiement enregistré": "Pago registrado",
    "Pièce jointe à ajouter": "Archivo adjunto por añadir",
    "Votre messagerie s'ouvre avec l'objet et le texte prêts. Joignez le PDF à la main : « {nom} ».":
      "Se abrirá tu aplicación de correo con el asunto y el texto listos. Adjunta el PDF manualmente: « {nom} ».",
    "Aucune adresse e-mail pour ce client : complétez le destinataire dans le message.":
      "No hay una dirección de correo para este cliente: completa el destinatario en el mensaje.",
    "Copier le texte": "Copiar el texto", "Texte copié": "Texto copiado", "OK": "Aceptar",
    "à encaisser": "por cobrar", "{n} facture en retard": "{n} factura atrasada", "{n} factures en retard": "{n} facturas atrasadas",
    "Indiquez le nom de l'entreprise.": "Indica el nombre de la empresa.", "Mention de TVA inconnue.": "Nota de IVA desconocida.",
    "Indiquez la mention de TVA.": "Indica la nota de IVA.", "IBAN invalide (clé de contrôle).": "El IBAN no es válido (dígitos de control).",
    "Devise inconnue.": "Moneda desconocida.", "Code de devise invalide (lettres, ex. CHF).": "El código de moneda no es válido (letras, p. ej., CHF).",
    "Préfixe invalide (lettres et chiffres, 10 au plus).": "El prefijo no es válido (máximo 10 letras y números).",
    "Les préfixes des devis, factures et avoirs doivent être différents.": "Los prefijos de las cotizaciones, facturas y notas de crédito deben ser distintos.",
    "Logo": "Logotipo", "image PNG, JPG, GIF ou WebP attendue.": "Se esperaba una imagen PNG, JPG, GIF o WebP.",
    "le fichier n'est pas une image valide.": "el archivo no es una imagen válida.",
    "Logo illisible.": "No se puede leer el logotipo.", "Logo trop lourd (1 Mo au plus).": "El logotipo es demasiado grande (máximo 1 MB).",
    "Document introuvable.": "No se encontró el documento.", "Type de document inconnu.": "Tipo de documento desconocido.",
    "Type de remise inconnu.": "Tipo de descuento desconocido.", "La remise dépasse le sous-total.": "El descuento supera el subtotal.",
    "Document émis": "Documento emitido", "il n'est plus modifiable. Pour corriger une facture, créez un avoir.": "ya no se puede modificar. Para corregir una factura, crea una nota de crédito.",
    "Un avoir se crée depuis la facture à corriger.": "La nota de crédito se crea desde la factura que se debe corregir.",
    "Un document émis ne se supprime pas.": "No se puede eliminar un documento emitido.",
    "Ce document est déjà émis.": "Este documento ya fue emitido.",
    "Renseignez d'abord votre entreprise (Réglages).": "Primero, completa los datos de tu empresa (Configuración).",
    "Indiquez le client.": "Indica el cliente.", "Ajoutez au moins une ligne avec une désignation.": "Añade al menos un concepto con una descripción.",
    "Chaque ligne doit avoir une désignation.": "Cada concepto debe tener una descripción.", "Le total doit être supérieur à zéro.": "El total debe ser mayor que cero.",
    "Facture d'origine introuvable.": "No se encontró la factura original.", "L'avoir dépasse le montant restant de la facture.": "La nota de crédito supera el saldo pendiente de la factura.",
    "Un document de cette série porte une date postérieure à aujourd'hui": "Un documento de esta serie tiene una fecha posterior a hoy",
    "vérifiez la date de l'ordinateur.": "revisa la fecha de la computadora.",
    "Statut inconnu.": "Estado desconocido.", "Seul un devis émis peut être accepté ou refusé.": "Solo se pueden aceptar o rechazar las cotizaciones emitidas.",
    "Ce devis a déjà été transformé en facture.": "Esta cotización ya se convirtió en factura.",
    "Émettez d'abord le devis.": "Primero emite la cotización.", "Ce devis est refusé.": "Esta cotización fue rechazada.",
    "Un avoir se crée sur une facture émise.": "La nota de crédito se crea a partir de una factura emitida.",
    "Un paiement s'enregistre sur une facture émise.": "Los pagos se registran en facturas emitidas.",
    "Date du paiement invalide.": "La fecha de pago no es válida.", "Moyen de paiement inconnu.": "Método de pago desconocido.",
    "Paiement introuvable.": "No se encontró el pago.", "Trop de documents.": "Hay demasiados documentos.",
    "Choisissez au moins une session.": "Selecciona al menos una sesión.", "Sessions introuvables.": "No se encontraron las sesiones.",
    "Microsoft Edge est introuvable": "No se encontró Microsoft Edge", "impossible de créer le PDF.": "no se pudo crear el PDF.",
    "Edge n'a pas pu créer le PDF.": "Edge no pudo crear el PDF.",
    "Google Chrome ou Chromium est introuvable": "No se encontró Google Chrome o Chromium",
    "Le PDF est ouvert dans un autre programme": "El PDF está abierto en otro programa", "fermez-le puis recommencez.": "ciérralo e inténtalo de nuevo.",
    "Émettez d'abord le document (un brouillon n'a pas de numéro).": "Primero emite el documento (los borradores no tienen número).",
    "Émettez d'abord le document.": "Primero emite el documento.",
    "Taux de TVA": "Tasa de IVA", "Délai de paiement": "Plazo de pago", "Validité des devis": "Vigencia de las cotizaciones", "Validité": "Vigencia",
    "nombre manquant.": "falta un número.", "nombre invalide.": "el número no es válido.", "valeur trop petite.": "el valor es demasiado bajo.",
    "valeur trop grande.": "el valor es demasiado alto.", "nombre entier attendu.": "se esperaba un número entero.",
    "Régime de taxes inconnu.": "Régimen de impuestos desconocido.", "Province inconnue.": "Provincia desconocida.",
    "Deux taxes au plus.": "Se permiten hasta dos impuestos.", "Taxe inconnue.": "Impuesto desconocido.", "Une taxe est en double.": "Hay un impuesto repetido.",
    "Au Canada, choisissez « Inscrit aux taxes » ou « Non inscrit ».": "En Canadá, elige «Inscrito para cobrar impuestos» o «No inscrito».",
  });
})();
