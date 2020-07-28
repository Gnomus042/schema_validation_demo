from flask import Flask, render_template, jsonify
import os

import config

app = Flask(__name__)


@app.route('/')
def index():
    return render_template('validation.html')


@app.route('/services')
def services():
    return jsonify(services=config.supported_services)


@app.route('/tests')
def tests():
    pass

if __name__ == '__main__':
    app.run()
