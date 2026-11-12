# -*- coding: utf-8 -*-
"""Tests des dictionnaires de traduction (outil/web/*.js) : le dictionnaire
est commun à toute la page, une même phrase ne doit donc pas recevoir deux
traductions différentes, et les {variables} doivent se retrouver dans la
traduction."""
import os
import re
import shutil
import subprocess
import sys
import unittest

WEB = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "outil", "web")
PAGE = os.path.join(os.path.dirname(WEB), "hub.html")
FICHIERS = ["i18n.js", "mails.js", "notes.js", "agenda.js", "motsdepasse.js", "ssh.js", "reglages.js"]
BLOC = re.compile(r"I18N\.ajouter\(\{(.*?)\}\);", re.S)
BLOC_ES = re.compile(r"I18N\.ajouterEspanol\(\{(.*?)\}\);", re.S)
PAIRE = re.compile(r'"((?:[^"\\]|\\.)*)"\s*:\s*"((?:[^"\\]|\\.)*)"')


def paires(nom):
    with open(os.path.join(WEB, nom) if not os.path.isabs(nom) else nom, encoding="utf-8") as f:
        texte = f.read()
    for bloc in BLOC.findall(texte):
        # Commentaires « // … » en fin de ligne retirés.
        bloc = re.sub(r"^\s*//.*$", "", bloc, flags=re.M)
        yield from PAIRE.findall(bloc)

def paires_es(nom):
    with open(os.path.join(WEB, nom), encoding="utf-8") as f:
        texte = f.read()
    for bloc in BLOC_ES.findall(texte):
        bloc = re.sub(r"^\s*//.*$", "", bloc, flags=re.M)
        yield from PAIRE.findall(bloc)


class TestDictionnaires(unittest.TestCase):
    def test_chaque_fichier_a_un_dictionnaire(self):
        for nom in FICHIERS:
            self.assertTrue(list(paires(nom)), f"{nom} : aucun I18N.ajouter trouvé")

    def test_pas_de_traductions_contradictoires(self):
        vues = {}
        for nom in FICHIERS:
            for cle, valeur in paires(nom):
                if cle in vues and vues[cle][1] != valeur:
                    self.fail(f"« {cle} » traduit « {vues[cle][1]} » dans {vues[cle][0]} et « {valeur} » dans {nom}")
                vues[cle] = (nom, valeur)

    def test_variables_conservees(self):
        for nom in FICHIERS:
            for cle, valeur in paires(nom):
                self.assertEqual(set(re.findall(r"\{(\w+)\}", cle)), set(re.findall(r"\{(\w+)\}", valeur)),
                                 f"{nom} : variables différentes entre « {cle} » et « {valeur} »")

    def test_traductions_espagnoles_et_variables(self):
        for nom in ("i18n.js", "reglages.js"):
            traductions = list(paires_es(nom))
            self.assertTrue(traductions, f"{nom} : aucun dictionnaire espagnol trouvé")
            for cle, valeur in traductions:
                self.assertEqual(set(re.findall(r"\{(\w+)\}", cle)), set(re.findall(r"\{(\w+)\}", valeur)),
                                 f"{nom} : variables différentes entre « {cle} » et « {valeur} »")

    @unittest.skipUnless(shutil.which("node"), "node absent")
    def test_langue_espagnole_en_javascript(self):
        script = (
            "global.window=global; global.document={documentElement:{}}; "
            "require(process.argv[1]); I18N.langue='es'; "
            "if (I18N.langue !== 'es' || I18N.locale() !== 'es-ES' || "
            "I18N.t('Accueil') !== 'Inicio' || I18N.t('Bonjour') !== 'Buenos días') process.exit(1);"
        )
        r = subprocess.run(["node", "-e", script, os.path.join(WEB, "i18n.js")],
                           capture_output=True, text=True, timeout=30,
                           creationflags=0x08000000 if sys.platform == "win32" else 0)
        self.assertEqual(r.returncode, 0, r.stderr)

    @unittest.skipUnless(shutil.which("node"), "node absent")
    def test_syntaxe_js(self):
        for nom in FICHIERS:
            r = subprocess.run(["node", "--check", os.path.join(WEB, nom)], capture_output=True, text=True,
                               timeout=30, creationflags=0x08000000 if sys.platform == "win32" else 0)
            self.assertEqual(r.returncode, 0, f"{nom} : {r.stderr}")

    def test_textes_selon_le_systeme_traduits(self):
        """Chaque texte de selonSysteme("…Windows…", "…Linux…") a sa traduction
        anglaise, sous Windows comme sous Linux (chemins et séparateurs exceptés)."""
        sources = [os.path.join(WEB, n) for n in sorted(os.listdir(WEB)) if n.endswith(".js")] + [PAGE]
        cles, appels = set(), []
        chaine = r'"((?:[^"\\]|\\.)*)"'
        for chemin in sources:
            cles.update(cle for cle, _ in paires(chemin))
            with open(chemin, encoding="utf-8") as f:
                appels += [(os.path.basename(chemin), a, b) for a, b in
                           re.findall(r"selonSysteme\(\s*" + chaine + r"\s*,\s*" + chaine, f.read())]
        self.assertTrue(appels, "aucun appel à selonSysteme trouvé")
        for nom, *textes in appels:
            for texte in textes:
                if " " in texte and re.search(r"[a-zé]{3}", texte) and "\\" not in texte:
                    self.assertIn(texte, cles, f"{nom} : « {texte} » n'a pas de traduction anglaise")


if __name__ == "__main__":
    unittest.main()
