# -*- coding: utf-8 -*-
"""Notas rápidas y extractos personales, guardados en donnees/notes_rapides.json."""
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
    """Devuelve la fecha local en formato ISO 8601."""
    return datetime.datetime.now().astimezone().isoformat(timespec="seconds")


def _toutes():
    """Lee las notas y verifica la estructura del archivo."""
    notes = config.lire_donnees(NOM, [])
    if not isinstance(notes, list) or not all(isinstance(note, dict) for note in notes):
        raise ValueError("Los datos de las notas rápidas no son válidos.")
    return notes


def lister(_d=None):
    """Devuelve las notas fijadas primero y luego las más recientes."""
    with _verrou:
        notes = [dict(note) for note in _toutes()]
    notes.sort(key=lambda note: note.get("modifie_le", ""), reverse=True)
    notes.sort(key=lambda note: not bool(note.get("epingle", False)))
    return {"notes": notes}


def enregistrer(d):
    """Crea o modifica una nota rápida."""
    if not isinstance(d, dict):
        raise ValueError("La nota rápida no es válida.")
    titre = str(d.get("titre") or "").strip()
    contenu = str(d.get("contenu") or "")
    categorie = d.get("categorie")
    epingle = d.get("epingle", False)
    if not titre:
        raise ValueError("Debes indicar un título para la nota rápida.")
    if len(titre) > MAX_TITRE:
        raise ValueError("El título no puede superar 160 caracteres.")
    if not contenu.strip():
        raise ValueError("El contenido no puede estar vacío.")
    if len(contenu) > MAX_CONTENU:
        raise ValueError("El contenido no puede superar 100 000 caracteres.")
    if categorie not in CATEGORIES:
        raise ValueError("La categoría de la nota rápida no es válida.")
    if not isinstance(epingle, bool):
        raise ValueError("El estado del marcador no es válido.")

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
                raise ValueError("El identificador de la nota rápida no es válido.")
            existante = next((note for note in notes if note.get("id") == identifiant), None)
            if existante is None:
                raise ValueError("Nota rápida no encontrada.")
            existante.update(avec)
            resultat = existante
        else:
            resultat = {"id": uuid.uuid4().hex[:12], **avec}
            notes.append(resultat)
        config.ecrire_donnees(NOM, notes)
        return dict(resultat)


def supprimer(d):
    """Elimina una nota rápida existente."""
    identifiant = d.get("id") if isinstance(d, dict) else None
    if not isinstance(identifiant, str) or not identifiant:
        raise ValueError("El identificador de la nota rápida no es válido.")
    with _verrou:
        notes = _toutes()
        restantes = [note for note in notes if note.get("id") != identifiant]
        if len(restantes) == len(notes):
            raise ValueError("Nota rápida no encontrada.")
        config.ecrire_donnees(NOM, restantes)
    return {"supprime": True}


def epingler(d):
    """Fija o desactiva una nota rápida."""
    identifiant = d.get("id") if isinstance(d, dict) else None
    valeur = d.get("epingle") if isinstance(d, dict) else None
    if not isinstance(identifiant, str) or not identifiant:
        raise ValueError("El identificador de la nota rápida no es válido.")
    if not isinstance(valeur, bool):
        raise ValueError("El estado del marcador no es válido.")
    with _verrou:
        notes = _toutes()
        note = next((element for element in notes if element.get("id") == identifiant), None)
        if note is None:
            raise ValueError("Nota rápida no encontrada.")
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
