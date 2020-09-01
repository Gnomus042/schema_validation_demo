from flask import Blueprint, render_template, jsonify
import json
import config

sdtt = Blueprint('sdtt', __name__)


@sdtt.route('/scc')
def index():
    return render_template('sdtt.html')


@sdtt.route('/scc/hierarchy')
def hierarchy():
    return jsonify(hierarchy=json.dumps(config.hierarchy))
