import RPi.GPIO as GPIO
import requests

PIN_CLK = 17
PIN_DT = 27

def setup_stuff():
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(PIN_CLK, GPIO.IN)
    GPIO.setup(PIN_DT, GPIO.IN)


def main():
    setup_stuff()

    print("ready")

    while True:
        #clk = GPIO.input(PIN_CLK)
        #dt = GPIO.input(PIN_DT)
        #print(clk, dt)
        GPIO.wait_for_edge(PIN_CLK, GPIO.FALLING)
        clk = 0
        while GPIO.input(PIN_CLK) != 1:
            dt = GPIO.input(PIN_DT)
        #print(clk, dt)
        delta = 0
        if dt == 0:
            delta = 1
        elif dt == 1:
            delta = -1
        delta *= 10
        if delta != 0:
            requests.get("http://192.168.0.2:5000/dial?v=%d" % delta)



if __name__ == "__main__":
    main()
