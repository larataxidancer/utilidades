# -*- coding: utf-8 -*-
"""Modèles de procédures opérationnelles et suivi de leurs exécutions."""
import datetime
import threading
import uuid

import config

NOM = "procedures"
CATEGORIES = ("général", "client", "technique", "administratif", "autre")
MAX_TITRE = 160
MAX_DESCRIPTION = 2000
MAX_ETAPES = 100
MAX_DETAIL = 2000
MAX_CONTEXTE = 500

_verrou = threading.RLock()


def _maintenant():
    """Renvoie la date locale au format ISO 8601."""
    return datetime.datetime.now().astimezone().isoformat(timespec="seconds")


def _donnees():
    """Lit et vérifie la structure de persistance."""
    donnees = config.lire_donnees(NOM, {"modeles": [], "executions": []})
    if not isinstance(donnees, dict):
        raise ValueError("Les données des procédures sont invalides.")
    modeles = donnees.get("modeles", [])
    executions = donnees.get("executions", [])
    if not isinstance(modeles, list) or not isinstance(executions, list):
        raise ValueError("Les données des procédures sont invalides.")
    if not all(isinstance(element, dict) for element in modeles + executions):
        raise ValueError("Les données des procédures sont invalides.")
    return {"modeles": modeles, "executions": executions}


def liste(_d=None):
    """Renvoie les modèles et les exécutions, triés par date de modification."""
    with _verrou:
        donnees = _donnees()
        modeles = [dict(modele, etapes=[dict(etape) for etape in modele.get("etapes", [])])
                   for modele in donnees["modeles"]]
        executions = [dict(execution, etapes=[dict(etape) for etape in execution.get("etapes", [])])
                      for execution in donnees["executions"]]
    modeles.sort(key=lambda element: element.get("modifie_le", ""), reverse=True)
    executions.sort(key=lambda element: element.get("modifie_le", ""), reverse=True)
    return {"modeles": modeles, "executions": executions}


def _texte(valeur, nom, maximum, obligatoire=False):
    """Nettoie et valide un texte."""
    texte = str(valeur or "").strip()
    if obligatoire and not texte:
        raise ValueError(f"Indiquez {nom}.")
    if len(texte) > maximum:
        raise ValueError(f"{nom.capitalize()} ne peut pas dépasser {maximum} caractères.")
    return texte


def _etapes(valeur):
    """Valide et normalise la liste des étapes d'un modèle."""
    if not isinstance(valeur, list) or not valeur:
        raise ValueError("Ajoutez au moins une étape à la procédure.")
    if len(valeur) > MAX_ETAPES:
        raise ValueError(f"Une procédure ne peut pas dépasser {MAX_ETAPES} étapes.")
    resultat = []
    for etape in valeur:
        if not isinstance(etape, dict):
            raise ValueError("Une étape de la procédure est invalide.")
        resultat.append({
            "id": uuid.uuid4().hex[:12],
            "titre": _texte(etape.get("titre"), "un titre d'étape", MAX_TITRE, True),
            "detail": _texte(etape.get("detail"), "le détail d'une étape", MAX_DETAIL),
        })
    return resultat


def modele_enregistrer(d):
    """Crée ou modifie un modèle de procédure."""
    if not isinstance(d, dict):
        raise ValueError("Le modèle de procédure est invalide.")
    titre = _texte(d.get("titre"), "un titre", MAX_TITRE, True)
    categorie = d.get("categorie")
    if not isinstance(categorie, str) or not categorie.strip() or len(categorie.strip()) > 80:
        raise ValueError("La catégorie du modèle est invalide.")
    description = _texte(d.get("description"), "la description", MAX_DESCRIPTION)
    etapes_source = d.get("etapes")
    etapes = _etapes(etapes_source)
    maintenant = _maintenant()
    with _verrou:
        donnees = _donnees()
        identifiant = d.get("id")
        if identifiant:
            if not isinstance(identifiant, str):
                raise ValueError("L'identifiant du modèle est invalide.")
            modele = next((element for element in donnees["modeles"] if element.get("id") == identifiant), None)
            if modele is None:
                raise ValueError("Modèle de procédure introuvable.")
            anciens = {etape.get("id") for etape in modele.get("etapes", [])}
            for source, etape in zip(etapes_source, etapes):
                if isinstance(source.get("id"), str) and source["id"] in anciens:
                    etape["id"] = source["id"]
            modele.update({"titre": titre, "categorie": categorie.strip(), "description": description,
                           "etapes": etapes, "modifie_le": maintenant})
        else:
            modele = {"id": uuid.uuid4().hex[:12], "titre": titre, "categorie": categorie.strip(),
                      "description": description, "etapes": etapes, "cree_le": maintenant,
                      "modifie_le": maintenant}
            donnees["modeles"].append(modele)
        config.ecrire_donnees(NOM, donnees)
        return dict(modele, etapes=[dict(etape) for etape in modele["etapes"]])


def modele_supprimer(d):
    """Supprime un modèle sans modifier les exécutions déjà créées."""
    identifiant = d.get("id") if isinstance(d, dict) else None
    if not isinstance(identifiant, str) or not identifiant:
        raise ValueError("L'identifiant du modèle est invalide.")
    with _verrou:
        donnees = _donnees()
        modeles = [modele for modele in donnees["modeles"] if modele.get("id") != identifiant]
        if len(modeles) == len(donnees["modeles"]):
            raise ValueError("Modèle de procédure introuvable.")
        donnees["modeles"] = modeles
        config.ecrire_donnees(NOM, donnees)
    return {"supprime": True}


