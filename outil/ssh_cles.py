# -*- coding: utf-8 -*-
"""Serveurs SSH de « Mes outils » : une clé par serveur, posée en un clic.

- La clé (ed25519, sans phrase de passe) est créée par ssh-keygen (celui de
  Windows, ou celui d'OpenSSH sous Linux) dans ~/.ssh (%USERPROFILE%\\.ssh),
  nommée « mesoutils_<alias> ».
- Le mot de passe du serveur ne sert qu'une fois, pour déposer la clé dans
  ~/.ssh/authorized_keys. Il passe à ssh par un petit programme intermédiaire
  (ssh_askpass.cmd sous Windows, ssh_askpass.sh, droits 700, sous Linux) et
  une variable d'environnement du seul processus ssh : il n'est ni
  enregistré, ni journalisé, ni écrit sur la ligne de commande.
- Chaque serveur reçoit un bloc dans ~/.ssh/config, encadré par des repères
  « Mes outils » : « ssh <alias> » suffit ensuite. Le reste du fichier n'est
  jamais touché (sous Linux, ses droits sont ramenés à 600 : ssh refuse un
  fichier modifiable par d'autres).
- La liste (sans aucun secret) est dans donnees/ssh.json.
"""
import datetime
import json
import os
import re
import shutil
import subprocess
import sys
import threading

import config  # noqa: E402
import systeme

FICHIER = os.path.join(config.DONNEES, "ssh.json")
DOSSIER_SSH = os.path.join(os.path.expanduser("~"), ".ssh")
CONFIG_SSH = os.path.join(DOSSIER_SSH, "config")
if systeme.WINDOWS:
    OPENSSH = os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "System32", "OpenSSH")
    SSH = os.path.join(OPENSSH, "ssh.exe")
    SSH_KEYGEN = os.path.join(OPENSSH, "ssh-keygen.exe")
else:
    OPENSSH = "/usr/bin"
    SSH = shutil.which("ssh") or "/usr/bin/ssh"
    SSH_KEYGEN = shutil.which("ssh-keygen") or "/usr/bin/ssh-keygen"
ASKPASS_CMD = os.path.join(config.DONNEES, "ssh_askpass.cmd")
ASKPASS_SH = os.path.join(config.DONNEES, "ssh_askpass.sh")
# Rend à ssh le mot de passe placé dans l'environnement de ce seul processus
# ssh. PowerShell lit la variable sans l'interpréter (caractères spéciaux
# sans risque) ; pas besoin de Python, donc aussi dans le programme installé.
CONTENU_ASKPASS = ('@powershell -NoProfile -NonInteractive -Command '
                   '"[Console]::OutputEncoding = [Text.Encoding]::UTF8; '
                   '[Console]::Out.WriteLine($env:MESOUTILS_SSH_SECRET)"\n')
# Linux : même rôle, en sh. printf '%s\n' écrit la variable telle quelle
# (ni « - » ni « \ » interprétés, contrairement à echo).
CONTENU_ASKPASS_SH = "#!/bin/sh\nprintf '%s\\n' \"$MESOUTILS_SSH_SECRET\"\n"
CREATE_NO_WINDOW = systeme.SANS_FENETRE  # 0 hors de Windows
DELAI = 25  # secondes pour une connexion
_verrou = threading.Lock()

