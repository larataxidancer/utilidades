# -*- coding: utf-8 -*-
"""Tests de l'application Procédures : modèles, exécutions, rapports et routes."""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from aide import ConfigTemporaire, ServeurTest

import procedures  # noqa: E402


class TestProcedures(ServeurTest):
    def test_validation_modele_et_erreur_http(self):
        with ConfigTemporaire():
            statut, reponse = self.post("/api/procedures/modele/enregistrer", {
                "modele": {"titre": "", "categorie": "Technique", "etapes": [{"titre": "Étape"}]},
            })
            self.assertEqual(statut, 400)
            self.assertEqual(reponse["erreur"], "Indiquez un titre.")

            statut, reponse = self.post("/api/procedures/modele/enregistrer", {
                "modele": {"titre": "Modèle", "categorie": "Technique", "etapes": []},
            })
            self.assertEqual(statut, 400)
            self.assertEqual(reponse["erreur"], "Ajoutez au moins une étape à la procédure.")
            self.assertEqual(procedures.liste()["modeles"], [], "Aucun modèle invalide n'est conservé.")

    def test_cycle_complet_rapport_et_suppression(self):
        with ConfigTemporaire():
            statut, modele = self.post("/api/procedures/modele/enregistrer", {
                "modele": {
                    "titre": "Mise en service",
                    "categorie": "Technique",
                    "description": "Vérifier la mise en service.",
                    "etapes": [
                        {"titre": "Vérifier la configuration", "detail": "Relire les paramètres."},
                        {"titre": "Valider le résultat", "detail": ""},
                    ],
                },
            })
            self.assertEqual(statut, 200)
            self.assertEqual(len(modele["etapes"]), 2)

            statut, execution = self.post("/api/procedures/execution/demarrer", {
                "modele_id": modele["id"], "contexte": "Version 2",
            })
            self.assertEqual(statut, 200)
            self.assertEqual(execution["contexte"], "Version 2")
            self.assertNotEqual(execution["etapes"][0]["id"], modele["etapes"][0]["id"],
                                "Les étapes de l'exécution sont des copies indépendantes.")
            self.assertIsNone(execution["termine_le"])

            for etape in execution["etapes"]:
                statut, execution = self.post("/api/procedures/execution/etape", {
                    "execution_id": execution["id"], "etape_id": etape["id"], "faite": True,
                })
                self.assertEqual(statut, 200)
            self.assertTrue(execution["termine_le"], "L'exécution se termine à 100 %.")

            statut, rapport = self.post("/api/procedures/execution/rapport", {"id": execution["id"]})
            self.assertEqual(statut, 200)
            self.assertIn("- [x] Vérifier la configuration", rapport["markdown"])
            self.assertIn("- [x] Valider le résultat", rapport["markdown"])
            self.assertIn("Avancement : 2/2 (100 %)", rapport["markdown"])

            statut, resultat = self.post("/api/procedures/execution/supprimer", {"id": execution["id"]})
            self.assertEqual((statut, resultat["supprime"]), (200, True))
            statut, resultat = self.post("/api/procedures/modele/supprimer", {"id": modele["id"]})
            self.assertEqual((statut, resultat["supprime"]), (200, True))
            self.assertEqual(procedures.liste(), {"modeles": [], "executions": []})

    def test_reouvrir_execution_reinitialise_la_fin(self):
        with ConfigTemporaire():
            modele = procedures.modele_enregistrer({
                "titre": "Vérification",
                "categorie": "Général",
                "etapes": [{"titre": "Contrôler"}],
            })
            execution = procedures.execution_demarrer({"modele_id": modele["id"]})
            execution = procedures.execution_etape({
                "execution_id": execution["id"], "etape_id": execution["etapes"][0]["id"], "faite": True,
            })
            self.assertTrue(execution["termine_le"])
            execution = procedures.execution_etape({
                "execution_id": execution["id"], "etape_id": execution["etapes"][0]["id"], "faite": False,
            })
            self.assertIsNone(execution["termine_le"])


if __name__ == "__main__":
    unittest.main()