def execution_demarrer(d):
    """Démarre une exécution à partir d'une copie indépendante du modèle."""
    if not isinstance(d, dict):
        raise ValueError("La demande de démarrage est invalide.")
    identifiant = d.get("modele_id")
    if not isinstance(identifiant, str) or not identifiant:
        raise ValueError("Choisissez un modèle de procédure.")
    contexte = _texte(d.get("contexte"), "le contexte", MAX_CONTEXTE)
    avec = _maintenant()
    with _verrou:
        donnees = _donnees()
        modele = next((element for element in donnees["modeles"] if element.get("id") == identifiant), None)
        if modele is None:
            raise ValueError("Modèle de procédure introuvable.")
        execution = {
            "id": uuid.uuid4().hex[:12],
            "modele_id": modele["id"],
            "titre": modele["titre"],
            "categorie": modele["categorie"],
            "description": modele["description"],
            "contexte": contexte,
            "etapes": [{"id": uuid.uuid4().hex[:12], "titre": etape["titre"],
                        "detail": etape.get("detail", ""), "faite": False}
                       for etape in modele["etapes"]],
            "demarree_le": avec,
            "modifie_le": avec,
            "termine_le": None,
        }
        donnees["executions"].append(execution)
        config.ecrire_donnees(NOM, donnees)
        return dict(execution, etapes=[dict(etape) for etape in execution["etapes"]])


def execution_etape(d):
    """Coche ou décoche une étape et met à jour l'état de l'exécution."""
    if not isinstance(d, dict):
        raise ValueError("La demande de mise à jour est invalide.")
    execution_id = d.get("execution_id")
    etape_id = d.get("etape_id")
    faite = d.get("faite")
    if not isinstance(execution_id, str) or not execution_id or not isinstance(etape_id, str) or not etape_id:
        raise ValueError("L'identifiant de l'exécution ou de l'étape est invalide.")
    if not isinstance(faite, bool):
        raise ValueError("L'état de l'étape est invalide.")
    with _verrou:
        donnees = _donnees()
        execution = next((element for element in donnees["executions"] if element.get("id") == execution_id), None)
        if execution is None:
            raise ValueError("Exécution de procédure introuvable.")
        etape = next((element for element in execution.get("etapes", []) if element.get("id") == etape_id), None)
        if etape is None:
            raise ValueError("Étape de procédure introuvable.")
        etape["faite"] = faite
        execution["modifie_le"] = _maintenant()
        complet = bool(execution["etapes"]) and all(element.get("faite") for element in execution["etapes"])
        execution["termine_le"] = execution["modifie_le"] if complet else None
        config.ecrire_donnees(NOM, donnees)
        return dict(execution, etapes=[dict(element) for element in execution["etapes"]])


def execution_supprimer(d):
    """Supprime une exécution existante."""
    identifiant = d.get("id") if isinstance(d, dict) else None
    if not isinstance(identifiant, str) or not identifiant:
        raise ValueError("L'identifiant de l'exécution est invalide.")
    with _verrou:
        donnees = _donnees()
        executions = [element for element in donnees["executions"] if element.get("id") != identifiant]
        if len(executions) == len(donnees["executions"]):
            raise ValueError("Exécution de procédure introuvable.")
        donnees["executions"] = executions
        config.ecrire_donnees(NOM, donnees)
    return {"supprime": True}


def execution_rapport(d):
    """Génère un compte rendu Markdown de l'exécution."""
    identifiant = d.get("id") if isinstance(d, dict) else None
    if not isinstance(identifiant, str) or not identifiant:
        raise ValueError("L'identifiant de l'exécution est invalide.")
    with _verrou:
        donnees = _donnees()
        execution = next((element for element in donnees["executions"] if element.get("id") == identifiant), None)
        if execution is None:
            raise ValueError("Exécution de procédure introuvable.")
        execution = dict(execution, etapes=[dict(etape) for etape in execution.get("etapes", [])])
    total = len(execution["etapes"])
    faites = sum(bool(etape.get("faite")) for etape in execution["etapes"])
    lignes = [f"# {execution.get('titre', '')}", "", f"- Catégorie : {execution.get('categorie', '')}",
              f"- Statut : {'Terminée' if execution.get('termine_le') else 'En cours'}",
              f"- Avancement : {faites}/{total} ({faites * 100 // total if total else 0} %)"]
    if execution.get("contexte"):
        lignes.append(f"- Contexte : {execution['contexte']}")
    if execution.get("description"):
        lignes.extend(["", execution["description"]])
    lignes.extend(["", "## Étapes"])
    lignes.extend(f"- [{'x' if etape.get('faite') else ' '}] {etape.get('titre', '')}"
                  for etape in execution["etapes"])
    return {"markdown": "\n".join(lignes)}


ROUTES = {
    "liste": liste,
    "modele/enregistrer": lambda d: modele_enregistrer(d.get("modele") or {}),
    "modele/supprimer": modele_supprimer,
    "execution/demarrer": execution_demarrer,
    "execution/etape": execution_etape,
    "execution/supprimer": execution_supprimer,
    "execution/rapport": execution_rapport,
}
