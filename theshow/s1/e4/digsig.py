import os
import json
import shutil
import gnupg


VAULT = "/tmp/notgreatvault"

def init_vault():
    shutil.rmtree(VAULT, ignore_errors=True)
    os.makedirs(VAULT, mode=0o700, exist_ok=True)
    gpg = gnupg.GPG(gnupghome=VAULT)
    key_input = gpg.gen_key_input(
        name_real="User A",
        name_email="usera@example.com",
        passphrase="PASSWORD")
    key = gpg.gen_key(key_input)
    print("usera fpr: %s" % key.fingerprint)


def import_anotherkey(imp_file):
    gpg = gnupg.GPG(gnupghome=VAULT)
    a = gpg.list_keys()
    #print(json.dumps(a, indent=2))
    #print(gpg.export_keys("usera@example.com"))
    userb_pubkey = open(imp_file).read()
    result = gpg.import_keys(userb_pubkey)
    print(result.results)
    #gpg.trust_keys


def sign_and_verify():
    gpg = gnupg.GPG(gnupghome=VAULT)
    #a = gpg.sign("nightshadedude is teaching a new hire")
    #open("firsttext", "wb").write(str(a).encode("ascii"))
    #print(a)
    #signed_text = open("firsttext", "rb").read()
    #result = gpg.verify(signed_text)
    result = gpg.verify_file(open("firsttext", "rb"))
    print(bool(result))

import PIL.Image
import PIL.PngImagePlugin

def pixel_fun():
    gpg = gnupg.GPG(gnupghome=VAULT)
    throw Exception("download Fumiko.png from https://opengameart.org/content/fumiko-complete-charset")
    fumiko_sig = gpg.sign_file(open("Fumiko.png"), detach=True)
    #print(fumiko_sig.data)
    
    #im = PIL.Image.open("Fumiko.png")
    im = PIL.Image.open("fumiko-signed.png")
    print(im.info)
    info = PIL.PngImagePlugin.PngInfo()
    info.add_text("signature", str(fumiko_sig))
    #im.save("fumiko-signed.png", "png", pnginfo=info)
    

def main():
    #init_vault()
    #throw Exception("generate a userb.asc")
    #import_anotherkey("userb.asc")
    #sign_and_verify()
    pixel_fun()


if __name__ == "__main__":
    main()
