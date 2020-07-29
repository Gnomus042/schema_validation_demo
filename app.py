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
    tests = []
    for filename in os.listdir(config.tests_path):
        tests.append(open(f'{config.tests_path}/{filename}').read())
    return jsonify(tests=tests)


@app.route('/shape/<lang>/<service>')
def shape(lang, service):
    return jsonify(shape=open(f'static/validation/{lang}/specific/{service}.{lang}').read())


@app.route('/shacl/shapes/<service>')
def shacl_shapes(service):
    base = open(f'{config.shacl_path}/full.shacl').read()
    specific = open(f'{config.shacl_path}/specific/{service}.shacl').read()
    return base + specific


if __name__ == '__main__':
    app.run()