_ESPAGNOL = {
    "Serveur introuvable dans la liste.": "No se encontró el servidor en la lista.",
    "Donnez un nom au serveur (lettres ou chiffres).": "Asigna un nombre al servidor (letras o números).",
    "Donnez un nom au serveur.": "Asigna un nombre al servidor.",
    "Adresse du serveur invalide (IP ou nom, sans espace).": "La dirección del servidor no es válida (IP o nombre, sin espacios).",
    "Utilisateur invalide (lettres, chiffres, . _ -).": "El usuario no es válido (letras, números, . _ -).",
    "Le port doit être entre 1 et 65535.": "El puerto debe estar entre 1 y 65535.",
    "Le port doit être un nombre.": "El puerto debe ser un número.",
    "La clé de ce serveur n'est plus sur ce PC.": "La clave de este servidor ya no está en este equipo.",
    "Saisissez le mot de passe du serveur (il ne sert qu'une fois).": "Ingresa la contraseña del servidor (solo se usará una vez).",
    "Connexion refusée : mot de passe ou utilisateur incorrect (ou connexion par mot de passe désactivée sur le serveur).":
        "Conexión rechazada: la contraseña o el usuario son incorrectos (o el servidor desactivó el acceso con contraseña).",
    "Le serveur refuse la connexion sur ce port : vérifiez le port SSH.":
        "El servidor rechazó la conexión en este puerto: revisa el puerto SSH.",
    "Adresse du serveur introuvable.": "No se encontró la dirección del servidor.",
    "Le serveur ne répond pas : vérifiez l'adresse et le port.": "El servidor no responde: revisa la dirección y el puerto.",
    "Erreur inconnue.": "Error desconocido.",
    "Création de la clé impossible : {detail}": "No se pudo crear la clave: {detail}",
    "L'empreinte du serveur a changé depuis la dernière connexion. Par prudence, rien n'a été fait.":
        "La huella digital del servidor cambió desde la última conexión. Por seguridad, no se realizó ninguna acción.",
    "Clé publique inattendue : rien n'a été envoyé.": "La clave pública no es la esperada: no se envió nada.",
    "Le serveur ne répond pas (délai dépassé). Vérifiez l'adresse et le port.":
        "El servidor no responde (se agotó el tiempo de espera). Revisa la dirección y el puerto.",
    "Aucun terminal trouvé sur ce PC (par exemple : sudo apt install gnome-terminal).":
        "No se encontró una terminal en este equipo (por ejemplo: sudo apt install gnome-terminal).",
    "Un serveur s'appelle déjà « {nom} » : choisissez un autre nom.":
        "Ya existe un servidor llamado «{nom}»: elige otro nombre.",
}


def _i18n(texte, **valeurs):
    resultat = _ESPAGNOL.get(texte, texte) if config.langue() == "es" else texte
    return resultat.format(**valeurs) if valeurs else resultat
RE_HOTE = re.compile(r"^[A-Za-z0-9.\-:\[\]]{1,253}$")
RE_UTILISATEUR = re.compile(r"^[A-Za-z0-9._\-]{1,64}$")


class ErreurSSH(Exception):
    pass


# ---------------------------------------------------------------------------
# Liste des serveurs (sans secret)
# ---------------------------------------------------------------------------
def lister():
    if not os.path.exists(FICHIER):
        return []
    with open(FICHIER, encoding="utf-8") as f:
        serveurs = json.load(f)
    for s in serveurs:
        s["cle_presente"] = os.path.exists(s["cle"])
    return serveurs


def _ecrire(serveurs):
    os.makedirs(os.path.dirname(FICHIER), exist_ok=True)
    propres = [{k: v for k, v in s.items() if k != "cle_presente"} for s in serveurs]
    tmp = FICHIER + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(propres, f, ensure_ascii=False, indent=2)
    os.replace(tmp, FICHIER)


def _trouver(alias):
    serveur = next((s for s in lister() if s["alias"] == alias), None)
    if not serveur:
        raise ErreurSSH(_i18n("Serveur introuvable dans la liste."))
    return serveur


def alias_depuis(nom):
    """« Serveur Web » → « serveur-web » : le nom court de « ssh <alias> »."""
    sans_accent = (nom.lower()
                   .translate(str.maketrans("àâäéèêëîïôöùûüç", "aaaeeeeiioouuuc")))
    alias = re.sub(r"[^a-z0-9]+", "-", sans_accent).strip("-")
    if not alias:
        raise ErreurSSH(_i18n("Donnez un nom au serveur (lettres ou chiffres)."))
    return alias[:40]


def _verifier(nom, hote, port, utilisateur):
    nom = (nom or "").strip()
    hote = (hote or "").strip()
    utilisateur = (utilisateur or "").strip()
    hote = re.sub(r"^[a-z]+://", "", hote).split("/")[0]  # « http://1.2.3.4:1901/ » collé tel quel
    if ":" in hote and hote.count(":") == 1:
        hote = hote.split(":")[0]  # un port web collé avec l'IP n'est pas le port SSH
    if not nom:
        raise ErreurSSH(_i18n("Donnez un nom au serveur."))
    if not RE_HOTE.match(hote):
        raise ErreurSSH(_i18n("Adresse du serveur invalide (IP ou nom, sans espace)."))
    if not RE_UTILISATEUR.match(utilisateur):
        raise ErreurSSH(_i18n("Utilisateur invalide (lettres, chiffres, . _ -)."))
    try:
        port = int(port or 22)
    except (TypeError, ValueError):
        raise ErreurSSH(_i18n("Le port doit être un nombre.")) from None
    if not 1 <= port <= 65535:
        raise ErreurSSH(_i18n("Le port doit être entre 1 et 65535."))
    return nom, hote, port, utilisateur


