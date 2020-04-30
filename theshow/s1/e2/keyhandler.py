import os
import json
import struct
import re

# xinput list
XINPUT_KB_NAME = "Dell KB216 Wired Keyboard"
INPUT_EVENT_NAME = "/dev/input/by-id/usb-413c_Dell_KB216_Wired_Keyboard-event-kbd"
INPUT_EVENT_FORMAT = "@lIIHHI"
INPUT_EVENT_SIZE = struct.calcsize(INPUT_EVENT_FORMAT)
SCANCODE_FILE = "../../assets/linux/scancodes-to-keynames.json"


def disable_xinput():
    DOWN_ARROW = "\u21b3"
    for line in os.popen("xinput list").readlines():
        if line.find(XINPUT_KB_NAME) != -1:
            xi_kb_name = line.split(DOWN_ARROW)[1].split("\t")[0][1:].strip()
            cmd = "xinput disable \"%s\"" % xi_kb_name
            #print(cmd)
            os.system(cmd)


def process_key(key_name):
    print(key_name)
    commands = {
        "KEY_Q": "echo 'I do nothing fun' &",
        "KEY_X": "xeyes &",
        "KEY_C": "chromium --incognito 'https://duckduckgo.com/?q=RFC+HTCPCP' &",
    }
    if key_name in commands:
        #print(commands[key_name])
        os.system(commands[key_name])


def decode_event(raw_event):
    scancode_decoder = json.load(open(SCANCODE_FILE))
    et = struct.unpack(INPUT_EVENT_FORMAT, raw_event)
    (et_tv_sec, et_tv_usec, _, ev_type, ev_code, ev_value) = et
    EV_KEY = 0x01
    KEYDOWN = 0x01
    if ev_type == EV_KEY and ev_value == KEYDOWN:
        print(ev_type, ev_code, ev_value)
        ev_code_str = str(ev_code)
        if ev_code_str in scancode_decoder:
            process_key(scancode_decoder[ev_code_str])


def main():
    disable_xinput()
    with open(INPUT_EVENT_NAME, "rb") as f:
        while True:
            raw_event = f.read(INPUT_EVENT_SIZE)
            decode_event(raw_event)


if __name__ == "__main__":
    main()
