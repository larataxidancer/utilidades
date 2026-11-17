# -*- coding: utf-8 -*-
"""Tests de localisation espagnole des messages Python orientés utilisateur."""
import os
import sys
import unittest
from unittest import mock

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "outil"))

import config
import conteneurs
import extraits
import github
import procedures
import requetes


class TestLocalisationPython(unittest.TestCase):
    def test_messages_espagnols_et_variables(self):
        with mock.patch.object(config, "lire", return_value={"langue": "es"}):
            self.assertIn("agrega tu cuenta al grupo docker", conteneurs.message_linux("permission denied"))
            with self.assertRaisesRegex(ValueError, "Asigna un título"):
                extraits.enregistrer({"titre": "", "contenu": "x"})
            with self.assertRaisesRegex(ValueError, "no puede tener más de 100 pasos"):
                procedures._etapes([{}] * 101)
            self.assertEqual(github._i18n("Le dossier {dossier} existe déjà.", dossier="proyecto"),
                             "La carpeta proyecto ya existe.")
            self.assertEqual(requetes._i18n("Pas de réponse après {delai:g} s (délai dépassé).", delai=2.5),
                             "No hubo respuesta después de 2.5 s (se agotó el tiempo de espera).")

    def test_le_francais_reste_inchange(self):
        with mock.patch.object(config, "lire", return_value={"langue": "fr"}):
            self.assertEqual(conteneurs._i18n("Docker n'est pas installé."), "Docker n'est pas installé.")
            with self.assertRaisesRegex(ValueError, "Donnez un titre"):
                extraits.enregistrer({"titre": "", "contenu": "x"})


if __name__ == "__main__":
    unittest.main()