# ---------------------------------------------------------------------------
# Fichier de configuration SSH
# ---------------------------------------------------------------------------
def _reperes(alias):
    return f"# >>> Mes outils : {alias}", f"# <<< Mes outils : {alias}"


def _lire_config():
    if not os.path.exists(CONFIG_SSH):
        return ""
    with open(CONFIG_SSH, encoding="utf-8") as f:
        return f.read()


def _ecrire_config(texte):
    os.makedirs(DOSSIER_SSH, mode=0o700, exist_ok=True)
    tmp = CONFIG_SSH + ".tmp"
    with open(tmp, "w", encoding="utf-8", newline="\n") as f:
        f.write(texte)
    if not systeme.WINDOWS:
        # ssh refuse un config modifiable par le groupe (umask 002 d'Ubuntu).
        os.chmod(tmp, 0o600)
    os.replace(tmp, CONFIG_SSH)


def _retirer_bloc(texte, alias):
    debut, fin = _reperes(alias)
    motif = re.compile(re.escape(debut) + r".*?" + re.escape(fin) + r"\n?", re.S)
    return motif.sub("", texte)


def _poser_bloc(serveur):
    debut, fin = _reperes(serveur["alias"])
    cle = "~/.ssh/" + os.path.basename(serveur["cle"])
    bloc = (f"{debut}\n"
            f"Host {serveur['alias']}\n"
            f"    HostName {serveur['hote']}\n"
            f"    Port {serveur['port']}\n"
            f"    User {serveur['utilisateur']}\n"
            f"    IdentityFile {cle}\n"
            f"    IdentitiesOnly yes\n"
            f"{fin}\n")
    texte = _retirer_bloc(_lire_config(), serveur["alias"])
    if texte and not texte.endswith("\n"):
        texte += "\n"
    _ecrire_config(texte + bloc)


# ---------------------------------------------------------------------------
# Commandes ssh
# ---------------------------------------------------------------------------
def _chemin_askpass():
    return ASKPASS_CMD if systeme.WINDOWS else ASKPASS_SH


def _preparer_askpass():
    """Le petit programme que ssh appelle pour obtenir le mot de passe : il
    le lit dans son environnement et l'écrit pour ssh, rien de plus.
    Rend son chemin."""
    chemin = _chemin_askpass()
    contenu = CONTENU_ASKPASS if systeme.WINDOWS else CONTENU_ASKPASS_SH
    os.makedirs(os.path.dirname(chemin), exist_ok=True)
    actuel = None
    if os.path.exists(chemin):
        with open(chemin, encoding="utf-8") as f:
            actuel = f.read()
    if actuel != contenu:
        with open(chemin, "w", encoding="utf-8", newline="\r\n" if systeme.WINDOWS else "\n") as f:
            f.write(contenu)
    if not systeme.WINDOWS:
        os.chmod(chemin, 0o700)  # exécutable, et lisible par vous seul
    return chemin


def _executer(commande, secret=None, delai=DELAI):
    env = dict(os.environ)
    env.pop("MESOUTILS_SSH_SECRET", None)
    if secret is not None:
        # Le mot de passe ne vit que dans l'environnement de ce processus ssh,
        # qui le demande à ssh_askpass au moment de se connecter.
        askpass = _preparer_askpass()
        env.update(SSH_ASKPASS=askpass, SSH_ASKPASS_REQUIRE="force", MESOUTILS_SSH_SECRET=secret)
        if systeme.WINDOWS:
            env["DISPLAY"] = "mes-outils"
    try:
        return subprocess.run(commande, env=env, stdin=subprocess.DEVNULL, capture_output=True,
                              text=True, encoding="utf-8", errors="replace", timeout=delai,
                              **systeme.options_sans_fenetre())
    except subprocess.TimeoutExpired:
        raise ErreurSSH(_i18n("Le serveur ne répond pas (délai dépassé). Vérifiez l'adresse et le port.")) from None


