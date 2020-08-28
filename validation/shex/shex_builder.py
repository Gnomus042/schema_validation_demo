import os
import re
import json


def pack():
    base = open('base.shex').read()
    shapes = [base]
    for shex_file in os.listdir('shapes'):
        shapes.append(open(f'shapes/{shex_file}').read())
    for shex_file in os.listdir('raw_shapes'):
        if shex_file not in os.listdir('shapes'):
            shapes.append(open(f'raw_shapes/{shex_file}').read())
    for topic in os.listdir('specific'):
        for shex_file in os.listdir(f'specific/{topic}'):
            shapes.append(open(f'specific/{topic}/{shex_file}').read())
    full = fill_temp_holes(('\n' * 3).join(shapes))
    open('full.shex', 'w').write(full)


def find_unknown():
    defined_shapes = set([shex_file[:-5] for shex_file in os.listdir('shapes')+os.listdir('raw_shapes')])
    unknown = set()
    for shex_file in os.listdir('shapes'):
        shape = open(f'shapes/{shex_file}').read()
        links = set(re.findall("<#(.*?)>", shape))
        unknown = unknown.union(links.difference(defined_shapes))
    return sorted(list(unknown))


def fill_temp_holes(shex):
    holes = find_unknown()
    for hole in holes:
        shex = shex.replace(f'@<#{hole}>', f'{{ a [schema:{hole}] }}')
    return shex


if __name__ == '__main__':
    pack()

