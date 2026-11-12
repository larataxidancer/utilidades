# -*- coding: utf-8 -*-
"""Tests de l'onglet Notes rapides : persistance, validation et routes."""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from aide import ConfigTemporaire, ServeurTest

import config  # noqa: E402
import notes_rapides  # noqa: E402


class TestNotesRapides(unittest.TestCase):
    def test_creer_et_modifier(self):
        with ConfigTemporaire() as cfg:
            note = notes_rapides.enregistrer({
                "titre": "Raccourcis utiles",
                "contenu": "git status",
                "categorie": "commande",
                "epingle": True,
            })
            self.assertEqual(set(note), {"id", "titre", "contenu", "categorie", "epingle", "modifie_le"})
            self.assertEqual(note["epingle"], True)
            self.assertTrue(note["id"], "Un identifiant est attribué.")
            modifiee = notes_rapides.enregistrer({
                **note,
                "titre": "État du dépôt",
                "contenu": "git status --short",
                "epingle": False,
            })
            self.assertEqual(modifiee["id"], note["id"])
            self.assertEqual(modifiee["titre"], "État du dépôt")
            self.assertEqual(config.lire_donnees("notes_rapides"), [modifiee])
            self.assertTrue(cfg.donnees.endswith("donnees"))

    def test_validation(self):
        with ConfigTemporaire():
            invalides = (
                {},
                {"titre": "", "contenu": "texte", "categorie": "note"},
                {"titre": "Titre", "contenu": " ", "categorie": "note"},
                {"titre": "x" * 161, "contenu": "texte", "categorie": "note"},
                {"titre": "Titre", "contenu": "texte", "categorie": "autre"},
                {"titre": "Titre", "contenu": "texte", "categorie": "note", "epingle": "oui"},
                {"id": "inconnu", "titre": "Titre", "contenu": "texte", "categorie": "note"},
            )
            for donnees in invalides:
                with self.subTest(donnees=donnees), self.assertRaises(ValueError):
                    notes_rapides.enregistrer(donnees)
            self.assertEqual(notes_rapides.lister()["notes"], [], "Aucune note invalide n'est enregistrée.")

    def test_epingler_lister_et_supprimer(self):
        with ConfigTemporaire():
            premiere = notes_rapides.enregistrer({
                "titre": "Note ordinaire", "contenu": "Un texte", "categorie": "note",
            })
            seconde = notes_rapides.enregistrer({
                "titre": "Commande épinglée", "contenu": "python --version",
                "categorie": "commande", "epingle": True,
            })
            epinglee = notes_rapides.epingler({"id": premiere["id"], "epingle": True})
            self.assertTrue(epinglee["epingle"])
            self.assertEqual([note["id"] for note in notes_rapides.lister()["notes"]],
                             [premiere["id"], seconde["id"]])
            self.assertEqual(notes_rapides.supprimer({"id": premiere["id"]}), {"supprime": True})
            self.assertEqual([note["id"] for note in notes_rapides.lister()["notes"]], [seconde["id"]])
            with self.assertRaisesRegex(ValueError, "introuvable"):
                notes_rapides.supprimer({"id": premiere["id"]})


class TestRoutesNotesRapides(ServeurTest):
    def test_routes(self):
        with ConfigTemporaire():
            statut, note = self.post("/api/notes_rapides/enregistrer", {
                "note": {"titre": "Fragment", "contenu": "print('ok')", "categorie": "code"},
            })
            self.assertEqual(statut, 200)
            self.assertEqual(note["categorie"], "code")
            statut, resultat = self.post("/api/notes_rapides/liste", {})
            self.assertEqual(statut, 200)
            self.assertEqual(resultat["notes"], [note])
            statut, epinglee = self.post("/api/notes_rapides/epingler", {"id": note["id"], "epingle": True})
            self.assertEqual(statut, 200)
            self.assertTrue(epinglee["epingle"])
            statut, resultat = self.post("/api/notes_rapides/supprimer", {"id": note["id"]})
            self.assertEqual((statut, resultat["supprime"]), (200, True))
            statut, resultat = self.post("/api/notes_rapides/enregistrer", {
                "note": {"titre": "", "contenu": "texte", "categorie": "note"},
            })
            self.assertEqual(statut, 400)
            self.assertEqual(resultat["erreur"], "Donnez un titre à la note rapide.")


if __name__ == "__main__":
    unittest.main()