def _message_erreur(sortie):
    texte = (sortie or "").strip()
    if "Permission denied" in texte:
        return _i18n("Connexion refusée : mot de passe ou utilisateur incorrect (ou connexion par mot de passe désactivée sur le serveur).")
    if "Connection refused" in texte:
        return _i18n("Le serveur refuse la connexion sur ce port : vérifiez le port SSH.")
    if "Could not resolve" in texte or "Name or service not known" in texte:
        return _i18n("Adresse du serveur introuvable.")
    if "timed out" in texte.lower():
        return _i18n("Le serveur ne répond pas : vérifiez l'adresse et le port.")
    if "REMOTE HOST IDENTIFICATION HAS CHANGED" in texte:
        return _i18n("L'empreinte du serveur a changé depuis la dernière connexion. Par prudence, rien n'a été fait.")
    return texte.splitlines()[-1] if texte else _i18n("Erreur inconnue.")


def _base_ssh(serveur):
    return [SSH, "-p", str(serveur["port"]),
            "-o", "StrictHostKeyChecking=accept-new",
            "-o", f"ConnectTimeout={DELAI - 5}",
            f"{serveur['utilisateur']}@{serveur['hote']}"]


def _cle_publique(serveur):
    with open(serveur["cle"] + ".pub", encoding="utf-8") as f:
        return f.read().strip()


def tester(alias):
    serveur = _trouver(alias)
    if not os.path.exists(serveur["cle"]):
        raise ErreurSSH(_i18n("La clé de ce serveur n'est plus sur ce PC."))
    commande = _base_ssh(serveur)
    commande[1:1] = ["-i", serveur["cle"], "-o", "IdentitiesOnly=yes", "-o", "BatchMode=yes"]
    r = _executer(commande + ["echo ok; hostname"])
    if r.returncode != 0 or not r.stdout.startswith("ok"):
        raise ErreurSSH(_message_erreur(r.stderr))
    machine = r.stdout.splitlines()[1] if len(r.stdout.splitlines()) > 1 else ""
    _maj(alias, dernier_test=_maintenant(), dernier_resultat="ok")
    return {"ok": True, "machine": machine}


def creer(nom, hote, port, utilisateur, mot_de_passe):
    """Créer la clé, la déposer sur le serveur avec le mot de passe, puis
    vérifier que la connexion se fait sans lui."""
    nom, hote, port, utilisateur = _verifier(nom, hote, port, utilisateur)
    if not mot_de_passe:
        raise ErreurSSH(_i18n("Saisissez le mot de passe du serveur (il ne sert qu'une fois)."))
    alias = alias_depuis(nom)
    with _verrou:
        serveurs = lister()
        if any(s["alias"] == alias for s in serveurs):
            raise ErreurSSH(_i18n("Un serveur s'appelle déjà « {nom} » : choisissez un autre nom.", nom=alias))
        cle = os.path.join(DOSSIER_SSH, f"mesoutils_{alias}")
        serveur = {"nom": nom, "alias": alias, "hote": hote, "port": port, "utilisateur": utilisateur,
                   "cle": cle, "cree_le": _maintenant()}

        os.makedirs(DOSSIER_SSH, exist_ok=True)
        cree_ici = not os.path.exists(cle)
        if cree_ici:
            r = _executer([SSH_KEYGEN, "-q", "-t", "ed25519", "-N", "", "-C", f"mes-outils {alias}", "-f", cle])
            if r.returncode != 0:
                raise ErreurSSH(_i18n("Création de la clé impossible : {detail}",
                                      detail=_message_erreur(r.stderr)))
        try:
            _deposer(serveur, mot_de_passe)
        except ErreurSSH:
            # Rien ne reste d'un essai manqué : ni clé, ni ligne dans la liste.
            if cree_ici:
                for fichier in (cle, cle + ".pub"):
                    if os.path.exists(fichier):
                        os.remove(fichier)
            raise

        serveurs.append(serveur)
        _ecrire(serveurs)
        _poser_bloc(serveur)
    resultat = tester(alias)
    return {"serveur": _trouver(alias), **resultat}


