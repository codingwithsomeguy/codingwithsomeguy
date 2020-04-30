import os, json

from flask import Flask, render_template, request
app = Flask(__name__)


@app.route("/")
def home():
    # TODO: something
    return render_template("home.html", data={"foo": "bar",})


dial_value = 50

@app.route("/dial")
def dial():
    global dial_value
    if "v" in request.args:
        try:
            v = int(request.args["v"])
            dial_value = dial_value + v
        except ValueError:
            pass
    return str(dial_value)


@app.route("/upload", methods=['POST'])
def upload():
    rawdata = request.get_data()
    # TODO: handle upload in rawdata
    return "received"


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0")

