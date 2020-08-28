from flask import Blueprint, render_template

sdtt = Blueprint('sdtt', __name__)


@sdtt.route('/sdtt')
def index():
    return render_template('sdtt.html')