def _deposer(serveur, mot_de_passe):
    """Déposer la clé publique sur le serveur, avec le mot de passe."""
    publique = _cle_publique(serveur)
    if not re.match(r"^ssh-ed25519 [A-Za-z0-9+/=]+ [A-Za-z0-9 ._\-]+$", publique):
        raise ErreurSSH(_i18n("Clé publique inattendue : rien n'a été envoyé."))
    # Ajout sans doublon, droits stricts : sshd ignore un authorized_keys
    # trop ouvert.
    distant = ("umask 077; mkdir -p ~/.ssh && touch ~/.ssh/authorized_keys && "
               f"(grep -qxF '{publique}' ~/.ssh/authorized_keys || echo '{publique}' >> ~/.ssh/authorized_keys) && "
               "chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys && echo cle-posee")
    commande = _base_ssh(serveur)
    commande[1:1] = ["-o", "PubkeyAuthentication=no", "-o", "PreferredAuthentications=password,keyboard-interactive",
                     "-o", "NumberOfPasswordPrompts=1"]
    r = _executer(commande + [distant], secret=mot_de_passe)
    if r.returncode != 0 or "cle-posee" not in r.stdout:
        raise ErreurSSH(_message_erreur(r.stderr))


def ajouter_existant(nom, hote, port, utilisateur, cle):
    """Inscrire un serveur dont la clé est déjà posée (sans mot de passe)."""
    nom, hote, port, utilisateur = _verifier(nom, hote, port, utilisateur)
    alias = alias_depuis(nom)
    with _verrou:
        serveurs = [s for s in lister() if s["alias"] != alias]
        serveur = {"nom": nom, "alias": alias, "hote": hote, "port": port, "utilisateur": utilisateur,
                   "cle": cle, "cree_le": _maintenant()}
        serveurs.append(serveur)
        _ecrire(serveurs)
        _poser_bloc(serveur)
    return serveur


def retirer(alias):
    """Retirer la clé du serveur, puis de ce PC et de la liste."""
    serveur = _trouver(alias)
    avertissement = None
    if os.path.exists(serveur["cle"] + ".pub"):
        publique = _cle_publique(serveur)
        distant = ("f=~/.ssh/authorized_keys; if [ -f $f ]; then "
                   f"grep -vxF '{publique}' $f > $f.mesoutils; cat $f.mesoutils > $f; rm -f $f.mesoutils; "
                   "fi; echo cle-retiree")
        commande = _base_ssh(serveur)
        commande[1:1] = ["-i", serveur["cle"], "-o", "IdentitiesOnly=yes", "-o", "BatchMode=yes"]
        r = _executer(commande + [distant])
        if r.returncode != 0 or "cle-retiree" not in r.stdout:
            avertissement = ("La clé n'a pas pu être retirée du serveur (" + _message_erreur(r.stderr)
                             + "). Elle a été retirée de ce PC ; retirez la ligne « mes-outils "
                             + alias + " » du fichier authorized_keys du serveur.")
    with _verrou:
        _ecrire([s for s in lister() if s["alias"] != alias])
        _ecrire_config(_retirer_bloc(_lire_config(), alias))
        # On ne supprime que les clés créées par l'outil, jamais une clé reprise.
        if os.path.basename(serveur["cle"]).startswith("mesoutils_"):
            for fichier in (serveur["cle"], serveur["cle"] + ".pub"):
                if os.path.exists(fichier):
                    os.remove(fichier)
    return {"ok": True, "avertissement": avertissement}


def ouvrir_terminal(alias):
    serveur = _trouver(alias)
    if not systeme.WINDOWS:
        if not systeme.ouvrir_terminal(commande=[SSH, alias], titre=serveur["nom"]):
            raise ErreurSSH(_i18n("Aucun terminal trouvé sur ce PC (par exemple : sudo apt install gnome-terminal)."))
        return {"ok": True}
    wt = os.path.join(os.environ.get("LOCALAPPDATA", ""), "Microsoft", "WindowsApps", "wt.exe")
    if os.path.exists(wt):
        subprocess.Popen([wt, "new-tab", "--title", serveur["nom"], SSH, alias], close_fds=True)
    else:
        subprocess.Popen(["cmd.exe", "/c", "start", serveur["nom"], SSH, alias], close_fds=True)
    return {"ok": True}


def _maj(alias, **valeurs):
    with _verrou:
        serveurs = lister()
        for s in serveurs:
            if s["alias"] == alias:
                s.update(valeurs)
        _ecrire(serveurs)


def _maintenant():
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
