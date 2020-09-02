import codecs
from flask import Flask, render_template, jsonify, send_file, Response, Blueprint
import os

import config

app = Flask(__name__)

from sdtt import sdtt as sdtt_blueprint
app.register_blueprint(sdtt_blueprint)


@app.route('/old')
def index():
    return render_template('validation.html')


@app.route('/services')
def services():
    return jsonify(services=config.supported_services)


@app.route('/services/allowed')
def services_allowed():
    return config.allowed_for_validation


@app.route('/tests')
def tests():
    tests = []
    for filename in sorted(list(os.listdir(config.tests_path))):
        tests.append(open(f'{config.tests_path}/{filename}').read())
    return jsonify(tests=tests)


@app.route('/shape/<lang>/<type>/<service>')
def shape(lang, type, service):
    return jsonify(shape=open(f'validation/{lang}/specific/{service}/{type}.{lang}').read())


@app.route('/context')
def context():
    return send_file('validation/context.json')


@app.route('/shex/shapes')
def shex_shapes():
    return Response(response=codecs.open(f'{config.shex_path}/full.shexj', 'r', 'utf-8').read(),
                    status=200,
                    mimetype='text/shex')


@app.route('/shacl/shapes')
def shacl_shapes_full():
    return send_file(f'{config.shacl_path}/full.shacl')


@app.route('/shacl/shapes/<service>')
def shacl_shapes(service):
    base = open(f'{config.shacl_path}/full.shacl').read()
    for dir in os.listdir(f'{config.shacl_path}/specific'):
        specific = open(f'{config.shacl_path}/specific/{dir}/{service}.shacl').read()
        base += '\n\n'+specific
    return base


@app.route('/shacl/subclasses')
def shacl_subclasses():
    return open(f'{config.shacl_path}/subclasses.ttl').read()


if __name__ == '__main__':
    app.run()
