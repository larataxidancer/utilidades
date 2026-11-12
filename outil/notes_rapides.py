# -*- coding: utf-8 -*-
"""Notes rapides et extraits personnels, conservés dans donnees/notes_rapides.json."""
import datetime
import threading
import uuid

import config

NOM = "notes_rapides"
CATEGORIES = ("note", "code", "commande")
MAX_TITRE = 160
MAX_CONTENU = 100_000

_verrou = threading.RLock()


def _maintenant():
    """Renvoie la date locale au format ISO 8601."""
    return datetime.datetime.now().astimezone().isoformat(timespec="seconds")


def _toutes():
    """Lit les notes et vérifie la structure du fichier."""
    notes = config.lire_donnees(NOM, [])
    if not isinstance(notes, list) or not all(isinstance(note, dict) for note in notes):
        raise ValueError("Les données des notes rapides sont invalides.")
    return notes


def lister(_d=None):
    """Renvoie les notes épinglées en premier, puis les plus récentes."""
    with _verrou:
        notes = [dict(note) for note in _toutes()]
    notes.sort(key=lambda note: note.get("modifie_le", ""), reverse=True)
    notes.sort(key=lambda note: not bool(note.get("epingle", False)))
    return {"notes": notes}


def enregistrer(d):
    """Crée ou modifie une note rapide."""
    if not isinstance(d, dict):
        raise ValueError("La note rapide est invalide.")
    titre = str(d.get("titre") or "").strip()
    contenu = str(d.get("contenu") or "")
    categorie = d.get("categorie")
    epingle = d.get("epingle", False)
    if not titre:
        raise ValueError("Donnez un titre à la note rapide.")
    if len(titre) > MAX_TITRE:
        raise ValueError("Le titre ne peut pas dépasser 160 caractères.")
    if not contenu.strip():
        raise ValueError("Le contenu ne peut pas être vide.")
    if len(contenu) > MAX_CONTENU:
        raise ValueError("Le contenu ne peut pas dépasser 100 000 caractères.")
    if categorie not in CATEGORIES:
        raise ValueError("La catégorie de la note rapide est invalide.")
    if not isinstance(epingle, bool):
        raise ValueError("L'état de l'épingle est invalide.")

    avec = {
        "titre": titre,
        "contenu": contenu,
        "categorie": categorie,
        "epingle": epingle,
        "modifie_le": _maintenant(),
    }
    with _verrou:
        notes = _toutes()
        identifiant = d.get("id")
        if identifiant:
            if not isinstance(identifiant, str):
                raise ValueError("L'identifiant de la note rapide est invalide.")
            existante = next((note for note in notes if note.get("id") == identifiant), None)
            if existante is None:
                raise ValueError("Note rapide introuvable.")
            existante.update(avec)
            resultat = existante
        else:
            resultat = {"id": uuid.uuid4().hex[:12], **avec}
            notes.append(resultat)
        config.ecrire_donnees(NOM, notes)
        return dict(resultat)


def supprimer(d):
    """Supprime une note rapide existante."""
    identifiant = d.get("id") if isinstance(d, dict) else None
    if not isinstance(identifiant, str) or not identifiant:
        raise ValueError("L'identifiant de la note rapide est invalide.")
    with _verrou:
        notes = _toutes()
        restantes = [note for note in notes if note.get("id") != identifiant]
        if len(restantes) == len(notes):
            raise ValueError("Note rapide introuvable.")
        config.ecrire_donnees(NOM, restantes)
    return {"supprime": True}


def epingler(d):
    """Épingle ou désépingle une note rapide."""
    identifiant = d.get("id") if isinstance(d, dict) else None
    valeur = d.get("epingle") if isinstance(d, dict) else None
    if not isinstance(identifiant, str) or not identifiant:
        raise ValueError("L'identifiant de la note rapide est invalide.")
    if not isinstance(valeur, bool):
        raise ValueError("L'état de l'épingle est invalide.")
    with _verrou:
        notes = _toutes()
        note = next((element for element in notes if element.get("id") == identifiant), None)
        if note is None:
            raise ValueError("Note rapide introuvable.")
        note["epingle"] = valeur
        note["modifie_le"] = _maintenant()
        config.ecrire_donnees(NOM, notes)
        return dict(note)


ROUTES = {
    "liste": lister,
    "enregistrer": lambda d: enregistrer(d.get("note") or {}),
    "supprimer": supprimer,
    "epingler": epingler,
}
